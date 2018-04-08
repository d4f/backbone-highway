// Karma configuration
// Generated on Thu Jan 19 2017 11:27:12 GMT+0100 (Paris, Madrid)
const webpackConfig = require('./webpack.config.js')

// explained at http://mike-ward.net/2015/09/07/tips-on-setting-up-karma-testing-with-webpack/
webpackConfig.entry = ''

module.exports = function (config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '.',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha'],

    // list of files / patterns to load in the browser
    files: [
      'test/main.js'
    ],

    // list of files to exclude
    exclude: [
    ],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'test/main.js': ['webpack', 'sourcemap']
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['mocha'],

    webpackServer: {
      noInfo: true // please don't spam the console when running in karma!
    },

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: process.env.NODE_WATCH ? ['Chrome'] : ['ChromeHeadlessNoSandbox'],

    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox']
      }
    },

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity,

    webpack: webpackConfig

    // htmlReporter: {
    //   outputDir: 'test-reports', // where to put the reports
    //   namedFiles: true // name files instead of creating sub-directories
    // },

    // options for code coverage karma plugin
    // coverageReporter: {
    //   type: 'html', // produces a html document after code is run
    //   dir: 'test-reports/' // path to created html doc
    // }
  })
}
