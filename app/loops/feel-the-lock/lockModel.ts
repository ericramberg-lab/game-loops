export type Difficulty = "easy" | "medium" | "hard";
export type PinType = "standard" | "spool";

export type Pin = {
  id: number;
  type: PinType;
  targetHeight: number;
  bindingOrder: number;
  friction: number;
  audioPitch: number;
  currentHeight: number;
  isSet: boolean;
  isOverset: boolean;
  falseSet: boolean;
  falseSetPushback: number;
};

export type LockConfig = {
  seed: number;
  difficulty: Difficulty;
  pinCount: number;
  spoolCount: number;
  tolerance: number;
  safeTensionMin: number;
  safeTensionMax: number;
  tensionResponseRate: number;
  stressGrowthRate: number;
  stressDecayRate: number;
  moveRate: number;
  frictionMin: number;
  frictionMax: number;
  dropOnRelease: boolean;
  bindingFrictionMultiplier: number;
  showHeightGuides: boolean;
  showBindingPinHint: boolean;
};

export type LockEventKind =
  | "set"
  | "overset"
  | "falseSet"
  | "dropped"
  | "pickBroken"
  | "opened"
  | "scrape";

export type LockEvent = {
  kind: LockEventKind;
  pinId?: number;
  pinPitch?: number;
  time: number;
  intensity?: number;
};

export type LockState = {
  config: LockConfig;
  pins: Pin[];
  tension: number;
  targetTension: number;
  pickPos: number;
  pickHeight: number;
  pickStress: number;
  cylinderRotation: number;
  picksLeft: number;
  opened: boolean;
  failed: boolean;
  startedAt: number | null;
  elapsed: number;
  events: LockEvent[];
  oversetCount: number;
  droppedCount: number;
  picksBrokenCount: number;
};

export function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  if (s === 0) s = 0xdeadbeef;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function configFor(difficulty: Difficulty, seed: number): LockConfig {
  const base: LockConfig = {
    seed,
    difficulty,
    pinCount: 4,
    spoolCount: 0,
    tolerance: 0.075,
    safeTensionMin: 0.25,
    safeTensionMax: 0.72,
    tensionResponseRate: 5.2,
    stressGrowthRate: 0.28,
    stressDecayRate: 0.9,
    moveRate: 3.8,
    frictionMin: 0.6,
    frictionMax: 1.05,
    dropOnRelease: false,
    bindingFrictionMultiplier: 2.6,
    showHeightGuides: true,
    showBindingPinHint: true,
  };
  if (difficulty === "medium") {
    return {
      ...base,
      pinCount: 5,
      spoolCount: 1,
      tolerance: 0.05,
      frictionMin: 0.75,
      frictionMax: 1.35,
      bindingFrictionMultiplier: 3.0,
      dropOnRelease: true,
      showHeightGuides: false,
      showBindingPinHint: true,
    };
  }
  if (difficulty === "hard") {
    return {
      ...base,
      pinCount: 6,
      spoolCount: 2,
      tolerance: 0.038,
      frictionMin: 0.85,
      frictionMax: 1.55,
      stressGrowthRate: 0.42,
      stressDecayRate: 0.7,
      bindingFrictionMultiplier: 3.5,
      dropOnRelease: true,
      showHeightGuides: false,
      showBindingPinHint: false,
    };
  }
  return base;
}

