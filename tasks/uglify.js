module.exports = {
  options: {
    mangle: false
  },
  code: {
    files: {
      'dist/backbone.highway.min.js': [
        'src/backbone.highway.js'
      ]
    }
  }
};
