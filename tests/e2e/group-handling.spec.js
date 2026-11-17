/**
 * Group ID and row count regression coverage.
 *
 * @since 3.0.0
 */

const { test, expect } = require('./fixtures/test');

test('bounds posted group counts on ordinary page requests', async ({
	request,
}) => {
	for (const [key, value, expected] of [
		['_wpcf7_groups_count[emails]', '100000', 50],
		['_wpcf7_groups_count[emails]', '-1', 1],
		['_wpcf7_groups_count[emails]', '0', 1],
		['_wpcf7_groups_count[emails]', 'abc', 1],
		['_wpcf7_groups_count[emails]', '1.5', 1],
		['_wpcf7_groups_count[emails][]', 'x', 0],
		['_wpcf7_groups_count[unknown]', '100000', 0],
		['_wpcf7_groups_count[emails]', '3', 3],
	]) {
		const response = await request.post('/?pagename=single-group', {
			form: { [key]: value },
			timeout: 10_000,
		});
		expect(response.ok()).toBeTruthy();
		const html = await response.text();
		const fields = [...html.matchAll(/ name="repeated-email__(\d+)"/g)];
		expect(fields).toHaveLength(expected);
		if (expected) {
			expect(fields.map((match) => Number(match[1]))).toEqual(
				Array.from({ length: expected }, (_, index) => index + 1)
			);
		}
		expect(html.length).toBeLessThan(500_000);
	}
});
