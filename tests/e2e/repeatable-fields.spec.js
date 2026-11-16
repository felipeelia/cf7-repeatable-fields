const { test, expect } = require('./fixtures/test');

const mailboxPath = '/?rest_route=/cf7-repeatable-fields-tests/v1/emails';

async function submit(page) {
	const response = page.waitForResponse(
		(value) =>
			value.request().method() === 'POST' &&
			value.url().includes('/feedback'),
		{ timeout: 10_000 }
	);
	await page.getByRole('button', { name: 'Submit', exact: true }).click();
	const result = await response;
	expect(result.ok()).toBeTruthy();
	return result.json();
}

async function fillSingleGroup(page, subject, slug = 'single-group') {
	await page.goto(`/?pagename=${slug}`);
	await page.locator('[name="your-name"]').fill('Test Name');
	await page.locator('[name="your-email"]').fill('email@example.org');
	await page.locator('[name="your-subject"]').fill(subject);
	await page.locator('[name="your-message"]').fill('Test message');
	await fillRow(page.locator('.wpcf7-field-group').first(), 1);
}

async function fillRow(row, index) {
	await row.locator('input[type="email"]').fill(`email-${index}@example.org`);
	await row.locator(`input[type="radio"][value="radio ${index}"]`).check();
	await row
		.locator('select')
		.selectOption(index === 1 ? 'option1' : 'option 2');
	await row.locator(`input[type="checkbox"][value="check ${index}"]`).check();
}

test('boots the requested WordPress, PHP and CF7 versions', async ({
	request,
}) => {
	const response = await request.get(
		'/?rest_route=/cf7-repeatable-fields-tests/v1/ready'
	);
	expect(response.ok()).toBeTruthy();
	const versions = await response.json();
	if (process.env.CF7RF_VERSION) {
		expect(versions.plugin).toBe(process.env.CF7RF_VERSION);
	}
	if (process.env.WP_VERSION !== 'latest') {
		expect(versions.wordpress).toBe(process.env.WP_VERSION || '7.1.4');
	}
	expect(versions.php).toMatch(
		new RegExp(
			`^${(process.env.PHP_VERSION || '8.3').replace('.', '\\.')}\\.`
		)
	);
	if (process.env.CF7_VERSION !== 'latest') {
		expect(versions.cf7).toBe(process.env.CF7_VERSION || '6.2.5');
	}
});

test('adds and removes rows, then sends all repeated values in mail', async ({
	page,
	request,
}, testInfo) => {
	const subject = `${testInfo.title}-${testInfo.retry}`;
	await fillSingleGroup(page, subject);
	const rows = page.locator('.wpcf7-field-group');
	await page.locator('.wpcf7-field-group-add').last().click();
	await page.locator('.wpcf7-field-group-add').last().click();
	await expect(rows).toHaveCount(3);
	await rows.nth(1).locator('.wpcf7-field-group-remove').click();
	await expect(rows).toHaveCount(2);
	await expect(page.locator('[name="repeated-email__3"]')).toHaveCount(0);
	await fillRow(rows.nth(1), 2);

	const result = await submit(page);
	expect(result, JSON.stringify(result)).toMatchObject({
		status: 'mail_sent',
	});
	await expect(page.locator('.wpcf7-response-output')).toContainText(
		'Thank you'
	);
	const response = await request.get(mailboxPath, { params: { subject } });
	const emails = await response.json();
	expect(emails).toHaveLength(1);
	expect(emails[0]).toContain('From: Test Name email@example.org');
	expect(emails[0]).toContain('Test message');
	expect(emails[0]).toContain('Second email: email-2@example.org');
	for (const index of [1, 2]) {
		expect(emails[0]).toContain(
			`GROUP #${index}\nCheckbox: check ${index}\nE-mail: email-${index}@example.org\nRadio: radio ${index}\nSelect: ${index === 1 ? 'option1' : 'option 2'}`
		);
	}
});

test('rejects an empty required field in a later row and sends after correction', async ({
	page,
	request,
}, testInfo) => {
	const subject = `${testInfo.title}-${testInfo.retry}`;
	await fillSingleGroup(page, subject);
	await page.locator('.wpcf7-field-group-add').click();
	await fillRow(page.locator('.wpcf7-field-group').nth(1), 2);
	await page.locator('[name="repeated-email__2"]').fill('');
	const invalid = await submit(page);
	expect(invalid.status).toBe('validation_failed');
	expect(invalid.invalid_fields).toEqual(
		expect.arrayContaining([
			expect.objectContaining({ field: 'repeated-email__2' }),
		])
	);
	await expect(
		page.locator('[data-name="repeated-email__2"] .wpcf7-not-valid-tip')
	).toBeVisible();
	const emptyMailbox = await request.get(mailboxPath, {
		params: { subject },
	});
	expect(await emptyMailbox.json()).toEqual([]);
	await page
		.locator('[name="repeated-email__2"]')
		.fill('email-2@example.org');
	await page.locator('[name="repeated-email__2"]').blur();
	await expect(
		page.locator('[data-name="repeated-email__2"] .wpcf7-not-valid-tip')
	).toHaveCount(0);
	expect(await submit(page)).toMatchObject({ status: 'mail_sent' });
});

