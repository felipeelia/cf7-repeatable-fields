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

The `trunk` branch is the main branch and contains all new code to be released in an upcoming version. A version released is just a tag of that branch.

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

Coverage includes saving group syntax in the CF7 editor, adding/removing rows, generated mail, invalid repeated fields and correction, independent groups with unequal row counts, jQuery-free operation, native group events, cloned defaults, exclusive checkboxes, and late script loading. The reduced #65 fixture currently passes; the original report still needs investigation before the issue can be considered resolved.

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

1. Branch: Starting from `trunk`, cut a release branch named `release/X.Y.Z` for your changes.
1. Version bump: Bump the version number in `cf7-repeatable-fields.php`, `package.json`, `package-lock.json`, `readme.txt`, and any other relevant files if it does not already reflect the version being released. In `cf7-repeatable-fields.php` update both the plugin "Version:" property and the plugin `CF7_REPEATABLE_FIELDS_VERSION` constant.
1. Changelog: Add/update the changelog in `CHANGELOG.md` and `readme.txt`, ensuring to link the [X.Y.Z] release reference in the footer of `CHANGELOG.md` (e.g., https://github.com/felipeelia/cf7-repeatable-fields/compare/X.Y.Z-1...X.Y.Z). Update the Unreleased link to https://github.com/felipeelia/cf7-repeatable-fields/compare/X.Y.Z...trunk
1. Props: Update `CREDITS.md` file with any new contributors, confirm maintainers are accurate.
1. Readme updates: Make any other readme changes as necessary. `README.md` is geared toward GitHub and `readme.txt` contains WordPress.org-specific content. The two are slightly different.
1. New files: Check to be sure any new files/paths that are unnecessary in the production version are included in `.distignore`.
1. POT file: Run `wp i18n make-pot . languages/cf7-repeatable-fields.pot` and commit the file. In case of errors, try to disable Xdebug (see [this comment](https://github.com/10up/ElasticPress/pull/3079#issuecomment-1291028290).)
1. Release date: Double check the release date in both changelog files.
1. Merge: Merge the release branch/PR into `trunk`.
1. Test: Run `git pull origin trunk` and test for functionality locally.
1. Release: Create a [new release](https://github.com/felipeelia/cf7-repeatable-fields/releases/new), naming the release and the new tag with the new version number (`X.Y.Z`). Paste the release changelog from `CHANGELOG.md` into the body of the release and include a link to the closed issues on the [milestone](https://github.com/felipeelia/cf7-repeatable-fields/milestone/#?closed=1).
1. SVN: Wait for the [GitHub Action](https://github.com/felipeelia/cf7-repeatable-fields/actions/workflows/deploy.yml) to finish deploying to the WordPress.org repository. If all goes well, users with SVN commit access for that plugin will receive an emailed diff of changes.
1. Check WordPress.org: Ensure that the changes are live on https://wordpress.org/plugins/cf7-repeatable-fields/. This may take a few minutes.
1. Close milestone: Edit the [milestone](https://github.com/felipeelia/cf7-repeatable-fields/milestone/#) with release date (in the `Due date (optional)` field) and link to GitHub release (in the `Description` field), then close the milestone.
1. Punt incomplete items: If any open issues or PRs which were milestoned for `X.Y.Z` do not make it into the release, update their milestone to `X.Y.Z+1`, `X.Y+1.0`, `X+1.0.0` or `Future Release`.
