=== Contact Form 7 - Repeatable Fields ===
Contributors: felipeelia
Donate link:  https://felipeelia.dev/contact-form-7-repeatable-fields/
Tags:         contact form 7, cf7, repeater, repeatable
Tested up to: 6.3
Stable tag:   2.0.1
License:      GPLv2 or later
License URI:  http://www.gnu.org/licenses/gpl-2.0.html

Adds repeatable groups of fields to Contact Form 7.

== Description ==
This plugin adds repeatable groups of fields to Contact Form 7.

**NOTE:** Tested with Contact Form 7 5.7.7.

== Usage ==

= Form tab =
Wrap the desired fields with `[field_group your_group_id_here][/field_group]`. The shortcode accepts additional parameters, in WP shortcode format and in CF7 fields parameters format as well.

Example:
~~~
[field_group emails id="emails-groups" tabindex:1]
	<label>Your Email (required)[email* your-email]</label>
	[radio your-radio use_label_element default:1 "radio 1" "radio 2" "radio 3"]
	[select* your-menu include_blank "option1" "option 2"]
	[checkbox* your-checkbox "check 1" "check 2"]
[/field_group]
~~~

= Mail tab =
In the mail settings, wrap the fields with your group id. You can use the `[group_index]` tag to print the group index and an additional `__<NUMBER>` to print a field at a specific index.

Example:
~~~
The second email entered by the user was: [your-email__2]

These were the groups:
[emails]
GROUP #[group_index]
	Checkbox: [your-checkbox]
	E-mail: [your-email]
	Radio: [your-radio]
	Select: [your-menu]
[/emails]
~~~

== Check out the Wiki ==

* [Hooks available](https://github.com/felipeelia/cf7-repeatable-fields/wiki/Hooks) - How to customize the _add_ and _remove_ buttons
* [Frequently Asked Questions](https://github.com/felipeelia/cf7-repeatable-fields/wiki/Frequently-Asked-Questions)

== Contribute ==
You can contribute with code, issues and ideas at the [GitHub repository](https://github.com/felipeelia/cf7-repeatable-fields).

If you like the plugin, [a review](https://wordpress.org/support/plugin/cf7-repeatable-fields/reviews/#new-post) is appreciated :)

== Frequently Asked Questions ==

= I have a problem with the plugin. Where can I get help? =

If you have identified a bug or would like to suggest an enhancement, please refer to our [GitHub repo](https://github.com/felipeelia/cf7-repeatable-fields). I do not provide support here at WordPress.org forums.

= My question is not listed here. Can I search somewhere else? =

Yes! Give a look at the [Frequently Asked Questions](https://github.com/felipeelia/cf7-repeatable-fields/wiki/Frequently-Asked-Questions) section of our wiki.

== Changelog ==

= 2.0.1 - 2023-09-11 =

__Added:__

* End-to-end tests foundation.

__Changed:__

* Removed unnecessary files from final package.

__Fixed:__

* Required checkbox not showing validation messages.

= 2.0.0 - 2023-07-23 =

**Note that this version changes minimum required versions of:**

* [WordPress](https://wordpress.org): 6.0+
* [PHP](https://php.net/): 7.2+
* [Contact Form 7](https://wordpress.org/plugins/contact-form-7/): 5.7+

This release marks the (slow) resumption of this plugin development. If you want to know more about it check out [this blog post](https://felipeelia.dev/contact-form-7-repeatable-fields-2-0-0/). If you find this plugin useful, consider leaving it [a review](https://wordpress.org/support/plugin/cf7-repeatable-fields/reviews/#new-post).

__Added:__

* Support to [wp-env](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-env/).
* `group_id` as a parameter to all filters.
* Very basic unit testing.

__Changed:__

* Linting tools and script build process.
* Docs were migrated to [GitHub wiki](https://github.com/felipeelia/cf7-repeatable-fields/wiki).

__Fixed:__

* Validation problem with Contact Form 5.7+. Props [@sfdeveloper](https://profiles.wordpress.org/sfdeveloper/).

= 1.1.3 - 2019-12-11 =

* Update WP `Tested up to` field
* Apply WP Coding Standards
* Fix a small sanitization problem

= 1.1.2 - 2019-10-10 =

* Fix Exclusive Checkboxes

= 1.1.1 - 2019-09-04 =

* Add compatibility to formatted dates (`[_format_{field name} "{date format}"]`)
* DEV: Copy data and events while cloning a new group (JS)
* DEV: Pass `$new_group` as an extra param for the `wpcf7-field-groups/added` event.
* DEV: Apply some WPCS rules and add a CF7_REPEATABLE_FIELDS_VERSION const (may affect JS cache)

= 1.1 - 2018-06-14 =

* Replace groups in mail 2 field

= 1.0.2 - 2018/03/29 =

* Fix repeated tags in mail body

= 1.0.1 - 2018/03/20 =

* Fix the `wpcf7_field_group_remove_button_atts` filter name. Props to @asilvestre87

= 1.0.0 - 2018/03/19 =

* Initial release

== Upgrade Notice ==

= 2.0.0 =
This version changes the minimum requirements of the plugin: PHP 7.2+, WordPress 6.0+, and Contact Form 7 5.7+.
