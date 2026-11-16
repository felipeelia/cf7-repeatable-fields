# Contributing and Maintaining

First, thank you for taking the time to contribute!

The following is a set of guidelines for contributors as well as information and instructions around our maintenance process.  The two are closely tied together in terms of how we all work together and set expectations, so while you may not need to know everything in here to submit an issue or pull request, it's best to keep them in the same document.

## Ways to contribute

Contributing isn't just writing code - it's anything that improves the project.  All contributions are managed right here on GitHub.  Here are some ways you can help:

### Reporting bugs

If you're running into an issue, please take a look through [existing issues](https://github.com/felipeelia/cf7-repeatable-fields/issues) and [open a new one](https://github.com/felipeelia/cf7-repeatable-fields/issues/new) if needed.  If you're able, include steps to reproduce, environment information, and screenshots/screencasts as relevant.

### Suggesting enhancements

New features and enhancements are also managed via [issues](https://github.com/felipeelia/cf7-repeatable-fields/issues).

### Pull requests

Pull requests represent a proposed solution to a specified problem.  They should always reference an issue that describes the problem and contains discussion about the problem itself.  Discussion on pull requests should be limited to the pull request itself, i.e. code review.

## Workflow

The `trunk` branch contains ongoing development for the next release. Create a topic branch from `trunk` and open your pull request against `trunk`. Published GitHub releases and their version tags identify released versions.

Keep pull requests focused, explain the resulting behavior, and include reproduction steps and validation results. Add regression coverage for bug fixes when practical. Commit built JavaScript in `dist/` alongside source changes (`npm run build`).

Add changes under `Unreleased` in `CHANGELOG.md`, following the existing categories, wording, and props format. Every entry must link to at least one pull request. Give credit to reporters, testers, and contributors as appropriate. Add new contributors to `CREDITS.md` when preparing the release.

The release checklist below follows [ElasticPress’s contributing and release process](https://github.com/10up/ElasticPress/blob/develop/CONTRIBUTING.md), adapted to this plugin’s single main branch and committed assets.

## Development and tests

Use Node.js 24.15+ (`nvm use`), npm 11+, and PHP 8.3+. The plugin targets WordPress 7.1+ and Contact Form 7 6.2.5+. PHP linting uses the `10up-Default` ruleset from `10up/phpcs-composer`.

```sh
npm ci
composer install
npm run lint
```

JavaScript linting uses the flat configuration in `eslint.config.mjs`. The WordPress preset provides compatibility wrappers for ESLint 10; npm currently reports upstream peer-range warnings for some of its plugins. A normal `npm ci` works without `--force` or `--legacy-peer-deps`.

Two scoped npm overrides temporarily select patched tooling dependencies: `isomorphic-git` under Playground storage, and `serialize-javascript` under `copy-webpack-plugin`. Remove these when the parent packages adopt the fixed releases.

### End-to-end tests

The E2E suite uses Playwright and WordPress Playground. Docker, a local database, and an SMTP server are not required.

```sh
npx playwright install chromium
npm run e2e:run
```

The command builds the production JavaScript, starts a disposable Playground site on port 9400, installs CF7, seeds forms and pages, and runs Chromium tests. Stop any other process using that port first. Each run starts with a fresh database; mail is intercepted by the test-only MU plugin and checked through its test mailbox endpoint. Never install `tests/plugins/log-emails.php` on a public site.

The default stack is WordPress 7.1.4, PHP 8.3, and CF7 6.2.5. To check upstream releases:

```sh
WP_VERSION=latest CF7_VERSION=latest npm run e2e:run
```

`PHP_VERSION` can also select a Playground PHP version. Keep combinations compatible with the CF7 release being tested. CI runs the pinned stack on pull requests and also checks latest releases on scheduled or manually triggered runs.

Use `npm run e2e:open` for Playwright's interactive runner or `npm run e2e:serve` for manual inspection of the seeded Playground site (admin login: `admin` / `password`). Reports are written to `playwright-report/`; failed tests retain screenshots and traces in `test-results/`. Browser JavaScript errors fail the test; PHP debug output is written to `test-results/php-errors.log` when present.

The E2E suite covers form editing, repeated-field interactions, validation, and generated mail. Add regression tests for reported bugs using reproducible fixtures.

### PHP integration tests

PHPUnit continues to use the WordPress test library and MySQL. With Docker running, the existing optional `wp-env` setup provides these independently of the Playground E2E suite:

```sh
npm run env start
npm run env -- run tests-cli --env-cwd=wp-content/plugins/cf7-repeatable-fields php vendor/bin/phpunit
npm run env stop
```

If the default ports are occupied, prefix the wp-env commands with `WP_ENV_PORT=8898 WP_ENV_TESTS_PORT=8899`.

Alternatively, use `bin/install-wp-tests.sh` with a dedicated test database and WordPress 7.1.4, then run `composer test`. These tests reset their database; do not point them at a development or production database.

## Release instructions

Open an issue titled `[Release] X.Y.Z`, assign the release milestone, and copy the checklist below into its description, replacing the version and milestone links.

- [ ] **Branch:** Create `release/X.Y.Z` from an up-to-date `trunk`.
- [ ] **Versions:** Update the plugin header and `CF7_REPEATABLE_FIELDS_VERSION` in `cf7-repeatable-fields.php`, `package.json`, the root and root-package versions in `package-lock.json`, and `Stable tag` in `readme.txt`. Use `X.Y.Z` without a `v` prefix.
- [ ] **Changelogs:** Move the `Unreleased` entries into a dated `X.Y.Z` section in `CHANGELOG.md`, and update `readme.txt` using its existing format. Retain props and pull request links in `CHANGELOG.md`. Add the release comparison link in its footer, and point `Unreleased` at `X.Y.Z...trunk`. Check the release date in both files.
- [ ] **Credits:** Add new contributors to `CREDITS.md` and confirm maintainer details. Include credit for bug reports and testing as well as code.
- [ ] **Readmes:** Update the GitHub and WordPress.org readmes as needed. Check minimum requirements, `Tested up to`, and any upgrade instructions.
- [ ] **Distribution:** Check `.distignore` so runtime files and the license are included, and development tools, dependencies, tests, and reports are excluded. Confirm any JavaScript changes have their built files committed in `dist/`.
- [ ] **Translations:** Run `wp i18n make-pot . languages/cf7-repeatable-fields.pot --exclude=tests,vendor,node_modules,playwright-report,test-results` and commit the updated POT file.
- [ ] **Test:** Run `npm run lint`, `npm run e2e:run`, and the PHP integration tests described above. Also check current upstream releases with `WP_VERSION=latest CF7_VERSION=latest npm run e2e:run`.
- [ ] **Review and merge:** Open the release pull request against `trunk`, link the release issue and milestone, and wait for review and green CI. Merge it and fetch the updated `trunk`.
- [ ] **Publish:** Create a [GitHub release](https://github.com/felipeelia/cf7-repeatable-fields/releases/new) targeting the reviewed `trunk` commit. Use tag `X.Y.Z`, title `Version X.Y.Z`, and the release changelog as the description. Append `See: https://github.com/felipeelia/cf7-repeatable-fields/milestone/NUMBER?closed=1`.
- [ ] **Deploy:** Watch [Deploy to WordPress.org](https://github.com/felipeelia/cf7-repeatable-fields/actions/workflows/deploy.yml). Publishing the GitHub release deploys the committed files to WordPress.org unless the release is marked **This is a pre-release**. Pushing a tag or saving a draft alone does not deploy the plugin.
- [ ] **Verify:** Check the version, changelog, requirements, and download on [WordPress.org](https://wordpress.org/plugins/cf7-repeatable-fields/). Allow a few minutes for propagation, then smoke-test the downloaded plugin with CF7 and confirm existing installations can see the update.
- [ ] **Close out:** Move unfinished issues and pull requests to a future milestone. Add the release date and GitHub release link to the milestone description, set its due date, and close the milestone and release issue. Leave an empty `Unreleased` section for subsequent changes.

Deployment uses the repository’s `SVN_USERNAME` and `SVN_PASSWORD` secrets. Assets are already committed, so the deployment workflow does not install dependencies or build them.

### Hotfixes

If `trunk` contains changes that should not be included in an urgent release, create `hotfix/X.Y.Z` from the latest stable release tag. Follow the release checklist for that branch and publish the reviewed hotfix commit. Merge the fix and release metadata back into `trunk`, resolving version and changelog conflicts as needed.

### Readme and assets between releases

The [Plugin asset/readme update](https://github.com/felipeelia/cf7-repeatable-fields/actions/workflows/push-asset-readme-update.yml) workflow updates WordPress.org readme/assets on pushes to `trunk`. Review `readme.txt` and `.wordpress-org/` changes with that in mind; they can become public before the next plugin release.

### Failed deployment

Inspect the workflow and check WordPress.org before retrying; the SVN commit may already have succeeded. Rerun the failed job for a temporary failure or corrected credentials. If published code needs changing, prepare a new version rather than moving an existing release tag.
