module.exports = {
  options: {
    jshintrc: '.jshintrc',
    reporter: require('jshint-stylish')
  },
  grunt: {
    src: ['Gruntfile.js', 'tasks/**/*.js']
  },
  code: {
    src: [
      '<%= config.srcFiles %>',
    ]
  }
};
