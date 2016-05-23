/**
 * Note TinyMCE Background Plugin
 */

tinymce.PluginManager.add( 'note_background', function( editor ) {
	'use strict';

	var DOM = tinymce.DOM,
		$ = jQuery,
		api = wp.customize, // Customizer API
		NotePreview = api.NotePreview, // NotePreview
		$el = $( editor.getElement() ),
		$note_widget = $el.parents( '.note-widget' ),
		$note_wrapper = $note_widget.find( '.note-wrapper' ),
		has_background_attachment = false,
		background_attachment = {},
		background_attachment_id,
		background_attachment_size = 'full', // Default to 'full'
		note_widget_data,
		//add_background_button,
		//remove_background_button,
		frame,
		state,
		selection;


	/*
	 * TinyMCE Editor Events
	 */

	// Init event
	editor.on( 'init', function() {
		var widget_number = editor.note.widget_number,
			widget_settings = note.widgets.settings[widget_number];

		// Clone the original Note Widget data (deep copy; used throughout this plugin to "reset" the data when necessary)
		note_widget_data = $.extend( true, {}, editor.note.widget_data );

		// If we have an initial background image attachment ID
		if ( widget_settings.extras && widget_settings.extras.background_image_attachment_id ) {
			has_background_attachment = true; // Set the background image flag
			background_attachment_id = widget_settings.extras.background_image_attachment_id; // Store a reference to the initial background image attachment ID
			background_attachment = wp.media.model.Attachment.get( background_attachment_id ); // Store a reference to the initial background image
		}

		// Store global references to the add/remove background buttons
		//add_background_button = getNoteInsertToolbarButton( 'note_background' );
		//remove_background_button = getNoteInsertToolbarButton( 'note_background_remove' );

		/*
		 * Send the initial note-widget-update command to the Customizer. The current way that
		 * Note logic is implemented, expects that the data should be different on subsequent updates,
		 * however the initial data is populated with the first note-widget-update command data.
		 */
		// TODO: See function docs below for revamp notes
		noteUpdateBackgroundImage( {
			attachment_id: background_attachment_id
		} );
	} );


	/*******************
	 * Note Background *
	 *******************/

	// Note Background
	editor.addButton( 'note_background', {
		// id: 'note_background', TODO: Not currently used; TinyMCE doesn't add the tooltips on multiple editors when this is set
		tooltip: 'Edit Background Image', // TODO: i18n, l10n
		icon: 'format-image dashicons-format-image',
		onclick: function() {
			var library, library_comparator;

			// If we don't have focus
			if ( ! DOM.hasClass( editor.getBody(), 'mce-edit-focus' ) ) {
				// Focus the editor (skip focusing and just set the active editor)
				editor.focus( true );

				// Since we're skipping the DOM focusing, we need to set the global wpActiveEditor ID, which is used as a fallback when WordPress is determining the active TinyMCE editor (@see https://github.com/WordPress/WordPress/blob/4.5-branch/wp-includes/js/tinymce/plugins/wordpress/plugin.js#L89)
				window.wpActiveEditor = editor.id;
			}

			// If we don't have a frame, attach a media frame to the editor now
			if ( ! frame ) {
				// Create the media frame
				editor.note.media.frame = frame = wp.media.editor.add( editor.id, {
					id: 'note-background', // Unique ID for this frame
					state: 'note-background', // Custom Note state
					frame: 'select', // Select state for frame
					// States attached to this frame
					states: [
						// Note Background state
						new wp.media.controller.Library( {
							id: 'note-background',
							title: 'Select a Background Image', // TODO: I18n & l10n
							priority: 10,
							filterable: 'all',
							library: wp.media.query( { type: 'image' } ),
							multiple: false, // Only allow one selection
							editable: false,
							sidebar: false,
							displaySettings: false,
							displayUserSettings: false,
							syncSelection: true,
							has_background_attachment: has_background_attachment
						 } )
					],
					// Frame button configuration
					button: {
						text: 'Save', // Button label // TODO: I18n & l10n
						event: 'select', // Trigger the select event on click
						reset: false, // Don't reset the selection upon closing
						requires: {
							selection: false // This button does not require a selection to be made in order to be active
						}
					}
				} );

				// Store a reference to the library and the library comparator
				library = frame.state().get( 'library' );
				library_comparator = library.comparator;

				// Adjust the comparator to ensure that items that are not in the current query are pushed to the top of the list (i.e. the selected background image)
				// https://github.com/WordPress/WordPress/blob/8dd2a31c389795c3f3c84fa4f812e19aac183392/wp-includes/js/media-views.js#L690
				// TODO: WordPress attribution
				library.comparator = function( a, b ) {
					var aInQuery = !! this.mirroring.get( a.cid ),
						bInQuery = !! this.mirroring.get( b.cid );

					if ( ! aInQuery && bInQuery ) {
						return -1;
					}
					else if ( aInQuery && ! bInQuery ) {
						return 1;
					}
					else {
						return library_comparator.apply( this, arguments );
					}
				};

				// Observe the selection and ensure that the background image is loaded initially (even if it is not in the current query)
				// https://github.com/WordPress/WordPress/blob/8dd2a31c389795c3f3c84fa4f812e19aac183392/wp-includes/js/media-views.js#L705
				library.observe( frame.state().get('selection') ); // TODO: Not loading the image properly

				// Store references to the frame state and selection
				state = frame.state();
				selection = state.get( 'selection' );


				/*******************************
				 * Media Frame Event Listeners *
				 *******************************/

				// Frame Open (Once)
				frame.once( 'open', function() {
					// Initial open event, if we have a background image attachment ID
					if ( selection && has_background_attachment ) {
						// Reset the selection
						selection.reset( [ background_attachment ] );
					}
				} );

				// Frame Open (ensure the the background image data is always fetched if we have one set)
				frame.on( 'open', function() {
					// If we have an attachment
					if ( has_background_attachment && ! _.isEmpty( background_attachment ) ) {
						// Fetch the data
						background_attachment.fetch();

						selection.reset( background_attachment ? [ background_attachment ] : [] );
					}
				} );

				// Frame Escape (clicking on the "close" button)
				frame.on( 'escape', function() {
					// If we have an attachment selected and an initial background image attachment ID
					if ( has_background_attachment ) {
						// Reset the selection
						selection.reset( [ background_attachment ] );
					}
					else {
						// Reset the selection
						selection.reset();
					}
				} );

				// Frame Select, when a selection is made
				frame.on( 'select', function() {
					var attachment = selection.first();

					// Attachment details
					if ( attachment ) {
						has_background_attachment = true; // Set the background image flag
						background_attachment = attachment; // Store a reference to the background image attachment
						background_attachment_id = attachment.get( 'id' ); // Store a reference to the background image attachment ID

						// Add the background image to the editor
						$note_wrapper.css( 'background', 'url(' + attachment.get( 'sizes' )[background_attachment_size].url + ') ' + editor.note.background_image_css );
					}
					else {
						has_background_attachment = false; // Reset the background image flag
						background_attachment = {}; // Reset the background image attachment
						background_attachment_id = false; // Reset the background image attachment ID

						// Remove any background images from the editor
						$note_wrapper.css( 'background', '' );

						// Remove any existing <style> blocks (exist after the wrapper element) TODO: Use jQuery.next() here instead?
						$note_wrapper.parent().find( 'style.note-background-css' ).remove();
					}

					// TODO: Only send this data if the data has changed from the widget settings
					// Send the note-widget-update command to the Customizer with updated background data
					noteUpdateBackgroundImage( {
						attachment_id: background_attachment_id
					} );
				} );

				// Selection Change Sizes (Once)
				/*selection.once( 'change:sizes', function( event ) {
					var content = frame.views.get( frame.content.selector )[0], // We get an array from the frame
						sidebar = content.sidebar,
						display = sidebar.get( 'display' );

					// Re-render the sidebar attachment display view to ensure the display attachment details are populated correctly
					display.render();
				} );*/

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

	// Note Background Remove
	/*editor.addButton( 'note_background_remove', {
		id: 'note_background_remove',
		tooltip: 'Remove Background Image', // TODO: i18n, l10n
		icon: 'dashicons-format-image dashicons-no note-remove-background',
		onclick: function () {
			// Reset all of the global flags
			has_background_attachment = false; // Reset the background image flag
			background_attachment = {}; // Reset the background image attachment
			background_attachment_id = false; // Reset the background image attachment ID
			background_attachment_size = 'full'; // Reset the background image attachment size (defaults to 'full' on sanitization)

			// Remove any background images from the editor (also overrides <style> block output from widget)
			$note_wrapper.css( 'background', 'transparent' );

			// Reset the selection
			selection.reset();

			// Disable the remove background button
			setToolbarButtonDisabledState( remove_background_button, true );

			// Send the note-widget-update command to the Customizer with updated background data
			noteUpdateBackgroundImage( {
				attachment_id: background_attachment_id,
				attachment_size: background_attachment_size
			} );
		}
	} );*/


	/**********************
	 * Internal Functions *
	 **********************/

	/**
	 * This function uses Note Widgets as a transport to send background image data over to the Customizer.
	 */
	// TODO: Optimize logic in Note to allow for a more robust transport layer (i.e. to send this data in one call, not having to reset data, etc...)
	function noteUpdateBackgroundImage( background_data ) {
		// Set the local focused flag
		NotePreview.is_widget_focused = true;

		// Send the note-widget-focus event
		NotePreview.preview.send( 'note-widget-focus', editor.note.widget_data );


		/*
		 * Background Image Attachment ID
		 */
		// Adjust the editor Note Widget data
		editor.note.widget_data.widget.content = background_data.attachment_id;
		editor.note.widget_data.selectors.widget_content = '.note-background-image-id';
		editor.note.widget_data.selectors.widget_content_data = 'note-background-image-id';

		// Send data to the Customizer
		NotePreview.preview.send( 'note-widget-update', editor.note.widget_data );


		// Reset the editor Note Widget data (global note_widget_data; clone deep)
		editor.note.widget_data = $.extend( true, {},  note_widget_data );

		// Reset the local focused flag
		NotePreview.is_widget_focused = false;

		// Send the note-widget-blur event
		NotePreview.preview.send( 'note-widget-blur', editor.note.widget_data );
	}

	/**
	 * This function returns toolbar buttons from the Note insert panel.
	 */
	function getNoteInsertToolbarButton( id ) {
		var insert_panel = editor.note.insert_panel,
			items = insert_panel.items(),
			panel_items, the_item = false;

		// Note/TinyMCE return a toolbar in the first item set
		if ( items && items[0] ) {
			// Fetch the individual panel items
			panel_items = items[0].items();
		}

		// If we have panel items
		if ( panel_items ) {
			// Loop through items
			tinymce.each( panel_items, function( item ) {
				// If this setting ID matches the passed in ID or the icon class names
				if ( ( item.settings.id && item.settings.id === id ) || ( item.settings.icon && item.settings.icon.indexOf( id ) ) ) {
					the_item = item;
				}
			} );
		}

		return the_item;
	}

	/**
	 * This function sets the disabled state on buttons based on parameters
	 */
	function setToolbarButtonDisabledState( button, state ) {
		// Disable/enable the button
		button.disabled( state );

		// Adjust the tab index
		DOM.setAttrib( button.getEl(), 'tabindex', ( state ) ? '0' : '-1' );
	}
} );