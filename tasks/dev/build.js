module.exports = function (grunt) {
  'use strict';

  grunt.registerTask('build', [
    'clean:dist',
    'config',
    'handlebars',
    'useminPrepare',
    'imagemin',
    'htmlmin',
    'concat',
    'cssmin',
    'uglify',
    'copy:dist',
    'copy:distdev',
    'rev',
    'usemin',
  ]);
};
