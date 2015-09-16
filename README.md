# Routing Backbone with style \o/
----

This library wraps the ```Backbone.Router``` to simplify its use and bring new functionalities

Its structure and API is inspired by routers in the Node.js frameworks: Meteor and ExpressJS.

Added functionalities compared to the ```Backbone.Router``` are:

 * Multiple controllers for the same path
 * Before and After triggers distributed using an event aggregator
 * Simple trigger cache managing
 * Aliasing between routes
 * "Secured" routes
 * Close action (similar to onbeforeunload)

## Installation

You can install the library via bower:

```
bower install backbone-router
```

## Dependencies and structure

The project has been renamed from marionette-router to backbone-router, because the ```Backbone.Marionette``` dependency has been removed.

The dependencies left are:

 - Backbone >= 1.1.4
 - Underscore >= 1.4.4 

Until now the library was overriding the ```Backbone.Router``` namespace. I now understand that this was a huge mistake as it was breaking the dependencies of other Backbone libraries by replacing the core API.

## General use

Declaring routes goes through executing a simple method: ```Backbone.Router.map();```

This method takes a function as its only parameter which will be executed in the router's context to access the internal API easily. A route consists of a unique name and an object to describe the route's action.

Let's just jump right in with an example:

```javascript
// Create a marionette app instance
var App = new Backbone.Marionette.Application();

// Start route declarations
Backbone.Router.map(function() {
  // Declare a route named 'home'
  this.route("home", {
    // The url to which the route will respond
    "path": "/",
    // Method to be executed when the given path is intercepted
    "action": function() {
      // Do something fantastic \o/
    }
  });

  // Declare other routes...
});

// Wait for document ready event
$(function() {
  // Start the marionette app
  App.start();

  // Start the router passing the marionette app instance
  Backbone.Router.start(App);
});
```

## Start routing

The router has to be started via the ```start``` method.

Parameters:

 - App (Mixed) - Can be an instance of ```Backbone.Marionette.Application``` or a copy of ```Backbone.Events```. Will be used to execute triggers declared in routes.
 - Options (Object) - Override default router configuration

If given a Marionette app instance the router will use the ```vent``` global event aggregator to distribute route triggers.

Building on the previous script, here is an example:

```javascript
// Create app
var App = new Backbone.Marionette.Application();

// Define some routes ...

// Start the marionette app
App.start();

// Start the router passing the marionette app instance and an options object
Backbone.Router.start(App, {
  // Root url for all routes, passed to Backbone.history
  "root": "/admin",

  // Activate html5 pushState or not, true by default
  "pushState": false,

  // Whether the user is currently logged in or not
  "authed": false,

  // If not logged in, redirect the user to a route named "login" (if it exists)
  "redirectToLogin": false,

  // Print out routing debug information to the console
  "debug": true
});
```

Or passing a ```Backbone.Events``` copy:

```javascript
// Copy Backbone.Events
var dispatcher = _.extend({}, Backbone.Events);

// Start router
Backbone.Router.start(dispatcher);
```

The dispatcher can also be overridden before the router is started in this way:

```javascript
Backbone.Router.dispatcher = _.extend({}, Backbone.Events);
```

## Router go!

To redirect the user to a certain route when, for example, he clicks a link simply use the ```go``` method.

```javascript
Backbone.Router.go("home");
```

**Parameters**

 - name (Mixed): The route name to execute or an object describing the route.
 - args (Mixed): Array of arguments, can also be a function's ```arguments``` object.
 - options (Object): Passed to the Backbone.Router navigate method. Defaults to ```{ "trigger": true, "replace": false }```

Let's define a route that takes a parameter:

```javascript
Backbone.Router.map(function() {
  // Declare a user profile page
  this.route("user_profile", {
    "path": "/user/:id",
    "action": function(userId) {
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
$("a.profile").click(function(e) {
  e.preventDefault();

  var userId = $(this).attr("data-id");

  // Redirecting to route named "user_profile" passing an id
  Backbone.Router.go("user_profile", [userId]);
});
```

As the first parameter to the ```go``` method can be an object, we could also write the previous script in this manner:

