const assert = require('assert')
const isFunction = require('lodash/isFunction')

const highway = require('../../dist/backbone-highway')

describe('Backbone.Highway', () => {
  it('should expose a public API', () => {
    assert.ok(isFunction(highway.start))
    assert.ok(isFunction(highway.route))
    assert.ok(isFunction(highway.go))
  })
})
