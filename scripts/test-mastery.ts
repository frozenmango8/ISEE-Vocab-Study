import { masteredCount, recordLearn } from '../src/lib/storage.ts'

const mem: Record<string, string> = {}
Object.defineProperty(globalThis, 'window', {
  value: { dispatchEvent() {}, addEventListener() {}, removeEventListener() {} },
})
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (k: string) => mem[k] ?? null,
    setItem: (k: string, v: string) => {
      mem[k] = v
    },
  },
})

const ids = ['abundant', 'abode']
if (masteredCount(ids) !== 0) throw new Error('start should be 0')
recordLearn('abundant', true)
if (masteredCount(ids) !== 0) throw new Error('one correct is not mastered')
recordLearn('abundant', true)
if (masteredCount(ids) !== 1) throw new Error('two correct should master')
recordLearn('abode', true)
recordLearn('abode', false)
if (masteredCount(ids) !== 1) throw new Error('one miss should not master abode')
recordLearn('abode', true)
recordLearn('abode', true)
if (masteredCount(ids) !== 2) throw new Error('both should be mastered')
console.log('mastery checks passed')
