/**
 * Note TinyMCE Insert Plugin - /assets/js/note-tinymce-insert.js
 * License: GPLv2 or later
 * Copyright: Janneke Van Dorpe (iseulde), http://iseulde.com/
 *
 * @see https://github.com/iseulde/wp-front-end-editor/blob/master/js/tinymce.insert.js
 *
 * We've used Janneke Van Dorpe's TinyMCE Insert Plugin as a base and modified it to suit our needs.
 */

/* global tinymce */

tinymce.PluginManager.add( 'note_insert', function( editor ) {
	'use strict';

	var panel,
		$panel_el,
		DOM = tinymce.DOM,
		$ = jQuery,
		$el = $( editor.getElement() ),
		panel_client_height = 0, // Panel height
		panel_offset_width = 0, // Panel offset width
		$note_widget = $el.parents( '.note-widget' ),
		panel_visible = false, // Flag to determine if the
		panel_hover = false, // Flag to determine if the
		panel_timer,
		panel_timeout = 400, // ms
		frame; // TODO: move to image plugin

	/*
	 * Editor Pre-Initialization - Before the editor is initialized, Add our panel and
	 * logic to interact with the panel.
	 */
	editor.on( 'PreInit', function( event ) {
		// Create the Panel (also store a reference to the panel on the editor)
		panel = editor.note.insert_panel = tinymce.ui.Factory.create( {
			type: 'panel',
			layout: 'flow',
			classes: 'insert-panel note-insert-panel',
			ariaRoot: true,
			ariaRemember: true,
			items: editor.toolbarItems( editor.settings.blocks )
		} );

		/*
		 * This function sets the panel's position in the DOM.
		 */
		// TODO: Need to determine when the bounds of the browser window interfere with the position and adjust as necessary
		panel.setPosition = function() {
			var insert_el = this.getEl(), // Insert element
				body = editor.getBody(), // Editor body
				body_pos = editor.dom.getPos( body ), // Editor body position
				left = ( body_pos.x + ( body.clientWidth / 2 ) - ( panel_offset_width / 2 ) ),
				top = ( body_pos.y - panel_client_height - parseInt( DOM.getStyle( insert_el, 'margin-bottom', true ), 10 ) );

			// Adjust the styles of the panel (tied to the insert element)
			DOM.setStyles( insert_el, {
				'left': left, // Editor width minus toolbar width
				'top': top // Editor body y position minus client height reference
			} );

			// Return this for chaining
			return this;
		};

		// Render the panel to the document body
		panel.renderTo( document.body );

		// Store the client height of the panel (before it's hidden)
		panel_client_height = panel.getEl().clientHeight;

		// Store the client height of the panel (before it's hidden)
		panel_offset_width = panel.getEl().offsetWidth;

		// Hide the panel
		panel.hide();

		// Reference to the panel element
		$panel_el = $( panel.getEl() );


		/*
		 * Event Listeners
		 */

		// Window Resize
		DOM.bind( window, 'resize', function() {
			// Hide the panel
			panel.hide();
		} );

		// Set the widget selector (based on note data on the editor)
		if ( editor.hasOwnProperty( 'note' ) && editor.note.hasOwnProperty( 'parent' ) ) {
			$note_widget = $el.parents( editor.note.parent );
		}

		// Note Widgets only
		if ( $note_widget.length ) {
			// Mouse Enter (hover)
			$note_widget.on( 'mouseenter.note', function() {
				// Set the position and show the panel
				panel.setPosition().show();

				// Set the visible flag
				panel_visible = true;

				// Clear the timeout
				clearTimeout( panel_timer );
			} );

			// Mouse Leave (leave; exit)
			$note_widget.on( 'mouseleave.note', function() {
				// Set a timer if the panel is visible
				if ( panel_visible ) {
					panel_timer = setTimeout( function() {
						// Hide the panel
						panel.hide();
					}, panel_timeout );
				}
			} );
		}

		// Panel - Mouse Enter (hover)
		$panel_el.on( 'mouseenter.note', function() {
			// Set the position and show the panel
			panel.setPosition().show();

			// Set the hover flag
			panel_hover = true;

			// Clear the timeout
			clearTimeout( panel_timer );
		} );

		// Panel - Mouse Leave (leave; exit)
		$panel_el.on( 'mouseleave.note', function() {
			// Set a timer if the panel is visible and hovered
			if ( panel_visible && panel_hover ) {
				panel_timer = setTimeout( function() {
					// Hide the panel
					panel.hide();
				}, panel_timeout );
			}
		} );
	} );

	// TODO: Move to image plugin
	editor.addButton( 'wp_image', {
		tooltip: 'Image', // TODO: i18n, l10n
		icon: 'dashicons-format-image',
		onclick: function( event ) {
			// Attach the frame to the editor
			editor.note.media.frame = frame = wp.media.editor.open( editor.id, {
				id: 'note-insert', // Unique ID for this frame
				state: 'note-insert', // Custom Note state
				frame: 'post', // Select state for frame
				// States attached to this frame
				states: [
					// Note Insert State
					new wp.media.controller.Library( {
						id: 'note-insert',
						title: wp.media.view.l10n.insertMediaTitle,
						priority: 20,
						filterable: 'all',
						library: wp.media.query( { type: 'image' } ),
						multiple: false, // Only allow one selection
						editable: false,
						display: true, // TODO: Necessary?
						displaySettings: true,
						displayUserSettings: true
					} )
				],
				// Frame button configuration
				button: {
					text: 'Insert Into Widget', // Button label // TODO: I18n & l10n - move to Note Customizer
					event: 'insert' // Trigger the insert event on click
				}
			} );

			// Fire an event on the editor (pass an empty array of data and the frame)
			editor.fire( 'wpLoadImageForm', { data : [], frame: frame } );
		}
	} );


	// Edit Widget Button
	editor.addButton( 'note_edit', {
		tooltip: 'Edit', // TODO: i18n, l10n
		icon: 'dashicons-edit',
		onclick: function( event ) {
			// Send data to the Customizer
			wp.customize.NotePreview.preview.send( 'note-widget-edit', editor.note.widget_data );
		}
	} );
} );