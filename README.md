# Routing Backbone with style \o/

[![Build Status](https://travis-ci.org/d4f/backbone-highway.svg?branch=dev)](https://travis-ci.org/d4f/backbone-highway)
----

```Backbone.Highway``` wraps the ```Backbone.Router``` to simplify its use and bring new functionalities

Its structure and API is inspired by routers in the Node.js frameworks: Meteor and ExpressJS.

Added functionalities compared to the ```Backbone.Router``` are:

 * Multiple controllers for the same path
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

## Dependencies and structure

The dependencies are:

 - Backbone >= 1.1.4
 - Underscore >= 1.4.4

Until now the library was overriding the ```Backbone.Router``` namespace. I now understand that this was a huge mistake as it was breaking the dependencies of other Backbone libraries by replacing the core API. Thus the new name ```Backbone.Highway```

## General use

Declaring routes goes through executing a simple method: ```Backbone.Highway.map();```

This method takes a function as its only parameter which will be executed in the router's context to access the internal API easily. A route consists of a unique name and an object to describe the route's action.

Let's just jump right in with an example:

```javascript
// Create an app object containing an
// instance of Backbone.Events
var App = {
  events: _.extend({}, Backbone.Events)
};

// Start route declarations
Backbone.Highway.map(function () {
  // Declare a route named 'home'
  this.route('home', {
    // The url to which the route will respond
    path: '/',

    // Method to be executed when the given path is intercepted
    action: function () {
      // Do something fantastic \o/
    }
  });

  // Declare other routes...
});

// Wait for document ready event
$(function () {
  // Start the router passing a global event aggregator
  Backbone.Highway.start({
    dispatcher: App.events
  });
});
```

## Start routing

The router has to be started via the ```start``` method.
It receives an ```options``` object containing at least a ```dispatcher```

Parameters:

 - Options (Object) - Override default router configuration

These are the default options :

```javascript
/**
 * Default options that are extended when the router is started
 * @type {Object}
 */
var defaultOptions = {
  // --- Backbone History options ---
  // Docs: http://backbonejs.org/#History

  // Use html5 pushState
  pushState: true,

  // Root url
  root: '',

  // Set to false to force page reloads for old browsers
  hashChange: true,

  // Don't trigger the initial route
  silent: false,

  // --------------------------------

  // Event aggregator used to dispatch triggers.
  // Highway will not work without at least an instance of Backbone.Events
  // Also accepts an instance of Backbone.Wreqr or any object containing a 'trigger' method.
  dispatcher: null,

  // The current user status, logged in or not
  authenticated: false,

  // Enable automatic execution of a login route when accessing a secured routes
  redirectToLogin: false,

  // Names of automatically executed routes
  routes: {
    login: 'login',
    error404: '404',
    error403: '403'
  }

  // Print out debug information
  debug: false,

  // Override log method
  log: function () {
    if (this.debug && window.console && window.console.log) {
      window.console.log.apply(window.console, arguments);
    }
  }
};
```

Example of overriding the default options :


```javascript
// Create app
var App = {
  events: _.extend({}, Backbone.Events)
};

// Define some routes ...

// Start the router passing an options object
Backbone.Highgway.start({
  dispatcher: App.events,

  // Root url for all routes, passed to Backbone.history
  root: '/admin',

  // Activate html5 pushState or not, true by default
  pushState: false,

  // Whether the user is currently logged in or not
  authenticated: true,

  // If not logged in, redirect the user to a route named "login"
  redirectToLogin: true,

  // Print out routing debug information to the console
  debug: true
});
```

## Router go!

To redirect the user to a certain route when, for example, he clicks a link simply use the ```go``` method.

```javascript
Backbone.Highway.go('home');
```

**Parameters**

 - name (Mixed): The route name to execute or an object describing the route.
 - args (Mixed): Array of arguments, can also be a function's ```arguments``` object.
 - options (Object): Passed to the Backbone.Router navigate method. Defaults to ```{ trigger: true, replace: false }```

Let's define a route that takes a parameter:

```javascript
Backbone.Highway.map(function () {
  // Declare a user profile page
  this.route('user.profile', {
    path: '/user/:id',
    action: function(userId) {
      // Render user profile page
    }
  });
})
```

Considering the current page contains a link like this:

```javascript
<a href="/user/42" class="profile" data-id="42">Your profile!</a>
```

We could write a script (using jquery) to redirect the user like so:

```javascript
// Intercept the user click
$('a.profile').click(function (e) {
  e.preventDefault();

  var userId = $(this).attr('data-id');

  // Redirecting to route named 'user.profile' passing an id
  Backbone.Highway.go('user.profile', [userId]);
});
```

As the first parameter to the ```go``` method can be an object, we could also write the previous script in this manner:

```javascript
// Intercept the user click
$('a.profile').click(function (e) {
  e.preventDefault();

  // Redirecting to route using the path defined in the href attribute
  Backbone.Highway.go({
    path: $(this).attr('href')
  });
});
```


## Route declaration parameters

The ```path``` and ```action``` parameters are the base of a route. But a few more parameters exist to extend the control of the route.

```javascript
// Definition object for a route named 'user.edit'
{
  // Path with an 'id' parameter
  path: '/user/:id/edit',

  // Route will only be executed if the user is logged in
  authenticated: true,

  // Execute triggers before the 'action' controller
  before: [
    { name: 'core.display', cache: true },
    'users:display'
  ],

  // Main controller for the route
  action: function (userId) {
    // Render a user edit form
  },

  // Execute triggers after the 'action' controller
  after: [
    'core.postTriggers'
  ],

  // Executed when user is routed away from this route
  // similar to an 'onbeforeunload' event
  close: function () {
    // Return false to cancel the routing
    return confirm('Are you sure you want to leave this page?');
  }
}
```

### Catching client-side 404 and 403

A route named 404 can be declared to catch all non-existent routes.
In the same way a route can be named 403 to catch accessing restricted routes.

```javascript
Backbone.Highway.map(function () {
  // 404 controller
  this.route('404', {
    action: function (path) {
      // Couldn't find what you're looking for =/
    }
  });

  // 403 controller
  this.route('403', {
    action: function (path) {
      // Sorry you can't access this content =(
    }
  });
});
```

For convenience, the action methods will receive the current ```window.location.pathname``` as the first argument.

The 404 controller will also be executed when a non-existent route is called with the ```go``` method.

The 403 controller will only be executed if the ```redirectToLogin``` option is set to ```false```.

## Events distribution (Triggers)

To distribute the triggers declared in the ```before``` and ```after``` parameters ```Backbone.Highway``` uses an instance of any Backbone like event aggregator. It has only been tested with ```Backbone.Events``` and ```Backbone.Wreqr```.

```Backbone.Highway``` only tests if the passed object has a ```trigger``` method. So it could be anything you like.

```javascript
// Create app with instace of Backbone.Events
var App = {
  events: _.extend({}, Backbone.Events)
};

// Start the router
Backbone.Highway.start({
  dispatcher: App.events
});
```

## Trigger declaration

Triggers can be declared in different ways.

They can be a simple ```String``` for the simple ones:

```javascript
{
  // ...
  before: [
    'core',
    'module',
    'submodule'
  ],
  // ...
}
```
They can also be declared as an ```Object``` with different parameters:

```javascript
{
  // ...
  before: [
    { name: 'core', cache: true },
    { name: 'module', args: ['foo', 'bar'] },
    'submodule'
  ],
  // ...
}
```

**Most importantly:** Each declared route becomes a trigger itself so that routes can build on each other.

## Secured routes

Each route can receive an ```authenticated``` boolean parameter to declare if the route should be interpreted when the user is logged in or not.

```javascript
Backbone.Highway.map(function() {
  // Declare secure route
  this.route('admin.users', {
    path: '/admin/users',
    authenticated: true,
    action: function () {
      // Display list of users
    }
  });
});
```
To make a route be interpreted in both cases (i.e. when the user is logged in or logged out),
simply leave out the ```authenticated``` parameter in the route declaration.

**Important**

Only the server has the authority to tell if a connected client is a logged in user or not.
So for this system to actually work, the server has to print out a small piece of JavaScript to tell the router the current client's state:

```php
<script type="text/javascript" src="backbone.highway.js"></script>
<script type="text/javascript">
window.LOGGED_IN = <?php if ($_SESSION['logged_in']): ?>true<?php else: ?>false<?php endif; ?>;

$(funtion() {
  // Starting the router telling it if the user is logged in or not
  Backbone.Highway.start(App, {
    authenticated: window.LOGGED_IN
  });
});
</script>
```


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
