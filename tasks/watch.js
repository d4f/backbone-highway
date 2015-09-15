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
      '<%= config.src %>',
      'assets/**/*.js'
    ],
    tasks: ['lint:code']
  }
};
