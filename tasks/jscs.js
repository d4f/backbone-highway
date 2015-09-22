module.exports = {
  options: {
    config: '.jscsrc',
    verbose: true
  },
  code: [
    '<%= config.src %>/**/*.js',
    'assets/**/*.js'
  ],
  grunt: {
    src: ['Gruntfile.js', 'tasks/**/*.js'],
    options: {
      maximumLineLength: null
    }
  }
};
