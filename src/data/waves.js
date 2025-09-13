// Wave configurations - defines enemy spawns for each wave
export const WAVES = [
  // Wave 1: Basic introduction
  {
    entries: [
      { type: "grunt", count: 10, gap: 0.8 }
    ]
  },
  // Wave 2: Introduce runners
  {
    entries: [
      { type: "grunt", count: 12 },
      { type: "runner", count: 2, gap: 1.0 }
    ]
  },
  // Wave 3: More balanced
  {
    entries: [
      { type: "grunt", count: 14 },
      { type: "runner", count: 4 }
    ]
  },
  // Wave 4: Introduce tanks
  {
    entries: [
      { type: "grunt", count: 10 },
      { type: "runner", count: 4 },
      { type: "tank", count: 2, gap: 1.2 }
    ]
  },
  // Wave 5: Building pressure
  {
    entries: [
      { type: "grunt", count: 12 },
      { type: "runner", count: 6 },
      { type: "tank", count: 2 }
    ]
  },
  // Wave 6: Mixed challenge
  {
    entries: [
      { type: "grunt", count: 8 },
      { type: "runner", count: 8 },
      { type: "tank", count: 3 }
    ]
  },
  // Wave 7: Speed and armor focus
  {
    entries: [
      { type: "runner", count: 10 },
      { type: "tank", count: 6, gap: 1.3 }
    ]
  },
  // Wave 8: Large mixed wave
  {
    entries: [
      { type: "grunt", count: 18 },
      { type: "runner", count: 6 },
      { type: "tank", count: 4 }
    ]
  },
  // Wave 9: Heavy pressure
  {
    entries: [
      { type: "grunt", count: 8 },
      { type: "runner", count: 10 },
      { type: "tank", count: 6 }
    ]
  },
  // Wave 10: Boss wave
  {
    entries: [
      { type: "boss", count: 1 },
      { type: "runner", count: 10 },
      { type: "tank", count: 6 }
    ]
  }
];

// Economy configuration
export const ECON = {
  startGold: 150,
  lives: 10,
  waveBonus: (wave) => 10 + 2 * wave,
  interWaveTime: 8000, // milliseconds
  skipWaveBonus: 5 // extra gold for skipping inter-wave time
};

// Debug configuration
export const DEBUG = {
  enabled: true, // Set to false for production
  maxWaves: 1, // Set to 1 for quick testing, or WAVES.length for full game
  showDebugPanel: true,
  instantWaves: false, // Skip inter-wave delays
  infiniteGold: false // Give unlimited gold
};

// Wave management helpers
export const getTotalWaves = () => DEBUG.enabled ? DEBUG.maxWaves : WAVES.length;

export const getWaveInfo = (waveNumber) => {
  const maxWaves = getTotalWaves();
  if (waveNumber < 1 || waveNumber > maxWaves) {
    return null;
  }
  // If debug mode limits waves, cycle through available waves
  const actualWaveIndex = ((waveNumber - 1) % WAVES.length);
  return WAVES[actualWaveIndex];
};

export const calculateWaveBonus = (waveNumber) => {
  return ECON.waveBonus(waveNumber);
};
