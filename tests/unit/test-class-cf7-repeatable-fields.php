<?php
/**
 * Class Test_CF7_Repeatable_Fields
 *
 * @package CF7_Repeatable_Fields
 */

/**
 * Main class test.
 */
class Test_CF7_Repeatable_Fields extends WP_UnitTestCase {
	/**
	 * A single example test.
	 */
	public function test_shortcode_render() {
		\CF7_Repeatable_Fields::get_instance()->shortcode_render( [ 'group-id' ], '' );

		$this->assertSame( 1, did_filter( 'wpcf7_field_group_add_button_atts' ) );
		$this->assertSame( 1, did_filter( 'wpcf7_field_group_add_button' ) );
		$this->assertSame( 1, did_filter( 'wpcf7_field_group_remove_button_atts' ) );
		$this->assertSame( 1, did_filter( 'wpcf7_field_group_remove_button' ) );
	}
}
