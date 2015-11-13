define([
  'underscore',
  'backbone',
  'backbone.highway'
], function (_, Backbone, router) {
  'use strict';

  // jshint -W030

  var dispatcher = _.extend({}, Backbone.Events);

  var options = {
    allowClose: true
  };

  before(function () {
    router.route('home', {
      path: '/',
      action: function () {}
    });
    router.route('settings', {
      path: '/settings',
      action: function () {},
      close: function () {
        return options.allowClose;
      }
    });
    router.route('users.detail', {
      path: '/users/:id',
      action: function () {}
    });
    router.start({
      dispatcher: dispatcher,
      pushState: false
    });
  });

  describe('Exposed object', function () {
    it('should have a `start` method', function () {
      should.exist(router.start);
    });

    it('should have a `map` method', function () {
      should.exist(router.map);
    });

    it('should have a `route` method', function () {
      should.exist(router.route);
    });

    it('should have a `go` method', function () {
      should.exist(router.go);
    });
  });

  describe('Public method', function () {
    describe('start', function () {
      it('should throw a ReferenceError if a dispatcher instance is missing', function () {
        var fn = _.bind(router.start, router);
        expect(fn).to.throw(ReferenceError);
      });
    });

    describe('map', function () {
      it('should throw a TypeError if the first argument is not a function', function () {
        var fn = _.bind(router.map, router);
        expect(fn).to.throw(TypeError, /should be a function/);
      });

      it('should execute given definer function', function () {
        var callback = function () { return true; };
        router.map(callback).should.be.true;
      });
    });

    describe('route', function () {
      it('should throw a ReferenceError if the name is not a string', function () {
        var fn = _.bind(router.route, router, 1337);
        expect(fn).to.throw(ReferenceError, /Route name should be a string/);
      });

      it('should throw a ReferenceError if the route definition is not an object', function () {
        var fn = _.bind(router.route, router, 'bad.definition', 500);
        expect(fn).to.throw(ReferenceError, /needs to be an object/);
      });
    });

    describe('go', function () {
      it('should accept a route name', function () {
        router.go('home').should.be.true;
      });

      it('should accept a route object with a name', function () {
        router.go({name: 'home'}).should.be.true;
      });

      it('should accept a route object with a path', function () {
        router.go({path: '/'}).should.be.true;
      });

      it('should change the url fragment', function () {
        router.go('home').should.be.true;
        Backbone.history.getFragment().should.equal('');

        router.go({path: '/users/42'}).should.be.true;
        Backbone.history.getFragment().should.equal('users/42');
      });

      it('should get allowed or blocked by the close controller of a route', function () {
        router.go('settings');

        options.allowClose = false;
        router.go('home').should.be.false;

        options.allowClose = true;
        router.go('home').should.be.true;
      });
    });
  });

  describe('Private method', function () {
    describe('_parse', function () {
      // FIXME - Maybe the _parse method should return an error for this
      it.skip('should return the path as is if no arguments are given or arguments is not an array', function () {
        router._parse('/test/path').should.equal('/test/path');
        router._parse('/user/:id', 'meh').should.equal('/user/:id');
      });

      it('should inject parameters into the path', function () {
        router._parse(
          'users/:id',
          [42]
        ).should.equal('users/42');

        router._parse(
          'users/:id/edit/:part',
          [42, 'email']
        ).should.equal('users/42/edit/email');
      });

      it('should inject optional params into the path', function () {
        router._parse(
          'users(/:id)',
          [42]
        ).should.equal('users/42');

        router._parse(
          'users/:id(/edit/:part)',
          [42, 'email']
        ).should.equal('users/42/edit/email');
      });

      it('should remove optional parameters part from path if no arguments are given', function () {
        // FIXME - _parse('/user(/:id)') === '/user'
        // router._parse('/user(/:id)').should.equal('/user');
      });
    });

    describe('_path', function () {
      it('should return false if the route does not exist', function () {
        router._path('inexisting.route').should.be.false;
      });

      it('should return the route url with injected parameters for an existing route', function () {
        router._path('users.detail', [42]).should.equal('users/42');
      });
    });

    describe('_stripHeadingSlash', function () {
      it('should remove first slash from a path', function () {
        router._stripHeadingSlash('/test/path').should.equal('test/path');
      });
    });

    describe('_getStoreKey', function () {
      it('should generate a localStorage key from options', function () {
        var store = router.options.store, key = 'path';
        router._getStoreKey(key).should.equal(store.prefix + store.separator + key);
      });
    });

    describe('_storeCurrentRoute', function () {
      before(function () {
        router.go('users.detail', [42]);
        router._storeCurrentRoute();
      });

      it('should store the current route in the localStorage', function () {
        localStorage.getItem(router._getStoreKey('path')).should.equal('users/42');
      });

      after(function () {
        localStorage.removeItem(router._getStoreKey('path'));
      });
    });

    describe('_extractParameters', function () {
      it('should extract parameters from a path', function () {
        var args = router._extractParameters('users.detail', '/users/42');
        args.should.be.an.array;
        args[0].should.equal('42');

        // Backbone generates a null value as the last item in the extracted arguments array?!
        args.should.have.length(2);
      });
    });

    describe('_routeToRegExp', function () {
      it('should generate a regular expression from a path', function () {
        var re = router._routeToRegExp('users/:id');
        expect(re instanceof RegExp).to.be.ok;
      });
    });

    describe('_httpError', function () {
      it('should not execute anything if no error controllers are defined', function () {
        router._httpError(404).should.be.false;
        router._httpError(403).should.be.false;
      });

      it('should throw an Error if unhandled http error code is given', function () {
        var fn = _.bind(router._httpError, router, 500);
        expect(fn).to.throw(Error, /Unhandled http error code: 500/);
      });

      it('should execute error controllers if defined', function () {
        var errorRoute = {
          action: function () {}
        };
        router.route('404', errorRoute);
        router.route('403', errorRoute);

        router._httpError(404).should.be.true;
        router._httpError(403).should.be.true;
      });
    });
  });
});
