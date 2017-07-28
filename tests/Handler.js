const { describe, it } = require('mocha')
const expect = require('expect')
const Handler = require('../src/Handler')


describe('Handler', () => {
  it('throws when a store with a del method is not provided', () => {
    expect(() => Handler()).toThrow()
    expect(() => Handler({})).toThrow()
    expect(() => Handler({ del: 1 })).toThrow()
    expect(() => Handler({ del: () => {} })).toThrow()
  })

  it('throws when fn is not a function', () => {
    let store = { del: () => {} }
    expect(() => Handler(store, null)).toThrow()
    expect(() => Handler(store, null, 1)).toThrow()
    expect(() => Handler(store, null, {})).toThrow()
    expect(() => Handler(store, null, () => {})).toNotThrow()
  })

  it('returns a function', () => {
    let handler = Handler({ del: () => {} }, null, () => {})

    expect(handler).toBeA(Function)
  })

  it('the result has "store", "key", "fn" and "unhook" properties', () => {
    let store = { del: () => {} }
    let fn = () => {}
    let handler = Handler(store, 'foo', fn)

    expect(handler.store).toBe(store)
    expect(handler.key).toBe('foo')
    expect(handler.fn).toBe(fn)
    expect(handler.unhook).toBeA(Function)
  })

  it('when called, invokes fn with proper args and context', () => {
    let store = { del: () => {} }
    let obj = { fn: expect.createSpy() }
    let arg = {}
    let context = {}
    let handler = Handler(store, 'key', obj.fn)

    handler.call(context, arg)

    expect(obj.fn).toHaveBeenCalled(arg)
    expect(obj.fn.calls[0].context).toBe(context)
  })

  it('can be used as a constructor', () => {
    let store = { del: () => {} }
    let fn = () => {}
    let handler

    expect(() => {
      handler = new Handler(store, 'key', fn)
    }).toNotThrow()
    expect(handler).toBeA(Function)
    expect(handler.store).toBe(store)
    expect(handler.key).toBe('key')
    expect(handler.fn).toBe(fn)
    expect(handler.unhook).toBeA(Function)
  })

  describe('#unhook()', () => {
    it('calls del() on the store', () => {
      let store = { del: expect.createSpy() }
      let handler = Handler(store, null, () => {})

      handler.unhook()

      expect(store.del).toHaveBeenCalledWith(handler)
    })
  })
})
