module.exports = function (grunt) {
  'use strict';

  grunt.registerTask('serve', function () {
    grunt.task.run([
      'lint:code',
      // 'clean:server',
      // 'config',
      // 'handlebars',
      'browserSync',
      'watch'
    ]);
  });
};
