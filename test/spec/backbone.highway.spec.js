define([
  'underscore',
  'backbone.highway'
], function (_, router) {
  'use strict';

  // jshint -W030

  describe('Methods', function () {
    it('should have a start method', function () {
      expect(
        _.isFunction(router.start)
      ).to.be.ok;
    });
  });
});
