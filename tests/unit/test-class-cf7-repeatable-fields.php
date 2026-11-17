<?php
/**
 * Class Test_CF7_Repeatable_Fields
 *
 * @since 2.0.0
 *
 * @package CF7_Repeatable_Fields
 */

/**
 * Main class test.
 */
class Test_CF7_Repeatable_Fields extends WP_UnitTestCase {
	/**
	 * Reset the singleton's request state between tests.
	 *
	 * @since 3.0.0
	 */
	public function set_up() {
		parent::set_up();
		$groups = new ReflectionProperty( CF7_Repeatable_Fields::class, 'groups' );
		$groups->setAccessible( true );
		$groups->setValue( CF7_Repeatable_Fields::get_instance(), [] );
		unset( $_POST['_wpcf7_groups_count'] );
	}

	/**
	 * Clear submitted counts after each test.
	 *
	 * @since 3.0.0
	 */
	public function tear_down() {
		unset( $_POST['_wpcf7_groups_count'] );
		parent::tear_down();
	}

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

	/**
	 * Invalid IDs must be rejected before filters or group registration.
	 *
	 * @since 3.0.0
	 *
	 * @dataProvider invalid_group_ids
	 * @param string $group_id Invalid group ID.
	 */
	public function test_rejects_invalid_group_ids( $group_id ) {
		$filter_calls = did_filter( 'wpcf7_field_group_add_button_atts' );
		$html         = CF7_Repeatable_Fields::get_instance()->shortcode_render( [ stripcslashes( $group_id ) ], 'example' );

		$this->assertStringContainsString( 'You need to set an ID to this group.', $html );
		$this->assertStringNotContainsString( '<input', $html );
		$this->assertStringNotContainsString( '<img', $html );
		$this->assertSame( $filter_calls, did_filter( 'wpcf7_field_group_add_button_atts' ) );
		$groups = new ReflectionProperty( CF7_Repeatable_Fields::class, 'groups' );
		$groups->setAccessible( true );
		$this->assertSame( [], $groups->getValue( CF7_Repeatable_Fields::get_instance() ) );
	}

	/**
	 * Invalid literal and escaped shortcode IDs.
	 *
	 * @since 3.0.0
	 *
	 * @return array
	 */
	public function invalid_group_ids() {
		return [
			'empty'        => [ '' ],
			'quote'        => [ 'bad"id' ],
			'less than'    => [ 'bad<id' ],
			'greater than' => [ 'bad>id' ],
			'space'        => [ 'bad id' ],
			'newline'      => [ "bad\n" ],
			'escaped'      => [ 'x\\x22\\x3e\\x3cimg src=x onerror=window.cf7rfSecurityProbe=1\\x3e' ],
		];
	}

	/**
	 * Escaped attributes saved by contributors must stay inert when rendered.
	 *
	 * @since 3.0.0
	 */
	public function test_contributor_post_with_escaped_group_id() {
		wp_set_current_user( self::factory()->user->create( [ 'role' => 'contributor' ] ) );
		$this->assertFalse( current_user_can( 'unfiltered_html' ) );
		$payload = "[field_group 'x\\x22\\x3e\\x3cimg src=x onerror=window.cf7rfSecurityProbe=1\\x3e']example[/field_group]";
		$post_id = wp_insert_post(
			wp_slash(
				[
					'post_title'   => 'Group ID test',
					'post_content' => $payload,
					'post_status'  => 'draft',
				]
			)
		);
		$html    = apply_filters( 'the_content', get_post_field( 'post_content', $post_id ) );
		$this->assertStringContainsString( 'You need to set an ID to this group.', $html );
		$this->assertStringNotContainsString( '<img', $html );
		$this->assertStringNotContainsString( 'onerror=', $html );
	}

	/**
	 * Supported IDs and attribute syntax continue to render.
	 *
	 * @since 3.0.0
	 */
	public function test_valid_group_id_and_attributes() {
		$html = do_shortcode( '[field_group EmpHistory_1-2 id:history class="custom" data-label="A &amp; B"]example[/field_group]' );
		$this->assertStringContainsString( 'data-wpcf7-group-id="EmpHistory_1-2"', $html );
		$this->assertStringContainsString( 'name="_wpcf7_groups_count[EmpHistory_1-2]"', $html );
		$this->assertStringContainsString( 'id="history"', $html );
		$this->assertStringContainsString( 'class="wpcf7-field-groups custom"', $html );
	}

	/**
	 * Invalid attribute names are discarded before the content filter receives them.
	 *
	 * @since 3.0.0
	 */
	public function test_discards_invalid_attribute_names() {
		add_filter(
			'wpcf7_field_group_content',
			function ( $html, $atts ) {
				$this->assertStringNotContainsString( 'bad"name', implode( ' ', $atts ) );
				return $html;
			},
			10,
			2
		);
		CF7_Repeatable_Fields::get_instance()->shortcode_render(
			[
				'emails',
				'bad"name' => 'value',
			],
			''
		);
	}

