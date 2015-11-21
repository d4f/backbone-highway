module.exports = {
  options: {
    nospawn: true
  },
  gruntfile: {
    files: [
      '<%= jshint.grunt.src %>'
    ],
    tasks: ['lint:grunt'],
  },
  code: {
    files: [
      '<%= config.src %>/**/*.js',
      '<%= config.test %>/**/*.spec.js',
      'assets/**/*.js'
    ],
    tasks: ['lint:code']
  },
  tests: {
    files: [
      '<%= config.src %>/**/*.js',
      '<%= config.test %>/**/*.spec.js'
    ],
    tasks: ['karma:watch:run']
  }
};
