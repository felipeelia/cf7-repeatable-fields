=== Contact Form 7 - Repeatable Fields ===
Contributors: felipeelia
Donate link: https://felipeelia.dev/contact-form-7-repeatable-fields/
Tags: contact form 7, cf7, repeater, repeatable
Requires at least: 4.6
Tested up to: 5.3
Requires PHP: 5.3
Stable tag: 1.1.3
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Adds repeatable groups of fields to Contact Form 7.

== Description ==
This plugin adds repeatable groups of fields to Contact Form 7.

**NOTE:** Tested with Contact Form 7 5.1.6.

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

== Customizing the add and remove buttons ==
You can [add filters](https://developer.wordpress.org/reference/functions/add_filter/) to your theme to customize the add and remove buttons.

Example
~~~
// In your theme's functions.php
function customize_add_button_atts( $attributes ) {
  return array_merge( $attributes, array(
    'text' => 'Add Entry',
  ) );
}
add_filter( 'wpcf7_field_group_add_button_atts', 'customize_add_button_atts' );
~~~

The available filters are:

= wpcf7_field_group_add_button_atts =

Filters the add button attributes.

Parameters:
* $attributes: Array of attributes for the add button. Keys:
 * `additional_classes`: css class(es) to add to the button
 * `text`: text used for the button

Return value: array of button attributes

= wpcf7_field_group_add_button =

Filters the add button HTML.

Parameters:
* $html: Default add button HTML

Return value: button HTML

= wpcf7_field_group_remove_button_atts =

Filters the remove button attributes.

Parameters:
* $attributes: Array of attributes for the remove button. Keys:
 * `additional_classes`: css class(es) to add to the button
 * `text`: text used for the button

Return value: array of button attributes

= wpcf7_field_group_remove_button =

Filters the remove button HTML.

Parameters:
* $html: Default remove button HTML

Return value: button HTML

== Contribute ==
You can contribute with code, issues and ideas at the [GitHub repository](https://github.com/felipeelia/cf7-repeatable-fields).

If you like it, a review is appreciated :)

== Frequently Asked Questions ==

= Can I change the add/remove buttons? =

Yes. You can use `wpcf7_field_group_add_button_atts`, `wpcf7_field_group_add_button`, `wpcf7_field_group_remove_button_atts`, and `wpcf7_field_group_remove_button` filters, as shown above. Props to @berniegp.

= How can I display the group index number in the form? =

You'll have to use the `wpcf7-field-groups/change` jQuery event.

In the Form tab, add an element to hold the group index. In this example, it'll be a `<span>` with the `group-index` class:
~~~
[field_group emails id="emails-groups" tabindex:1]
	<p>Group #<span class="group-index"></span></p>
	<label>Your Email (required)[email* your-email]</label>
	[radio your-radio use_label_element default:1 "radio 1" "radio 2" "radio 3"]
	[select* your-menu include_blank "option1" "option 2"]
	[checkbox* your-checkbox "check 1" "check 2"]
[/field_group]
~~~

And then you’ll have to add this to your JavaScript code:
~~~
jQuery( function( $ ) {
	$( '.wpcf7-field-groups' ).on( 'wpcf7-field-groups/change', function() {
		var $groups = $( this ).find( '.group-index' );
		$groups.each( function() {
			$( this ).text( $groups.index( this ) + 1 );
		} );
	} ).trigger( 'wpcf7-field-groups/change' );
} );
~~~

You can add that JS through your theme OR use some plugin like [Simple Custom CSS and JS](https://wordpress.org/plugins/custom-css-js/).

== Changelog ==

To read the full list check our changelog.txt

= 1.1.3 =

* Update WP `Tested up to` field
* Apply WP Coding Standards
* Fix a small sanitation problem

= 1.1.2 =

* Fix Exclusive Checkboxes

= 1.1.1 =

* Add compatibility to formatted dates (`[_format_{field name} "{date format}"]`)
* DEV: Copy data and events while cloning a new group (JS)
* DEV: Pass `$new_group` as an extra param for the `wpcf7-field-groups/added` event.
* DEV: Apply some WPCS rules and add a CF7_REPEATABLE_FIELDS_VERSION const (may affect JS cache)

= 1.1 =

* Replace groups in mail 2 field
