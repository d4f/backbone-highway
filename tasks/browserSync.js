var historyApiFallback = require('connect-history-api-fallback');

module.exports = {
  server: {
    options: {
      watchTask: true,
      logLevel: 'debug',
      logConnections: true,
      server: {
        baseDir: ['<%= config.app %>', '<%= config.tmp %>'],
        routes: {
          '/scripts/templates.js': '<%= config.tmp %>/scripts/templates.js'
        }
      },
      browser: ['google chrome'],
      middleware: [require('connect-logger')(), historyApiFallback()]
    },
    bsFiles: {
      src: [
        '<%= config.app %>/*.html',
        '<%= config.app %>/scripts/*.js',
        '<%= config.tmp %>/scripts/*.js',
        '<%= config.app %>/styles/*.css'
      ]
    }
  }
};
