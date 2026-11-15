const { test, expect } = require('./fixtures/test');

test('adds and removes rows without loading jQuery', async ({ page }) => {
	await page.goto('/?pagename=single-group');
	expect(await page.evaluate(() => typeof window.jQuery)).toBe('undefined');
	await expect(page.locator('script[src*="/jquery/"]')).toHaveCount(0);
	const rows = page.locator('.wpcf7-field-group');
	const add = rows.first().locator('.wpcf7-field-group-add');
	await add.evaluate((button) => {
		button.innerHTML = '<span>Add another</span>';
	});
	await add.locator('span').click();
	await expect(rows).toHaveCount(2);
	await expect(
		rows.nth(1).locator('[name="repeated-email__2"]')
	).toBeVisible();
	await expect(
		rows.nth(1).locator('[name="your-checkbox__2[]"]')
	).toHaveCount(2);
	await expect(rows.nth(1).locator('.wpcf7-field-group-count')).toHaveValue(
		'2'
	);
	await expect(
		rows.first().locator('.wpcf7-field-group-remove')
	).toBeHidden();
	const remove = rows.nth(1).locator('.wpcf7-field-group-remove');
	await remove.evaluate((button) => {
		button.innerHTML = '<span>Remove this</span>';
	});
	await remove.locator('span').click();
	await expect(rows).toHaveCount(1);
	await expect(rows.first().locator('.wpcf7-field-group-count')).toHaveValue(
		'1'
	);
});

test('bubbles native group events in order with DOM row references', async ({
	page,
}) => {
	await page.addInitScript(() => {
		window.cf7rfEvents = [];
		for (const name of ['change', 'added', 'removed']) {
			document.addEventListener(`wpcf7-field-groups/${name}`, (event) => {
				const rows = event.target
					.closest('.wpcf7-field-groups')
					.querySelectorAll('.wpcf7-field-group');
				window.cf7rfEvents.push({
					name,
					target: event.target.className,
					row: event.detail?.group?.className || null,
					connected: event.detail?.group?.isConnected ?? null,
					lastRow: event.detail?.group === rows[rows.length - 1],
					count: rows.length,
				});
				if (name === 'removed') {
					window.cf7rfRemovedGroup = event.detail.group;
				}
			});
		}
	});
	await page.goto('/?pagename=single-group');
	await page.locator('.wpcf7-field-group-add').click();
	await page.locator('.wpcf7-field-group-remove').last().click();
	const events = await page.evaluate(() => window.cf7rfEvents);
	expect(events.map(({ name }) => name)).toEqual([
		'change',
		'added',
		'change',
		'removed',
		'change',
	]);
	expect(events[1]).toMatchObject({
		target: expect.stringContaining('wpcf7-field-group-add'),
		row: 'wpcf7-field-group',
		connected: true,
		lastRow: true,
		count: 2,
	});
	expect(events[3]).toMatchObject({
		target: expect.stringContaining('wpcf7-field-group-remove'),
		row: 'wpcf7-field-group',
		connected: true,
		lastRow: true,
		count: 2,
	});
	expect(events[4]).toMatchObject({ count: 1 });
	expect(
		await page.evaluate(() => window.cf7rfRemovedGroup.isConnected)
	).toBe(false);
});

test('preserves defaults and scopes exclusive checkboxes to their own rows and forms', async ({
	page,
}) => {
	await page.goto('/?pagename=same-form-twice');
	const forms = page.locator('form.wpcf7-form');
	const firstRow = forms.first().locator('.wpcf7-field-group').first();
	const otherForm = forms.nth(1).locator('.wpcf7-field-group');
	await expect(
		firstRow.getByRole('checkbox', { name: 'First', exact: true })
	).toBeChecked();
	await otherForm
		.getByRole('checkbox', { name: 'Second', exact: true })
		.check();
	await expect(
		otherForm.getByRole('checkbox', { name: 'First', exact: true })
	).not.toBeChecked();
	await expect(
		firstRow.getByRole('checkbox', { name: 'First', exact: true })
	).toBeChecked();
	await firstRow
		.getByRole('checkbox', { name: 'Second', exact: true })
		.check();
	await firstRow.locator('.wpcf7-field-group-add').click();
	const newRow = forms.first().locator('.wpcf7-field-group').nth(1);
	await expect(
		newRow.getByRole('checkbox', { name: 'First', exact: true })
	).toBeChecked();
	await expect(
		newRow.getByRole('checkbox', { name: 'Second', exact: true })
	).not.toBeChecked();
	await newRow.getByRole('checkbox', { name: 'Second', exact: true }).check();
	await expect(
		newRow.getByRole('checkbox', { name: 'First', exact: true })
	).not.toBeChecked();
	await expect(
		firstRow.getByRole('checkbox', { name: 'Second', exact: true })
	).toBeChecked();
	await expect(
		otherForm.getByRole('checkbox', { name: 'Second', exact: true })
	).toBeChecked();
});

test('renumbers rows after an externally dispatched native change event', async ({
	page,
}) => {
	await page.goto('/?pagename=single-group');
	await page.locator('.wpcf7-field-groups').evaluate((container) => {
		container.append(
			container.querySelector('.wpcf7-field-group').cloneNode(true)
		);
		container.dispatchEvent(
			new CustomEvent('wpcf7-field-groups/change', { bubbles: true })
		);
	});
	await expect(page.locator('[name="repeated-email__2"]')).toBeVisible();
	await expect(page.locator('.wpcf7-field-group-count').first()).toHaveValue(
		'2'
	);
	await expect(
		page.locator('.wpcf7-field-group-remove').last()
	).toBeVisible();
});

test('initializes when its script is loaded after DOMContentLoaded', async ({
	page,
}) => {
	const asset = '**/cf7-repeatable-fields/dist/scripts.js*';
	await page.route(asset, (route) => route.abort());
	await page.goto('/?pagename=single-group');
	await expect(page.locator('[name="repeated-email"]')).toBeVisible();
	await page.unroute(asset);
	await page.addScriptTag({
		url: '/wp-content/plugins/cf7-repeatable-fields/dist/scripts.js',
	});
	await expect(page.locator('[name="repeated-email__1"]')).toBeVisible();
	await page.locator('.wpcf7-field-group-add').click();
	await expect(page.locator('.wpcf7-field-group')).toHaveCount(2);
});
