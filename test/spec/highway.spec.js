const assert = require('assert')
// const defer = require('lodash/defer')
const isFunction = require('lodash/isFunction')
const isObject = require('lodash/isObject')

const highway = require('../../dist/backbone-highway')

const location = window.location

const definitions = {
  home: {
    name: 'home',
    path: '/',
    action (state) {
      return state.resolve()
    }
  },
  profile: {
    name: 'profile',
    path: '/users/:id',
    action (state) {
      return state.resolve(state.params.id)
    }
  },
  optional: {
    name: 'optional',
    path: '/optional(/path/:param)',
    action (state) {
      return state.resolve(state.params.param)
    }
  }
}

describe('Backbone.Highway', () => {
  it('should expose a public API', () => {
    assert.ok(isFunction(highway.start))
    assert.ok(highway.start.length === 1)

    assert.ok(isFunction(highway.route))
    assert.ok(highway.route.length === 1)

    assert.ok(isFunction(highway.go))
    assert.ok(highway.go.length === 1)

    assert.ok(isFunction(highway.reload))
    assert.ok(isFunction(highway.restart))

    assert.ok(isObject(highway.store))
  })

  it('should register routes using the `route` method', () => {
    // Declare some routes
    const homeRoute = highway.route(definitions.home)
    const profileRoute = highway.route(definitions.profile)
    const optionalRoute = highway.route(definitions.optional)

    assert.ok(isFunction(homeRoute.get))
    assert.ok(isFunction(homeRoute.set))
    assert.ok(isFunction(homeRoute.parse))
    assert.ok(isFunction(homeRoute.configure))
    assert.ok(isFunction(homeRoute.execute))
    assert.ok(isFunction(homeRoute.getActionWrapper))
    assert.ok(isFunction(homeRoute.getNavigateOptions))

    assert.equal(homeRoute.get('name'), 'home')
    assert.equal(homeRoute.get('path'), '')
    assert.ok(isFunction(homeRoute.get('action')))

    assert.equal(profileRoute.get('name'), 'profile')
    assert.equal(profileRoute.get('path'), 'users/:id')
    assert.ok(isFunction(profileRoute.get('action')))

    assert.equal(optionalRoute.get('name'), 'optional')
    assert.equal(optionalRoute.get('path'), 'optional(/path/:param)')
    assert.ok(isFunction(optionalRoute.get('action')))
  })

  it('should start the router using `start` method', () => {
    highway.start()
  })

  it('should execute routes using the `go` method', () => {
    assert.ok(
      highway.go({ name: 'profile', params: { id: 42 } })
    )
    assert.equal(location.pathname, '/users/42')

    assert.ok(
      highway.go({ name: 'home' })
    )
    assert.equal(location.pathname, '/')

    assert.ok(
      highway.go({ name: 'optional', params: { param: 'param' } })
    )
    assert.equal(location.pathname, '/optional/path/param')

    assert.ok(
      !highway.go({ name: 'inexisting-route' })
    )

    assert.ok(
      highway.go({ name: 'optional' })
    )
    assert.equal(location.pathname, '/optional')

    assert.ok(
      highway.go({ path: '/users/42' })
    )
    assert.equal(location.pathname, '/users/42')
  })
})