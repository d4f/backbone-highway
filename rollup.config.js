import buble from 'rollup-plugin-buble';
import uglify from 'rollup-plugin-uglify';

const env = process.env.NODE_ENV || 'development';

const plugins = [buble()];
const dest = {
  development: 'dist/backbone-highway.js',
  production: 'dist/backbone-highway.min.js'
};

if (env === 'production') {
  plugins.push(uglify());
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
  }
};
