// Karma configuration
// Generated on Mon Aug 17 2015 16:09:27 GMT+0200 (CEST)

module.exports = function (config) {
  'use strict';

  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '.',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha', 'requirejs', 'chai', 'sinon-chai'],

    // list of files / patterns to load in the browser
    files: [
      'test/test-main.js',
      {pattern: 'src/**/*.js', included: false},

      // bower components
      {pattern: 'demo/assets/vendor/jquery/dist/jquery.min.js', included: false},
      {pattern: 'demo/assets/vendor/underscore/*.js', included: false},
      {pattern: 'demo/assets/vendor/lodash/*.js', included: false},
      {pattern: 'demo/assets/vendor/backbone/*.js', included: false},
      {pattern: 'demo/assets/vendor/backbone.marionette/lib/*.js', included: false},

      {pattern: 'test/spec/**/*.spec.js', included: false}
    ],

    // list of files to exclude
    exclude: [
      // 'app/scripts/main.js',
      // 'app/scripts/templates/*'
    ],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {},

    // test results reporter to use
    // possible values: 'dots.js', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['dots', 'progress'],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values:
    //   config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],

    // If browser does not capture in given timeout [ms], kill it
    captureTimeout: 5000,

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false
  });
};
