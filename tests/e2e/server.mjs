import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { runCLI } from '@wp-playground/cli';

const root = fileURLToPath(new URL('../../', import.meta.url));
const pluginRoot = resolve(process.env.CF7RF_PLUGIN_DIR || root);
mkdirSync(`${root}test-results`, { recursive: true });
const cf7Version = process.env.CF7_VERSION || '6.2.5';
const cf7Url = `https://downloads.wordpress.org/plugin/contact-form-7${
	cf7Version === 'latest' ? '' : `.${cf7Version}`
}.zip`;

const cli = await runCLI({
	command: 'server',
	port: 9400,
	wp: process.env.WP_VERSION || '7.1.4',
	php: process.env.PHP_VERSION || '8.3',
	login: false,
	mount: [
		{
			hostPath: pluginRoot,
			vfsPath: '/wordpress/wp-content/plugins/cf7-repeatable-fields',
		},
		{
			hostPath: `${root}tests`,
			vfsPath:
				'/wordpress/wp-content/plugins/cf7-repeatable-fields/tests',
		},
		{
			hostPath: `${root}test-results`,
			vfsPath:
				'/wordpress/wp-content/plugins/cf7-repeatable-fields/test-results',
		},
		{
			hostPath: `${root}tests/plugins`,
			vfsPath: '/wordpress/wp-content/mu-plugins',
		},
	],
	blueprint: {
		steps: [
			{
				step: 'defineWpConfigConsts',
				consts: {
					WP_DEBUG: true,
					WP_DEBUG_DISPLAY: false,
					WP_DEBUG_LOG:
						'/wordpress/wp-content/plugins/cf7-repeatable-fields/test-results/php-errors.log',
					SCRIPT_DEBUG: false,
				},
			},
			{
				step: 'installPlugin',
				pluginData: { resource: 'url', url: cf7Url },
				options: { activate: true },
			},
			{
				step: 'activatePlugin',
				pluginPath: 'cf7-repeatable-fields/cf7-repeatable-fields.php',
			},
			{
				step: 'runPHP',
				code: readFileSync(
					new URL('./fixtures/seed.php', import.meta.url),
					'utf8'
				),
			},
		],
	},
});

for (const signal of ['SIGINT', 'SIGTERM']) {
	process.once(signal, async () => {
		await cli[Symbol.asyncDispose]();
		process.exit(0);
	});
}
