module.exports = function (grunt) {
  'use strict';

  grunt.registerTask('build', [
    'lint',
    'uglify'
  ]);
};
