<?php
/**
 * Plugin Name: Contact Form 7 - Repeatable Fields
 * Plugin URI:  https://github.com/felipeelia/cf7-repeatable-fields
 * Description: An add-on plugin for Contact Form 7 that adds a repeatable group of fields functionality.
 * Version:     1.1.3
 * Author:      Felipe Elia
 * Author URI:  https://felipeelia.dev/
 * Text Domain: cf7-repeatable-fields
 * Domain Path: /languages
 * License:     GPLv2 or later
 *
 * @package CF7_Repeatable_Fields
 */

defined( 'ABSPATH' ) || exit;

define( 'CF7_REPEATABLE_FIELDS_VERSION', '1.1.1' );
define( 'CF7_REPEATABLE_FIELDS_FILE', __FILE__ );
define( 'CF7_REPEATABLE_FIELDS_DIR', __DIR__ );

/**
 * Run after all plugins are loaded. If CF7 is active loads the main class, otherwise show a notice.
 */
function wpcf7_repeatable_fields_init() {
	if ( class_exists( 'WPCF7_ContactForm' ) ) {
		require CF7_REPEATABLE_FIELDS_DIR . '/class-cf7-repeatable-fields.php';
		CF7_Repeatable_Fields::get_instance();
	} else {
		add_action( 'admin_notices', 'wpcf7_repeatable_fields_admin_notice' );
	}
}
add_action( 'plugins_loaded', 'wpcf7_repeatable_fields_init' );

/**
 * Notice asking for CF7.
 */
function wpcf7_repeatable_fields_admin_notice() {
	if ( ! current_user_can( 'activate_plugins' ) ) {
		return;
	}

	$plugin_info = get_plugin_data( CF7_REPEATABLE_FIELDS_FILE );

	?>
	<div class="notice notice-error is-dismissible">
		<p>
			<?php
			printf(
				/* translators: 1: Plugin name; 2: Contact Form 7 link */
				esc_html__( 'In order to %1$s work, %2$s needs to be installed and activated.', 'cf7-repeatable-fields' ),
				'<strong>' . esc_html( $plugin_info['Name'] ) . '</strong>',
				'<a href="http://contactform7.com/" target="_blank">' . esc_html__( 'Contact Form 7', 'cf7-repeatable-fields' ) . '</a>'
			);
			$screen = get_current_screen();
			if ( 'plugins' !== $screen->id ) {
				if ( file_exists( WP_PLUGIN_DIR . '/contact-form-7/wp-contact-form-7.php' ) ) {
					$url = 'plugins.php';
				} else {
					$url = 'plugin-install.php?tab=search&s=Contact+form+7';
				}
				echo ' <a href="' . esc_url( admin_url( $url ) ) . '">' . esc_html__( 'Do it now?', 'cf7-repeatable-fields' ) . '</a>';
			}
			?>
		</p>
	</div>
	<?php
}
