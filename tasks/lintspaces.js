module.exports = {
  options: {
    editorconfig: '.editorconfig',
    ignores: [
      'js-comments'
    ]
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
