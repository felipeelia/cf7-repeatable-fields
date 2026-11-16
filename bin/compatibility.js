/* Compatibility automation runs only from the trusted trunk workflow. */
const { readFileSync, writeFileSync, mkdirSync } = require('node:fs');

function stableVersion(value) {
	if (typeof value !== 'string' || !/^\d+\.\d+(?:\.\d+)?$/.test(value)) {
		throw new Error(`Expected a stable version, received ${value}`);
	}
	return value;
}

function series(version) {
	return stableVersion(version).split('.').slice(0, 2).join('.');
}

function newerSeries(latest, tested) {
	const left = series(latest).split('.').map(Number);
	const right = series(tested).split('.').map(Number);
	return left[0] > right[0] || (left[0] === right[0] && left[1] > right[1]);
}

async function getJSON(url) {
	// Retry transient metadata errors without accepting prerelease/fallback versions.
	let lastError;
	for (let attempt = 0; attempt < 3; attempt++) {
		try {
			const response = await fetch(url, {
				signal: AbortSignal.timeout(30_000),
			});
			if (!response.ok) {
				throw new Error(
					`Metadata request failed: ${response.status} ${url}`
				);
			}
			return await response.json();
		} catch (error) {
			lastError = error;
		}
	}
	throw lastError;
}

async function discover(sha) {
	const pluginInfo = (slug) =>
		getJSON(
			`https://api.wordpress.org/plugins/info/1.2/?action=plugin_information&request[slug]=${slug}`
		);
	const [wp, cf7, published] = await Promise.all([
		getJSON('https://api.wordpress.org/core/version-check/1.7/'),
		pluginInfo('contact-form-7'),
		pluginInfo('cf7-repeatable-fields'),
	]);
	const current = wp.offers?.find((offer) => offer.response === 'upgrade');
	return {
		sha,
		wordpress: stableVersion(current?.version),
		cf7: stableVersion(cf7.version),
		published: stableVersion(published.version),
	};
}

function classifyResult(outcome, result) {
	if (!result || result.errors?.length || !result.stats) {
		return {
			status: 'infrastructure',
			failures: [
				'No complete Playwright report; inspect setup/server logs.',
			],
		};
	}
	const failures = [];
	function visit(suites) {
		for (const suite of suites || []) {
			for (const spec of suite.specs || []) {
				for (const test of spec.tests || []) {
					if (test.status === 'unexpected') {
						const error = test.results?.findLast(
							(item) => item.error
						)?.error;
						failures.push(
							`${spec.title}: ${error?.message || 'Test failed'}`
						);
					}
				}
			}
			visit(suite.suites);
		}
	}
	visit(result.suites);
	if (result.stats.unexpected > 0) {
		return { status: 'compatibility', failures };
	}
	if (
		outcome !== 'success' ||
		result.stats.skipped > 0 ||
		!(result.stats.expected + result.stats.flaky > 0)
	) {
		return {
			status: 'infrastructure',
			failures: [
				'Test run failed or did not execute the complete suite.',
			],
		};
	}
	return { status: 'passed', failures: [] };
}

function recordResult(env) {
	let results;
	try {
		results = JSON.parse(
			readFileSync('test-results/playwright.json', 'utf8')
		);
	} catch {
		// Setup errors and an unavailable browser/server may not produce a report.
	}
	const result = {
		target: env.TARGET,
		versions: JSON.parse(env.VERSIONS),
		...classifyResult(env.TEST_OUTCOME, results),
	};
	mkdirSync('test-results', { recursive: true });
	writeFileSync('test-results/result.json', JSON.stringify(result, null, 2));
	return result;
}

async function upsertIssue({ github, context, issues, key, title, body }) {
	const marker = `<!-- cf7rf-compatibility:${key} -->`;
	const existing = issues.find(
		(issue) => !issue.pull_request && issue.body?.includes(marker)
	);
	const content = `${marker}\n${body}`;
	if (existing) {
		// Respect a maintainer's decision to close an issue; never reopen it daily.
		if (existing.state === 'open' && existing.body !== content) {
			await github.rest.issues.update({
				...context.repo,
				issue_number: existing.number,
				body: content,
			});
		}
		return existing;
	}
	const { data } = await github.rest.issues.create({
		...context.repo,
		title,
		body: content,
	});
	issues.push(data);
	return data;
}

