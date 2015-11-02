define([
  'underscore',
  'backbone',
  'backbone.highway'
], function (_, Backbone, router) {
  'use strict';

  // jshint -W030

  var dispatcher = _.extend({}, Backbone.Events);

  describe('Public API methods', function () {
    it('should have a `start` method', function () {
      expect(
        _.isFunction(router.start)
      ).to.be.ok;
    });

    it('should have a `map` method', function () {
      expect(
        _.isFunction(router.map)
      ).to.be.ok;
    });

    it('should have a `route` method', function () {
      expect(
        _.isFunction(router.route)
      ).to.be.ok;
    });

    it('should have a `go` method', function () {
      expect(
        _.isFunction(router.go)
      ).to.be.ok;
    });
  });

  describe('Private API methods', function () {
    describe('parse', function () {
      it('should return the path as is if no arguments are given or arguments is not an array', function () {
        router.parse('/test/path').should.deep.equal('/test/path');
        router.parse('/user/:id', 'meh').should.deep.equal('/user/:id');
      });

      it('should inject parameters into the path', function () {
        router.parse(
          '/user/:id/edit',
          [42]
        ).should.deep.equal('/user/42/edit');
      });

      it('should inject optional params into the path', function () {
        router.parse(
          '/user(/:id)',
          [42]
        ).should.deep.equal('/user/42');

        // FIXME - parse('/user(/:id/edit)'), [42]) === '/user/42/edit'
        // router.parse(
        //   '/user(/:id/edit)',
        //   [42]
        // ).should.deep.equal('/user/42/edit');
      });

      it('should remove optional parameters part from path if no arguments are given', function () {
        // FIXME - parse('/user(/:id)') === '/user'
        // router.parse('/user(/:id)').should.deep.equal('/user');
      });
    });

    describe('stripHeadingSlash', function () {
      it('should remove first slash from a path', function () {
        router.stripHeadingSlash('/test/path').should.deep.equal('test/path');
      });
    });

    describe('getStoreKey', function () {
      before(function () {
        router.start({dispatcher: dispatcher});
      });

      it('should generate a localStorage key from options', function () {
        var store = router.options.store,
            key = 'path';
        router.getStoreKey(key).should.deep.equal(store.prefix + store.separator + key);
      });
    });

    describe('extractParameters', function () {
      before(function () {
        router.route('user.detail', {
          path: '/users/:id',
          action: function () {}
        });
        router.start({dispatcher: dispatcher});
      });

      it('should extract parameters from a path', function () {
        var args = router.extractParameters('user.detail', '/users/42');
        expect(
          _.isArray(args)
        ).to.be.ok;

        expect(args[0]).to.deep.equal('42');
      });
    });

    describe('routeToRegExp', function () {
      it('should generate a regular expression from a path', function () {
        var re = router.routeToRegExp('users/:id');
        expect(re instanceof RegExp).to.be.ok;
      });
    });
  });
});