```javascript
// Intercept the user click
$("a.profile").click(function(e) {
  e.preventDefault();

  // Redirecting to route using the path defined in the href attribute
  Backbone.Router.go({ "path": this.href });
});
```


## Route declaration parameters

The ```path``` and ```action``` parameters are the base of a route. But a few more parameters exist to extend the control of the route.

```javascript
// Definition object for a route named 'user_edit'
{
  // Path with an 'id' parameter
  "path": "/user/:id/edit",

  // Route will only be executed if the user is logged in
  "authed": true,

  // Execute triggers before the 'action' controller
  "before": [
    { "name": "core:display", "cache": true },
    "users:display"
  ],

  // Main controller for the route
  "action": function(userId) {
    // Render a user edit form
  },

  // Execute triggers after the 'action' controller
  "after": [
    "core:post_triggers"
  ],

  // Executed when user is routed away from this route
  // similar to an "onbeforeunload" event
  "close": function() {
    // Return false to cancel the routing
    return confirm("Are you sure you want to leave this page?");
  }
}
```

### Catching client-side 404 and 403

A route named 404 can be declared to catch all non-existent routes.
In the same way a route can be named 403 to catch accessing restricted routes.

```javascript
Backbone.Router.map(function() {
  // 404 controller
  this.route("404", {
    "action": function(path) {
      // Couldn't find what you're looking for =/
    }
  });

  // 403 controller
  this.route("403", {
    "action": function(path) {
      // Sorry you can't access this content =(
    }
  });
});
```

For convenience, the action methods will receive the current ```window.location.pathname``` as the first argument.

The 404 controller will also be executed when a non-existent route is called with the ```go``` method.

The 403 controller will only be executed if the ```redirectToLogin``` option is set to ```false```.

## Events distribution (Triggers)

To distribute the triggers declared in the ```before``` and ```after``` parameters the ```Backbone.Router``` uses the ```Marionette``` global event aggregator: ```App.vent```

This parameter can be overridden using any ```Backbone.Events``` instance or any object with a ```trigger``` method.

```javascript
var App = new Backbone.Marionette.Application();

// Create a custom event aggregator
var myDispatcher = _.extend({}, Backbone.Events);

// Pass the custom object to the Router
Backbone.Router.dispatcher = myDispatcher;

App.start();
Backbone.Router.start(App);
```

## Trigger declaration

Triggers can be declared in different ways.

They can be a simple ```String``` for the simple ones:

```javascript
{
  // ...
  "before": [
    "core",
    "module",
    "submodule"
  ],
  // ...
}
```
They can also be declared as an object with different parameters:

```javascript
{
  // ...
  "before": [
    { "name": "core", "cache": true },
    { "name": "module", args: [foo, bar] },
    "submodule"
  ],
  // ...
}
```

**Most importantly:** Each declared route becomes a trigger itself so that routes can build on each other.

## Secured routes

Each route can receive an ```authed``` boolean parameter to declare if the route should be interpreted when the user is logged in or not.

```javascript
Backbone.Router.map(function() {
  // Declare secure route
  this.route("secure_route", {
    "path": "/admin/users",
    "authed": true,
    "action": function() {
      // Display list of users
    }
  });
});
```
To make a route be interpreted in both cases (i.e. when the user is logged in or logged out),
simply leave out the ```authed``` parameter in the route declaration.

**Important**

Only the server has the authority to tell if a connected client is a logged in user or not.
So for this system to actually work, the server has to print out a small piece of JavaScript to tell the router the current client's state:

```php
<script type="text/javascript" src="backbone.router.js"></script>
<script type="text/javascript">
window.logged_in = <?php if ($_SESSION['logged_in']): ?>true<?php else: ?>false<?php endif; ?>;

$(funtion() {
  // Starting the marionette app
  App.start();

  // Starting the router telling it if the user is logged in or not
  Backbone.Router.start(App, {
    "authed": window.logged_in
  });
});
</script>
```


## Example

An implementation example ```index.php``` file is available in the repository. To run it create an apache vhost or use any web server you like.

So that client-side routing can work, every request sent to the server must be answered with the same code,
therefore an ```.htaccess``` file activating mod_rewrite and redirecting all requests to the ```index.php``` file is also available in the repository.


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

