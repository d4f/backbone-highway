module.exports = {
  options: {
    config: '.jscsrc',
    verbose: true
  },
  code: [
    '<%= config.srcFiles %>'
  ],
  grunt: {
    src: ['Gruntfile.js', 'tasks/**/*.js'],
    options: {
      maximumLineLength: null
    }
  }
};