function shuffleWithRng<T>(arr: T[], rng: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function generateLock(config: LockConfig): LockState {
  const rng = makeRng(config.seed);
  const pins: Pin[] = [];

  const rawHeights: number[] = [];
  for (let i = 0; i < config.pinCount; i++) {
    rawHeights.push(0.35 + rng() * 0.55);
  }

  if (config.difficulty === "easy") {
    for (let i = 1; i < rawHeights.length; i++) {
      if (Math.abs(rawHeights[i]! - rawHeights[i - 1]!) < 0.14) {
        rawHeights[i] =
          rawHeights[i]! + (rawHeights[i]! < 0.6 ? 0.18 : -0.18);
        rawHeights[i] = Math.max(0.35, Math.min(0.9, rawHeights[i]!));
      }
    }
  }

  const bindingOrder = shuffleWithRng(
    Array.from({ length: config.pinCount }, (_, i) => i),
    rng,
  );

  const spoolSlots = new Set<number>();
  const shuffledSlots = shuffleWithRng(
    Array.from({ length: config.pinCount }, (_, i) => i),
    rng,
  );
  for (let i = 0; i < config.spoolCount; i++) {
    spoolSlots.add(shuffledSlots[i]!);
  }

  for (let i = 0; i < config.pinCount; i++) {
    pins.push({
      id: i,
      type: spoolSlots.has(i) ? "spool" : "standard",
      targetHeight: rawHeights[i]!,
      bindingOrder: bindingOrder[i]!,
      friction:
        config.frictionMin + rng() * (config.frictionMax - config.frictionMin),
      audioPitch: 0.85 + rng() * 0.4,
      currentHeight: 0,
      isSet: false,
      isOverset: false,
      falseSet: false,
      falseSetPushback: 0,
    });
  }

  return {
    config,
    pins,
    tension: 0,
    targetTension: 0,
    pickPos: 0,
    pickHeight: 0,
    pickStress: 0,
    cylinderRotation: 0,
    picksLeft: 3,
    opened: false,
    failed: false,
    startedAt: null,
    elapsed: 0,
    events: [],
    oversetCount: 0,
    droppedCount: 0,
    picksBrokenCount: 0,
  };
}

export type LockInputs = {
  wantPickPos: number;
  wantPickHeight: number;
  wantTension: number;
  now: number;
  hasInputSinceStart: boolean;
};

function findBindingPinId(state: LockState): number | null {
  const candidates = state.pins
    .filter((p) => !p.isSet)
    .sort((a, b) => a.bindingOrder - b.bindingOrder);
  return candidates[0]?.id ?? null;
}

export function updateLock(state: LockState, dt: number, inputs: LockInputs): void {
  if (state.opened || state.failed) return;
  if (state.startedAt === null && inputs.hasInputSinceStart) {
    state.startedAt = inputs.now;
  }
  if (state.startedAt !== null) {
    state.elapsed = inputs.now - state.startedAt;
  }

  const cfg = state.config;
  const pickChanged = Math.abs(inputs.wantPickPos - state.pickPos) > 0.001;

  state.targetTension = Math.max(0, Math.min(1, inputs.wantTension));
  const tensionDiff = state.targetTension - state.tension;
  state.tension += tensionDiff * Math.min(1, cfg.tensionResponseRate * dt);

  state.pickPos = Math.max(0, Math.min(cfg.pinCount - 1, inputs.wantPickPos));
  state.pickHeight = Math.max(0, Math.min(1, inputs.wantPickHeight));

  const bindingPinId = findBindingPinId(state);
  const pickIndex = Math.round(state.pickPos);
  const overTension = state.tension > cfg.safeTensionMax;

  for (const pin of state.pins) {
    const isBinding = pin.id === bindingPinId;
    const isUnderPick = pickIndex === pin.id;

    if (pin.isSet && !pin.falseSet) {
      pin.currentHeight = pin.targetHeight;
      if (cfg.dropOnRelease && state.tension < cfg.safeTensionMin * 0.5) {
        const dropChance = 0.4 * dt * (cfg.safeTensionMin - state.tension);
        const rand = Math.abs(Math.sin((pin.id + 1) * inputs.now * 0.5));
        if (rand < dropChance) {
          pin.isSet = false;
          pin.currentHeight = pin.targetHeight * 0.6;
          state.droppedCount += 1;
          state.events.push({
            kind: "dropped",
            pinId: pin.id,
            pinPitch: pin.audioPitch,
            time: inputs.now,
          });
        }
      }
      continue;
    }

    let bindingFriction = 1;
    if (isBinding) {
      bindingFriction =
        1 +
        (state.tension - cfg.safeTensionMin) *
          cfg.bindingFrictionMultiplier;
      if (bindingFriction < 1) bindingFriction = 1;
    }
    const totalFriction = pin.friction * bindingFriction;
    const rate = cfg.moveRate / totalFriction;

    let target: number;
    if (isUnderPick) {
      target = state.pickHeight;
    } else {
      target = 0;
    }

    if (pin.falseSet) {
      pin.falseSetPushback += dt * 0.35;
      if (state.tension < cfg.safeTensionMin) {
        pin.falseSet = false;
        pin.falseSetPushback = 0;
        pin.currentHeight = Math.max(0, pin.currentHeight - dt * 0.8);
      } else {
        target = Math.max(target, pin.targetHeight * 0.72);
      }
    }

    const diff = target - pin.currentHeight;
    const step = Math.sign(diff) * Math.min(Math.abs(diff), rate * dt);
    pin.currentHeight = Math.max(0, Math.min(1, pin.currentHeight + step));

    if (isBinding) {
      const isSafeTension =
        state.tension >= cfg.safeTensionMin &&
        state.tension <= cfg.safeTensionMax;
      const withinTolerance =
        Math.abs(pin.currentHeight - pin.targetHeight) < cfg.tolerance;

      if (pin.type === "spool") {
        if (
          !pin.falseSet &&
          !pin.isSet &&
          isSafeTension &&
          pin.currentHeight >= pin.targetHeight * 0.7 &&
          pin.currentHeight < pin.targetHeight - cfg.tolerance
        ) {
          pin.falseSet = true;
          state.events.push({
            kind: "falseSet",
            pinId: pin.id,
            pinPitch: pin.audioPitch,
            time: inputs.now,
          });
        }
        if (
          pin.falseSet &&
          withinTolerance &&
          isSafeTension &&
          isUnderPick
        ) {
          pin.isSet = true;
          pin.falseSet = false;
          pin.falseSetPushback = 0;
          state.events.push({
            kind: "set",
            pinId: pin.id,
            pinPitch: pin.audioPitch,
            time: inputs.now,
          });
        }
      } else {
        if (withinTolerance && isSafeTension && isUnderPick) {
          pin.isSet = true;
          state.events.push({
            kind: "set",
            pinId: pin.id,
            pinPitch: pin.audioPitch,
            time: inputs.now,
          });
        }
      }

      if (
        !pin.isSet &&
        pin.currentHeight > pin.targetHeight + cfg.tolerance * 1.4 &&
        state.tension > cfg.safeTensionMin
      ) {
        if (!pin.isOverset) {
          pin.isOverset = true;
          state.oversetCount += 1;
          state.events.push({
            kind: "overset",
            pinId: pin.id,
            pinPitch: pin.audioPitch,
            time: inputs.now,
          });
        }
      }
      if (
        pin.isOverset &&
        state.tension < cfg.safeTensionMin &&
        pin.currentHeight < pin.targetHeight - cfg.tolerance
      ) {
        pin.isOverset = false;
      }

      if (
        (pickChanged || pickIndex !== pin.id) &&
        Math.abs(pin.currentHeight) > 0.01 &&
        Math.random() < dt * 4
      ) {
        state.events.push({
          kind: "scrape",
          pinId: pin.id,
          pinPitch: pin.audioPitch,
          time: inputs.now,
          intensity: 0.7,
        });
      }
    }
  }

  const setCount = state.pins.filter((p) => p.isSet).length;
  state.cylinderRotation = setCount / cfg.pinCount;

  const pickOnBinding = pickIndex === bindingPinId;
  if (state.tension > cfg.safeTensionMax) {
    state.pickStress +=
      dt * cfg.stressGrowthRate * (state.tension - cfg.safeTensionMax) * 6;
  } else if (pickOnBinding && overTension) {
    state.pickStress += dt * cfg.stressGrowthRate * 0.5;
  } else {
    state.pickStress = Math.max(0, state.pickStress - dt * cfg.stressDecayRate);
  }
  if (state.pickStress >= 1) {
    state.pickStress = 0;
    state.picksBrokenCount += 1;
    state.picksLeft -= 1;
    state.events.push({ kind: "pickBroken", time: inputs.now });
    for (const pin of state.pins) {
      if (pin.isOverset) {
        pin.isOverset = false;
        pin.currentHeight = 0;
      }
      if (pin.falseSet) {
        pin.falseSet = false;
        pin.falseSetPushback = 0;
        pin.currentHeight = 0;
      }
      if (!pin.isSet) {
        pin.currentHeight = 0;
      }
      if (pin.isSet && cfg.dropOnRelease && Math.random() < 0.35) {
        pin.isSet = false;
        pin.currentHeight = 0;
        state.droppedCount += 1;
      }
    }
    state.targetTension = 0;
    state.tension = Math.min(state.tension, 0.1);
    if (state.picksLeft <= 0) {
      state.failed = true;
    }
  }

  if (setCount === cfg.pinCount && !state.opened) {
    state.opened = true;
    state.events.push({ kind: "opened", time: inputs.now });
  }
}

export function newLockState(
  difficulty: Difficulty,
  seed: number,
): LockState {
  return generateLock(configFor(difficulty, seed));
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff) >>> 0;
}
