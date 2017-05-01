# Backbone.Highway - Routing Backbone with style \o/

[![JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
[![Build Status](https://travis-ci.org/d4f/backbone-highway.svg?branch=master)](https://travis-ci.org/d4f/backbone-highway)
[![bitHound Overall Score](https://www.bithound.io/github/d4f/backbone-highway/badges/score.svg)](https://www.bithound.io/github/d4f/backbone-highway)
[![npm](https://img.shields.io/npm/dm/backbone-highway.svg)](https://www.npmjs.com/package/backbone-highway)

`Backbone.Highway` wraps the `Backbone.Router` to simplify its use and bring new functionalities.

Added functionalities compared to the `Backbone.Router` are:

 * Named routes
 * Catching client-size 404
 * Before/After Middlewares
 * Before/After event triggers distributed using an event aggregator
 * Async flow control using JavaScript `Promise`

## Installation

```bash
npm install --save backbone-highway
```

or

```bash
bower install --save backbone-highway
```

## Getting started

Simply declare some routes using the `highway.route()` method
and then start the router with the `highway.start()` method.

```javascript
import highway from 'backbone-highway'

// Declare a home route
highway.route({
  name: 'home', // The name of the route
  path: '/', // The url to which the route will respond

  // Method to be executed when the given path is intercepted
  action (state) {
    // Do something fantastic \o/

    state.resolve() // Resolve state when execution is done
  }
})

// Declare a user profile route
highway.route({
  name: 'profile',
  path: '/users/:id',
  action (state) {
    // Render user profile page using `state.params.id` parameter
    console.log(`Executing profile controller for user#${state.params.id}`)

    state.resolve() // Resolve state when execution is done
  }
})


// Start the router
highway.start()
```

## Declaring a route `highway.route()`

```js
highway.route({
  name: 'profile',
  path: '/users/:id(/edit/:section)',
  action (state) {
    const { params } = state

    console.log(`Executing profile for #${params.id} and editing section '${params.section}'`)

    state.resolve()
  }
})
```

A route is at least composed of a `name`, `path` and `action`, like it is shown the example above.
The `name` and `path` need to be uniq to prevent conflicting routes which can lead to unexpected behavior.

*Note: The path of the route needs to be declared with a leading slash to properly work in `highway`. For now, the regular expression format has not been tested, it may or may not work.*

The `action` needs to be a `function` which will receive an `Object` as its only argument.
This `state` object will contain:

* `params` with the parameters received from parsing the dynamic parts of the `path`.
* `resolve` and `reject` methods to control the flow of execution of the route.

### Options for the `route` method

* `name {string}` The uniq name of the route
* `path {string}` The path of the route as described in the [Backbone documentation](http://backbonejs.org/#Router-routes)
* `action {function}` The controller method for this route
* `before {array}` *Optional* A list of events or middlewares to be executed before the `action`
* `after {array}` *Optional* A list of events or middlewares to be executed after the `action` if it is resolved

## Starting the router `highway.start()`

`Backbone.Highway` uses sensible defaults that can be overriden by passing an options object to the start method.

Here are the default options provided by the library :

```javascript
highway.start({
  // # Backbone History options
  // Docs: http://backbonejs.org/#History

  // Use html5 pushState
  pushState: true,

  // Root url for pushState
  root: '',

  // Set to false to force page reloads for old browsers
  hashChange: true,

  // Don't trigger the initial route
  silent: false,

  // # Backbone.Highway specific options

  // Print out debug information
  debug: false,

  // Event aggregator instance
  dispatcher: null
})
```

## Navigating `highway.go()`

Use the ```go``` method to navigate programmatically to a declared route

```javascript
// Navigate to simple route using its name
highway.go('home')

// Navigate to route with parameters
highway.go({ name: 'profile', params: { id: 42 } })

// Navigate using url
highway.go({ path: '/users/42' })
```

The `go` method can either take a string to navigate to a simple route using its name.
Or, an object with at least a `name` key.

It can also take a `params` object to pass dynamic parameters to the route.
The `params` can also be an `Array` which will be mapped onto the dynamic parts of the path in sequential order.

### Options for the `go` method

* `name {string}` The route name
* `params {mixed}` An `Object` or `Array` of dynamic parameters passed to the route
* `path {string}` To use instead of the `name` and `params` to navigate directly to a known URL path
* `force {boolean}` Force the route to execute even if it is the last executed route, default `false`.<br>
  Can be useful when trying to navigate to the same page but with a different value for a dynamic parameter of the route

#### Backbone.Router specific options

These options are just passed to `Backbone.Router.navigate` when executing the `go` method.

* `trigger {boolean}` Trigger the route controller, default `true`
* `replace {boolean}` Replace the current entry in the browser history, default `false`

See [the Backbone documentation](http://backbonejs.org/#Router-navigate) for more info.

## Catching client-side 404

You can declare a special route named `404` to catch inexisting routes

```javascript
highway.route({
  name: '404',
  action () {
    // Display 404 error page
  }
})
```

## `before` and `after` events / middlewares

Each route can trigger events using an event aggregator like `Backbone.Events` or `Backbone.Radio`

```javascript
import highway from 'backbone-highway'
import { Events } from 'backbone'

// Listen to 'core:render' event
Events.on('core:render', state => {
  console.log(`Hello ${state.params.name} from 'core:render' event!`)
})

// Declare a profile route
highway.route({
  name: 'profile',
  path: '/users/:name',
  // Declare events that will be triggered before the `action`
  before: [
    'core:render' // An event can be a simple string
    { name: 'core:render', params: { name: 'World' } }, // Or an object to pass in specific parameters
    (state) => { // Or even a function that will be executed instead of being passed to the `dispatcher`
      setTimeout(() => state.resolve(), 1000)
    }
  ],
  action (state) {
    console.log(`Hello ${state.params.name} from route action!`)
  }
})

// Start the router passing the event aggregator instance in the `dispatcher` option
highway.start({ dispatcher: Events })

// Navigate to the route
highway.go({ name: 'profile', params: { name: 'Highway' } })
```

In this example, the route parameter `name` will be passed to the event,
but it can be overridden by declaring specific `params` for the event.

## Dependencies

 - Backbone >= 1.1.4
 - Underscore >= 1.4.4

## Demo / Example

Use npm to install dependencies and launch the demo server.

```
npm install && npm start
```

## License

The MIT License (MIT)
