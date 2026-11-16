<?php
/**
 * Plugin Name: Log Emails
 * Version:     1.0.0
 * Author:      Felipe Elia
 * Author URI:  https://felipeelia.dev/
 * License:     GPLv2 or later
 *
 * @package CF7_Repeatable_Fields_Tests
 */

/**
 * Create a CPT called "Emails".
 */
function cf7rf_tests_create_post_type() {
	register_post_type(
		'email',
		[
			'labels'      => [
				'name'          => __( 'Emails' ),
				'singular_name' => __( 'Email' ),
			],
			'public'      => true,
			'has_archive' => true,
		]
	);
}
add_action( 'init', 'cf7rf_tests_create_post_type' );

/**
 * Log all emails
 *
 * @param null|bool $pre_mail Short-circuit return value.
 * @param array     $atts   Array of the `wp_mail()` arguments.
 * @return true
 */
function cf7rf_tests_log_email( $pre_mail, $atts ) {
	wp_insert_post(
		[
			'post_type'    => 'email',
			'post_title'   => $atts['subject'],
			'post_content' => $atts['message'],
		]
	);
	return true;
}
add_filter( 'pre_wp_mail', 'cf7rf_tests_log_email', 10, 2 );

/**
 * Expose the test mailbox only in the disposable E2E environment.
 * This MU plugin must never be installed on a production site.
 */
function cf7rf_tests_register_routes() {
	register_rest_route(
		'cf7-repeatable-fields-tests/v1',
		'/ready',
		[
			'methods'             => 'GET',
			'permission_callback' => '__return_true',
			'callback'            => function () {
				if ( ! get_option( 'cf7rf_tests_ready' ) ) {
					return new WP_Error( 'fixtures_not_ready', 'Fixtures are still loading.', [ 'status' => 503 ] );
				}
				return [
					'wordpress' => get_bloginfo( 'version' ),
					'php'       => PHP_VERSION,
					'cf7'       => WPCF7_VERSION,
					'plugin'    => CF7_REPEATABLE_FIELDS_VERSION,
				];
			},
		]
	);
	register_rest_route(
		'cf7-repeatable-fields-tests/v1',
		'/emails',
		[
			'methods'             => 'GET',
			'permission_callback' => '__return_true',
			'callback'            => function ( $request ) {
				$emails = get_posts(
					[
						'post_type'   => 'email',
						'post_status' => 'any',
						'numberposts' => 200,
					]
				);
				return array_values(
					array_map(
						function ( $email ) {
							return $email->post_content;
						},
						array_filter(
							$emails,
							function ( $email ) use ( $request ) {
								return $request['subject'] === $email->post_title;
							}
						)
					)
				);
			},
			'args'                => [
				'subject' => [
					'required' => true,
					'type'     => 'string',
				],
			],
		]
	);
}
add_action( 'rest_api_init', 'cf7rf_tests_register_routes' );
