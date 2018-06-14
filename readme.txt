=== Contact Form 7 - Repeatable Fields ===
Contributors: felipeelia
Tags: contact form 7, cf7
Requires at least: 4.6
Tested up to: 4.9.4
Requires PHP: 5.3
Stable tag: 1.1
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Adds repeatable groups of fields to Contact Form 7.

== Description ==
This plugin adds repeatable groups of fields to Contact Form 7.

**NOTE:** Tested with Contact Form 7 5.0.

== Usage ==

= Form tab =
Wrap the desired fields with `[field_group your_group_id_here][/field_group]`. The shortcode accepts additional parameters, in WP shortcode format and in CF7 fields parameters format as well.

Example:
~~~~
[field_group emails id="emails-groups" tabindex:1]
	<label>Your Email (required)[email* your-email]</label>
	[radio your-radio use_label_element default:1 "radio 1" "radio 2" "radio 3"]
	[select* your-menu include_blank "option1" "option 2"]
	[checkbox* your-checkbox "check 1" "check 2"]
[/field_group]
~~~~

= Mail tab =
In the mail settings, wrap the fields with your group id. You can use the `[group_index]` tag to print the group index and an additional `__<NUMBER>` to print a field at a specific index.

Example:
~~~~
The second email entered by the user was: [your-email__2]

These were the groups:
[emails]
GROUP #[group_index]
	Checkbox: [your-checkbox]
	E-mail: [your-email]
	Radio: [your-radio]
	Select: [your-menu]
[/emails]
~~~~

= Contribute =
You can contribute with code, issues and ideas at the [GitHub repository](https://github.com/felipeelia/cf7-repeatable-fields).

If you like it, a review is appreciated :)

== Frequently Asked Questions ==

= Can I change the add/remove buttons? =

* Yes. You can use `wpcf7_field_group_add_button_atts`, `wpcf7_field_group_add_button`, `wpcf7_field_group_remove_button`, and `wpcf7_field_group_remove_button` filters. It'll be better documented soon.

== Changelog ==

To read the full list check our changelog.txt

= Latest =

* Replace groups in mail 2 field
