import {
  canPlace,
  dropOrigin,
  emptyGrid,
  stamp,
  tapOrigin,
  type Shape,
} from '../src/lib/blocks.ts'

const SHAPES: Shape[] = [
  [[1]],
  [[1, 1, 1, 1]],
  [[1], [1], [1], [1]],
  [[1, 0], [1, 1]],
  [[0, 1], [1, 1]],
  [[1, 1], [1, 0]],
  [[1, 1], [0, 1]],
  [[1, 1, 1], [0, 1, 0]],
]

let failed = 0
function assert(cond: boolean, msg: string) {
  if (!cond) {
    failed += 1
    console.error('FAIL', msg)
  }
}

const empty = emptyGrid()
for (const shape of SHAPES) {
  for (let r = 0; r < 8; r += 1) {
    for (let c = 0; c < 8; c += 1) {
      const origin = tapOrigin(shape, { r, c }, empty)
      assert(origin != null, `empty tapOrigin ${JSON.stringify(shape)} at ${r},${c}`)
      if (origin) assert(canPlace(empty, shape, origin.r, origin.c), `empty place ${r},${c}`)
    }
  }
}

let grid = stamp(emptyGrid(), [[1, 1, 1, 1]], 0, 0)
const l = [[1, 0], [1, 1]] as Shape
const center = tapOrigin(l, { r: 4, c: 4 }, grid)
assert(center != null, 'L in center after top bar')
if (center) assert(canPlace(grid, l, center.r, center.c), 'L center actually fits')

const drop = dropOrigin(l, { r: 4, c: 4 }, { r: 0, c: 1 }, grid)
assert(drop != null, 'dropOrigin L at center with awkward grab')

const overlap = tapOrigin([[1, 1, 1, 1]], { r: 0, c: 0 }, grid)
assert(overlap == null, 'overlap on existing bar should fail')

if (failed) {
  console.error(`${failed} failures`)
  process.exit(1)
}
console.log('blocks placement checks passed')
