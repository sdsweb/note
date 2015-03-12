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

tinymce.PluginManager.add( 'noteinsert', function( editor ) {
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
		// Create the Panel
		panel = tinymce.ui.Factory.create( {
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
	// TODO: Store a reference to frame on editor if possible/necessary
	editor.addButton( 'wp_image', {
		tooltip: 'Image',
		icon: 'dashicons-format-image',
		onclick: function( event ) {
			// If wpActiveEditor is wrong, set the active editor here
			if ( window.wpActiveEditor !== editor.id ) {
				window.wpActiveEditor = editor.id;
			}

			// If we already have a frame, open it and trigger an event
			if ( frame ) {
				// Open the existing frame (pass the editor ID to set this editor as the active editor)
				frame = wp.media.editor.open( editor.id, { state: 'note-insert' } );

				// Fire an event on the editor (pass an empty array of data and the frame)
				editor.fire( 'wpLoadImageForm', { data : [], frame: frame } );
			}
			// Otherwise, create the frame and set up the event listeners
			else {
				// Create a custom media editor frame for Note
				frame = wp.media.editor.open( editor.id, {
					id: 'note-insert', // Unique ID for this frame
					state: 'note-insert', // Custom Note state
					frame: 'select', // Select state for frame
					// States attached to this frame
					states: [
						// Note Insert State
						new wp.media.controller.Library( {
							id: 'note-insert',
							title: wp.media.view.l10n.insertMediaTitle,
							priority: 20,
							filterable: 'all',
							library: wp.media.query( { type: 'image' } ),
							editable: false,
							display: true,
							displaySettings: true,
							displayUserSettings: true
						} )
					],
					// Frame button configuration
					button: {
						text: 'Insert Into Widget', // Button label // TODO: l10n - move to Note Customizer
						state: 'insert', // State of the media modal is insert on click
						event: 'insert' // Trigger the insert event on click
					}
				} );

				/*
				 * Event listeners
				 */

				// TODO: Necessary?
				jQuery( frame.el )
					.find( 'select.attachment-filters' )
					.val( 'image' )
					.trigger( 'change' );

				// Fire an event on the editor (pass an empty array of data and the frame)
				editor.fire( 'wpLoadImageForm', { data : [], frame: frame } );
			}
		}
	} );


	// Edit Widget Button
	editor.addButton( 'note_edit', {
		tooltip: 'Edit',
		icon: 'dashicons-edit',
		onclick: function( event ) {
			// Send data to the Customizer
			wp.customize.NotePreview.preview.send( 'note-widget-edit', editor.note.widget_data );

			// TODO: event.preventDefault()?
		}
	} );
} );