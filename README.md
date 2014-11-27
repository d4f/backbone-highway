# Routing Marionette with style \o/
----

This library wraps the ```Backbone.Marionette``` router to simplify it's use and bring new functionnalities

It's structure and API is inspired by routers in the Node.js frameworks: Meteor and ExpressJS.

Added functionnalities compared to the ```Backbone.Marionette``` router are :

 * Multiple controllers for a same path
 * Before and After triggers
 * Trigger caching
 * Aliasing
 * "Secured" routes

## Installation

You can install the library via bower :

```
bower install marionette-router
```

## General use

Declaring routes goes through executing a simple method : ```Backbone.MarionetteRouter.map();```

This method takes a function as it's only parameter which will be executed in the router's context to access the internal API easily. A route consists of a unique name and an object to describe the route's action.

Let's just jump right in with an example :

```javascript
// Create a marionette app instance
var App = new Backbone.Marionette.Application();

// Start route declarations
Backbone.MarionetteRouter.map(function() {
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
  Backbone.MarionetteRouter.start(App);
});
```

**Important:** Routes have to be declared before ```Backbone.Marionette``` and ```Backbone.MarionetteRouter``` are started.

## Start routing

The MarionetteRouter has to be started via the ```start``` method right after the Marionette application has been started.

The start method needs to receive the Marionette instance as the first parameter, and it can take an object as the second parameter to change the routers behaviour.

Building on the previous script, here is a complete example :

```javascript
// Start the marionette app
App.start();

// Start the router passing the marionette app instance and an options object
Backbone.MarionetteRouter.start(App, {
  // Root url for all routes, passed to Backbone.history
  "root": "/admin",

  // Activate html5 pushState or not, true by default
  "pushState": false,

  // Is the user currently logged in or not
  "authed": false,

  // If not logged in, redirect the user to a route named "login" (if it exists)
  "redirectToLogin": false,

  // Print out routing debug information to the console
  "debug": true
});
```

## Router go !

To redirect the user to a certain route when, for example, he clicks a link simply use the ```go``` method.

```javascript
Backbone.MarionetteRouter.go("home");
```

**Parameters**

 - name (String) : The route name to execute.
 - args (Mixed) : Array of arguments, can also be a functions ```arguments``` object.
 - options (Object) : Passed to the Backbone.Router navigate method. Defaults to ```{ "trigger": true, "replace": false }```

Let's define a route that takes a parameter :

```javascript
Backbone.MarionetteRouter.map(function() {
  // Declare a user profile page
  this.route("user_profile", {
    "path": "/user/:id",
    "action": function(userId) {
      // Render user profile page
    }
  });
})
```

Considering the current page contains a link like this :

```javascript
<a href="/user/42" class="profile" data-id="42">Your profile!</a>
```

We could write a script (using jquery) to redirect the user like so :

```javascript
// Intercept the user click
$("a.profile").click(function(e) {
  e.preventDefault();

  var userId = $(this).attr("data-id");

  // Redirecting to route named "user_profile" passing an id
  Backbone.MarionetteRouter.go("user_profile", [userId]);
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
  ]
}
```

### Catching client-side 404

A route named 404 can be declared to catch all inexisting routes :

```javascript
Backbone.MarionetteRouter.map(function() {
  // 404 controller
  this.route("404", {
    "action": function(path) {
      // Render a nice 404 page
    }
  });
});
```

For convenience, the action method will receive the current ```window.location.pathname``` as the first argument.
The controller will also be executed when an inexisting route is called with the ```go``` method.

## Events distribution (Triggers)

To distribute the triggers declared in the ```before``` and ```after``` parameters the ```Backbone.MarionetteRouter``` uses the ```Marionette``` global event aggregator : ```App.vent```

This parameter can be overridden using any ```Backbone.Events``` instance.

```javascript
var App = new Backbone.Marionette.Application();

// Create a custom event aggregator
var myDispatcher = _.extend({}, Backbone.Events);

// Pass the custom object to the Router
Backbone.MarionetteRouter.dispatcher = myDispatcher;

App.start();
Backbone.MarionetteRouter.start(App);
```

## Trigger declaration

Triggers can be declared in different ways.

It can be a simple ```String``` for the simple ones :

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
It can also be declared as an object with different parameters :

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

**Most importantly :** Each declared route becomes a trigger itself so that routes can build on each other.

## Secured routes

Each route can receive an ```authed``` boolean parameter to declare if the route should be interpreted when the user is logged in or not.

```javascript
Backbone.MarionetteRouter.map(function() {
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
So for this system to actually work, the server has to print out a small piece of JavaScript to tell the router the current client's state :

```php
<script type="text/javascript" src="backbone.marionetterouter.js"></script>
<script type="text/javascript">
window.logged_in = <?php if ($_SESSION['logged_in']): ?>true<?php else: ?>false<?php endif; ?>;

$(funtion() {
  // Starting the marionette app
  App.start();

  // Starting the router telling it if the user is logged in or not
  Backbone.MarionetteRouter.start(App, {
    "authed": window.logged_in
  });
});
</script>
```


## Example

An implementation example ```index.php``` file is available in the repository. To run it create an apache vhost or using any web server you like.

So that client-side routing can work, every request sent to the server must be answered with the same code,
therefore an ```.htaccess``` file activating mod_rewrite and redirecting all the requests to the ```index.php``` file is also available in the repository.