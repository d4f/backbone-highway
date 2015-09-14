'use strict';

module.exports = function (grunt) {
  // show elapsed time at the end
  require('time-grunt')(grunt);

  // configurable paths
  var configPath = {
    app: 'app',
    tmp: '.tmp',
    dist: 'dist',
    css: 'css/**/*.css',
    srcFiles: 'src/**/*.js',
    // testFiles: 'test/**/**/*.js',
    // img: 'img/**/*.{png,jpg,jpeg,gif,webp}',
    // tplDir: 'js/templates/',
    // tplPath: this.tplDir + '*.{ejs,mustache,hbs}',
  };

  var config = {
    config: configPath,
    options: {
      port: grunt.option('port') || 9000,
      hostname: grunt.option('host') || 'localhost'
    }
  };

  var path = require('path');

  var tasksDir = path.join(process.cwd(), 'tasks');

  require('load-grunt-config')(grunt, {
    configPath: [tasksDir, path.join(tasksDir, 'extra')],
    overridePath: path.join(tasksDir, grunt.option('target') || 'dev'),
    init: true,
    config: config,
    // jitGrunt: {
    //   staticMappings: {
    //     useminPrepare: 'grunt-usemin'
    //   }
    // }
  });
};

// module.exports = function (grunt) {

//   // Project configuration
//   grunt.initConfig({

//     // Retrieve package.json file for project info
//     "pkg": grunt.file.readJSON("package.json"),

//     /**
//      * ====================================================================
//      *
//      *               Validate javascript syntax with jshint
//      *
//      * ====================================================================
//      */
//     "jshint": {
//       "all": [
//         "Gruntfile.js",
//         "src/backbone.router.js"
//       ]
//     },

//     /**
//      * ====================================================================
//      *
//      *              Minify concatenated javascript files
//      *
//      * ====================================================================
//      */
//     "uglify": {
//       // Minification options
//       "options": {
//         "mangle": false
//       },

//       // Task
//       "js": {
//         "files": {

//         }
//       }
//     },

//     /**
//      * ====================================================================
//      *
//      *           Watch added/removed files and re-execute tasks
//      *
//      * ====================================================================
//      */
//     "watch": {
//       // Source files to observe
//       "files": [
//         "<%= jshint.all %>"
//       ],

//       // Tasks to be run when files change
//       "tasks": [
//         "jshint"
//       ]

//     }
//   });

//   // Load plugins
//   grunt.loadNpmTasks('grunt-contrib-jshint');
//   grunt.loadNpmTasks("grunt-contrib-uglify");
//   grunt.loadNpmTasks("grunt-contrib-watch");

//   // Declare default task
//   grunt.registerTask("default", ["jshint"]);
// };
