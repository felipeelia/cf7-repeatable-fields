describe('CF7 Repeatable Fields functionality', () => {
	/**
	 * Delete synonyms recreate test posts before running tests.
	 */
	before(() => {
		cy.wpCliEvalCustom(
			`
			$content = get_posts(
				[
					'post_type'   => [ 'wpcf7_contact_form', 'page', 'email' ],
					'post_status' => 'any',
					'numberposts' => 999,
				]
			);
			foreach( $content as $entry ) {
				wp_delete_post( $entry->ID, true );
			}`
		);
	});

	it('Create field and see its values in emails', () => {
		cy.login();

		// Create form
		cy.visitAdminPage('admin.php?page=wpcf7-new');
		cy.get('#wpcf7-form').as('formTextarea');
		cy.get('@formTextarea').clear();
		cy.get('@formTextarea').type(
			`
<label>Your name: [text* your-name autocomplete:name]</label>
<label>Your email: [email* your-email autocomplete:email]</label>
<label>Subject: [text* your-subject]</label>
<label>Your message: [textarea your-message]</label>
[field_group emails id="emails-groups" tabindex:1]
	<label>Your Email (required)[email* your-email]</label>
	[radio your-radio use_label_element default:1 "radio 1" "radio 2" "radio 3"]
	[select* your-menu include_blank "option1" "option 2"]
	[checkbox* your-checkbox "check 1" "check 2"]
[/field_group]
[submit "Submit"]`,
			{ delay: 0 }
		);

		cy.get('a[href="#mail-panel"]').click();
		cy.get('#wpcf7-mail-body').as('mailTextarea');
		cy.get('@mailTextarea').clear();
		cy.get('@mailTextarea').type(
			`
From: [your-name] [your-email]
Subject: [your-subject]

Message Body:
[your-message]

The second email entered by the user was: [your-email__2]

These were the groups:
[emails]
GROUP #[group_index]
	Checkbox: [your-checkbox]
	E-mail: [your-email]
	Radio: [your-radio]
	Select: [your-menu]
[/emails]`,
			{ delay: 0 }
		);

		cy.get('#publishing-action input[name="wpcf7-save"]').click();
		cy.get('#wpcf7-shortcode').invoke('val').as('shortcode');

		// Create page with the form
		cy.get('@shortcode').then((shortcode) => {
			cy.wpCliEvalCustom(
				`
				$post_id = wp_insert_post(
					[
						'post_type'   => 'page',
						'post_status' => 'publish',
						'post_title'  => 'Contact Form',
						'post_content' => '${shortcode}',
					]
				);
				echo get_permalink( $post_id );
				`
			).then((result) => {
				cy.visit(result.stdout);
			});
		});

		// Visit page and send form
		cy.get('input[name="your-name"]').type('Test Name');
		cy.get('input[name="your-email"]').type('email@domain.com');
		cy.get('input[name="your-subject"]').type('Subject');
		cy.get('textarea[name="your-message"]').type('Test message');

		cy.get('input[name="your-email__1"]').type('email-1@domain.com');
		cy.get('input[name="your-radio__1"][value="radio 1"]').check();
		cy.get('select[name="your-menu__1"]').select('option1');
		cy.get('input[name="your-checkbox__1[]"][value="check 1"]').check();

		cy.get('.wpcf7-field-group-add').click();
		cy.get('input[name="_wpcf7_groups_count[emails]__1"]')
			.invoke('val')
			.should('eq', '2');
		cy.get('input[name="your-email__2"]').should('exist');

		cy.get('.wpcf7-field-group-add').last().click();
		cy.get('input[name="_wpcf7_groups_count[emails]__1"]')
			.invoke('val')
			.should('eq', '3');
		cy.get('input[name="your-email__3"]').should('exist');

		cy.get('.wpcf7-field-group-remove').eq(1).click();
		cy.get('input[name="your-email__3"]').should('not.exist');

		cy.get('input[name="your-email__2"]').type('email-2@domain.com');
		cy.get('input[name="your-radio__2"][value="radio 2"]').check();
		cy.get('select[name="your-menu__2"]').select('option 2');
		cy.get('input[name="your-checkbox__2[]"][value="check 2"]').check();

		cy.get('.wpcf7-submit').click();

		// Check email
		cy.wpCliEvalCustom(
			`
			$email = get_posts(
				[
					'post_type'   => 'email',
					'post_status' => 'any',
					'numberposts' => 1,
				]
			);
			echo $email[0]->post_content;
			`
		).then((result) => {
			const postContent = result.stdout;

			expect(postContent).to.contain('From: Test Name email@domain.com');
			expect(postContent).to.contain('Subject: Subject');
			expect(postContent).to.contain('Test message');
			expect(postContent).to.contain(
				'The second email entered by the user was: email-2@domain.com'
			);
			expect(postContent).to.contain(`GROUP #1
	Checkbox: check 1
	E-mail: email-1@domain.com
	Radio: radio 1
	Select: option1`);
			expect(postContent).to.contain(`GROUP #2
	Checkbox: check 2
	E-mail: email-2@domain.com
	Radio: radio 2
	Select: option 2`);
		});
	});
});