	/**
	 * Button attribute filters provide text, while whole-button filters support HTML.
	 *
	 * @since 3.0.0
	 */
	public function test_button_attributes_are_escaped_and_custom_html_is_preserved() {
		foreach ( [ 'add', 'remove' ] as $action ) {
			add_filter(
				"wpcf7_field_group_{$action}_button_atts",
				function ( $atts ) {
					$atts['additional_classes'] = "custom' onclick='alert(1)";
					$atts['text']               = '<b>Label</b>';
					return $atts;
				}
			);
		}
		$html = do_shortcode( '[field_group emails]example[/field_group]' );
		$this->assertStringContainsString( 'custom&#039; onclick=&#039;alert(1)', $html );
		$this->assertStringContainsString( '&lt;b&gt;Label&lt;/b&gt;', $html );
		$this->assertStringNotContainsString( '<b>Label</b>', $html );
		foreach ( [ 'add', 'remove' ] as $action ) {
			add_filter(
				"wpcf7_field_group_{$action}_button",
				function () use ( $action ) {
					return "<button><b>{$action}</b></button>";
				}
			);
		}
		$html = do_shortcode( '[field_group emails]example[/field_group]' );
		$this->assertStringContainsString( '<button><b>add</b></button>', $html );
		$this->assertStringContainsString( '<button><b>remove</b></button>', $html );
	}

	/**
	 * Process a form and both mail templates with submitted row counts.
	 *
	 * @since 3.0.0
	 *
	 * @param mixed $counts Submitted counts.
	 * @return WPCF7_ContactForm
	 */
	private function process_form( $counts ) {
		$_POST['_wpcf7_groups_count'] = $counts;
		$form                         = WPCF7_ContactForm::get_template();
		$mail                         = $form->prop( 'mail' );
		$mail['body']                 = '[emails]Row [group_index]: [name][/emails]';
		$form->set_properties(
			[
				'form'   => '[field_group emails][text name][/field_group]',
				'mail'   => $mail,
				'mail_2' => $mail,
			]
		);
		CF7_Repeatable_Fields::get_instance()->wpcf7_contact_form( $form );
		return $form;
	}

	/**
	 * Counts stay bounded and malformed entries are ignored without warnings.
	 *
	 * @since 3.0.0
	 *
	 * @dataProvider submitted_counts
	 * @param mixed $counts   Submitted counts.
	 * @param int   $expected Expected number of expanded rows, or zero when ignored.
	 */
	public function test_submitted_counts_are_bounded( $counts, $expected ) {
		$form = $this->process_form( $counts );
		$this->assertSame( $expected, substr_count( $form->prop( 'form' ), '[text name__' ) );
		foreach ( [ 'mail', 'mail_2' ] as $property ) {
			$body = $form->prop( $property )['body'];
			$this->assertSame( $expected, substr_count( $body, '[name__' ) );
			if ( $expected ) {
				for ( $i = 1; $i <= $expected; $i++ ) {
					$this->assertStringContainsString( "[text name__{$i}]", $form->prop( 'form' ) );
					$this->assertStringContainsString( "Row {$i}: [name__{$i}]", $body );
				}
			}
		}
	}

	/**
	 * Normal, excessive and malformed row counts.
	 *
	 * @since 3.0.0
	 *
	 * @return array
	 */
	public function submitted_counts() {
		return [
			'normal'        => [ [ 'emails' => '3' ], 3 ],
			'maximum'       => [ [ 'emails' => '50' ], 50 ],
			'excessive'     => [ [ 'emails' => '100000' ], 50 ],
			'negative'      => [ [ 'emails' => '-1' ], 1 ],
			'zero'          => [ [ 'emails' => '0' ], 1 ],
			'text'          => [ [ 'emails' => 'abc' ], 1 ],
			'decimal'       => [ [ 'emails' => '1.5' ], 1 ],
			'nested array'  => [ [ 'emails' => [ 'x' ] ], 0 ],
			'unknown group' => [ [ 'unknown' => '100000' ], 0 ],
			'integer key'   => [ [ 123 => '100000' ], 0 ],
			'scalar input'  => [ '100000', 0 ],
			'mixed'         => [
				[
					'emails'  => '3',
					'unknown' => '100000',
				],
				3,
			],
		];
	}

	/**
	 * Sites can raise the limit for an individual group.
	 *
	 * @since 3.0.0
	 */
	public function test_custom_row_limit() {
		add_filter(
			'wpcf7_field_group_max_rows',
			function ( $max_rows, $group_id ) {
				$this->assertSame( 50, $max_rows );
				$this->assertSame( 'emails', $group_id );
				return 75;
			},
			10,
			2
		);
		$this->test_submitted_counts_are_bounded( [ 'emails' => '100000' ], 75 );
	}

	/**
	 * A nonpositive filtered limit still accepts at least one row.
	 *
	 * @since 3.0.0
	 */
	public function test_row_limit_has_a_minimum_of_one() {
		add_filter( 'wpcf7_field_group_max_rows', '__return_zero' );
		$this->test_submitted_counts_are_bounded( [ 'emails' => '100000' ], 1 );
	}
}
