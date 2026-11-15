import wordpress from '@wordpress/eslint-plugin';

export default [
	{
		ignores: [
			'node_modules/**',
			'vendor/**',
			'dist/**',
			'playwright-report/**',
			'test-results/**',
		],
	},
	...wordpress.configs.recommended,
	{
		languageOptions: {
			globals: {
				$: 'readonly',
				jQuery: 'readonly',
			},
		},
		rules: {
			'import/no-extraneous-dependencies': [
				'error',
				{ devDependencies: true },
			],
		},
	},
];
