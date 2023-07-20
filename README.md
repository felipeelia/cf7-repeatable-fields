# Contact Form 7 - Repeatable Fields

> Adds repeatable groups of fields to Contact Form 7.

[![Support Level](https://img.shields.io/badge/support-may_take_time-yellow.svg)](#support-level) [![Tests Status](https://github.com/felipeelia/cf7-repeatable-fields/actions/workflows/test.yml/badge.svg?branch=trunk)](https://github.com/felipeelia/cf7-repeatable-fields) [![Release Version](https://img.shields.io/github/release/felipeelia/cf7-repeatable-fields.svg)](https://github.com/felipeelia/cf7-repeatable-fields/releases/latest) ![WordPress tested up to version](https://img.shields.io/wordpress/plugin/tested/cf7-repeatable-fields?label=WordPress) [![GPLv2 License](https://img.shields.io/github/license/felipeelia/cf7-repeatable-fields.svg)](https://github.com/felipeelia/cf7-repeatable-fields/blob/trunk/LICENSE.md)

## Requirements

This plugin requires these software with the following versions:

* [WordPress](https://wordpress.org) 6.0+
* [PHP](https://php.net/) 7.2+
* [Contact Form 7](https://wordpress.org/plugins/contact-form-7/) 5.7+

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

## Check out the Wiki

* [Hooks available](https://github.com/felipeelia/cf7-repeatable-fields/wiki/Hooks) - How to customize the add and remove buttons
* [Frequently Asked Questions](https://github.com/felipeelia/cf7-repeatable-fields/wiki/Frequently-Asked-Questions)

## Contribute ##
You can contribute with code, issues and ideas at the [GitHub repository](https://github.com/felipeelia/cf7-repeatable-fields).

If you like it, [a review](https://wordpress.org/support/plugin/cf7-repeatable-fields/reviews/#new-post) is appreciated :)

## Changelog

A complete listing of all notable changes to this plugin are documented in [CHANGELOG.md](https://github.com/felipeelia/cf7-repeatable-fields/blob/trunk/CHANGELOG.md).
