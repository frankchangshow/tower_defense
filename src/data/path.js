// Path configuration for the tower defense level
export const WAYPOINTS = [
  {x: 0, y: 4},
  {x: 3, y: 4},
  {x: 3, y: 2},
  {x: 7, y: 2},
  {x: 7, y: 6},
  {x: 11, y: 6},
  {x: 11, y: 3},
  {x: 15, y: 3},
  {x: 15, y: 4}
];

export const TILE_SIZE = 60;

// Grid dimensions
export const GRID_WIDTH = 16;
export const GRID_HEIGHT = 9;

// World pixel dimensions
export const WORLD_WIDTH = GRID_WIDTH * TILE_SIZE;
export const WORLD_HEIGHT = GRID_HEIGHT * TILE_SIZE;

// Helper functions for grid/pixel conversion
export const gridToWorld = (gridX, gridY) => ({
  x: gridX * TILE_SIZE + TILE_SIZE / 2,
  y: gridY * TILE_SIZE + TILE_SIZE / 2
});

export const worldToGrid = (worldX, worldY) => ({
  x: Math.floor(worldX / TILE_SIZE),
  y: Math.floor(worldY / TILE_SIZE)
});

// Create a set of all path tiles (waypoints + tiles between them)
const createPathTiles = () => {
  const pathTiles = new Set();
  // console.log('🛣️ Creating path tiles from waypoints:', WAYPOINTS);

  // Add all waypoints
  WAYPOINTS.forEach((point, index) => {
    pathTiles.add(`${point.x},${point.y}`);
    // console.log(`📍 Added waypoint ${index}: (${point.x}, ${point.y})`);
  });

  // Add tiles between waypoints
  for (let i = 0; i < WAYPOINTS.length - 1; i++) {
    const start = WAYPOINTS[i];
    const end = WAYPOINTS[i + 1];
    // console.log(`🔗 Processing segment ${i}: (${start.x}, ${start.y}) → (${end.x}, ${end.y})`);

    // Calculate tiles between waypoints
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));

    // console.log(`  dx: ${dx}, dy: ${dy}, steps: ${steps}`);

    for (let step = 0; step <= steps; step++) {
      const x = Math.round(start.x + (dx * step) / steps);
      const y = Math.round(start.y + (dy * step) / steps);
      pathTiles.add(`${x},${y}`);
      // console.log(`  Added tile (${x}, ${y}) at step ${step}`);
    }
  }

  // console.log(`✅ Total path tiles created: ${pathTiles.size}`);
  // console.log('🗺️ Path tiles:', Array.from(pathTiles));
  return pathTiles;
};

const pathTiles = createPathTiles();

// Check if a grid position is on the path
export const isOnPath = (gridX, gridY) => {
  return pathTiles.has(`${gridX},${gridY}`);
};
