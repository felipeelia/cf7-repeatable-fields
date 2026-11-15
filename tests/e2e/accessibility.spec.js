const { test, expect } = require('./fixtures/test');

test('supports descriptive controls and predictable keyboard focus', async ({
	page,
}) => {
	await page.goto('/?pagename=single-group');
	const add = page.getByRole('button', { name: 'Add group', exact: true });
	await add.focus();
	await page.keyboard.press('Enter');
	const email = page.locator('[name="repeated-email__2"]');
	await expect(email).toBeFocused();
	const remove = page.getByRole('button', {
		name: 'Remove group',
		exact: true,
	});
	await remove.focus();
	await page.keyboard.press('Space');
	await expect(page.locator('.wpcf7-field-group')).toHaveCount(1);
	await expect(
		page.getByRole('button', { name: 'Add group', exact: true })
	).toBeFocused();
});

test('keeps IDs and label/ARIA references unique across cloned rows and form instances', async ({
	page,
}) => {
	await page.goto('/?pagename=same-form-twice');
	const forms = page.locator('form.wpcf7-form');
	await forms
		.first()
		.getByRole('button', { name: 'Add group', exact: true })
		.click();
	const rows = page.locator('.wpcf7-field-group');
	const originalId = await rows
		.first()
		.locator('input[type="email"]')
		.getAttribute('id');
	const ids = await rows
		.locator('[id]')
		.evaluateAll((elements) => elements.map((element) => element.id));
	expect(new Set(ids).size).toBe(ids.length);
	for (const row of await rows.all()) {
		const label = row.locator('label[for]');
		const input = row.locator('input[type="text"]');
		await expect(label).toHaveAttribute(
			'for',
			await input.getAttribute('id')
		);
		await label.click();
		await expect(input).toBeFocused();
		expect(
			await row.getByRole('group').getAttribute('aria-labelledby')
		).toBe(await row.locator('label[id]').getAttribute('id'));
		const help = row.locator('span[id]');
		await expect(row.getByRole('group')).toHaveAttribute(
			'aria-describedby',
			await help.getAttribute('id')
		);
	}
	await forms
		.first()
		.getByRole('button', { name: 'Remove group', exact: true })
		.click();
	await expect(rows.first().locator('input[type="email"]')).toHaveAttribute(
		'id',
		originalId
	);
});

test('connects CF7 validation summary links to the correct repeated input', async ({
	page,
}) => {
	await page.goto('/?pagename=single-group');
	await page.locator('[name="your-name"]').fill('Test');
	await page.locator('[name="your-email"]').fill('test@example.org');
	await page.locator('[name="your-subject"]').fill('Validation links');
	await page.getByRole('button', { name: 'Add group', exact: true }).click();
	await page.locator('[name="repeated-email__1"]').fill('first@example.org');
	for (const row of await page.locator('.wpcf7-field-group').all()) {
		await row.locator('select').selectOption('option1');
		await row
			.getByRole('checkbox', { name: 'check 1', exact: true })
			.check();
	}
	const pending = page.waitForResponse(
		(response) =>
			response.request().method() === 'POST' &&
			response.url().includes('/feedback')
	);
	await page.getByRole('button', { name: 'Submit', exact: true }).click();
	expect((await (await pending).json()).status).toBe('validation_failed');
	const field = page.locator('[name="repeated-email__2"]');
	const id = await field.getAttribute('id');
	await expect(page.locator('.screen-reader-response a')).toHaveAttribute(
		'href',
		`#${id}`
	);
	await expect(field).toHaveAttribute('aria-invalid', 'true');
});

test('keeps controls usable at a narrow mobile width', async ({
	page,
}, testInfo) => {
	await page.setViewportSize({ width: 320, height: 740 });
	await page.goto('/?pagename=single-group');
	await page.getByRole('button', { name: 'Add group', exact: true }).click();
	for (const button of await page
		.locator('.wpcf7-field-group-add, .wpcf7-field-group-remove')
		.all()) {
		if (!(await button.isVisible())) {
			continue;
		}
		const box = await button.boundingBox();
		expect(box.height).toBeGreaterThanOrEqual(44);
		expect(box.x).toBeGreaterThanOrEqual(0);
		expect(box.x + box.width).toBeLessThanOrEqual(320);
	}
	for (const row of await page.locator('.wpcf7-field-group').all()) {
		expect(
			await row.evaluate(
				(element) => element.scrollWidth <= element.clientWidth
			)
		).toBe(true);
	}
	await page.screenshot({
		path: testInfo.outputPath('mobile-form.png'),
		fullPage: true,
	});
});
