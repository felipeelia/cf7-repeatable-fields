<?php
/**
 * Plugin Main Class File
 *
 * @package CF7_Repeatable_Fields
 */

defined( 'ABSPATH' ) || exit;

/**
 * Main Class
 */
class CF7_Repeatable_Fields {
	/**
	 * The only instance of the class.
	 *
	 * @var object
	 */
	protected static $instance = null;

	/**
	 * Name of the shortcode responsible for repeating the group.
	 *
	 * @var string
	 */
	protected $shortcode = 'field_group';

	/**
	 * Form groups, indexed by their ids. Each group has
	 * `tags` (an array of WPCF7_FormTag) and
	 * `raw`, the forms as created by the user.
	 *
	 * @var array
	 */
	protected $groups = array();

	/**
	 * Class constructor. Run only once (Singleton).
	 */
	private function __construct() {
		add_shortcode( $this->shortcode, array( $this, 'shortcode_render' ) );
		add_action( 'wpcf7_contact_form', array( $this, 'wpcf7_contact_form' ) );
		add_action( 'wpcf7_enqueue_scripts', array( $this, 'wpcf7_enqueue_scripts' ) );
	}

	/**
	 * The group shortcode. Generate the `<div>` element with fields and
	 * set `$this->tags`.
	 *
	 * @param  array  $atts    Group attributes. Should have a value wo attribute to be used as the group ID.
	 * @param  string $content Everything inside the shortcode. Hopefully CF7 fields (raw tags).
	 * @return string          $content with the add and remove buttons wrapped by a `div`.
	 */
	public function shortcode_render( $atts, $content ) {
		// Respect classes sent by user, but add the necessary class for js.
		$atts          = ( empty( $atts ) ) ? array() : $atts;
		$atts['class'] = ( isset( $atts['class'] ) ) ? $atts['class'] : '';
		$atts['class'] = 'wpcf7-field-groups ' . $atts['class'];

		$group_id = '';
		$atts     = array_map(
			function( $att, $value ) use ( &$group_id ) {
				// WordPress sets numeric atts if the `attr="value"` format isn't used.
				if ( is_int( $att ) ) {
					if ( false === strpos( $value, ':' ) ) {
						$att      = 'data-wpcf7-group-id';
						$group_id = $value;
					} else {
						// User can send attributes in the same format of CF7, i.e., `attr:value`.
						list( $att, $value ) = explode( ':', $value );
					}
				}
				return sprintf( '%s="%s"', $att, esc_attr( $value ) );
			},
			array_keys( $atts ),
			$atts
		);
		// Abort if there is no group id.
		if ( empty( $group_id ) ) {
			return sprintf(
				/* translators: Format to use surrounded by code tag */
				'<p>' . __( 'You need to set an ID to this group. Use %s format.', 'cf7-repeatable-fields' ) . '</p>',
				"<code>[{$this->shortcode} your_custom_id]</code>"
			);
		}

		$form_tags_manager         = WPCF7_FormTagsManager::get_instance();
		$this->groups[ $group_id ] = array(
			'tags' => $form_tags_manager->scan( $content ),
			'raw'  => $content,
		);

		// Add and remove group buttons. TODO: make this available from form edit screen.
		/**
		 * Filters the add button attributes. Additional classes and text, so far.
		 *
		 * @param array $add_button_atts Array of strings with `group_id`, `additional_classes` and
		 *                               `text` as indexes.
		 */
		$add_button_atts = apply_filters(
			'wpcf7_field_group_add_button_atts',
			array(
				'group_id'           => $group_id,
				'additional_classes' => '',
				'text'               => '+',
			)
		);
		/**
		 * Filters the whole add group button. This way developers can wrap it with another element.
		 *
		 * @param string $button_html The HTML of the add button.
		 * @param string $group_id    Current group ID.
		 */
		$add_button = apply_filters(
			'wpcf7_field_group_add_button',
			"<button type='button' class='wpcf7-field-group-add {$add_button_atts['additional_classes']}'>" .
				$add_button_atts['text'] .
			'</button>',
			$group_id
		);

		/**
		 * Filters the remove button attributes. Additional classes and text, so far.
		 *
		 * @param array $remove_button_atts Array of strings with `group_id`, `additional_classes` and
		 *                                  `text` as indexes.
		 */
		$remove_button_atts = apply_filters(
			'wpcf7_field_group_remove_button_atts',
			array(
				'group_id'           => $group_id,
				'additional_classes' => '',
				'text'               => '-',
			)
		);
		/**
		 * Filters the whole remove group button. This way developers can wrap it with another element.
		 *
		 * @param string $button_html The HTML of the remove button.
		 * @param string $group_id    Current group ID.
		 */
		$remove_button = apply_filters(
			'wpcf7_field_group_remove_button',
			"<button type='button' class='wpcf7-field-group-remove {$remove_button_atts['additional_classes']}'>" .
				$remove_button_atts['text'] .
			'</button>',
			$group_id
		);

		return '<div ' . implode( ' ', $atts ) . '>' .
			'<div class="wpcf7-field-group">' .
				do_shortcode( $content ) .
				$remove_button .
				$add_button .
				'<input type="hidden" class="wpcf7-field-group-count" name="_wpcf7_groups_count[' . $group_id . ']" value="1" />' .
			'</div>' .
		'</div>';
	}

	/**
	 * Enqueue the necessary JS for groups manipulation.
	 */
	public function wpcf7_enqueue_scripts() {
		$file = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ?
			'assets/js/scripts.js' :
			'dist/scripts.js';

		wp_enqueue_script(
			'wpcf7-field-group-script',
			plugin_dir_url( CF7_REPEATABLE_FIELDS_FILE ) . $file,
			array( 'jquery' ),
			CF7_REPEATABLE_FIELDS_VERSION,
			true
		);
	}

