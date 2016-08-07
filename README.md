# Backbone.Highway - Routing Backbone with style \o/

```Backbone.Highway``` wraps the ```Backbone.Router``` to simplify its use and bring new functionalities.

This is a simplified version of the previous ```Backbone.Highway``` library completely re-written in ES2015.

Added functionalities compared to the ```Backbone.Router``` are:

 * Named routes
 * Special error routes 404
 * Event triggers distributed using an event aggregator

## Installation

```
npm i --save backbone-highway2
```

or

```
bower i --save backbone-highway2
```

## Getting started

Simply declare some routes using the ```highway.route()``` method
and then start the router with the ```highway.start()``` method.

```javascript
import $ from 'jquery';
import highway from 'backbone-highway2';

// Declare a home route
highway.route({
  name: 'home', // The name of the route
  path: '/', // The url to which the route will respond

  // Method to be executed when the given path is intercepted
  action() {
    // Do something fantastic \o/
  }
});

// Declare a user profile route
highway.route({
  name: 'profile',
  path: '/users/:id',
  action(id) {
    // Render user profile page using id parameter
  }
});

// Wait for document ready event
$(() => {
  // Start the router
  highway.start();
});
```

## Navigating

Use the ```go``` method to navigate to a declared route

```javascript
// Navigate to simple route using its name
highway.go('home');

// Navigate to route with parameters
highway.go({ name: 'profile', params: [42] });
// `params` can be called `args` aswell
highway.go({ name: 'profile', args: [42] });

// Navigate using url
highway.go({ path: '/users/42' });
```

## Catching client-side 404

You can declare a special route named ```404``` to catch inexisting routes

```javascript
highway.route({
  name: '404',
  action() {
    // Display 404 error page
  }
});
```

## Events

Each route can trigger events using an event aggregator like ```Backbone.Events``` or ```Backbone.Radio```

```javascript
import $ from 'jquery';
import highway from 'backbone-highway2';
import { Events } from 'backbone';

// Listen to 'core:render' event
Events.on('core:render', (name) => {
  console.log(`Hello ${name} from 'core:render' event!`);
});

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
    console.log(`Hello ${name} from route action!`);
  }
});

// Wait for document ready
$(() => {
  // Start the router passing the event aggregator instance in the `dispatcher` option
  highway.start({ dispatcher: Events });

  // Navigate to the route
  highway.go({ name: profile, params: ['Highway'] });
});
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

Copyright (c) 2015 d4f

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
