const { test, expect } = require('./fixtures/test');

test('saves repeatable group syntax through the CF7 editor', async ({
	page,
}) => {
	await page.goto('/wp-login.php');
	await page.locator('#user_login').fill('admin');
	await page.locator('#user_pass').fill('password');
	await page.locator('#wp-submit').click();
	await expect(page.locator('#wpadminbar')).toBeVisible();
	await page.goto('/wp-admin/admin.php?page=wpcf7-new');
	await page.locator('#title').fill('Repeatable editor smoke test');
	const form =
		'[field_group editor-group]\n<label>Email [email* editor-email]</label>\n[/field_group]\n[submit "Send"]';
	await page.locator('#wpcf7-form').fill(form);
	await page.getByRole('button', { name: 'Save', exact: true }).click();
	await expect(page).toHaveURL(/post=\d+/);
	await expect(page.locator('#wpcf7-form')).toHaveValue(form);
	await page.reload();
	await expect(page.locator('#wpcf7-form')).toHaveValue(form);
});
