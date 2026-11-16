const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
	stableVersion,
	newerSeries,
	discover,
	classifyResult,
	recordResult,
	upsertIssue,
	proposeReadme,
	report,
} = require('../../bin/compatibility');

const versions = {
	sha: 'tested-sha',
	wordpress: '7.2.1',
	cf7: '6.3.1',
	published: '2.0.2',
};
const context = {
	repo: { owner: 'owner', repo: 'plugin' },
	serverUrl: 'https://github.com',
	runId: 123,
};

function harness({
	readme = 'Tested up to: 7.1.4\nRequires at least: 7.1\n',
	issues = [],
	head = versions.sha,
} = {}) {
	const calls = [];
	const endpoint = (name, data) => async (args) => {
		calls.push({ name, args });
		return { data: typeof data === 'function' ? data(args) : data };
	};
	const github = {
		paginate: async () => issues,
		rest: {
			issues: {
				listForRepo: () => {},
				create: endpoint('issue.create', (args) => ({
					...args,
					number: 1,
					state: 'open',
				})),
				update: endpoint('issue.update', {}),
			},
			repos: {
				getContent: endpoint('content', {
					content: Buffer.from(readme).toString('base64'),
				}),
			},
			git: {
				getCommit: endpoint('base', { tree: { sha: 'base-tree-sha' } }),
				getRef: endpoint('ref', { object: { sha: head } }),
				createTree: endpoint('tree', { sha: 'tree-sha' }),
				createCommit: endpoint('commit', { sha: 'commit-sha' }),
				createRef: endpoint('branch', {}),
			},
			pulls: { create: endpoint('pr', {}) },
		},
	};
	const core = {
		warning: (message) => calls.push({ name: 'warning', message }),
		setFailed: (message) => calls.push({ name: 'failed', message }),
		summary: {
			addHeading() {
				return this;
			},
			addRaw() {
				return this;
			},
			addTable() {
				return this;
			},
			async write() {},
		},
	};
	return {
		github,
		core,
		calls,
		context,
		versions,
		issues,
		runURL: 'https://example.org/run',
	};
}

const passed = () => ({ status: 'passed', versions });
const runResults = () => ({ trunk: passed(), published: passed() });

test('accepts only exact stable versions and compares numeric X.Y', () => {
	for (const version of ['7.2', '7.2.1', '6.2.5']) {
		assert.equal(stableVersion(version), version);
	}
	for (const version of [
		'latest',
		'7.2-RC1',
		'7.2.1-beta',
		undefined,
		'7.2\nBAD=value',
	]) {
		assert.throws(() => stableVersion(version));
	}
	assert.equal(newerSeries('7.1.5', '7.1.4'), false);
	assert.equal(newerSeries('7.2', '7.1.4'), true);
	assert.equal(newerSeries('8.0', '7.9'), true);
	assert.equal(newerSeries('7.10', '7.9'), true);
	assert.equal(newerSeries('7.2', '8.0'), false);
});

test('discovery uses official stable metadata and retries a failed request', async (t) => {
	let attempts = 0;
	t.mock.method(globalThis, 'fetch', async (url) => {
		if (url.includes('/core/')) {
			attempts++;
			if (attempts === 1) {
				throw new Error('Temporary outage');
			}
			return {
				ok: true,
				json: async () => ({
					offers: [
						{ response: 'autoupdate', version: '6.9' },
						{ response: 'upgrade', version: '7.2.1' },
					],
				}),
			};
		}
		return {
			ok: true,
			json: async () => ({
				version: url.endsWith('=contact-form-7') ? '6.3.1' : '2.0.2',
			}),
		};
	});
	assert.deepEqual(await discover('tested-sha'), versions);
	assert.equal(attempts, 2);
});

test('rejects prerelease metadata rather than proposing compatibility', async (t) => {
	t.mock.method(globalThis, 'fetch', async (url) => ({
		ok: true,
		json: async () =>
			url.includes('/core/')
				? { offers: [{ response: 'upgrade', version: '7.3-RC1' }] }
				: { version: '6.3.1' },
	}));
	await assert.rejects(discover('sha'), /Expected a stable version/);
});

