/**
 * Generate a grid of territory polygons centered around a lat/lng point.
 * Each cell is ~50m x 50m (roughly 0.00045 deg lat, 0.00065 deg lng at mid-latitudes).
 */
export interface TerritoryCell {
  id: string
  bounds: [number, number][] // [lat, lng] pairs forming the polygon
  centerLat: number
  centerLng: number
}

const CELL_SIZE_LAT = 0.00045 // ~50m
const CELL_SIZE_LNG = 0.00065 // ~50m

export function generateTerritoryGrid(
  centerLat: number,
  centerLng: number,
  rows = 20,
  cols = 20
): TerritoryCell[] {
  const cells: TerritoryCell[] = []
  const startLat = centerLat - (rows / 2) * CELL_SIZE_LAT
  const startLng = centerLng - (cols / 2) * CELL_SIZE_LNG

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lat = startLat + r * CELL_SIZE_LAT
      const lng = startLng + c * CELL_SIZE_LNG
      const id = `cell_${r}_${c}`
      cells.push({
        id,
        centerLat: lat + CELL_SIZE_LAT / 2,
        centerLng: lng + CELL_SIZE_LNG / 2,
        bounds: [
          [lat, lng],
          [lat + CELL_SIZE_LAT, lng],
          [lat + CELL_SIZE_LAT, lng + CELL_SIZE_LNG],
          [lat, lng + CELL_SIZE_LNG],
        ],
      })
    }
  }
  return cells
}

/**
 * Check if a point is inside a polygon using ray-casting algorithm.
 */
export function pointInPolygon(
  lat: number,
  lng: number,
  polygon: [number, number][]
): boolean {
  // polygon stores [lat, lng] pairs: index 0 = lat, index 1 = lng
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const latI = polygon[i][0], lngI = polygon[i][1]
    const latJ = polygon[j][0], lngJ = polygon[j][1]
    const intersect =
      lngI > lng !== lngJ > lng &&
      lat < ((latJ - latI) * (lng - lngI)) / (lngJ - lngI) + latI
    if (intersect) inside = !inside
  }
  return inside
}

/**
 * Find which territory cell contains the given GPS position.
 */
export function findCellForPosition(
  lat: number,
  lng: number,
  cells: TerritoryCell[]
): TerritoryCell | null {
  return cells.find(cell => pointInPolygon(lat, lng, cell.bounds)) ?? null
}
