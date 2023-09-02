const { defineConfig } = require('cypress');

module.exports = defineConfig({
	fixturesFolder: 'tests/e2e/fixtures',
	screenshotsFolder: 'tests/e2e/screenshots',
	videosFolder: 'tests/e2e/videos',
	downloadsFolder: 'tests/e2e/downloads',
	video: false,
	retries: {
		runMode: 1,
	},
	e2e: {
		async setupNodeEvents(on, config) {
			const { loadConfig } = require('@wordpress/env/lib/config');

			const wpEnvConfig = await loadConfig('../..');

			if (wpEnvConfig) {
				const port = wpEnvConfig.env.tests.port || null;

				if (port) {
					config.baseUrl = wpEnvConfig.env.tests.config.WP_SITEURL;
				}
			}

			return config;
		},
		specPattern: 'tests/e2e/integration/**/*.cy.{js,jsx,ts,tsx}',
		supportFile: 'tests/e2e/support/index.js',
	},
});
