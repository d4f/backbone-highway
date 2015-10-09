var historyApiFallback = require('connect-history-api-fallback');

module.exports = {
  server: {
    options: {
      watchTask: true,
      logLevel: 'info',
      logConnections: true,
      server: {
        baseDir: [
          '<%= config.demo %>',
          '<%= config.src %>',
          '<%= config.dist %>',
          'docs'
        ]
      },
      // browser: ['google chrome'],
      middleware: [require('connect-logger')(), historyApiFallback()]
    },
    bsFiles: {
      src: [
        '<%= config.demo %>/*.html',
        '<%= config.src %>',
        '<%= config.dist %>'
      ]
    }
  }
};
