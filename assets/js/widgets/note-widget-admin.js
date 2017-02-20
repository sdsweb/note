/**
 *  Note Widget
 */

var note = window.note || {};

( function ( $ ) {
	"use strict";

	/**
	 * Document Ready
	 */
	$( function() {
		var $document = $( document );
		/*
		 * Note Range Input (Columns & Rows)
		 */

		// On note input range change (jQuery "input" event)
		$document.on( 'input', '.note-range-input-range', function() {
			var $this = $( this );

			// Adjust the value
			$this.next( '.note-range-value' ).html( $this.val() );
		} );

		// On widget display layout change
		$document.on( 'change', '.note-select.note-template', function( e ) {
			var $this = $( this ),
				$selected = $this.find( ':selected' ),
				$widget_parent = $this.parents( '.widget' ), // Get widget instance
				$note_customize_columns = $widget_parent.find( '.note-customize-columns' ),
				$note_customize_columns_input = $note_customize_columns.find( 'input' ),
				columns = parseInt( $note_customize_columns_input.val(), 10 ),
				default_columns = parseInt( note.widgets.defaults.columns, 10 ),
				$note_customize_rows = $widget_parent.find( '.note-customize-rows' ),
				template_columns = default_columns,
				template;
				// $note_customize_rows_input = $note_customize_columns.find( 'input' );
				// rows = $note_customize_rows_input.val();
				// default_rows = note.widgets.defaults.rows;

			// Columns
			if ( $selected.data( 'note-customize-columns' ) ) {
				// Show the columns range slider
				$note_customize_columns.removeClass( 'note-hidden' );

				// Find the template configuration data for the currently selected template
				if ( note.widgets && note.widgets.templates && note.widgets.templates.hasOwnProperty( $this.val() ) ) {
					// Store a reference to the template
					template = note.widgets.templates[$this.val()];

					// If we have columns in this template configuration
					if ( template.config && template.config.columns ) {
						template_columns = parseInt( ( _.isObject( template.config.columns ) ) ? _.size( template.config.columns ) : template.config.columns, 10 );
					}

					// If the current columns value equals the default value and we have a template column value that does not
					if ( columns === default_columns && template_columns !== default_columns ) {
						// Set the columns range slider and trigger the 'input' event
						$note_customize_columns_input.val( template_columns ). trigger( 'input' );
					}
				}
			}
			else {
				// Hide the columns range slider
				$note_customize_columns.addClass( 'note-hidden' );
			}

			// Rows
			if ( $selected.data( 'note-customize-rows' ) ) {
				// Show the rows range slider
				$note_customize_rows.removeClass( 'note-hidden' );
			}
			else {
				// Hide the rows range slider
				$note_customize_rows.addClass( 'note-hidden' );
			}
		} );
	} );
}( jQuery ) );
