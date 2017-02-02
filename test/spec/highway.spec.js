const assert = require('assert')
const isFunction = require('lodash/isFunction')

const highway = require('../../dist/backbone-highway')

describe('Backbone.Highway', () => {
  it('should expose a public API', () => {
    assert.ok(isFunction(highway.start))
    assert.ok(isFunction(highway.route))
    assert.ok(isFunction(highway.go))
    assert.ok(isFunction(highway.reload))
    assert.ok(isFunction(highway.restart))
  })

  it('should register routes using the `route` method', () => {
    highway.route({
      name: 'home',
      path: '/',
      action (state) {
        state.resolve()
      }
    })
  })
})
