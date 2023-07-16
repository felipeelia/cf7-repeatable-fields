<?php
/**
 * Plugin Name: Log Emails
 * Version:     1.0.0
 * Author:      10up Inc.
 * License:     GPLv2 or later
 *
 * @package CF7_Repeatable_Fields_Tests
 */

/**
 * Create a CPT called "Emails".
 */
function create_post_type() {
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
add_action( 'init', __NAMESPACE__ . '\create_post_type' );

/**
 * Log all emails
 *
 * @param null|bool $return Short-circuit return value.
 * @param array     $atts   Array of the `wp_mail()` arguments.
 * @return true
 */
function log_email( $return, $atts ) {
	wp_insert_post(
		[
			'post_type'    => 'email',
			'post_title'   => $atts['subject'],
			'post_content' => $atts['message'],
		]
	);
	return true;
}
add_filter( 'pre_wp_mail', __NAMESPACE__ . '\log_email', 10, 2 );
