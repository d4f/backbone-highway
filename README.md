# Backbone.Highway - Routing Backbone with style \o/

[![JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

```Backbone.Highway``` wraps the ```Backbone.Router``` to simplify its use and bring new functionalities.

This is a simplified version of the previous ```Backbone.Highway``` library completely re-written in ES2015.

Added functionalities compared to the ```Backbone.Router``` are:

 * Named routes
 * Catching client-size 404
 * Event triggers distributed using an event aggregator

## Installation

```
npm install --save backbone-highway
```

or

```
bower install --save backbone-highway
```

## Getting started

Simply declare some routes using the ```highway.route()``` method
and then start the router with the ```highway.start()``` method.

```javascript
import $ from 'jquery'
import highway from 'backbone-highway'

// Declare a home route
highway.route({
  name: 'home', // The name of the route
  path: '/', // The url to which the route will respond

  // Method to be executed when the given path is intercepted
  action() {
    // Do something fantastic \o/
  }
})

// Declare a user profile route
highway.route({
  name: 'profile',
  path: '/users/:id',
  action(id) {
    // Render user profile page using id parameter
  }
})

// Wait for document ready event
$(() => {
  // Start the router
  highway.start()
})
```

## Start options

```Backbone.Highway``` uses sensible defaults that can be overriden by passing an options object to the start method.

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
  debug: true,

  // Event aggregator instance
  dispatcher: null
})
```

## Navigating

Use the ```go``` method to navigate to a declared route

```javascript
// Navigate to simple route using its name
highway.go('home')

// Navigate to route with parameters
highway.go({ name: 'profile', params: [42] })
// `params` can be called `args` aswell
highway.go({ name: 'profile', args: [42] })

// Navigate using url
highway.go({ path: '/users/42' })
```

## Catching client-side 404

You can declare a special route named ```404``` to catch inexisting routes

```javascript
highway.route({
  name: '404',
  action() {
    // Display 404 error page
  }
})
```

## Events

Each route can trigger events using an event aggregator like ```Backbone.Events``` or ```Backbone.Radio```

```javascript
import $ from 'jquery'
import highway from 'backbone-highway'
import { Events } from 'backbone'

// Listen to 'core:render' event
Events.on('core:render', name => {
  console.log(`Hello ${name} from 'core:render' event!`)
})

// Declare a profile route
highway.route({
  name: 'profile',
  path: '/users/:name',
  // Declare events that will be triggered before the `action`
  events: [
    'core:render' // An event can be a simple string
    { name: 'core:render', params: ['World'] } // Or an object to pass in specific parameters
    { name: 'core:render', args: ['Arg World'] } // Same as above with `args` instead of `params`
  ],
  action(name) {
    console.log(`Hello ${name} from route action!`)
  }
})

// Wait for document ready
$(() => {
  // Start the router passing the event aggregator instance in the `dispatcher` option
  highway.start({ dispatcher: Events })

  // Navigate to the route
  highway.go({ name: profile, params: ['Highway'] })
})
```

In this example, the route parameter ```:name``` will be passed to the event,
but it can be overridden by declaring specific ```params``` for the event.

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

Copyright (c) 2016 d4f
