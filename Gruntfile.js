'use strict';

module.exports = function (grunt) {
  // show elapsed time at the end
  require('time-grunt')(grunt);

  // configurable paths
  var configPath = {
    demo: 'demo',
    tmp: '.tmp',
    dist: 'dist',
    src: 'src',
    test: 'test/spec'
  };

  var config = {
    config: configPath,
    options: {
      port: grunt.option('port') || 9000,
      hostname: grunt.option('host') || 'localhost'
    }
  };

  var path = require('path');

  var tasksDir = path.join(process.cwd(), 'tasks');

  require('load-grunt-config')(grunt, {
    configPath: [tasksDir, path.join(tasksDir, 'extra')],
    overridePath: path.join(tasksDir, grunt.option('target') || 'dev'),
    init: true,
    config: config
  });
};
