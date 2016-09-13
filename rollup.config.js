import buble from 'rollup-plugin-buble'
import uglify from 'rollup-plugin-uglify'
import nodeResolve from 'rollup-plugin-node-resolve'

const env = process.env.NODE_ENV || 'development'

const plugins = [
  nodeResolve({
    jsnext: true,
    main: true,
    skip: ['backbone', 'underscore']
  }),
  buble()
]

const dest = {
  development: 'dist/backbone-highway.js',
  production: 'dist/backbone-highway.min.js'
}

if (env === 'production') {
  plugins.push(uglify())
}

export default {
  entry: 'src/index.js',
  plugins,
  targets: [
    { dest: dest[env], format: 'umd', moduleName: 'Backbone.Highway' }
  ],
  globals: {
    underscore: '_',
    backbone: 'Backbone'
    // 'url-composer': 'urlComposer'
  }
}
