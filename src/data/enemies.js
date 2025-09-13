// Enemy configurations - data-driven for easy balancing
export const ENEMIES = {
  grunt: {
    name: "Grunt",
    baseHP: 30,
    speed: 1.0, // tiles per second
    killGold: 5,
    leakDamage: 1,
    tags: ["ground"],
    color: 0x8B4513 // brown
  },
  runner: {
    name: "Runner",
    baseHP: 22,
    speed: 1.6, // tiles per second
    killGold: 6,
    leakDamage: 1,
    tags: ["ground", "fast"],
    dmgTakenMods: { arrow: +0.10 }, // takes 10% more damage from arrows
    color: 0xFF6347 // tomato red
  },
  tank: {
    name: "Tank",
    baseHP: 70,
    speed: 0.7, // tiles per second
    killGold: 12,
    leakDamage: 2,
    tags: ["ground", "armored"],
    splashRes: -0.20, // takes 20% less splash damage
    color: 0x696969 // dim gray
  },
  boss: {
    name: "Boss",
    baseHP: 220,
    speed: 0.9, // tiles per second
    killGold: 40,
    leakDamage: 5,
    tags: ["ground", "boss"],
    slowImmuneFirst: 3.0, // seconds of slow immunity at start
    color: 0x8B0000 // dark red
  }
};

// Scaling configuration
export const SCALING = {
  hpPerWavePct: 0.12,    // +12% HP per wave
  bossHpMultiplier: 3.0  // applied after per-wave HP scaling
};

// Helper functions for enemy calculations
export const getScaledHP = (enemyType, waveNumber) => {
  const enemy = ENEMIES[enemyType];
  const baseHP = enemy.baseHP;
  const waveMultiplier = 1 + SCALING.hpPerWavePct * (waveNumber - 1);

  if (enemy.tags.includes("boss")) {
    return Math.floor(baseHP * waveMultiplier * SCALING.bossHpMultiplier);
  }

  return Math.floor(baseHP * waveMultiplier);
};

export const getEnemyColor = (enemyType) => {
  return ENEMIES[enemyType].color;
};

export const hasTag = (enemyType, tag) => {
  return ENEMIES[enemyType].tags.includes(tag);
};
