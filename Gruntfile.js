/**
 * Based on https://raw.githubusercontent.com/claudiosanches/woocommerce-pagseguro/master/Gruntfile.js
 *
 * @param {Object} grunt
 */
module.exports = function( grunt ) {
	'use strict';

	grunt.initConfig( {
		// Gets the package vars.
		pkg: grunt.file.readJSON( 'package.json' ),

		// Setting folder templates
		dirs: {
			js: 'assets/js/',
		},

		// Minify .js files.
		babel: {
			options: {
				presets: [ '@wordpress/babel-preset-default' ],
				compact: true,
				comments: false,
			},
			dist: {
				files: [ {
					expand: true,
					cwd: '<%= dirs.js %>',
					src: [
						'*.js',
						'!*.min.js',
					],
					dest: '<%= dirs.js %>',
					ext: '.min.js',
				} ],
			},
		},

		// Watch changes for assets.
		watch: {
			js: {
				files: [
					'<%= dirs.js %>*js',
					'!<%= dirs.js %>*.min.js',
				],
				tasks: [ 'terser' ],
			},
		},

		// Make .pot files.
		makepot: {
			dist: {
				options: {
					type: 'wp-plugin',
				},
			},
		},

		// Check text domain.
		checktextdomain: {
			options: {
				text_domain: '<%= pkg.name %>',
				keywords: [
					'__:1,2d',
					'_e:1,2d',
					'_x:1,2c,3d',
					'esc_html__:1,2d',
					'esc_html_e:1,2d',
					'esc_html_x:1,2c,3d',
					'esc_attr__:1,2d',
					'esc_attr_e:1,2d',
					'esc_attr_x:1,2c,3d',
					'_ex:1,2c,3d',
					'_n:1,2,4d',
					'_nx:1,2,4c,5d',
					'_n_noop:1,2,3d',
					'_nx_noop:1,2,3c,4d',
				],
			},
			files: {
				src: [
					'**/*.php', // Include all files.
					'!node_modules/**', // Exclude node_modules/.
				],
				expand: true,
			},
		},

		// Create README.md for GitHub.
		wp_readme_to_markdown: {
			options: {
				screenshot_url: 'http://ps.w.org/<%= pkg.name %>/assets/{screenshot}.png',
			},
			dest: {
				files: {
					'README.md': 'readme.txt',
				},
			},
		},
	} );

	// Load tasks.
	grunt.loadNpmTasks( 'grunt-babel' );
	grunt.loadNpmTasks( 'grunt-contrib-watch' );
	grunt.loadNpmTasks( 'grunt-checktextdomain' );
	grunt.loadNpmTasks( 'grunt-wp-i18n' );
	grunt.loadNpmTasks( 'grunt-wp-readme-to-markdown' );

	// Register tasks.
	grunt.registerTask( 'default', [
		'babel',
	] );
	grunt.registerTask( 'readme', 'wp_readme_to_markdown' );
};