test('distinguishes assertions from incomplete or missing reports', () => {
	const result = {
		errors: [],
		stats: { expected: 20, unexpected: 0, flaky: 0, skipped: 0 },
	};
	assert.equal(classifyResult('success', result).status, 'passed');
	assert.equal(classifyResult('failure', result).status, 'infrastructure');
	assert.equal(classifyResult('failure', undefined).status, 'infrastructure');
	assert.equal(
		classifyResult('success', {
			...result,
			stats: { expected: 0, unexpected: 0, flaky: 0, skipped: 0 },
		}).status,
		'infrastructure'
	);
	assert.equal(
		classifyResult('success', {
			...result,
			stats: { ...result.stats, skipped: 1 },
		}).status,
		'infrastructure'
	);
	assert.equal(
		classifyResult('failure', {
			...result,
			errors: [{ message: 'Server startup failed' }],
		}).status,
		'infrastructure'
	);
	const failure = classifyResult('failure', {
		...result,
		stats: { ...result.stats, unexpected: 1 },
		suites: [
			{
				suites: [
					{
						specs: [
							{
								title: 'Sends repeated fields',
								tests: [
									{
										status: 'unexpected',
										results: [
											{
												error: {
													message: 'Wrong email',
												},
											},
										],
									},
								],
							},
						],
					},
				],
			},
		],
	});
	assert.equal(failure.status, 'compatibility');
	assert.deepEqual(failure.failures, ['Sends repeated fields: Wrong email']);
});

test('issues are created once, updated when open, and left closed', async () => {
	const h = harness();
	const args = {
		...h,
		key: 'same-release',
		title: 'Failure',
		body: 'First report',
	};
	await upsertIssue(args);
	await upsertIssue({ ...args, body: 'Later run' });
	assert.deepEqual(
		h.calls.map((call) => call.name),
		['issue.create', 'issue.update']
	);
	h.issues[0].state = 'closed';
	await upsertIssue({ ...args, body: 'Another run' });
	assert.equal(h.calls.length, 2);
});

test('new WP series proposes a readme-only PR from the tested SHA', async () => {
	const h = harness();
	await report({ ...h, results: runResults() });
	const tree = h.calls.find((call) => call.name === 'tree').args;
	assert.equal(tree.base_tree, 'base-tree-sha');
	assert.deepEqual(tree.tree, [
		{
			path: 'readme.txt',
			mode: '100644',
			type: 'blob',
			content: 'Tested up to: 7.2\nRequires at least: 7.1\n',
		},
	]);
	assert.deepEqual(
		h.calls.find((call) => call.name === 'commit').args.parents,
		[versions.sha]
	);
	assert.equal(h.calls.find((call) => call.name === 'pr').args.base, 'trunk');
	assert.equal(
		h.calls.some((call) => call.name === 'issue.create'),
		false
	);
});

test('WP patches, CF7 updates, and older WP versions do not propose a PR', async () => {
	for (const tested of ['7.2', '7.2.0', '7.3', '8.0']) {
		const h = harness({ readme: `Tested up to: ${tested}\n` });
		await proposeReadme(h);
		assert.equal(
			h.calls.some((call) => call.name === 'pr'),
			false
		);
	}
});

test('an existing open or closed PR suppresses duplicate bumps', async () => {
	for (const state of ['open', 'closed']) {
		const h = harness({
			issues: [
				{
					pull_request: {},
					body: '<!-- cf7rf-tested-up-to:7.2 -->',
					state,
				},
			],
		});
		await proposeReadme(h);
		assert.equal(
			h.calls.some((call) => call.name === 'branch'),
			false
		);
	}
});

test('trunk movement during testing defers the PR', async () => {
	const h = harness({ head: 'untested-sha' });
	await proposeReadme(h);
	assert.equal(
		h.calls.some((call) => call.name === 'pr'),
		false
	);
	assert.equal(
		h.calls.some((call) => call.name === 'warning'),
		true
	);
});

test('failure of either target blocks the readme PR and links test evidence', async () => {
	for (const target of ['trunk', 'published']) {
		const h = harness();
		const results = runResults();
		results[target] = {
			versions,
			status: 'compatibility',
			failures: ['Sends repeated fields: Wrong email'],
		};
		await report({ ...h, results });
		assert.equal(
			h.calls.some((call) => call.name === 'pr'),
			false
		);
		const issue = h.calls.find((call) => call.name === 'issue.create').args;
		assert.match(issue.body, /Sends repeated fields: Wrong email/);
		assert.match(issue.body, /actions\/runs\/123/);
		assert.match(issue.title, /Compatibility check failed/);
		assert.equal(
			h.calls.some((call) => call.name === 'failed'),
			true
		);
	}
});