async function proposeReadme({
	github,
	context,
	versions,
	issues,
	runURL,
	core,
}) {
	const repo = context.repo;
	const { data: file } = await github.rest.repos.getContent({
		...repo,
		path: 'readme.txt',
		ref: versions.sha,
	});
	const readme = Buffer.from(file.content, 'base64').toString('utf8');
	const tested = readme.match(
		/^Tested up to:\s*(\d+\.\d+(?:\.\d+)?)\s*$/m
	)?.[1];
	if (!tested) {
		throw new Error('Cannot find Tested up to in readme.txt');
	}
	if (!newerSeries(versions.wordpress, tested)) {
		return;
	}
	const wp = series(versions.wordpress);
	const marker = `<!-- cf7rf-tested-up-to:${wp} -->`;
	// Closed PRs are also remembered, so rejecting a bump does not recreate it daily.
	if (
		issues.some(
			(issue) => issue.pull_request && issue.body?.includes(marker)
		)
	) {
		return;
	}
	const { data: head } = await github.rest.git.getRef({
		...repo,
		ref: 'heads/trunk',
	});
	if (head.object.sha !== versions.sha) {
		core.warning(
			'Trunk changed during testing; defer the readme PR until the next run.'
		);
		return;
	}
	const content = readme.replace(/^Tested up to:.*$/m, `Tested up to: ${wp}`);
	const branch = `automation/tested-up-to-${wp}`;
	// All commits start from the tested SHA; no untested trunk changes enter this PR.
	const { data: base } = await github.rest.git.getCommit({
		...repo,
		commit_sha: versions.sha,
	});
	const { data: tree } = await github.rest.git.createTree({
		...repo,
		base_tree: base.tree.sha,
		tree: [{ path: 'readme.txt', mode: '100644', type: 'blob', content }],
	});
	const { data: commit } = await github.rest.git.createCommit({
		...repo,
		message: `Update WordPress Tested up to to ${wp}`,
		tree: tree.sha,
		parents: [versions.sha],
	});
	try {
		await github.rest.git.createRef({
			...repo,
			ref: `refs/heads/${branch}`,
			sha: commit.sha,
		});
	} catch (error) {
		if (error.status !== 422) {
			throw error;
		}
		// Recover a partial earlier run, without overwriting a branch someone edited.
		const { data: existing } = await github.rest.repos.getContent({
			...repo,
			path: 'readme.txt',
			ref: branch,
		});
		const { data: comparison } = await github.rest.repos.compareCommits({
			...repo,
			base: versions.sha,
			head: branch,
		});
		if (
			Buffer.from(existing.content, 'base64').toString('utf8') !==
				content ||
			comparison.files?.length !== 1 ||
			comparison.files[0].filename !== 'readme.txt'
		) {
			throw new Error(
				`Existing ${branch} branch has different changes; review it manually.`
			);
		}
	}
	await github.rest.pulls.create({
		...repo,
		base: 'trunk',
		head: branch,
		title: `Update WordPress Tested up to to ${wp}`,
		body: `${marker}\nThe E2E suite passed against WordPress ${versions.wordpress}, Contact Form 7 ${versions.cf7}, and PHP 8.3 for both trunk (${versions.sha}) and the WordPress.org plugin (${versions.published}).\n\nOnly the WordPress X.Y compatibility field changes. Minimum requirements stay the same. This PR does not deploy to WordPress.org; deployment occurs when a non-prerelease GitHub release is published.\n\nValidation: [compatibility run](${runURL}). Review any required CI approvals in the PR before merging.`,
	});
}

async function report({
	github,
	context,
	core,
	versions = JSON.parse(process.env.VERSIONS || 'null'),
	results,
}) {
	const runURL = `${context.serverUrl}/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`;
	const issues = await github.paginate(github.rest.issues.listForRepo, {
		...context.repo,
		state: 'all',
		per_page: 100,
	});
	const common = { github, context, issues };
	if (!versions) {
		await upsertIssue({
			...common,
			key: 'discovery',
			title: 'Compatibility infrastructure: upstream version discovery failed',
			body: `Could not resolve stable upstream versions. No compatibility conclusion or readme update was made.\n\n[Inspect metadata/setup logs](${runURL}).`,
		});
		core.setFailed('Upstream version discovery failed.');
		return;
	}
	const rows = [];
	let allPassed = true;
	for (const target of ['trunk', 'published']) {
		let result = results?.[target];
		if (!results) {
			try {
				result = JSON.parse(
					readFileSync(
						`compatibility-results/compatibility-${target}/test-results/result.json`,
						'utf8'
					)
				);
			} catch {
				// Missing artifacts are infrastructure failures, never a passing check.
			}
		}
		if (
			!result ||
			JSON.stringify(result.versions) !== JSON.stringify(versions)
		) {
			result = {
				status: 'infrastructure',
				failures: ['Missing or mismatched result artifact.'],
			};
		}
		const plugin =
			target === 'published' ? versions.published : versions.sha;
		rows.push([`${target} (${plugin})`, result.status]);
		if (result.status === 'passed') {
			continue;
		}
		allPassed = false;
		const identity =
			target === 'published' ? `published-${plugin}` : 'trunk';
		const key = `${result.status}:wp-${versions.wordpress}:cf7-${versions.cf7}:${identity}`;
		const failures = (result.failures || [])
			.join('\n\n')
			.replace(/\u001b\[[0-9;]*m/g, '')
			.slice(0, 6000);
		await upsertIssue({
			...common,
			key,
			title: `${result.status === 'compatibility' ? 'Compatibility check failed' : 'Compatibility infrastructure failure'}: ${target} with WP ${versions.wordpress} / CF7 ${versions.cf7}`,
			body: `Plugin: ${target} (${plugin})\nWordPress: ${versions.wordpress}\nContact Form 7: ${versions.cf7}\nPHP: 8.3\n\n${result.status === 'compatibility' ? 'E2E tests failed. Investigate whether this is an upstream regression, an existing plugin bug, or a test problem; a failed check alone does not establish the cause.' : 'Setup or test execution did not complete. This is not a confirmed compatibility regression.'}\n\n${failures}\n\n[Workflow logs and Playwright reports](${runURL}) include test names, traces, and screenshots when available.`,
		});
	}
	await core.summary
		.addHeading('Upstream compatibility')
		.addRaw(
			`WordPress ${versions.wordpress}, CF7 ${versions.cf7}, PHP 8.3\n\n`
		)
		.addTable([['Plugin', 'Result'], ...rows])
		.write();
	if (allPassed) {
		await proposeReadme({ ...common, versions, runURL, core });
	} else {
		core.setFailed(
			'Compatibility checks did not pass; see the linked issues and artifacts.'
		);
	}
}

module.exports = {
	stableVersion,
	series,
	newerSeries,
	discover,
	classifyResult,
	recordResult,
	upsertIssue,
	proposeReadme,
	report,
};
