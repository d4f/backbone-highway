// glob pattern for all test files
var context = require.context('.', true, /.+\.spec\.js$/)

// pass bluebird in global
window.Promise = require('bluebird')

// Magic happening here !
context.keys().forEach(context)

module.exports = context
