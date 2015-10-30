'use strict';

var allTestFiles = [];
var TEST_REGEXP = /(spec|test)\.js$/i;

// Get a list of all the test files to include
Object.keys(window.__karma__.files).forEach(function (file) {
  if (TEST_REGEXP.test(file)) {
    allTestFiles.push(file);
  }
});

require.config({
  // Karma serves files under /base, which is the basePath from your config file
  baseUrl: '/base/src',

  paths: {
    test: '../test/spec',

    jquery: '../demo/assets/vendor/jquery/dist/jquery.min',
    underscore: '../demo/assets/vendor/underscore/underscore-min',
    backbone: '../demo/assets/vendor/backbone/backbone-min',
    marionette: '../demo/assets/vendor/backbone.marionette/lib/backbone.marionette.min'
  },

  deps: [
    'jquery',
    'underscore',
    'backbone',
    'marionette'
  ].concat(allTestFiles),

  // we have to kickoff jasmine, as it is asynchronous
  callback: window.__karma__.start
});
