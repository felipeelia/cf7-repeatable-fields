/**
 * Available events:
 * `wpcf7-field-groups/change`: triggered by .wpcf7-field-groups elements
 * `wpcf7-field-groups/added`: triggered by .wpcf7-field-group-add elements
 * `wpcf7-field-groups/removed`: triggered by .wpcf7-field-group-remove elements
 */
(function( $ ) {
	'use strict';

	$( function() {
		var $groups = $( '.wpcf7-field-groups' );
		// Only need to work if there is any group.
		if ( $groups.length ) {
			// Let's grab the groups models to append them when necessary.
			$groups.each( function() {
				$( this ).data( 'group-model', $( this ).find( '.wpcf7-field-group' ).eq( 0 ).clone() );
			} );

			$( 'body' ).on( 'wpcf7-field-groups/change', '.wpcf7-field-groups', function() {
				// For each group inside this we have to adjust name parameter.
				var $groups_inside = $( this ).find( '.wpcf7-field-group' );
				$groups_inside.each( function( index ) {
					$( this ).find( '.wpcf7-field-group-remove' ).toggle( index > 0 );
					var i = index + 1;
					$( this ).find( '[name]' ).each( function() {
						var $$                 = $( this ),
							$form_control_wrap = $$.closest( '.wpcf7-form-control-wrap' ),
							name               = $$.attr( 'name' ),
							is_array           = ( name.indexOf( '[]' ) > -1 ),
							raw_name           = name.replace( '[]', '' ),
							new_name           = raw_name.replace( /__[0-9]*/, '' ) + '__' + i;

						// The form control wrap class doesn't have `[]` chars...
						if ( $form_control_wrap.length && ! $form_control_wrap.hasClass( new_name ) ) {
							$form_control_wrap.removeClass( raw_name ).addClass( new_name );
						}
						// but the field can have.
						new_name += ( is_array ) ? '[]' : '';
						$$.attr( 'name', new_name )
					} );
				} );
				$( this ).find( '.wpcf7-field-group-count' ).val( $groups_inside.length );
			} );
			// Set thing up for the first time.
			$groups.trigger( 'wpcf7-field-groups/change' );

			// Handle the buttons action.
			$( 'body' ).on( 'click', '.wpcf7-field-group-add, .wpcf7-field-group-remove', function() {
				var $$ = $( this ),
					$groups = $$.closest( '.wpcf7-field-groups' );

				if ( $$.hasClass( 'wpcf7-field-group-add' ) ) {
					var $new_group = $groups.data( 'group-model' ).clone();
					$groups.append( $new_group );
					$$.trigger( 'wpcf7-field-groups/added' );
				} else {
					$$.trigger( 'wpcf7-field-groups/removed' );
					$$.closest( '.wpcf7-field-group' ).remove();
				}
				$groups.trigger( 'wpcf7-field-groups/change' );
				return false;
			});
		}
	});
}( jQuery ));