test('missing or mismatched artifacts produce infrastructure issues', async () => {
	for (const result of [
		undefined,
		{ status: 'passed', versions: { ...versions, wordpress: '7.1' } },
	]) {
		const h = harness();
		await report({ ...h, results: { trunk: result, published: passed() } });
		assert.match(
			h.calls.find((call) => call.name === 'issue.create').args.title,
			/infrastructure/
		);
		assert.equal(
			h.calls.some((call) => call.name === 'pr'),
			false
		);
	}
});

test('metadata discovery failure opens one infrastructure issue', async () => {
	const h = harness();
	await report({ ...h, versions: null });
	assert.match(
		h.calls.find((call) => call.name === 'issue.create').args.title,
		/discovery failed/
	);
	assert.equal(
		h.calls.some((call) => call.name === 'pr'),
		false
	);
});

test('repeated failures on later trunk commits update the same issue', async () => {
	const h = harness();
	const failed = (v) => ({
		status: 'compatibility',
		versions: v,
		failures: ['Same assertion'],
	});
	await report({
		...h,
		results: { trunk: failed(versions), published: passed() },
	});
	const next = { ...versions, sha: 'later-sha' };
	await report({
		...h,
		versions: next,
		results: {
			trunk: failed(next),
			published: { status: 'passed', versions: next },
		},
	});
	assert.equal(
		h.calls.filter((call) => call.name === 'issue.create').length,
		1
	);
	assert.equal(
		h.calls.filter((call) => call.name === 'issue.update').length,
		1
	);
});

test('artifact recording and download layout preserve the failure classification', async () => {
	const {
		mkdtempSync,
		mkdirSync,
		writeFileSync,
		copyFileSync,
		rmSync,
	} = require('node:fs');
	const { tmpdir } = require('node:os');
	const { join } = require('node:path');
	const original = process.cwd();
	const directory = mkdtempSync(join(tmpdir(), 'cf7-compatibility-test-'));
	try {
		process.chdir(directory);
		mkdirSync('test-results');
		writeFileSync(
			'test-results/playwright.json',
			JSON.stringify({
				errors: [],
				stats: { expected: 18, unexpected: 0, flaky: 0, skipped: 0 },
			})
		);
		assert.equal(
			recordResult({
				TARGET: 'trunk',
				VERSIONS: JSON.stringify(versions),
				TEST_OUTCOME: 'success',
			}).status,
			'passed'
		);
		for (const target of ['trunk', 'published']) {
			const path = `compatibility-results/compatibility-${target}/test-results`;
			mkdirSync(path, { recursive: true });
			copyFileSync('test-results/result.json', `${path}/result.json`);
		}
		const h = harness();
		await report(h);
		assert.equal(
			h.calls.some((call) => call.name === 'pr'),
			true
		);
		rmSync('test-results/playwright.json');
		assert.equal(
			recordResult({
				TARGET: 'trunk',
				VERSIONS: JSON.stringify(versions),
				TEST_OUTCOME: 'skipped',
			}).status,
			'infrastructure'
		);
	} finally {
		process.chdir(original);
		rmSync(directory, { recursive: true, force: true });
	}
});

test('a failed PR creation can recover its existing readme-only branch', async () => {
	const h = harness();
	h.github.rest.git.createRef = async () => {
		throw Object.assign(new Error('Already exists'), { status: 422 });
	};
	h.github.rest.repos.getContent = async ({ ref }) => ({
		data: {
			content: Buffer.from(
				ref === versions.sha
					? 'Tested up to: 7.1\n'
					: 'Tested up to: 7.2\n'
			).toString('base64'),
		},
	});
	h.github.rest.repos.compareCommits = async () => ({
		data: { files: [{ filename: 'readme.txt' }] },
	});
	await proposeReadme(h);
	assert.equal(
		h.calls.some((call) => call.name === 'pr'),
		true
	);
});

test('an existing automation branch with other changes is never overwritten', async () => {
	const h = harness();
	h.github.rest.git.createRef = async () => {
		throw Object.assign(new Error('Already exists'), { status: 422 });
	};
	h.github.rest.repos.compareCommits = async () => ({
		data: { files: [{ filename: 'plugin.php' }] },
	});
	await assert.rejects(proposeReadme(h), /review it manually/);
	assert.equal(
		h.calls.some((call) => call.name === 'pr'),
		false
	);
});
