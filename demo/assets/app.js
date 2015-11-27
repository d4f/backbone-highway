(function () {
  'use strict';

  var App = {
    events: _.extend({}, Backbone.Events)
  };

  Backbone.Highway.map(function () {
    // Catching client-side 404s (optional)
    this.route('404', {
      action: function (path) {
        console.log('Controller action: 404, path: %s', path);
        $('.content').html('404 ! =(');
      }
    });

    // Catching client-side 403s (optional)
    this.route('403', {
      action: function (path) {
        console.log('Controller action: 403, path: %s', path);
        $('.content').html('403 ! =(');
      }
    });

    // Declaring a home route
    this.route('home', {
      path: '/',
      before: [{
        name: 'core',
        cache: true
      }, {
        name: 'module',
        cache: true
      }],
      action: function () {
        console.log('Controller action: home');
        $('.content').html('Current page: Home');
      },
      // close: function () {
      //   if (App.user) {
      //     return confirm('Do you really want to quit the page?');
      //   }

      //   return true;
      // }
    });

    // Declaring a users list route
    this.route('users_list', {
      path: '/users',
      before: [
        {path: '/'}, // Executing the home route as a trigger
        'other_module'
      ],
      action: function () {
        console.log('Controller action: users_list');
        $('.content').html('Current page: Users');
      }
    });

    // Multiple controller for a same route
    this.route('users_list_extension', {
      path: '/users',
      action: function () {
        console.log('Controller action: users_list_extension');
      }
    });

    // Declaring an alias to the users list route
    this.route('users_alias', {
      path: '/some-alias',
      action: 'users_list'
    });

    this.route('alias.test', {
      path: '/alias/:id',
      before: [
        {path: '/users/1234', args: [5432]}
        // {name: 'user_show', args: [99]}
        // {name: 'user_show'}
      ],
      action: function (id) {
        console.log('Alias test: id=%s', id);
      }
    });

    // Declaring a secured route with a parameter
    this.route('user_show', {
      path: '/users/:id',
      // authenticated: true,
      action: function (userId) {
        console.log('Controller action: user_show');
        $('.content').html('Current page: User #' + userId);
      }
    });

    // Declaring a login route
    this.route('signin', {
      path: '/signin',
      authenticated: false,
      action: function () {
        console.log('Controller action: signin');

        loginUser();
      }
    });

    // Declaring a logout route
    this.route('logout', {
      path: '/logout',
      authenticated: true,
      action: function () {
        console.log('Controller action: logout');

        logoutUser();
      }
    });

    this.route('splat', {
      path: '/splat(/p:id)(/name/*path)',
      action: function () {
        console.log('Splat route', arguments);
      }
    });

  });

  App.MenuView = Backbone.Marionette.ItemView.extend({
    events: {
      'click a': 'navigate'
    },

    initialize: function () {
      console.log('[App.MenuView.initialize] init the menu view');
    },

    navigate: function (e) {
      e.preventDefault();

      var $el = $(e.target);

      var route = $el.attr('data-route'),
        id = $el.attr('data-id');

      if (id !== undefined) {
        Backbone.Highway.go(route, [id]);
      }
      else {
        Backbone.Highway.go(route);
      }
    }
  });

  var loginUser = function () {
    App.user = prompt('Enter your name :', 'JS Ninja');

    if (App.user !== null) {
      sessionStorage.setItem('user', App.user);
      location.href = '/';
    }
    else {
      console.log('Login canceled');
      Backbone.Highway.clearStore();
    }
  };

  var logoutUser = function () {
    sessionStorage.removeItem('user');
    location.href = '/';
  };

  /**
   * Register to some app events that will be triggered by the router
   * Typically where you would orchestrate the render of the application
   */
  var registerEvents = function () {
    App.events.on('core', function () {
      console.log('Got trigger: core');
    });

    App.events.on('module', function () {
      console.log('Got trigger: module');
    });

    App.events.on('other_module', function () {
      console.log('Got trigger: other module');
    });
  };

  $(function () {
    registerEvents();

    App.user = sessionStorage.getItem('user');

    if (App.user) {
      $('#main .username').html(App.user);
      $('#main .user, nav .logout').show();
      $('nav .login').hide();
    }

    Backbone.Highway.start({
      // dispatcher: App.events,
      authenticated: App.user ? true : false,
      redirectToLogin: true,
      debug: true,
      routes: {
        login: 'signin'
      },
      // silent: true,
      // "root": "/admin",
      // "pushState": false
    });

    App.menu = new App.MenuView({
      el: $('header nav')
    });

    Backbone.Highway.route('test_route', {
      path: '/test',
      before: [
        {path: '/users'}
      ],
      action: function () {
        console.log('meh \\o/');
      }
    });
  });
})();
