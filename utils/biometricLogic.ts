import { UserState } from '@/constants/data/types';

type BaselineSample = {
  bpm: number;
  hrv: number;
  eda: number;
  timestamp: number;
};

type SignalStats = {
  mean: number;
  sd: number;
};

type BaselineStats = {
  bpm: SignalStats;
  hrv: SignalStats;
  eda: SignalStats;
  sampleCount: number;
};

type PersistedBiometricBaseline = {
  version: 1;
  baselineSamples: BaselineSample[];
  rawStateHistory: UserState[];
};

const BASELINE_HISTORY_LIMIT = 120;
const RAW_STATE_HISTORY_LIMIT = 3;
const MIN_BASELINE_SAMPLES = 8;

const DEFAULT_BASELINE: BaselineStats = {
  bpm: { mean: 72, sd: 8 },
  hrv: { mean: 65, sd: 18 },
  eda: { mean: 3, sd: 2 },
  sampleCount: 0,
};

let baselineSamples: BaselineSample[] = [];
let rawStateHistory: UserState[] = [];

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const mean = (values: number[]) =>
  values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);

const standardDeviation = (values: number[], fallback: number) => {
  if (values.length < 2) return fallback;

  const avg = mean(values);
  const variance =
    values.reduce((sum, value) => sum + (value - avg) ** 2, 0) /
    values.length;

  return Math.max(Math.sqrt(variance), fallback);
};

const getBaselineStats = (): BaselineStats => {
  if (baselineSamples.length === 0) return DEFAULT_BASELINE;

  const bpmValues = baselineSamples.map((sample) => sample.bpm);
  const hrvValues = baselineSamples.map((sample) => sample.hrv);
  const edaValues = baselineSamples.map((sample) => sample.eda);

  return {
    bpm: {
      mean: mean(bpmValues),
      sd: standardDeviation(bpmValues, 4),
    },
    hrv: {
      mean: mean(hrvValues),
      sd: standardDeviation(hrvValues, 6),
    },
    eda: {
      mean: mean(edaValues),
      sd: standardDeviation(edaValues, 1.2),
    },
    sampleCount: baselineSamples.length,
  };
};

const zScore = (value: number, stats: SignalStats) =>
  (value - stats.mean) / Math.max(stats.sd, 0.001);

const getMode = (states: UserState[]): UserState => {
  const counts = new Map<UserState, number>();

  states.forEach((state) => {
    counts.set(state, (counts.get(state) ?? 0) + 1);
  });

  let bestState: UserState = states[states.length - 1] ?? 'RELAXED';
  let bestCount = -1;

  counts.forEach((count, state) => {
    if (count > bestCount) {
      bestState = state;
      bestCount = count;
    }
  });

  return bestState;
};

const shouldUpdateBaseline = (
  bpm: number,
  hrv: number,
  eda: number,
  arousalScore: number,
  baseline: BaselineStats,
) => {
  const bpmZ = zScore(bpm, baseline.bpm);
  const edaZ = zScore(eda, baseline.eda);
  const hrvDropZ = (baseline.hrv.mean - hrv) / Math.max(baseline.hrv.sd, 0.001);

  return (
    arousalScore < 1.2 &&
    bpm < 100 &&
    bpmZ < 1.5 &&
    edaZ < 1.5 &&
    hrvDropZ < 1.25
  );
};

const pushBaselineSample = (sample: BaselineSample) => {
  baselineSamples = [...baselineSamples, sample].slice(-BASELINE_HISTORY_LIMIT);
};

const pushRawState = (state: UserState) => {
  rawStateHistory = [...rawStateHistory, state].slice(-RAW_STATE_HISTORY_LIMIT);
};

const smoothState = (rawState: UserState): UserState => {
  pushRawState(rawState);

  if (rawStateHistory.length < RAW_STATE_HISTORY_LIMIT) {
    return rawState;
  }

  const mode = getMode(rawStateHistory);
  const latest = rawStateHistory[rawStateHistory.length - 1];
  const previous = rawStateHistory[rawStateHistory.length - 2];

  if (
    latest === 'ANXIOUS' &&
    previous !== 'ANXIOUS' &&
    mode !== 'ANXIOUS'
  ) {
    return 'STRESSED';
  }

  return mode;
};

