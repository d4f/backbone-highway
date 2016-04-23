define([
  'underscore',
  'backbone',
  'backbone.highway'
], function (_, Backbone, router) {
  'use strict';

  // jshint -W030

  var RouterCopy = function () {};
  RouterCopy.prototype = _.merge({}, router.prototype);

  before(function () {
    this.dispatcher = _.extend({}, Backbone.Events);

    this.options = {
      allowClose: true
    };

    var self = this;

    router.route('home', {
      path: '/',
      action: function () {}
    });
    router.route('settings', {
      path: '/settings',
      action: function () {},
      close: function () {
        return self.options.allowClose;
      }
    });
    router.route('users.detail', {
      path: '/users/:id',
      action: function () {}
    });
    router.route('users.action', {
      path: '/users/:id/:action-:section',
      action: function () {}
    });
    router.route('splat', {
      path: '/splat/*stuff',
      action: function () {}
    });
    router.start({
      dispatcher: this.dispatcher,
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

    it('should have a `define` method', function () {
      should.exist(router.define);
    });

    it('should have a `declare` method', function () {
      should.exist(router.declare);
    });

    it('should have a `route` method', function () {
      should.exist(router.route);
    });

    it('should have a `go` method', function () {
      should.exist(router.go);
    });

    it('should have a `clearCache` method', function () {
      should.exist(router.clearCache);
    });
  });

  describe('Public method', function () {
    describe('start', function () {
      it.skip('should initialize Highway and the underlying Backbone.Router', function () {});
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

      it('should have `define` and `declare` as aliases', function () {
        var callback = function () { return true; };
        router.define(callback).should.be.true;
        router.declare(callback).should.be.true;
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
        router.go('settings');
        router.go('home').should.be.true;
      });

      it('should accept a route object with a name', function () {
        router.go('settings');
        router.go({name: 'home'}).should.be.true;
      });

      it('should accept a route object with a path', function () {
        router.go('settings');
        router.go({path: '/'}).should.be.true;
      });

      it('should accept an object with named parameters as arguments', function () {
        router.go('users.detail', {id: 42}).should.be.true;
        Backbone.history.getFragment().should.equal('users/42');

        router.go('home');

        router.go({name: 'users.detail', args: {id: 42}}).should.be.true;
        Backbone.history.getFragment().should.equal('users/42');
      });

      it('should change the url fragment', function () {
        router.go('home').should.be.true;
        Backbone.history.getFragment().should.equal('');

        router.go({path: 'users/42'}).should.be.true;
        Backbone.history.getFragment().should.equal('users/42');

        router.go('users.action', [42, 'edit', 'profile']).should.be.true;
        Backbone.history.getFragment().should.equal('users/42/edit-profile');
      });

      it('should get allowed or blocked by the close controller of a route', function () {
        router.go('settings');

        this.options.allowClose = false;
        router.go('home').should.be.false;

        this.options.allowClose = true;
        router.go('home').should.be.true;
      });

      it('should re-execute the current controller when navigating with option force=true', function () {
        router.go('settings');
        router.go('home').should.be.true;
        router.go('home').should.be.false;
        router.go('home', null, {force: true}).should.be.true;
        router.go({
          name: 'home',
          options: {force: true}
        }).should.be.true;
      });
    });

    describe('clearCache', function () {
      it('should empty trigger cache memory', function () {
        router.clearCache().should.be.true;
      });
    });
  });

  describe('Private method', function () {
    describe('_processTriggers', function () {
      it.skip('should process a list of triggers', function () {});
    });

    describe('_processTrigger', function () {
      it.skip('should process a single trigger', function () {});
    });

    describe('_processControllers', function () {
      it.skip('should process a list of controllers', function () {});
    });

    describe('_findCachedTrigger', function () {
      it.skip('should retrieve a cached trigger', function () {});
    });

    describe('_cacheTrigger', function () {
      it.skip('should set a trigger as cached', function () {});
    });

    describe('_startHistory', function () {
      it.skip('should start Backbone.History', function () {});

      it.skip('should trigger a 404 if the opening route does not exist', function () {});

      it.skip('should apply stored route if it exists', function () {});
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

    describe('_applyStoredRoute', function () {
      it.skip('should load route from storage and navigate to it', function () {});
    });

    describe('_path', function () {
      it('should return false if the route does not exist', function () {
        router._path('inexisting.route').should.be.false;
      });

      it('should return the route url with injected parameters for an existing route', function () {
        router._path('users.detail').should.equal('users/:id');
      });
    });

    describe('_name', function () {
      it('should find the name of a route by its path', function () {
        router._name('/settings').should.equal('settings');
        router._name('/users/42').should.equal('users.detail');
        router._name('/splat/stuff/going-behind').should.equal('splat');
      });

      it('should return false if the path does not exist', function () {
        router._name('/inexisting/path').should.be.false;
      });
    });

    describe('_exists', function () {
      it('should tell if a route exists by its name', function () {
        router._exists({name: 'users.detail'}).should.be.true;
        router._exists({name: 'undefined.route.name'}).should.be.false;
      });

      it('should tell if a route exists by its path', function () {
        router._exists({path: '/users/99'}).should.be.true;
        router._exists({path: '/some/random/route'}).should.be.false;
      });
    });

    describe('_parse', function () {
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
        router._parse('users(/:id)', [42]).should.equal('users/42');
        router._parse('users/:id(/edit/:part)', [42, 'email']).should.equal('users/42/edit/email');
      });

      it('should throw an error if mandatory parameters are not passed', function () {
        var fn = _.bind(router._parse, router, '/user/:id');
        expect(fn).to.throw(ReferenceError, /Missing necessary arguments/);

        fn = _.bind(router._parse, router, '/user/:id/edit/:context', [42]);
        expect(fn).to.throw(ReferenceError, /Missing necessary arguments/);
      });

      it('should remove optional parameters part from path if no or part of arguments are given', function () {
        var simpleRoute = '/users(/:id)';
        var complicatedRoute = '/users(/:id)(/edit/:context)';

        router._parse(simpleRoute).should.equal('/users');
        router._parse(simpleRoute, [null]).should.equal('/users');

        router._parse(complicatedRoute, []).should.equal('/users');
        router._parse(complicatedRoute, [42, null]).should.equal('/users/42');
        router._parse(complicatedRoute, [42, 'profile']).should.equal('/users/42/edit/profile');
      });

      it('should allow text to surround a parameter in a URL component', function () {
        router._parse('/article/:name/p:number', ['title', 5]).should.equal('/article/title/p5');
      });

      it('should allow for multiple parameters in a single URL component', function () {
        router._parse('/article/p:page-:section', [5, 'summary']).should.equal('/article/p5-summary');
      });

      it('should inject splat params being optional or not', function () {
        router._parse('/article/*options', ['42/edit']).should.equal('/article/42/edit');
        router._parse('/article/p:id(/*options)', [5]).should.equal('/article/p5');
        router._parse('/article/p:id(/*options)', [5, 'view/details']).should.equal('/article/p5/view/details');
      });

      it('should allow optional parts that do not contain any parameters', function () {
        router._parse('/users(/:id)(/)', []).should.equal('/users');
        router._parse('/users(/:id)(/)', [42]).should.equal('/users/42');
      });
    });

    describe('_replaceArg', function () {
      it('should replace a named parameters', function () {
        router._replaceArg('/user/:id', '42').should.equal('/user/42');
      });

      it('should replace a splat parameter', function () {
        router._replaceArg('/user/*definition', '42/edit').should.equal('/user/42/edit');
      });

      it('should return path unaltered if no parameters are left to be replaced', function () {
        router._replaceArg('/user/42', 'name').should.equal('/user/42');
      });
    });

    describe('_checkPath', function () {
      it('should validate the structure of a given path', function () {
        router._checkPath('/users/42').should.be.true;
        router._checkPath('/articles/99/p5-summary').should.be.true;

        var fn = _.bind(router._checkPath, router, '/users/:id');
        expect(fn).to.throw(ReferenceError, /Missing necessary arguments/);

        fn = _.bind(router._checkPath, router, '/articles(/p:page)');
        expect(fn).to.throw(ReferenceError, /Missing necessary arguments/);

        fn = _.bind(router._checkPath, router, '/splat/*stuff');
        expect(fn).to.throw(ReferenceError, /Missing necessary arguments/);
      });
    });

    describe('_sanitizeArgs', function () {
      it('should wrap into an array anything that is not an array or an object', function () {
        router._sanitizeArgs(42).should.deep.equal([42]);
        router._sanitizeArgs('something').should.deep.equal(['something']);
      });

      it('should remove undesired argument values (null, undefined)', function () {
        router._sanitizeArgs([42, null, undefined]).should.deep.equal([42]);
      });
    });

    describe('_isValidArgsArray', function () {
      it('should validate the structure and content of passed arguments sanitizing it before hand', function () {
        router._isValidArgsArray(42).should.be.true;
        router._isValidArgsArray([42, 'edit', null]).should.be.true;
        router._isValidArgsArray([null, undefined]).should.be.false;
        router._isValidArgsArray([]).should.be.false;
      });
    });

    describe('_stripHeadingSlash', function () {
      it('should remove first slash from a path', function () {
        router._stripHeadingSlash('/test/path').should.equal('test/path');
      });

      it('should return false if wrong parameter type is given', function () {
        router._stripHeadingSlash(777).should.be.false;
        router._stripHeadingSlash(['stuff']).should.be.false;
        router._stripHeadingSlash({
          some: 'object'
        }).should.be.false;
      });
    });

    describe('_getStoreKey', function () {
      it('should generate a localStorage key from options', function () {
        var store = router.options.store;
        var key = 'path';
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

    describe('_removeRootUrl', function () {
      it('should remove pushState root url from path', function () {
        router.options.root = '/root-url';
        router._removeRootUrl('/root-url/testing').should.equal('/testing');
        router.options.root = '';
      });
    });

    describe('_convertArgObjectToArray', function () {
      it('should convert named arguments object to an ordered array', function () {
        router._convertArgObjectToArray(
          '/user/:id/edit/:section',
          {section: 'profile', id: 42}
        ).should.deep.equal([42, 'profile']);
      });
    });
  });
});