	/**
	 * Change the Contact Form attributes. This way we make CF7 process this as
	 * the form had several groups all the time.
	 *
	 * Here we take the fields and change their names. Example:
	 * A `[your-field]` field becomes `[your-field__1]` and, if it's needed,
	 * we append the necessary `[your-field__2]`, `[your-field__3]` and so on. That
	 * way CF7 validates the field as a normal one.
	 *
	 * @param  WPCF7_ContactForm $contact_form The Contact Form object.
	 */
	public function wpcf7_contact_form( $contact_form ) {
		// Don't mess up when user is editing the form.
		if ( is_admin() ) {
			return;
		}

		// This enables shortcode in Contact Form form. Side effects?
		$form   = do_shortcode( $contact_form->prop( 'form' ) );
		$mail   = $contact_form->prop( 'mail' );
		$mail_2 = $contact_form->prop( 'mail_2' );

		// Post info sanitization.
		$groups_count = $this->sanitize_groups_count();

		/*
		 * We only make our magic when user is sending the form.
		 * There is no need to change anything when showing it for the first time.
		 */
		if ( count( $this->groups ) && ! empty( $groups_count ) ) {
			foreach ( $groups_count as $group_id => $group_sent_count ) {

				// Change the `form` property.
				$form_raw_tags            = $this->groups[ $group_id ]['raw'];
				$form_tags_first_replaced = $form_raw_tags;
				foreach ( $this->groups[ $group_id ]['tags'] as $tag ) {
					$tag_type = preg_quote( $tag->type, '/' );
					$tag_name = preg_quote( $tag->name, '/' );
					// Change the original `name` to `name__1`.
					$form_tags_first_replaced = preg_replace( "/\[{$tag_type}(.*?){$tag_name}/", "[{$tag->type}\\1{$tag->name}__1", $form_tags_first_replaced );

				}
				$form_tags_replaced = $form_tags_first_replaced;
				for ( $i = 2; $i <= $group_sent_count; $i++ ) {
					// Change the `name__1` to `name__$i`.
					$form_tags_replaced .= preg_replace( '/__1(\s|\])/', "__{$i}$1", $form_tags_first_replaced );
				}
				$form = str_replace(
					$form_raw_tags,
					$form_tags_replaced,
					$form
				);

				// Change the `mail` property. Users can use `[group_index]` inside a group to show it's number.
				$mail['body']   = $this->replace_mail_field_groups( $group_id, $group_sent_count, $mail['body'] );
				$mail_2['body'] = $this->replace_mail_field_groups( $group_id, $group_sent_count, $mail_2['body'] );
			}
		}

		// Set up modified properties. `form` here already was `do_shortcode`'ed.
		$contact_form->set_properties(
			array(
				'form'   => $form,
				'mail'   => $mail,
				'mail_2' => $mail_2,
			)
		);
	}

	/**
	 * Replace a field group in mail bodies
	 *
	 * @param string $group_id           The group ID.
	 * @param int    $group_sent_count   Groups sent count.
	 * @param string $mail_body          The text set as body by users in CF7. User for main mail and mail 2.
	 * @return string            `$mail_body` with group replaced.
	 */
	private function replace_mail_field_groups( $group_id, $group_sent_count, $mail_body ) {
		$group_name    = preg_quote( $group_id, '/' );
		$group_in_mail = preg_match_all(
			"/\[{$group_name}\](.*?)\[\/{$group_name}\]/s",
			$mail_body,
			$matches
		);
		if ( $group_in_mail ) {
			foreach ( $matches[1] as $i => $group_raw_content ) {
				$group_tags_first_replaced = str_replace(
					'[group_index]',
					'[group_index__1]',
					$group_raw_content
				);

				foreach ( $this->groups[ $group_id ]['tags'] as $tag ) {
					$tag_name_regex = preg_quote( $tag->name, '/' );
					// Change the original `name` to `name__1`.
					// Date fields accept `_format_` as a prefix.
					$group_tags_first_replaced = preg_replace(
						"/\[(_format_)?{$tag_name_regex}(\s|\])/",
						"[$1{$tag->name}__1$2",
						$group_tags_first_replaced
					);
				}

				$group_tags_replaced = $group_tags_first_replaced;

				for ( $j = 2; $j <= $group_sent_count; $j++ ) {
					// Change the `name__1` to `name__$i`.
					$group_tags_replaced .= preg_replace(
						'/__1(\s|\])/',
						"__{$j}$1",
						$group_tags_first_replaced
					);
				}

				$group_tags_replaced = preg_replace(
					'/\[group_index__([0-9]*)\]/',
					'\\1',
					$group_tags_replaced
				);

				$mail_body = str_replace(
					$matches[0][ $i ],
					$group_tags_replaced,
					$mail_body
				);
			}
		}
		return $mail_body;
	}

	/**
	 * Sanitization method of the `_wpcf7_groups_count` hidden input.
	 *
	 * @return array
	 */
	private function sanitize_groups_count() {
		// phpcs:disable WordPress.Security.NonceVerification.Missing -- CF7 Handles this.
		// phpcs:disable WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		$groups_count = ( isset( $_POST['_wpcf7_groups_count'] ) ) ? wp_unslash( (array) $_POST['_wpcf7_groups_count'] ) : array();
		$groups_count = array_map( 'sanitize_text_field', wp_unslash( (array) $groups_count ) );
		// phpcs:enable WordPress.Security.NonceVerification.Missing
		// phpcs:enable WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		return $groups_count;
	}

	/**
	 * SINGLETON. Return the single class instance.
	 *
	 * @return object the single instance of the class.
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}
}
