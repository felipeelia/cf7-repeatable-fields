# Contact Form 7 - Repeatable Fields

> Adds repeatable groups of fields to Contact Form 7.

[![Support Level](https://img.shields.io/badge/support-may_take_time-yellow.svg)](#support-level) [![Tests Status](https://github.com/felipeelia/cf7-repeatable-fields/actions/workflows/test.yml/badge.svg?branch=trunk)](https://github.com/felipeelia/cf7-repeatable-fields) [![Release Version](https://img.shields.io/github/release/felipeelia/cf7-repeatable-fields.svg)](https://github.com/felipeelia/cf7-repeatable-fields/releases/latest) ![WordPress tested up to version](https://img.shields.io/wordpress/plugin/tested/cf7-repeatable-fields?label=WordPress) [![GPLv2 License](https://img.shields.io/github/license/felipeelia/cf7-repeatable-fields.svg)](https://github.com/felipeelia/cf7-repeatable-fields/blob/trunk/LICENSE.md)

## Requirements

This plugin requires these software with the following versions:

* [WordPress](https://wordpress.org) 7.1+
* [PHP](https://php.net/) 8.3+
* [Contact Form 7](https://wordpress.org/plugins/contact-form-7/) 6.2.5+

## Usage ##

### Form tab ###
Wrap the desired fields with `[field_group your_group_id_here][/field_group]`. The shortcode accepts additional parameters, in WP shortcode format and in CF7 fields parameters format as well.

Example:
```html
[field_group emails id="emails-groups" tabindex:1]
	<label>Your Email (required)[email* your-email]</label>
	[radio your-radio use_label_element default:1 "radio 1" "radio 2" "radio 3"]
	[select* your-menu include_blank "option1" "option 2"]
	[checkbox* your-checkbox "check 1" "check 2"]
[/field_group]
```

### Mail tab ###
In the mail settings, wrap the fields with your group id. You can use the `[group_index]` tag to print the group index and an additional `__<NUMBER>` to print a field at a specific index.

Example:
```html
The second email entered by the user was: [your-email__2]

These were the groups:
[emails]
GROUP #[group_index]
	Checkbox: [your-checkbox]
	E-mail: [your-email]
	Radio: [your-radio]
	Select: [your-menu]
[/emails]
```

## Group controls and field IDs

Starting with 3.0.0, the default buttons read “Add group” and “Remove group”. Adding a row focuses its first available control; removing a row returns focus to a neighboring row’s add button. The buttons inherit the theme’s appearance, with a minimum 44px target size and spacing between rows. Existing button filters still allow custom text and markup.

IDs inside repeated rows receive a unique `--cf7rf-<number>` suffix, including IDs in the first row. Labels, ARIA references, datalist references, table headers, and fragment links within that row are updated to match. IDs stay stable when other rows are removed. Use classes or field names for CSS and JavaScript hooks, and keep references to repeated IDs inside the same row. This only updates IDs present in the rendered markup; CF7 may omit a field’s explicit ID when the same form is rendered more than once on a page. Wrapping the field in its label works in that case.

## JavaScript events

Starting with 3.0.0, group events are bubbling DOM `CustomEvent`s. Listen with `addEventListener()`:

```js
document.addEventListener('wpcf7-field-groups/added', (event) => {
    const group = event.detail.group;
    // Initialize any custom widgets inside this new row.
});
```

| Event | Target | Timing and payload |
| --- | --- | --- |
| `wpcf7-field-groups/added` | Add button | After the new row is appended, before renumbering. `event.detail.group` is the new DOM element. |
| `wpcf7-field-groups/removed` | Remove button | Before the row leaves the DOM. `event.detail.group` is the row being removed. |
| `wpcf7-field-groups/change` | Groups container | Updates field names, IDs and their references, validation wrappers, and row counts. Listen on `document` to observe the updated state. |

To request renumbering after changing rows yourself:

```js
const groups = document.querySelector('.wpcf7-field-groups');
groups.dispatchEvent(new CustomEvent('wpcf7-field-groups/change', {
    bubbles: true,
}));
```

Migrate integrations using jQuery `.on()` and `.trigger()` to the native event APIs. The old second `$new_group` argument on the added event is now `event.detail.group`, a DOM element rather than a jQuery object. Native cloning does not copy attached event listeners; use event delegation or initialize widgets through the added event.

## Check out the Wiki

* [Hooks available](https://github.com/felipeelia/cf7-repeatable-fields/wiki/Hooks) - How to customize the _add_ and _remove_ buttons
* [Frequently Asked Questions](https://github.com/felipeelia/cf7-repeatable-fields/wiki/Frequently-Asked-Questions)

## Contribute ##
You can contribute with code, issues and ideas at the [GitHub repository](https://github.com/felipeelia/cf7-repeatable-fields).

If you like the plugin, [a review](https://wordpress.org/support/plugin/cf7-repeatable-fields/reviews/#new-post) is appreciated :)

## Changelog

A complete listing of all notable changes to this plugin are documented in [CHANGELOG.md](https://github.com/felipeelia/cf7-repeatable-fields/blob/trunk/CHANGELOG.md).
