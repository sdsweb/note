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
		modal_commands: ( window.note.hasOwnProperty( 'modal_commands' ) ) ? window.note.modal_commands : false,
		modal_command_listeners: {
			// Activate
			activate: [],
			// Deactivate
			deactivate: []
		},
		// Flag to determine if a Note widget is currently active (focused)
		is_widget_focused: false,
		// Flag to determine if a Note widget editor currently has a modal window active (open)
		is_widget_modal_active: false,
		$note_widgets: false,
		$document: false,
		transition_duration: 400, // CSS transition is 400ms
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
					// Find the correct editor
					var editor = _.find( self.editors, function( editor ) {
						// TODO: Check hasOwnProperty()
						return editor.note.widget_data.widget.id === data.widget.id;
					} );

					// If we have an editor
					if ( editor ) {
						var $editor = $( editor.getBody() ),
							editor_top = $editor.offset().top,
							editor_bottom = editor_top + $editor.height(),
							$window = $( window ),
							window_height = $window.height(),
							window_scroll_top,
							window_bottom;

						// Focus the editor first
						editor.focus( false );

						// Move cursor to end of existing content (in the last child element)
						editor.selection.select( editor.getBody().lastChild, true );
						editor.selection.collapse( false );

						// Get the window scroll top and bottom
						window_scroll_top = $window.scrollTop();
						window_bottom = window_scroll_top + window_height;

						// Determine if element is not visible in the Previewer window
						if ( ! ( ( editor_bottom <= window_bottom ) && ( editor_top >= window_scroll_top ) ) ) {
							// Scroll the editor to the middle of the Previewer
							$window.scrollTop( editor_top - ( window_height / 2 ) );
						}

						// Trigger our custom focus event
						editor.fire( 'note-editor-focus', data );
					}
				} );

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

							// Stop propagation to other callbacks on links to prevent Previewer refreshes
							$note_widget.on( 'click.note-widget', function( event ) {
								event.stopImmediatePropagation(); // prevent this event from bubbling up and firing other callbacks and event handlers
								event.stopPropagation(); // prevent this event from bubbling up and firing other callbacks and event handlers
							} );
						} );

						// TODO: Necessary?
						// Editor before content is set - Remove spaces from empty paragraphs.
						editor.on( 'BeforeSetContent', function( event ) {
							if ( event.content ) {
								event.content = event.content.replace( /<p>(?:&nbsp;|\u00a0|\uFEFF| )+<\/p>/gi, '<p></p>' );
							}
						} );

						// Editor focus
						editor.on( 'focus', function( event ) {
							var content = editor.getContent(),
								data = $.extend( true, editor.note.widget_data, { widget: { content: content } } ); // Deep copy

							// Set the active flag
							self.is_widget_focused = true;

							// Send data to the Customizer
							self.preview.send( 'note-widget-focus', data );
						} );

						// Editor Note Widget focus
						editor.on( 'note-editor-focus', function( data ) {
							// Add transition and Note edit focus CSS classes
							self.tinymce.DOM.addClass( editor.getBody(), 'mce-edit-focus-transition mce-note-edit-focus' );

							// Remove Note edit focus CSS class after 400ms
							_.delay( function() {
								self.tinymce.DOM.removeClass( editor.getBody(), 'mce-note-edit-focus' );

								// Remove the transition CSS class after another 400ms
								_.delay( function() {
									self.tinymce.DOM.removeClass( editor.getBody(), 'mce-edit-focus-transition' );
								}, self.transition_duration );
							}, self.transition_duration ); // CSS transition is 400ms
						} );

						// Editor blur
						editor.on( 'blur', function( event ) {
							var content = editor.getContent(),
								data = $.extend( true, editor.note.widget_data, { widget: { content: content } } ); // Deep copy

							// Set the active flag
							self.is_widget_focused = false;

							// Send data to the Customizer
							self.preview.send( 'note-widget-blur', data );
						} );

						// A change within the editor content has occurred
						editor.on( 'keyup change NodeChange', _.debounce( function( event ) {
							var $el = $( editor.getElement() ),
								content = editor.getContent(),
								data = {};

							// Stop propagation to other callbacks on links to prevent Previewer refreshes
							// TODO: Necessary?
							/*$el.find( 'a' ).on( 'click.note-widget', function( event ) {
								event.stopImmediatePropagation(); // prevent this event from bubbling up and firing other callbacks and event handlers
								event.stopPropagation(); // prevent this event from bubbling up and firing other callbacks and event handlers
							} );*/

							// Content within the editor has changed or this is an initial Previewer load
							if ( ( ! editor.note.hasOwnProperty( 'prevent_widget_update' ) || ! editor.note.prevent_widget_update ) && ( editor.note.prev_content === '' || editor.note.prev_content !== content ) ) {
								// Deep copy
								data = $.extend( true, editor.note.widget_data, { widget: { content: content } } );

								// Send data to the Customizer
								self.preview.send( 'note-widget-update', data );

								// Update the previous content reference
								editor.note.prev_content = content;
							}
						}, 300 ) ); // 300ms debounce delay


						/*
						 * Determine if we have any TinyMCE modal commands that should set the active
						 * or inactive modal flags in the Customizer.
						 */

						// Activate
						if ( self.modal_commands && self.modal_commands.hasOwnProperty( 'activate' ) ) {
							// Setup active modal commands
							self.setupModalCommands( 'activate', self.modal_commands.activate, {
								editor: editor,
								document: self.$document,
								media: wp.media
							} );
						}

						// Deactivate
						if ( self.modal_commands && self.modal_commands.hasOwnProperty( 'deactivate' ) ) {
							// Setup active modal commands
							self.setupModalCommands( 'deactivate', self.modal_commands.deactivate, {
								editor: editor,
								document: self.$document,
								media: wp.media
							} );
						}
					}
				} ) );
			} );
		},
		/**
		 * Setup modal commands.
		 */
		setupModalCommands: function( type, commands, targets ) {
			var self = this;

			// Loop through commands
			for ( var command_type in commands ) {
				// hasOwnProperty
				if ( commands.hasOwnProperty( command_type ) ) {
					var target; // Reference to the object being targeted

					// Switch based on the type of command
					switch ( command_type ) {
						// TinyMCE
						case 'tinymce':
							// Reference to the editor
							target = targets.editor;
						break;

						// jQuery Document
						case 'document':
							// Reference to the document
							target = targets.document;
						break;

						// wp.media Events
						case 'wp.media.events':
							// Reference to wp.media.events
							target = targets.media.events;
						break;

						// wp.media Frame
						case 'wp.media.frame':
							// Reference to wp.media.frame
							target = wp.media.frame;
						break;
					}

					// Determine if we actually have a target and any activate commands
					if ( target && ! _.isEmpty( commands[command_type] ) ) {
						// Arrays (constructor is the fastest method to check)
						if ( commands[command_type].constructor ===  Array ) {
							// Loop through commands
							for ( var i = 0; i < commands[command_type].length; i++ ) {
								// Setup the event listener
								self.addEventListenerToObject( type, target, targets.editor, targets.media, {
									id: _.uniqueId( 'note_modal_command_' ), // Unique ID for this command
									command: commands[command_type][i],
									sub_command: false,
									command_type: command_type
								} );
							}
						}
						// Objects
						else {
							// Loop through commands
							for ( var command in commands[command_type] ) {
								// hasOwnProperty
								if ( commands[command_type].hasOwnProperty( command ) ) {
									var is_key_numerical = ! isNaN( parseInt( command, 10 ) ),
										// If we have a numerical key, the command is the property value
										the_command = ( is_key_numerical ) ? commands[command_type][command] : command,
										// If we don't have a numerical key, the sub-command is the property value (if not empty)
										sub_command = ( ! is_key_numerical && commands[command_type][command] ) ? commands[command_type][command] : false;

									// Setup the event listener
									self.addEventListenerToObject( type, target, targets.editor, targets.media, {
										id: _.uniqueId( 'note_modal_command_' ), // Unique ID for this command
										command: the_command,
										sub_command: sub_command,
										command_type: command_type
									} );
								}
							}
						}
					}
				}
			}
		},
		/**
		 * This function adds an event listener to an object. It also stores a reference to the
		 * event listener.
		 */
		addEventListenerToObject: function( type, target, editor, media, command ) {
			var self = this,
				listener;

			// Setup the listener function
			listener = function( event ) {
				var event_sub_command = false,
					content = editor.getContent(), // Get the editor content
					data = $.extend( true, editor.note.widget_data, { widget: { content: content } } ), // Deep copy
					obj_keys = [], // Reference to sub-command object keys
					listener_obj_keys = [], // Reference to listener sub-command object keys
					sub_target,
					command_listeners = self.modal_command_listeners[type],
					modal_command_listener;

				// If we have a sub-command that should be listened to (string)
				if ( command.sub_command && typeof command.sub_command === 'string' ) {
					// Switch based on command type
					switch ( command.command_type ) {
						// TinyMCE (event.command contains the sub-command)
						case 'tinymce':
							event_sub_command = event.command; // Get the sub-command
						break;
					}

					// If we have an event sub-command, check it first
					if ( event_sub_command && event_sub_command === command.sub_command ) {
						// Send the modal flag command
						self.sendModalFlagCommand( type, data );
					}
				}
				// Otherwise if we have a sub-command that should be listened to (object)
				// Nested sub-commands are considered to be only one level deep
				else if ( command.sub_command && typeof command.sub_command === 'object' ) {
					// Get the object keys
					obj_keys = Object.keys( command.sub_command );

					// First check to see if this command has already been attached and called
					if ( command_listeners.length ) {
						for ( var i = 0; i < command_listeners.length; i++ ) {
							// First check the command name and the sub-command
							if ( command_listeners[i].command.command === command.command && typeof command_listeners[i].command.sub_command === 'object'  ) {
								// Get the listener object keys
								listener_obj_keys = Object.keys( command_listeners[i].command.sub_command );

								// Bail if the sub-command matches and that it has been called
								if ( listener_obj_keys[0] == obj_keys[0] && command_listeners[i].command.sub_command[obj_keys[0]] === command.sub_command[obj_keys[0]] && command_listeners[i].callback_count > 0 ) {
									return;
								}
							}
						}
					}

					// Switch based on object keys
					switch ( obj_keys[0] ) {
						// wp.media Events
						case 'wp.media.events':
							// Reference to wp.media.events
							sub_target = media.events;
						break;

						// wp.media Frame
						case 'wp.media.frame':
							// Reference to wp.media.frame
							sub_target = media.frame;
						break;
					}

					// Special case for the editor frame
					// TODO: How might we handle other special cases?
					if ( command.command === 'editor:frame-create' && obj_keys[0] === 'event.frame' && command.sub_command[obj_keys[0]] === 'close' ) {
						// Add the event listener to the sub target
						event.frame.on( command.sub_command[obj_keys[0]], function() {
							// Send the modal flag command
							self.sendModalFlagCommand( type, data );
						} );
					}
					// Regular sub-command
					else {
						// Add the event listener to the sub target
						sub_target.on( command.sub_command[obj_keys[0]], function() {
							// Send the modal flag command
							self.sendModalFlagCommand( type, data );
						} );
					}
				}
				// Regular command
				else {
					// Send the modal flag command
					self.sendModalFlagCommand( type, data );
				}

				// Increase callback count for this listener
				if ( self.modal_command_listeners[type].length ) {
					modal_command_listener = _.find( self.modal_command_listeners[type], function( listener ) {
						return listener.command.id === command.id;
					} );

					// If we have a match, increase the count
					if ( modal_command_listener ) {
						modal_command_listener.callback_count++;
					}
				}
			};

			// Add the listener to the reference array
			self.modal_command_listeners[type].push( {
				target: target,
				command: command,
				listener: listener,
				callback_count: 0 // Number of times the listener was called
			} );

			// Add listener to target/command
			target.on( command.command, listener );
		},
		// Send active/inactive command to Customizer
		sendModalFlagCommand: function( type, data ) {
			var self = this;

			// Switch based on the type of command
			switch ( type ) {
				// Activate
				case 'activate':
					// Set the active flag
					self.is_widget_modal_active = true;

					// Send data to Customizer
					self.preview.send( 'note-widget-modal-active', data );
				break;
				// Deactivate
				case 'deactivate':
					// Reset the active flag
					self.is_widget_modal_active = false;

					// Send data to Customizer
					self.preview.send( 'note-widget-modal-inactive', true );
				break;
			}
		}
		// TODO: Function to remove event listeners
	};

	/**
	 * Capture the instance of the Preview since it is private
	 */
	OldPreview = api.Preview;
	api.Preview = OldPreview.extend( {
		initialize: function( params, options ) {
			/**
			 * Modal Windows - We're adding this event handler here in order to ensure it is triggered
			 * before the Customize Preview click event is bound as jQuery calls handlers in order
			 * of registration. The Customize Preview event is bound once the api.Preview is constructed.
			 */

			// Stop propagation to other callbacks on modal links to prevent Previewer refreshes
			$( document.body ).on( 'click.note', '.media-modal a, .wp-link-wrap a', function( event ) {
				event.stopImmediatePropagation(); // prevent this event from bubbling up and firing other callbacks and event handlers
			} );

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