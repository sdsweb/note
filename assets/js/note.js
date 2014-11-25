/**
 * Note (Previewer) Core
 */

( function ( wp, $ ) {
	'use strict';

	// Bail if the customizer isn't initialized
	if ( ! wp || ! wp.customize ) {
		return;
	}

	var api = wp.customize, OldPreview;

	// Note Preview
	api.NotePreview = {
		preview: null, // Instance of the Previewer
		editors: [],
		tinymce: window.tinymce,
		note: window.note,
		$note_widgets: false,
		$document: false,
		// Initialization
		init: function () {
			var self = this;

			// Set TinyMCE Reference
			this.tinymce = window.tinymce;

			// Set the Note Widget jQuery reference
			this.$note_widgets = $( '.note-widget' );

			// Set the document jQuery reference
			this.$document = $( document );

			// When the previewer is active
			this.preview.bind( 'active', function() {
				// Append HTML attributes to Note widgets
				self.$note_widgets.each( function() {
					var $el = $( this );

					// Widget Number
					$el.attr( 'data-widget-number', $el.find( '.widget-number' ).val() );
					// Widget ID
					$el.attr( 'data-widget-id', $el.find( '.widget-id' ).val() );
					// Sidebar Name
					$el.attr( 'data-sidebar-name', $el.find( '.sidebar-name' ).val() );
					// Sidebar ID
					$el.attr( 'data-sidebar-id', $el.find( '.sidebar-id' ).val() );

					// Attempt to keep our theme panel/toolbar visible when the mouse leaves editors but is pressed
					$el.parent().on( 'mouseup', function( event ) {
						if ( event.currentTarget === event.srcElement ) {
							// Was the panel supposed to be visible?
							if ( self.tinymce.activeEditor.theme.panel.visible() ) {
								// Make the panel visible again
								setTimeout( function() {
									self.tinymce.activeEditor.theme.panel.visible( true );
								}, 10 );
							}
						}
					} );
				} );

				// Listen for the "note-widget-edit" event from the Customizer
				self.preview.bind( 'note-widget-edit', function( data ) {
					// $widget = $( '.note-widget[data-widget-id='+ data.widget.id + ']' )
					var editor;

					// Find the correct editor
					editor = _.find( self.editors, function( editor ) {
						return editor.note.widget_data.widget.id === data.widget.id;
					} );

					// If we have an editor
					if ( editor ) {
						// Focus the editor
						editor.focus( false );

						// Move cursor to end of existing content
						editor.selection.select( editor.getBody(), true );
						editor.selection.collapse( false );
					}
				} );

				// TODO: Finalize this functionality, need to reset the cursor position after Customizer is finished
				// Listen for the "note-widget-focus" event from the Customizer
				self.preview.bind( 'note-widget-focus', function( data ) {
					var editor;

					// Find the correct editor
					editor = _.find( self.editors, function( editor ) {
						return editor.note.widget_data.widget.id === data.widget.id;
					} );

					// If we have an editor
					if ( editor ) {
						// Set the flag
						editor.note.focus_event = true;

						// Focus the editor
						editor.focus( false );

						// Move cursor to correct position
						editor.selection.setCursorLocation( editor.note.current_element, editor.note.current_offset );
					}
				} );

				// Init TinyMCE
				self.tinymce.init( _.extend( self.note.tinymce, {
					// TinyMCE Setup
					setup: function( editor ) {
						// Add a Note object to the editor
						editor.note = {
							widget_data: {}, // Reference to widget data
							prev_content: '', // Reference to the previous content within the editor
							focus_event: false, // Flag
							current_element: false,
							current_offset: 0
						};

						// Add this editor reference to the list of editors
						self.editors.push( editor );

						// Editor initialization
						editor.on( 'init', function( event ) {
							var $el = $( editor.getElement() ),
								$note_widget = $el.parents( '.note-widget' );

							// Store widget data on editor
							editor.note.widget_data = {
								widget: {
									number: $note_widget.find( '.widget-number' ).val(),
									id: $note_widget.find( '.widget-id' ).val()
								},
								sidebar: {
									name: $note_widget.find( '.sidebar-name' ).val(),
									id: $note_widget.find( '.sidebar-id' ).val()
								}
							};
						} );

						// Editor save content - When content is saved, keep empty paragraphs
						editor.on( 'SaveContent', function( e ) {
							// If editor is hidden, we just want the textarea's value to be saved
							if ( ! editor.inline && editor.isHidden() ) {
								e.content = e.element.value;
								return;
							}

							// Keep empty paragraphs :(
							e.content = e.content.replace( /<p>(?:<br ?\/?>|\u00a0|\uFEFF| )*<\/p>/g, '<p>&nbsp;</p>' );

							if ( editor.getParam( 'wpautop', true ) && typeof window.switchEditors !== 'undefined' ) {
								e.content = window.switchEditors.pre_wpautop( e.content );
							}
						} );

						// Editor before content is set - Remove spaces from empty paragraphs.
						editor.on( 'BeforeSetContent', function( event ) {
							if ( event.content ) {
								event.content = event.content.replace( /<p>(?:&nbsp;|\u00a0|\uFEFF| )+<\/p>/gi, '<p></p>' );
							}
						} );

						// Editor focus
						editor.on( 'focus', function( event ) {
							// TODO: Finalize this functionality, need to reset the cursor position after Customizer is finished
							// Only if this isn't a focus event from the customizer
							/*if ( ! editor.note.focus_event ) {
								// Set the flags
								editor.note.current_element = editor.selection.getRng().startContainer;
								editor.note.current_offset = editor.selection.getBookmark( editor.note.current_element.textContent ).rng.startOffset;

								// Send data to the Customizer
								self.preview.send( 'note-widget-edit', editor.note.widget_data );
							}
							else {
								// Reset the flag
								editor.note.focus_event = false;
							}*/
						} );

						// A change within the editor content has occurred
						editor.on( 'keyup change NodeChange', _.debounce( function( event ) {
							var $el = $( editor.getElement() ),
								content = editor.getContent(),
								data = {};

							// Stop propagation to other callbacks on links to prevent Previewer refreshes
							$el.find( 'a' ).on( 'click.note-widget', function( event ) {
								event.stopImmediatePropagation(); // prevent this event from bubbling up and firing other callbacks and event handlers
							} );

							// Content within the editor has changed or this is an initial Previewer load
							if ( editor.note.prev_content === '' || editor.note.prev_content !== content ) {
								// Deep copy
								data = $.extend( true, editor.note.widget_data, { widget: { content: content } } );

								// Send data to the Customizer
								self.preview.send( 'note-widget-update', data );

								// Update the previous content reference
								editor.note.prev_content = content;
							}
						}, 300 ) ); // 300ms debounce delay
					}
				} ) );
			} );
		}
	};

	/**
	 * Capture the instance of the Preview since it is private
	 */
	OldPreview = api.Preview;
	api.Preview = OldPreview.extend( {
		initialize: function( params, options ) {
			api.NotePreview.preview = this;
			OldPreview.prototype.initialize.call( this, params, options );
		}
	} );

	/**
	 * Document Ready
	 */
	$( function() {
		var note = window.note;

		if ( ! note ) {
			return;
		}

		$.extend( api.NotePreview, note );

		// Initialize our custom Preview
		api.NotePreview.init();
	} );
} )( wp, jQuery );