const classifyFromPersonalizedBaseline = (
  bpm: number,
  hrv: number,
  eda: number,
  baseline: BaselineStats,
): UserState => {
  const zHr = zScore(bpm, baseline.bpm);
  const zEda = zScore(eda, baseline.eda);
  const zHrvDrop =
    (baseline.hrv.mean - hrv) / Math.max(baseline.hrv.sd, 0.001);

  const arousalScore = 0.45 * zHr + 0.35 * zEda + 0.2 * zHrvDrop;

  const isLikelyAnxious =
    arousalScore >= 2.6 &&
    zHr >= 1.6 &&
    zEda >= 1.2 &&
    zHrvDrop >= 1.1;

  const isLikelyStressed =
    arousalScore >= 1.4 &&
    (zHr >= 1.1 || zEda >= 1 || zHrvDrop >= 0.9);

  const isLikelyFocused =
    arousalScore >= 0.15 &&
    arousalScore < 1.4 &&
    zHr >= -0.25 &&
    zHr <= 1.4 &&
    zHrvDrop >= -0.4 &&
    zHrvDrop <= 1.1 &&
    zEda <= 1.1;

  if (
    shouldUpdateBaseline(bpm, hrv, eda, arousalScore, baseline)
  ) {
    pushBaselineSample({
      bpm,
      hrv,
      eda,
      timestamp: Date.now(),
    });
  }

  if (baseline.sampleCount < MIN_BASELINE_SAMPLES) {
    if (bpm > 108 && hrv < 35 && eda > 10) return 'ANXIOUS';
    if ((bpm > 92 || hrv < 45) && eda > 6) return 'STRESSED';
    if (bpm > 72 && hrv < 78 && eda <= 7) return 'FOCUSED';
    return 'RELAXED';
  }

  if (isLikelyAnxious) return 'ANXIOUS';
  if (isLikelyStressed) return 'STRESSED';
  if (isLikelyFocused) return 'FOCUSED';
  return 'RELAXED';
};

export const inferStateFromData = (
  bpm: number,
  hrv: number,
  eda: number,
): UserState => {
  const safeBpm = clamp(Math.round(bpm), 35, 210);
  const safeHrv = clamp(Math.round(hrv), 5, 220);
  const safeEda = clamp(Number(eda), 0, 40);

  const baseline = getBaselineStats();
  const rawState = classifyFromPersonalizedBaseline(
    safeBpm,
    safeHrv,
    safeEda,
    baseline,
  );

  return smoothState(rawState);
};

export const getBiometricBaselineDebug = () => getBaselineStats();

export const getBiometricBaselineSnapshot =
  (): PersistedBiometricBaseline => ({
    version: 1,
    baselineSamples: baselineSamples.map((sample) => ({ ...sample })),
    rawStateHistory: [...rawStateHistory],
  });

export const hydrateBiometricBaseline = (
  snapshot: Partial<PersistedBiometricBaseline> | null | undefined,
) => {
  const safeSamples = Array.isArray(snapshot?.baselineSamples)
    ? snapshot.baselineSamples
        .filter((sample): sample is BaselineSample =>
          Boolean(
            sample &&
              Number.isFinite(sample.bpm) &&
              Number.isFinite(sample.hrv) &&
              Number.isFinite(sample.eda) &&
              Number.isFinite(sample.timestamp),
          ),
        )
        .slice(-BASELINE_HISTORY_LIMIT)
    : [];

  const safeStates = Array.isArray(snapshot?.rawStateHistory)
    ? snapshot.rawStateHistory
        .filter(
          (state): state is UserState =>
            state === 'RELAXED' ||
            state === 'FOCUSED' ||
            state === 'STRESSED' ||
            state === 'ANXIOUS',
        )
        .slice(-RAW_STATE_HISTORY_LIMIT)
    : [];

  baselineSamples = safeSamples;
  rawStateHistory = safeStates;
};

export const resetBiometricBaseline = () => {
  baselineSamples = [];
  rawStateHistory = [];
};