test('submits independent groups with unequal row counts (issue #65)', async ({
	page,
	request,
}, testInfo) => {
	const subject = `${testInfo.title}-${testInfo.retry}`;
	await page.goto('/?pagename=multiple-groups');
	await page.locator('[name="your-subject"]').fill(subject);
	const employment = page.locator('#employment-history');
	const references = page.locator('#references-data');
	await employment.locator('.wpcf7-field-group-add').click();
	await references.locator('.wpcf7-field-group-add').last().click();
	await references.locator('.wpcf7-field-group-add').last().click();
	await employment.locator('.wpcf7-field-group-remove').last().click();
	await expect(employment.locator('.wpcf7-field-group')).toHaveCount(1);
	await expect(references.locator('.wpcf7-field-group')).toHaveCount(3);
	await employment.locator('input[type="text"]').fill('Employer One');
	await employment.locator('input[type="date"]').fill('2024-01-15');
	for (const index of [1, 2, 3]) {
		await references
			.locator(`[name="References-First-Name__${index}"]`)
			.fill(`Person ${index}`);
		await references
			.locator(`[name="References-Acquired-Years__${index}"]`)
			.fill(`${index}`);
	}
	const result = await submit(page);
	expect(result, JSON.stringify(result)).toMatchObject({
		status: 'mail_sent',
	});
	const response = await request.get(mailboxPath, { params: { subject } });
	const emails = await response.json();
	expect(emails).toHaveLength(1);
	expect(emails[0]).toContain('Employment #1: Employer One, 2024-01-15');
	expect(emails[0]).not.toContain('Employment #2');
	for (const index of [1, 2, 3]) {
		expect(emails[0]).toContain(
			`Reference #${index}: Person ${index}, ${index}`
		);
	}
});

test('validates repeated fields independently when the same form appears twice', async ({
	page,
}) => {
	await page.goto('/?pagename=same-form-twice');
	const forms = page.locator('form.wpcf7-form');
	await expect(forms).toHaveCount(2);
	await page.waitForFunction(() =>
		Array.from(document.querySelectorAll('form.wpcf7-form')).every(
			(form) => form.wpcf7?.schema
		)
	);
	await forms.first().locator('.wpcf7-field-group-add').click();
	const repeated = forms.first().locator('[name="repeated-email__2"]');
	await repeated.fill('invalid-email');
	await repeated.blur();
	await expect(repeated).toHaveAttribute('aria-invalid', 'true');
	await expect(forms.nth(1).locator('.wpcf7-field-group')).toHaveCount(1);
	const otherEmail = forms.nth(1).locator('[name="repeated-email__1"]');
	await otherEmail.fill('valid@example.org');
	await otherEmail.blur();
	await expect(otherEmail).toHaveAttribute('aria-invalid', 'false');
	await expect(
		forms
			.nth(1)
			.locator('[data-name="repeated-email__1"] .wpcf7-not-valid-tip')
	).toHaveCount(0);
	await expect(repeated).toHaveAttribute('aria-invalid', 'true');
	await repeated.fill('corrected@example.org');
	await repeated.blur();
	await expect(repeated).toHaveAttribute('aria-invalid', 'false');
});

test('renders independent repeated values in both mail templates', async ({
	page,
	request,
}, testInfo) => {
	const subject = `${testInfo.title}-${testInfo.retry}`;
	await fillSingleGroup(page, subject, 'mail-two');
	await page.locator('.wpcf7-field-group-add').click();
	await fillRow(page.locator('.wpcf7-field-group').nth(1), 2);
	expect(await submit(page)).toMatchObject({ status: 'mail_sent' });
	const primary = await request.get(mailboxPath, { params: { subject } });
	const copy = await request.get(mailboxPath, {
		params: { subject: `${subject} - copy` },
	});
	const primaryEmails = await primary.json();
	const copyEmails = await copy.json();
	expect(primaryEmails).toHaveLength(1);
	expect(copyEmails).toHaveLength(1);
	expect(primaryEmails[0]).toContain('E-mail: email-1@example.org');
	expect(primaryEmails[0]).toContain('E-mail: email-2@example.org');
	expect(copyEmails[0]).toContain('Second: email-2@example.org');
	expect(copyEmails[0]).toContain('Copy #1: email-1@example.org');
	expect(copyEmails[0]).toContain('Copy #2: email-2@example.org');
});

test('retains every repeated row when submitting again after a successful reset', async ({
	page,
	request,
}, testInfo) => {
	const subject = `${testInfo.title}-${testInfo.retry}`;
	await fillSingleGroup(page, `${subject} first`);
	await page.locator('.wpcf7-field-group-add').click();
	await fillRow(page.locator('.wpcf7-field-group').nth(1), 2);
	await page.evaluate(() => {
		window.cf7rfResetComplete = false;
		document.addEventListener(
			'wpcf7reset',
			() => {
				window.cf7rfResetComplete = true;
			},
			{ once: true }
		);
	});
	expect(await submit(page)).toMatchObject({ status: 'mail_sent' });
	await expect
		.poll(() => page.evaluate(() => window.cf7rfResetComplete))
		.toBe(true);
	await page.locator('[name="your-name"]').fill('Again');
	await page.locator('[name="your-email"]').fill('again@example.org');
	await page.locator('[name="your-subject"]').fill(subject);
	await fillRow(page.locator('.wpcf7-field-group').first(), 1);
	await fillRow(page.locator('.wpcf7-field-group').nth(1), 2);
	expect(await submit(page)).toMatchObject({ status: 'mail_sent' });
	const response = await request.get(mailboxPath, { params: { subject } });
	const emails = await response.json();
	expect(emails).toHaveLength(1);
	expect(emails[0]).toContain('GROUP #2');
	expect(emails[0]).toContain('E-mail: email-2@example.org');
});
