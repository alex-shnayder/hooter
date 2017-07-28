const { describe, it } = require('mocha')
const expect = require('expect')
const Store = require('../src/Store')
const Handler = require('../src/Handler')


function match(a, b) {
  return a === b || a === '*' || b === '*'
}

function handlerA() {}
function handlerB() {}

describe('Store', () => {
  describe('constructor', () => {
    it('throws when no record constructor is provided', () => {
      expect(() => new Store(undefined, match)).toThrow()
      expect(() => new Store(null, match)).toThrow()
      expect(() => new Store(12, match)).toThrow()
      expect(() => new Store(Handler, match)).toNotThrow()
      expect(() => new Store(() => {}, match)).toNotThrow()
    })

    it('throws when no matching function is provided', () => {
      expect(() => new Store()).toThrow()
      expect(() => new Store(Handler, 12)).toThrow()
      expect(() => new Store(Handler, match)).toNotThrow()
      expect(() => new Store(Handler, () => {})).toNotThrow()
    })
  })

  describe('#matchRecord()', () => {
    it('matches record instances by strict equality', () => {
      let store = new Store(Handler, match)
      let recordA = Handler(store, 'foo', handlerA)
      let recordAA = Handler(store, 'foo', handlerA)
      let recordB = Handler(store, 'bar', handlerB)

      let result1 = store.matchRecord(recordA, recordA)
      let result2 = store.matchRecord(recordA, recordAA)
      let result3 = store.matchRecord(recordA, recordB)

      expect(result1).toBe(true)
      expect(result2).toBe(false)
      expect(result3).toBe(false)
    })

    it('matches record keys using the matching function', () => {
      let store = new Store(Handler, match)
      let recordA = Handler(store, 'foo', handlerA)
      let recordB = Handler(store, 'bar', handlerB)
      let recordC = Handler(store, '*', handlerA)

      let result1 = store.matchRecord(recordA, 'foo')
      let result2 = store.matchRecord(recordB, 'bar')
      let result3 = store.matchRecord(recordA, 'bar')
      let result4 = store.matchRecord(recordA, '*')
      let result5 = store.matchRecord(recordC, 'foo')
      let result6 = store.matchRecord(recordC, '*')

      expect(result1).toBe(true)
      expect(result2).toBe(true)
      expect(result3).toBe(false)
      expect(result4).toBe(true)
      expect(result5).toBe(true)
      expect(result6).toBe(true)
    })
  })

  describe('#get()', () => {
    it('returns an empty array when nothing is found', () => {
      let store = new Store(Handler, match)
      let result1 = store.get('foo')
      store.put('bar', handlerA)
      let result2 = store.get('baz')

      expect(result1).toEqual([])
      expect(result2).toEqual([])
    })

    it('returns a new array every time', () => {
      let store = new Store(Handler, match)
      let foo1 = store.get('foo')
      let foo2 = store.get('foo')
      store.put('bar', handlerA)
      let bar1 = store.get('bar')
      let bar2 = store.get('bar')
      let all1 = store.get()
      let all2 = store.get()

      expect(foo1).toBeA(Array)
      expect(foo2).toBeA(Array)
      expect(foo1).toNotBe(foo2)

      expect(bar1).toBeA(Array)
      expect(bar2).toBeA(Array)
      expect(bar1).toNotBe(bar2)

      expect(all1).toBeA(Array)
      expect(all2).toBeA(Array)
      expect(all1).toNotBe(all2)
    })

    it('returns an array of all the records when no needle provided', () => {
      let store = new Store(Handler, match)
      store.put('foo', handlerA)
      store.put('bar', handlerB)
      let result1 = store.get()
      store.put('*', handlerB)
      let result2 = store.get()

      expect(result1).toEqual([
        Handler(store, 'foo', handlerA),
        Handler(store, 'bar', handlerB),
      ])
      expect(result2).toEqual([
        Handler(store, 'foo', handlerA),
        Handler(store, 'bar', handlerB),
        Handler(store, '*', handlerB),
      ])
    })

    it('returns an array of matching records', () => {
      let store = new Store(Handler, match)
      store.put('foo', handlerA)
      store.put('bar', handlerB)
      store.put('bar', handlerA)
      store.put('*', handlerB)

      let foo = store.get('foo')
      let bar = store.get('bar')
      let baz = store.get('baz')
      let asterisk = store.get('*')

      expect(foo).toEqual([
        Handler(store, 'foo', handlerA),
        Handler(store, '*', handlerB),
      ])
      expect(bar).toEqual([
        Handler(store, 'bar', handlerB),
        Handler(store, 'bar', handlerA),
        Handler(store, '*', handlerB),
      ])
      expect(baz).toEqual([Handler(store, '*', handlerB)])
      expect(asterisk).toEqual([
        Handler(store, 'foo', handlerA),
        Handler(store, 'bar', handlerB),
        Handler(store, 'bar', handlerA),
        Handler(store, '*', handlerB),
      ])
    })
  })

  describe('#put()', () => {
    it('returns the created record', () => {
      let store = new Store(Handler, match)
      let result = store.put('foo', handlerA)
      let expected = Handler(store, 'foo', handlerA)

      expect(result).toEqual(expected)
    })
  })

  describe('#del()', () => {
    it('deletes matching records', () => {
      let store = new Store(Handler, match)
      store.put('foo', handlerA)
      let recordB = store.put('bar', handlerA)
      store.put('bar', handlerB)

      store.del(recordB)
      let result1 = store.get()
      expect(result1).toEqual([
        Handler(store, 'foo', handlerA),
        Handler(store, 'bar', handlerB),
      ])

      store.del('foo')
      let result2 = store.get()
      expect(result2).toEqual([Handler(store, 'bar', handlerB)])
    })

    it('deletes all the records when no needle is provided', () => {
      let store = new Store(Handler, match)
      store.put('foo', handlerA)
      store.put('bar', handlerB)
      store.put('baz', handlerA)
      store.del()
      let result = store.get()

      expect(result).toEqual([])
    })
  })

  describe('reverse mode', () => {
    describe('#get()', () => {
      it('retrieves records in reverse order', () => {
        let store = new Store(Handler, match, true)
        store.put('foo', handlerA)
        store.put('bar', handlerB)
        store.put('bar', handlerA)
        store.put('baz', handlerB)
        let result = store.get()

        expect(result).toEqual([
          Handler(store, 'baz', handlerB),
          Handler(store, 'bar', handlerA),
          Handler(store, 'bar', handlerB),
          Handler(store, 'foo', handlerA),
        ])
      })
    })
  })
})
