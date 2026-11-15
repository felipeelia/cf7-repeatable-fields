const { test, expect } = require('./fixtures/test');

test('submits the original issue 65 form with repeated employment and reference groups', async ({
	page,
	request,
}) => {
	const mailbox = '/?rest_route=/cf7-repeatable-fields-tests/v1/emails';
	const params = { subject: 'Issue 65 reproduction' };
	const before = await request.get(mailbox, { params });
	const previousEmails = await before.json();
	await page.goto('/?pagename=issue-65');
	const employment = page.locator('#employment-history');
	const references = page.locator('#references-data');
	await employment.locator('.wpcf7-field-group-add').first().click();
	await references.locator('.wpcf7-field-group-add').first().click();
	await expect(employment.locator('.wpcf7-field-group')).toHaveCount(2);
	await expect(references.locator('.wpcf7-field-group')).toHaveCount(2);
	for (const field of await page
		.locator('form.wpcf7-form input:visible')
		.all()) {
		const type = await field.getAttribute('type');
		if (type === 'radio') {
			if ((await field.getAttribute('value')) === 'Yes') {
				await field.check();
			}
		} else if (type === 'date') {
			await field.fill('2024-01-15');
		} else if (type === 'number') {
			await field.fill('123');
		} else if (type === 'tel') {
			await field.fill('1234567890');
		} else if (type === 'text') {
			await field.fill('Example');
		}
	}
	const pending = page.waitForResponse(
		(response) =>
			response.request().method() === 'POST' &&
			response.url().includes('/feedback')
	);
	await page.getByRole('button', { name: 'Submit', exact: true }).click();
	const response = await pending;
	const result = await response.json();
	expect(result, JSON.stringify(result)).toMatchObject({
		status: 'mail_sent',
	});
	const mail = await request.get(mailbox, { params });
	const emails = await mail.json();
	expect(emails).toHaveLength(previousEmails.length + 1);
	for (const name of [
		'Employment History #1',
		'Employment History #2',
		'References #1',
		'References #2',
	]) {
		expect(emails[0]).toContain(name);
	}
});
