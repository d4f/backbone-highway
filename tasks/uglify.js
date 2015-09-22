module.exports = {
  options: {
    mangle: true,
    sourceMap: true,
    sourceMapName: 'dist/backbone.highway.min.map'
  },
  code: {
    files: {
      'dist/backbone.highway.min.js': [
        'src/backbone.highway.js'
      ]
    }
  }
};
