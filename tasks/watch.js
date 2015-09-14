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
      '<%= config.app %>/scripts/**/*.js',
      '!<%= config.app %>/scripts/oauth/**/*.js'
    ],
    tasks: ['lint:code']
  },
  handlebars: {
    files: [
      '<%= config.app %>/scripts/core/templates/**/*.hbs',
      '<%= config.app %>/scripts/templates/**/*.hbs',
      '<%= config.app %>/scripts/modules/**/templates/**/*.hbs'
    ],
    tasks: ['handlebars']
  }
};
