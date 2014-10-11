module.exports = function(grunt) {

	// Project configuration
	grunt.initConfig({

		// Retrieve package.json file for project info
		"pkg": grunt.file.readJSON("package.json"),



		/**
		 * ====================================================================
		 *
		 *               Validate javascript syntax with jshint
		 *
		 * ====================================================================
		 */
		"jshint": {
			"all": [
				"Gruntfile.js"
			]
		},










		/**
		 * ====================================================================
		 *
		 *              Minify concatenated javascript files
		 *
		 * ====================================================================
		 */
		"uglify": {
			// Minification options
			"options": {
				"mangle": false
			},

			// Task
			"js": {
				"files": {

				}
			}
		},




		/**
		 * ====================================================================
		 *
		 *           Watch added/removed files and re-execute tasks
		 *
		 * ====================================================================
		 */
		"watch": {
			// Source files to observe
			"files": [
				"<%= jshint.all %>"
			],

			// Tasks to be run when files change
			"tasks": [
				"jshint"
			]

		}
	});

	// Load plugins
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks("grunt-contrib-uglify");
	grunt.loadNpmTasks("grunt-contrib-watch");

	// Declare default task
	grunt.registerTask("default", ["jshint"]);
};