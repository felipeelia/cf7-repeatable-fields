/**
 * Available events:
 * `wpcf7-field-groups/change`: triggered by .wpcf7-field-groups elements
 * `wpcf7-field-groups/added`: triggered by .wpcf7-field-group-add elements
 * `wpcf7-field-groups/removed`: triggered by .wpcf7-field-group-remove elements
 */
( function( $ ) {
	'use strict';

	$( function() {
		const $groups = $( '.wpcf7-field-groups' );
		// Only need to work if there is any group.
		if ( $groups.length ) {
			// Let's grab the groups models to append them when necessary.
			$groups.each( function() {
				$( this ).data( 'group-model', $( this ).find( '.wpcf7-field-group' ).eq( 0 ).clone() );
			} );

			$( 'body' ).on( 'wpcf7-field-groups/change', '.wpcf7-field-groups', function() {
				// For each group inside this we have to adjust name parameter.
				const $groupsInside = $( this ).find( '.wpcf7-field-group' );
				$groupsInside.each( function( index ) {
					$( this ).find( '.wpcf7-field-group-remove' ).toggle( index > 0 );
					const i = index + 1;
					$( this ).find( '[name]' ).each( function() {
						const $$ = $( this ),
							$formControlWrap = $$.closest( '.wpcf7-form-control-wrap' ),
							name = $$.attr( 'name' ),
							isArray = ( name.indexOf( '[]' ) > -1 ),
							rawName = name.replace( '[]', '' );
						let newName = rawName.replace( /__[0-9]*/, '' ) + '__' + i;

						// The form control wrap class doesn't have `[]` chars...
						if ( $formControlWrap.length && ! $formControlWrap.hasClass( newName ) ) {
							$formControlWrap.removeClass( rawName ).addClass( newName );
						}
						// but the field can have.
						newName += ( isArray ) ? '[]' : '';
						$$.attr( 'name', newName );
					} );
				} );
				$( this ).find( '.wpcf7-field-group-count' ).val( $groupsInside.length );
			} );
			// Set thing up for the first time.
			$groups.trigger( 'wpcf7-field-groups/change' );

			// Handle the buttons action.
			$( 'body' ).on( 'click', '.wpcf7-field-group-add, .wpcf7-field-group-remove', function() {
				const $$ = $( this ),
					$allGroups = $$.closest( '.wpcf7-field-groups' );

				if ( $$.hasClass( 'wpcf7-field-group-add' ) ) {
					const $newGroup = $allGroups.data( 'group-model' ).clone( true );
					$allGroups.append( $newGroup );
					$$.trigger( 'wpcf7-field-groups/added', $newGroup );
				} else {
					$$.trigger( 'wpcf7-field-groups/removed' );
					$$.closest( '.wpcf7-field-group' ).remove();
				}
				$allGroups.trigger( 'wpcf7-field-groups/change' );
				return false;
			} );

			// Exclusive Checkbox
			$groups.on( 'click', '.wpcf7-exclusive-checkbox input:checkbox', function() {
				const name = $( this ).attr( 'name' );
				$groups.find( 'input:checkbox[name="' + name + '"]' ).not( this ).prop( 'checked', false );
			} );
		}
	} );
}( jQuery ) );
