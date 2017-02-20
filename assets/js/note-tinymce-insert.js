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

	var DOM = tinymce.DOM,
		Factory = tinymce.ui.Factory,
		panel,
		$panel_el,
		$ = jQuery,
		$el = $( editor.getElement() ),
		panel_client_height = 0, // Panel height
		panel_offset_width = 0, // Panel offset width
		$note_widget = $el.parents( '.note-widget' ),
		panel_visible = false, // Flag to determine if the
		panel_hover = false, // Flag to determine if the
		panel_timer,
		panel_timeout = 400, // ms
		frame,
		toolbar;


	/*
	 * TinyMCE Editor Events
	 */

	/*
	 * Preinit event
	 */
	editor.on( 'preinit', function() {
		/*
		 * Panel
		 */
		// Create the Panel (also store a reference to the panel on the editor)
		panel = editor.note.insert_panel = Factory.create( {
			type: 'panel',
			layout: 'flow',
			classes: 'insert-panel note-insert-panel',
			ariaRoot: true,
			ariaRemember: true,
			items: []
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

		// Reference to the panel element
		$panel_el = $( panel.getEl() );

		/*
		 * Create the toolbar.
		 *
		 * Because the WordPress TinyMCE plugin renders the toolbar to the DOM for us,
		 * we need to add it after the panel is rendered so that we can append it to our
		 * panel 'body' element.
		 */

		// Create the toolbar
		toolbar = editor.wp._createToolbar( editor.settings.blocks );

		// Add the toolbar to our panel
		panel.add( toolbar );

		// Append the toolbar to our panel in the DOM (grab the DOMQuery reference)
		toolbar.$el.appendTo( panel.getEl( 'body' ) );

		// Show the toolbar (WordPress hides it by default)
		toolbar.show();


		// Store the client height of the panel (before it's hidden)
		panel_client_height = panel.getEl().clientHeight;

		// Store the client height of the panel (before it's hidden)
		panel_offset_width = panel.getEl().offsetWidth;

		// Hide the panel
		panel.hide();


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


	/*
	 * TinyMCE Editor Buttons
	 */

	// TODO: Rename?
	// WordPress Image
	editor.addButton( 'wp_image', {
		tooltip: 'Image', // TODO: i18n, l10n
		icon: 'format-image dashicons-format-image',
		onclick: function() {
			var frame_menu;

			// If we don't have focus
			if ( ! DOM.hasClass( editor.getBody(), 'mce-edit-focus' ) ) {
				// Focus the editor (skip focusing and just set the active editor)
				editor.focus( true );

				// Since we're skipping the DOM focusing, we need to set the global wpActiveEditor ID, which is used as a fallback when WordPress is determining the active TinyMCE editor (@see https://github.com/WordPress/WordPress/blob/4.5-branch/wp-includes/js/tinymce/plugins/wordpress/plugin.js#L89)
				window.wpActiveEditor = editor.id;
			}

			// If we don't have a frame
			if ( ! frame ) {
				// Attach the frame to the editor
				editor.note.media.frame = frame = wp.media.editor.add( editor.id, {
					id: 'note-insert', // Unique ID for this frame
					state: 'note-insert', // Custom Note state
					frame: 'post', // Select state for frame
					// States attached to this frame
					states: [
						// Note Insert State
						new wp.media.controller.Library( {
							id: 'note-insert',
							title: wp.media.view.l10n.insertMediaTitle,
							priority: 10,
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

				// Hide the default states TODO: Fix gallery insertion and then unhide these
				frame_menu = frame.menu.get();
				frame_menu.hide( 'embed' ); // Embed
				frame_menu.hide( 'gallery' ); // Gallery
				frame_menu.hide( 'insert' ); // Insert (Post)
				frame_menu.hide( 'playlist' ); // Playlist
				frame_menu.hide( 'video-playlist' ); // Playlist

				// If the frame is not attached
				if ( ! frame.modal.views.attached ) {
					// Attach the frame (fixes a bug in FireFox and IE where the $el is initially visible so the rendering process is never completed @see https://github.com/WordPress/WordPress/blob/4.5-branch/wp-includes/js/media-views.js#L6764)
					frame.attach();
				}
			}

			// Open the frame for this editor (wp.media.editor.open() fixes a bug where images could be inserted into the wrong editor due to the active editor reference being incorrect; @see https://github.com/WordPress/WordPress/blob/703d5bdc8deb17781e9c6d8f0dd7e2c6b6353885/wp-includes/js/media-editor.js#L1062)
			wp.media.editor.open( editor.id );

			// Fire an event on the editor (pass an empty array of data and the frame)
			editor.fire( 'wpLoadImageForm', { data : [], frame: frame } );
		}
	} );


	// Note Edit Button
	editor.addButton( 'note_edit', {
		tooltip: 'Edit', // TODO: i18n, l10n
		icon: 'edit dashicons-edit',
		onclick: function() {
			// Send data to the Customizer
			wp.customize.NotePreview.preview.send( 'note-widget-edit', editor.note.widget_data );
		}
	} );
} );