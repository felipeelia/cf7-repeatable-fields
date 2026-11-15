const { test: base, expect } = require('@playwright/test');

const test = base.extend({
	page: async ({ page }, runTest, testInfo) => {
		const errors = [];
		page.on('pageerror', (error) => errors.push(error.message));
		await runTest(page);
		if (errors.length) {
			await testInfo.attach('browser-errors', {
				body: JSON.stringify(errors, null, 2),
				contentType: 'application/json',
			});
		}
		expect(errors, 'Browser JavaScript errors').toEqual([]);
	},
});

module.exports = { test, expect };
