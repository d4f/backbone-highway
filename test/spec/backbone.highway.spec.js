define([
  'underscore',
  'backbone.highway'
], function (_, router) {
  'use strict';

  // jshint -W030

  describe('Methods', function () {
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
  });
});
