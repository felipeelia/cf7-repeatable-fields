<?php
/**
 * Deterministic forms for the disposable Playground test site.
 *
 * @package CF7_Repeatable_Fields_Tests
 */

// Load WordPress before creating the fixture forms.
require_once '/wordpress/wp-load.php';

$cf7rf_forms = [
	'single-group'    => [
		'form' => '<label>Your name [text* your-name]</label>
<label>Your email [email* your-email]</label>
<label>Subject [text* your-subject]</label>
<label>Message [textarea your-message]</label>
[field_group emails id="emails-groups"]
<label>Repeated email [email* repeated-email]</label>
[radio your-radio use_label_element default:1 "radio 1" "radio 2"]
[select* your-menu include_blank "option1" "option 2"]
[checkbox* your-checkbox use_label_element "check 1" "check 2"]
[checkbox exclusive-choice exclusive use_label_element default:1 "First" "Second"]
[/field_group]
[submit "Submit"]',
		'body' => 'From: [your-name] [your-email]
Subject: [your-subject]
[your-message]
Second email: [repeated-email__2]
[emails]
GROUP #[group_index]
Checkbox: [your-checkbox]
E-mail: [repeated-email]
Radio: [your-radio]
Select: [your-menu]
[/emails]',
	],
	'multiple-groups' => [
		'form' => '<label>Subject [text* your-subject]</label>
[field_group EmpHistory id="employment-history"]
<label>Employer [text* employer-Name]</label>
<label>From [date* Emp-From-Date]</label>
[/field_group]
[field_group references id="references-data"]
<label>Reference [text* References-First-Name]</label>
<label>Years acquainted [number* References-Acquired-Years]</label>
[/field_group]
[submit "Submit"]',
		'body' => '[EmpHistory]
Employment #[group_index]: [employer-Name], [_format_Emp-From-Date "Y-m-d"]
[/EmpHistory]
[references]
Reference #[group_index]: [References-First-Name], [References-Acquired-Years]
[/references]',
	],
];


$cf7rf_forms['mail-two'] = $cf7rf_forms['single-group'];

// Preserve the form and mail template supplied in issue #65; the report omitted a submit button.
$cf7rf_forms['issue-65'] = [
	'form' => file_get_contents( '/wordpress/wp-content/plugins/cf7-repeatable-fields/tests/e2e/fixtures/issue-65-form.txt' ), // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- Local test fixture.
	'body' => file_get_contents( '/wordpress/wp-content/plugins/cf7-repeatable-fields/tests/e2e/fixtures/issue-65-mail.txt' ), // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- Local test fixture.
];

foreach ( $cf7rf_forms as $cf7rf_slug => $cf7rf_fixture ) {
	$cf7rf_form = WPCF7_ContactForm::get_template();
	$cf7rf_form->set_title( $cf7rf_slug );
	$cf7rf_form->set_properties(
		[
			'form' => $cf7rf_fixture['form'],
			'mail' => [
				'active'             => true,
				'subject'            => 'issue-65' === $cf7rf_slug ? 'Issue 65 reproduction' : '[your-subject]',
				'sender'             => 'Test Site <wordpress@example.org>',
				'recipient'          => 'recipient@example.org',
				'body'               => $cf7rf_fixture['body'],
				'additional_headers' => '',
				'attachments'        => '',
				'use_html'           => false,
				'exclude_blank'      => false,
			],
		]
	);
	if ( 'mail-two' === $cf7rf_slug ) {
		$cf7rf_mail_2            = $cf7rf_form->prop( 'mail' );
		$cf7rf_mail_2['active']  = true;
		$cf7rf_mail_2['subject'] = '[your-subject] - copy';
		$cf7rf_mail_2['body']    = "Second: [repeated-email__2]\n[emails]Copy #[group_index]: [repeated-email]\n[/emails]";
		$cf7rf_form->set_properties( [ 'mail_2' => $cf7rf_mail_2 ] );
	}
	$cf7rf_form->save();
	$cf7rf_shortcode = sprintf( '[contact-form-7 id="%d"]', $cf7rf_form->id() );

	wp_insert_post(
		[
			'post_type'    => 'page',
			'post_status'  => 'publish',
			'post_name'    => $cf7rf_slug,
			'post_title'   => $cf7rf_slug,
			'post_content' => $cf7rf_shortcode,
		]
	);
	if ( 'single-group' === $cf7rf_slug ) {
		wp_insert_post(
			[
				'post_type'    => 'page',
				'post_status'  => 'publish',
				'post_name'    => 'same-form-twice',
				'post_title'   => 'Same form twice',
				'post_content' => $cf7rf_shortcode . "\n" . $cf7rf_shortcode,
			]
		);
	}
}

wp_set_password( 'password', get_user_by( 'login', 'admin' )->ID );
update_option( 'cf7rf_tests_ready', true );
