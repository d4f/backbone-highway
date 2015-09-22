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
      'assets/**/*.js'
    ],
    tasks: ['lint:code']
  }
};
