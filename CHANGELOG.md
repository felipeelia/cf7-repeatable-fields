# Changelog

All notable changes to this project will be documented in this file, per [the Keep a Changelog standard](https://keepachangelog.com/).

## [Unreleased]

<!--
### Added
### Changed
### Deprecated
### Removed
### Fixed
### Security
-->

## [2.0.2] - 2024-10-22

**This is a security release.** It fixes a Stored cross-site scripting (XSS) vulnerability, that allowed users with contributor-level access and above, to inject arbitrary web scripts in pages that will execute whenever a user accesses an injected page. Thanks to Peter Thaleikis and the Wordfence team for reaching out about it.

### Added

* New `wpcf7_field_group_content` filter. Props [@Tessachu](https://github.com/Tessachu) and [@felipeelia](https://github.com/felipeelia) via [#90](https://github.com/10up/ElasticPress/pull/90).
* End-to-end basic tests. Props [@felipeelia](https://github.com/felipeelia) via [#78](https://github.com/10up/ElasticPress/pull/78).

### Changed

* Node version to v20. Props [@felipeelia](https://github.com/felipeelia) via [#89](https://github.com/10up/ElasticPress/pull/89).

### Security

* Sanitize wrapper div attributes. Props Peter Thaleikis and [@felipeelia](https://github.com/felipeelia) via [#90](https://github.com/10up/ElasticPress/pull/90).
* Bumped `postcss` from 8.4.26 to 8.4.31. Props [@dependabot](https://github.com/dependabot) via [#70](https://github.com/10up/ElasticPress/pull/70).
* Updated `ws` from 8.13.0 to 8.18.0. Props [@dependabot](https://github.com/dependabot) via [#88](https://github.com/10up/ElasticPress/pull/88).
* Updated `@wordpress/scripts` from 27.7.0 to 30.3.0. Props [@dependabot](https://github.com/dependabot) via [#88](https://github.com/10up/ElasticPress/pull/88).
* Bumped `braces` from 3.0.2 to 3.0.3. Props [@dependabot](https://github.com/dependabot) via [#80](https://github.com/10up/ElasticPress/pull/80).
* Bumped `webpack` from 5.91.0 to 5.94.0. Props [@dependabot](https://github.com/dependabot) via [#82](https://github.com/10up/ElasticPress/pull/82).
* Bumped `express` from 4.18.2 to 4.19.2. Props [@dependabot](https://github.com/dependabot) via [#74](https://github.com/10up/ElasticPress/pull/74).
* Bumped `follow-redirects` from 1.15.2 to 1.15.6. Props [@dependabot](https://github.com/dependabot) via [#76](https://github.com/10up/ElasticPress/pull/76).
* Bumped `webpack-dev-middleware` from 5.3.3 to 5.3.4. Props [@dependabot](https://github.com/dependabot) via [#75](https://github.com/10up/ElasticPress/pull/75).
* Bumped `@babel/traverse` from 7.22.8 to 7.23.2. Props [@dependabot](https://github.com/dependabot) via [#71](https://github.com/10up/ElasticPress/pull/71).
* Several node packages updated. Props [@felipeelia](https://github.com/felipeelia) via [#77](https://github.com/10up/ElasticPress/pull/77).

## [2.0.1] - 2023-09-11

### Added

* End-to-end tests foundation. Props [@felipeelia](https://github.com/felipeelia) via [#64](https://github.com/10up/ElasticPress/pull/64).

### Changed

* Removed unnecessary files from final package. Props [@felipeelia](https://github.com/felipeelia) via [#63](https://github.com/10up/ElasticPress/pull/63).

### Fixed

* Required checkbox not showing validation messages. Props [@felipeelia](https://github.com/felipeelia) via [#62](https://github.com/10up/ElasticPress/pull/62).

## [2.0.0] - 2023-07-23

**Note that this version changes minimum required versions of:**

* [WordPress](https://wordpress.org): 6.0+
* [PHP](https://php.net/): 7.2+
* [Contact Form 7](https://wordpress.org/plugins/contact-form-7/): 5.7+

This release marks the (slow) resumption of this plugin development. If you want to know more about it check out [this blog post](https://felipeelia.dev/contact-form-7-repeatable-fields-2-0-0/). If you find this plugin useful, consider leaving it [a review](https://wordpress.org/support/plugin/cf7-repeatable-fields/reviews/#new-post).

### Added

* Support to [wp-env](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-env/). See [6db4e08](https://github.com/felipeelia/cf7-repeatable-fields/commit/6db4e08).
* `group_id` as a parameter to all filters. See [#51](https://github.com/felipeelia/cf7-repeatable-fields/pull/51).
* Very basic unit testing. See [#52](https://github.com/felipeelia/cf7-repeatable-fields/pull/52).

### Changed

* Linting tools and script build process. See [6db4e08](https://github.com/felipeelia/cf7-repeatable-fields/commit/6db4e08).
* Docs were migrated to [GitHub wiki](https://github.com/felipeelia/cf7-repeatable-fields/wiki). See [14fdd49](https://github.com/felipeelia/cf7-repeatable-fields/commit/14fdd49).

### Fixed

* Validation problem with Contact Form 5.7+. Props [@sfdeveloper](https://profiles.wordpress.org/sfdeveloper/) via [this comment](https://wordpress.org/support/topic/compatibility-issues-with-cf7-5-7/#post-16588238) - added in [6db4e08](https://github.com/felipeelia/cf7-repeatable-fields/commit/6db4e08).

## [1.1.3] - 2019-12-11

* Update WP `Tested up to` field
* Apply WP Coding Standards
* Fix a small sanitization problem

## [1.1.2] - 2019-10-10

* Fix Exclusive Checkboxes

## [1.1.1] - 2019-09-04

* Add compatibility to formatted dates (`[_format_{field name} "{date format}"]`)
* DEV: Copy data and events while cloning a new group (JS)
* DEV: Pass `$new_group` as an extra param for the `wpcf7-field-groups/added` event.
* DEV: Apply some WPCS rules and add a CF7_REPEATABLE_FIELDS_VERSION const (may affect JS cache)

## [1.1] - 2018-06-14

* Replace groups in mail 2 field

## [1.0.2] - 2018/03/29

* Fix repeated tags in mail body

## [1.0.1] - 2018/03/20

* Fix the `wpcf7_field_group_remove_button_atts` filter name. Props to @asilvestre87

## [1.0.0] - 2018/03/19

* Initial release

[Unreleased]: https://github.com/felipeelia/cf7-repeatable-fields/compare/2.0.2...trunk
[2.0.2]: https://github.com/felipeelia/cf7-repeatable-fields/compare/2.0.1...2.0.2
[2.0.1]: https://github.com/felipeelia/cf7-repeatable-fields/compare/2.0.0...2.0.1
[2.0.0]: https://github.com/felipeelia/cf7-repeatable-fields/compare/1.1.3...2.0.0
[1.1.3]: https://github.com/felipeelia/cf7-repeatable-fields/compare/1.1.2...1.1.3
[1.1.2]: https://github.com/felipeelia/cf7-repeatable-fields/compare/1.1.1...1.1.2
[1.1.1]: https://github.com/felipeelia/cf7-repeatable-fields/compare/1.1...1.1.1
[1.1]: https://github.com/felipeelia/cf7-repeatable-fields/compare/1.0.2...1.1
[1.0.2]: https://github.com/felipeelia/cf7-repeatable-fields/compare/1.0.1...1.0.2
[1.0.1]: https://github.com/felipeelia/cf7-repeatable-fields/compare/1.0.0...1.0.1
[1.0.0]: https://github.com/felipeelia/cf7-repeatable-fields/releases/tag/1.0.0
