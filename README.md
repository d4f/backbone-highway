# Routing Backbone with style \o/

[![Build Status](https://travis-ci.org/d4f/backbone-highway.svg?branch=dev)](https://travis-ci.org/d4f/backbone-highway) [![No Maintenance Intended](http://unmaintained.tech/badge.svg)](http://unmaintained.tech/)
----

## New Highway

Please consider using the new package [backbone-highway2](https://github.com/d4f/highway) instead which still is actively maintained.

----

```Backbone.Highway``` wraps the ```Backbone.Router``` to simplify its use and bring new functionalities

Its structure and API is inspired by routers in the Node.js frameworks: Meteor and ExpressJS.

Added functionalities compared to the ```Backbone.Router``` are:

 * Multiple controllers for a same path
 * Before and After triggers distributed using an event aggregator
 * Simple trigger cache managing
 * Aliasing between routes
 * "Secured" routes
 * Close action (similar to onbeforeunload)

## Installation

You can install the library via npm:

```
npm install backbone-highway
```

Or bower:

```
bower install backbone-highway
```

## Getting started

To get started we simply declare some routes using the ```Backbone.Highway.route()``` method and then start
the router with the ```Backbone.Highway.start()``` method.

Let's just jump right in with an example:

```javascript
// Declare a home route
Backbone.Highway.route('home', {
  // The url to which the route will respond
  path: '/',

  // Method to be executed when the given path is intercepted
  action: function () {
    // Do something fantastic \o/
  }
});

// Declare a user profile route
Backbone.Highway.route('profile', {
  path: '/users/:id',
  action: function (id) {
    // Render user profile page using id parameter
  }
});

// Wait for document ready event
$(function () {
  // Start the router
  Backbone.Highway.start();
});
```

To learn more about the routers capabilities see the full documentation here : http://d4f.github.io/backbone-highway/

## Dependencies and structure

The dependencies are:

 - Backbone >= 1.1.4
 - Underscore >= 1.4.4

Until now the library was overriding the ```Backbone.Router``` namespace. I now understand that this was a huge mistake as it was breaking the dependencies of other Backbone libraries by replacing the core API. Thus the new name ```Backbone.Highway```

## Demo / Example

A demo is available in the ```demo``` folder.

Use npm and bower to install dependencies and grunt to launch the demo server.


```
~/backbone-highway$ npm install && bower install
~/backbone-highway$ grunt serve
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
