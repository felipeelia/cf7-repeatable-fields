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

[Unreleased]: https://github.com/felipeelia/cf7-repeatable-fields/compare/2.0.1...trunk
[2.0.1]: https://github.com/felipeelia/cf7-repeatable-fields/compare/2.0.0...2.0.1
[2.0.0]: https://github.com/felipeelia/cf7-repeatable-fields/compare/1.1.3...2.0.0
[1.1.3]: https://github.com/felipeelia/cf7-repeatable-fields/compare/1.1.2...1.1.3
[1.1.2]: https://github.com/felipeelia/cf7-repeatable-fields/compare/1.1.1...1.1.2
[1.1.1]: https://github.com/felipeelia/cf7-repeatable-fields/compare/1.1...1.1.1
[1.1]: https://github.com/felipeelia/cf7-repeatable-fields/compare/1.0.2...1.1
[1.0.2]: https://github.com/felipeelia/cf7-repeatable-fields/compare/1.0.1...1.0.2
[1.0.1]: https://github.com/felipeelia/cf7-repeatable-fields/compare/1.0.0...1.0.1
[1.0.0]: https://github.com/felipeelia/cf7-repeatable-fields/releases/tag/1.0.0
