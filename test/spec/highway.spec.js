import assert from 'assert'
import { isFunction, isObject } from 'lodash'

import highway from '../../src/index'

const location = window.location

const definitions = {
  home: {
    name: 'home',
    path: '/',
    async action (state) {
      return true
    }
  },
  profile: {
    name: 'profile',
    path: '/users/:id',
    async action (state) {
      return state.params.id
    }
  },
  optional: {
    name: 'optional',
    path: '/optional(/path/:param)',
    async action (state) {
      return state.params.param
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

    assert.ok(
      highway.go({ name: 'home', query: { test: 'query' } })
    )
    assert.equal(location.pathname, '/')
    assert.equal(location.search, '?test=query')
  })

  it('should remove an existing route using the `remove` method', () => {
    highway.route({
      name: 'simple',
      path: '/simple',
      action () {}
    })

    const simpleRoute = highway.remove({ name: 'simple' })
    checkRoute(simpleRoute, 'simple')

    highway.route({
      name: 'params',
      path: '/path/:control/params',
      action () {}
    })

    const paramsRoute = highway.remove({ path: '/path/with/params' })
    checkRoute(paramsRoute, 'params')

    function checkRoute (route, name) {
      assert.ok(route)

      const routeName = route.get('name')
      const routePath = route.get('path')

      assert.equal(routeName, name)
      assert.equal(highway.router[routeName], undefined)
      assert.equal(highway.router.routes[routePath], undefined)
    }
  })

  it('should receive query params in route `action` method', (done) => {
    highway.route({
      name: 'test-action-query',
      path: '/test/action/query',
      async action (state) {
        assert.ok(isObject(state.query))
        assert.equal(state.query.hello, 'world')

        done()
      }
    })

    assert.ok(
      highway.go({ name: 'test-action-query', query: { hello: 'world' } })
    )
  })

  it('should handle `before` events', (done) => {
    highway.route({
      name: 'before-events',
      path: '/before/:data',
      before: [
        async ({ params }) => {
          assert.equal(params.data, 'events')
        }
      ],
      async action ({ params }) {
        assert.equal(params.data, 'events')
        done()
      }
    })

    assert.ok(
      highway.go({ name: 'before-events', params: { data: 'events' } })
    )
  })

  it('should handle `after` events', (done) => {
    highway.route({
      name: 'after-events',
      path: '/after/:data',
      async action ({ params }) {
        assert.equal(params.data, 'events')

        return 'yeah'
      },
      after: [
        async ({ params, result }) => {
          assert.equal(params.data, 'events')
          assert.equal(result, 'yeah')
          done()
        }
      ]
    })

    assert.ok(
      highway.go({ name: 'after-events', params: { data: 'events' } })
    )
  })

  it('should execute 404 controller for missing routes', (done) => {
    highway.route({
      name: '404',
      action ({ params }) {
        assert.ok(isObject(params))
        done()
      }
    })

    assert.ok(
      highway.go({ name: 'some-random-inexisting-route' })
    )
  })
})
