export const SIZE = 8

export type Grid = number[][]
export type Shape = number[][]
export type Cell = { r: number; c: number }

export function emptyGrid(): Grid {
  return Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => 0))
}

export function filledCells(shape: Shape): Cell[] {
  const cells: Cell[] = []
  shape.forEach((row, r) => {
    row.forEach((on, c) => {
      if (on) cells.push({ r, c })
    })
  })
  return cells
}

export function firstFilled(shape: Shape): Cell {
  return filledCells(shape)[0] ?? { r: 0, c: 0 }
}

export function shapeWidth(shape: Shape): number {
  return Math.max(1, ...shape.map((row) => row.length))
}

export function canPlace(grid: Grid, shape: Shape, row: number, col: number): boolean {
  for (const cell of filledCells(shape)) {
    const rr = row + cell.r
    const cc = col + cell.c
    if (rr < 0 || cc < 0 || rr >= SIZE || cc >= SIZE) return false
    if (grid[rr][cc]) return false
  }
  return true
}

export function canPlaceAnywhere(grid: Grid, shape: Shape): boolean {
  for (let r = 0; r < SIZE; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      if (canPlace(grid, shape, r, c)) return true
    }
  }
  return false
}

export function stamp(grid: Grid, shape: Shape, row: number, col: number): Grid {
  const next = grid.map((line) => [...line])
  for (const cell of filledCells(shape)) {
    next[row + cell.r][col + cell.c] = 1
  }
  return next
}

export function tapOrigin(shape: Shape, cell: Cell, grid: Grid): Cell | null {
  for (const block of filledCells(shape)) {
    const origin = { r: cell.r - block.r, c: cell.c - block.c }
    if (canPlace(grid, shape, origin.r, origin.c)) return origin
  }
  const clamped = {
    r: Math.min(SIZE - shape.length, Math.max(0, cell.r)),
    c: Math.min(SIZE - shapeWidth(shape), Math.max(0, cell.c)),
  }
  return canPlace(grid, shape, clamped.r, clamped.c) ? clamped : null
}

export function dropOrigin(shape: Shape, cell: Cell, grab: Cell, grid: Grid): Cell | null {
  const grabbed = { r: cell.r - grab.r, c: cell.c - grab.c }
  if (canPlace(grid, shape, grabbed.r, grabbed.c)) return grabbed
  return tapOrigin(shape, cell, grid)
}
