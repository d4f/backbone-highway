var historyApiFallback = require('connect-history-api-fallback');

module.exports = {
  server: {
    options: {
      watchTask: true,
      logLevel: 'info',
      logConnections: true,
      server: {
        baseDir: ['<%= config.demo %>'],
        routes: {
          '/scripts/backbone.highway.js': 'src/backbone.highway.js'
        }
      },
      // browser: ['google chrome'],
      middleware: [require('connect-logger')(), historyApiFallback()]
    },
    bsFiles: {
      src: [
        '<%= config.demo %>/*.html',
        '<%= config.src %>'
      ]
    }
  }
};
