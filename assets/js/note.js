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
		editors: [], // TinyMCE Editors
		editor_config: [],  // TinyMCE Editor configurations
		editor_selectors: [], // TinyMCE Editor selectors
		tinymce: window.tinymce,
		tinyMCE: window.tinyMCE,
		tinymce_config: {},
		note: window.note,
		default_note_template_config_type: 'default',
		widget_settings: ( window.note.hasOwnProperty( 'widgets' ) && window.note.widgets.hasOwnProperty( 'settings' ) ) ? window.note.widgets.settings : false,
		widget_templates: ( window.note.hasOwnProperty( 'widgets' ) && window.note.widgets.hasOwnProperty( 'templates' ) ) ? window.note.widgets.templates : false,
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
        $body: false,
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

            // Set the document jQuery reference
            this.$body = $( 'body' );

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
					} ),
						body = ( editor ) ? editor.getBody() : false,
						$body = ( body ) ? $( body ) : false,
						$note_wrapper = ( body ) ? $body.parents( '.note-wrapper' ) : false,
						$editor,
						editor_top,
						editor_bottom,
						$window,
						window_height,
						window_scroll_top,
						window_bottom;

					// Note Template Widgets (Note Widgets that have a template selected; possibly rows/columns)
					if ( editor && $note_wrapper.length && $note_wrapper.hasClass( 'note-template-wrapper' ) ) {
						// Loop through editors
						$note_wrapper.find( '.editor' ).each( function() {
							var $this = $( this ),
								id = $this.attr( 'id' ),
								the_editor;

							// Find the TinyMCE Editor associated with this element
							the_editor = self.tinyMCE.get( id );

							// If we have an editor
							if ( the_editor ) {
								// Trigger our custom focus event
								the_editor.fire( 'note-editor-focus', data );
							}
						} );
					}
					// Standard/Default Note Widgets
					else if ( editor ) {
						// Focus the editor first
						editor.focus();

						// Move cursor to end of existing content (in the last child element)
						editor.selection.select( editor.getBody().lastChild, true );
						editor.selection.collapse( false );

						// Trigger our custom focus event
						editor.fire( 'note-editor-focus', data );
					}

					// If we have an original editor (scroll the Previewer)
					if ( editor ) {
						$editor = $( editor.getBody() );
						editor_top = $editor.offset().top;
						editor_bottom = editor_top + $editor.height();
						$window = $( window );
						window_height = $window.height();

						// Get the window scroll top and bottom
						window_scroll_top = $window.scrollTop();
						window_bottom = window_scroll_top + window_height;

						// Determine if element is not visible in the Previewer window
						if ( ! ( ( editor_bottom <= window_bottom ) && ( editor_top >= window_scroll_top ) ) ) {
							// Scroll the editor to the middle of the Previewer
							$window.scrollTop( editor_top - ( window_height / 2 ) );
						}
					}
				} );

				// Listen for the "note-widget-focus" event from the Customizer
				// TODO: Not currently in use
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
						editor.focus();

						// Move cursor to correct position
						editor.selection.setCursorLocation( editor.note.current_element, editor.note.current_offset );
					}
				} );

				// Base TinyMCE Configuration
				self.tinymce_config = {
					// TinyMCE Setup
					setup: function( editor ) {
						// Add a Note object to the editor
						editor.note = {
							widget_data: {}, // Reference to widget data
							prev_content: '', // Reference to the previous content within the editor
							focus_event: false, // Flag
							current_element: false,
							current_offset: 0,
							media: {},
							widget_id: false,
							widget_number: false,
							background_image_css: self.note.widgets.background_image_css
						};

						// Determine if we have a column TinyMCE editor and adjust selectors as necessary
						if ( editor.getParam( 'note_column_editor' ) ) {
							// Set the parent CSS selector for note_insert plugin
							editor.note.parent = '.note-col-has-editor';
						}

						// Add this editor reference to the list of editors
						self.editors.push( editor );

						// Editor initialization
						editor.on( 'init', function() {
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
								},
								// Pass default selectors to allow note-widget-update to be modified externally
								selectors: {
									widget_content: '.note-content', // Widget Content
									widget_content_data: 'note' // Widget Content Data Slug
								}
							};
							editor.note.widget_id = editor.note.widget_data.widget.id;
							editor.note.widget_number = editor.note.widget_data.widget.number;

							// Determine if we have a column TinyMCE editor and adjust selectors as necessary
							if ( editor.getParam( 'note_column_editor' ) ) {
								// Adjust the widget content selector
								editor.note.widget_data.selectors.widget_content = '.note-content-' + editor.getParam( 'note_column_editor' );
							}

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
						editor.on( 'focus', function() {
							var content = editor.getContent(),
								data = $.extend( true, editor.note.widget_data, { widget: { content: content } } ); // Deep copy

							// Set the active flag
							self.is_widget_focused = true;

							// Send data to the Customizer
							self.preview.send( 'note-widget-focus', data );
						} );

						// Editor Note Widget focus
						editor.on( 'note-editor-focus', function() {
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
						editor.on( 'blur', function() {
							var content = editor.getContent(),
								data = $.extend( true, editor.note.widget_data, { widget: { content: content } } ); // Deep copy

							// Set the active flag
							self.is_widget_focused = false;

							// Send data to the Customizer
							self.preview.send( 'note-widget-blur', data );
						} );

						// A change within the editor content has occurred
						// TODO: Create a function that can send updated data to the Customizer based on parameters that sits outside of this logic so that other developers and plugins can hook into Note easier (adjust widget_content to element in Customizer logic for this functionality; optimized functionality/logic)
						editor.on( 'keyup change NodeChange SetAttrib', _.debounce( function() {
							var content = editor.getContent(),
								data = {};

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
								editor: editor
							} );
						}

						// Deactivate
						if ( self.modal_commands && self.modal_commands.hasOwnProperty( 'deactivate' ) ) {
							// Setup active modal commands
							self.setupModalCommands( 'deactivate', self.modal_commands.deactivate, {
								editor: editor
							} );
						}
					}
				};

				// Merge TinyMCE config data with default configuration data
				self.note.tinymce[self.default_note_template_config_type] = _.extend( self.note.tinymce[self.default_note_template_config_type], self.tinymce_config );


				// Loop through widgets/settings
				if ( ! _.isEmpty( self.widget_settings ) ) {
					// Loop through widget settings
					_.each( self.widget_settings, function( settings ) {
						var template = ( ! _.isEmpty( self.widget_templates ) && self.widget_templates.hasOwnProperty( settings.template ) ) ? self.widget_templates[settings.template] : false,
							template_config = ( template && template.hasOwnProperty( 'config' ) ) ? template.config : {},
							template_config_type = ( template_config && template_config.hasOwnProperty( 'type' ) ) ? template_config.type : self.default_note_template_config_type,
							// TODO: Is there a more efficient way to find the correct widget element?
							$widget = $( _.find( self.$note_widgets, function( widget ) {
								return $( widget ).find( '.widget-id' ).val() === settings.widget_id;
							} ) ),
							widget_id = ( $widget ) ? $widget.attr( 'id' ) : false,
							$editors = ( $widget.length ) ? $widget.find( '.editor-content' ) : false;

						// If we have a widget and a template
						if ( $widget.length && template ) {
							// If we have editor elements and template columns
							if ( $editors.length && template_config.hasOwnProperty( 'columns' ) ) {
								var template_columns = template_config.columns;

								// Loop through editors
								$editors.each( function() {
									var $this = $( this ),
										$parent = $this.parent(),
										note_column = $parent.data( 'note-column' ),
										note_editor_id = $parent.data( 'note-editor-id' );

									// Reset the template config data
									template_config = ( template && template.hasOwnProperty( 'config' ) ) ? template.config : {};

									// Adjust the column configuration accordingly
									if ( note_column && template_columns.hasOwnProperty( note_column ) ) {
										template_config = _.defaults( _.clone( template_columns[note_column] ), _.clone( template_config ) );
									}

									// Determine the more specific template type (if set)
									template_config_type = template_config.type || self.default_note_template_config_type;

									// Initialize TinyMCE
									self.initTinyMCE( {
										// Adjust the selector to match this particular widget and editor
										selector: '#' + widget_id + ' .editor-' + note_editor_id,
										note_column_editor: note_editor_id
									}, template_config, template_config_type );
								} );
							}
							// Otherwise just setup one editor
							else {
								// Bail if the editor content element doesn't exist
								if ( ! $( '#' + widget_id + ' .editor-content' ).length ) {
									return;
								}

								self.initTinyMCE( {
									// Adjust the selector to match this particular widget and editor
									selector: '#' + widget_id + ' .editor-content'
								}, template_config, template_config_type );
							}
						}
					} );


					/*
					 * Now we have to initialize all default Note Widgets just one time (this all add TinyMCE to each widget)
					 */

					// Add the selector to array
					self.editor_selectors.push( self.note.tinymce[self.default_note_template_config_type].selector );

					// Add this editor config to array (will be populated with self.note.tinymce[self.default_note_template_config_type] data after TinyMCE init)
					self.editor_config.push( self.note.tinymce[self.default_note_template_config_type] );

					// Init TinyMCE
					self.tinymce.init( self.note.tinymce[self.default_note_template_config_type] );
				}

				/*
				 * Determine if we have any modal commands that should set the active
				 * or inactive modal flags in the Customizer.
				 */

				// Activate
				if ( self.modal_commands && self.modal_commands.hasOwnProperty( 'activate' ) ) {
					// Setup active modal commands
					self.setupModalCommands( 'activate', self.modal_commands.activate, {
						document: self.$document,
						media: wp.media
					} );
				}

				// Deactivate
				if ( self.modal_commands && self.modal_commands.hasOwnProperty( 'deactivate' ) ) {
					// Setup active modal commands
					self.setupModalCommands( 'deactivate', self.modal_commands.deactivate, {
						document: self.$document,
						media: wp.media
					} );
				}


				/*
				 * Note Sidebars
				 */

				// Note Sidebars exist
				if ( note.hasOwnProperty( 'sidebars' ) && note.sidebars.hasOwnProperty( 'args' ) && note.sidebars.args ) {
					// Send the Note Sidebar arguments to the Customizer (specific to the page being displayed)
					self.preview.send( 'note-sidebar-args', note.sidebars.args );

					/*
					 * Note UI Buttons
					 */

					// Note Edit Sidebar Button Mouseenter
					self.$document.on( 'mouseenter.note', '.note-edit-sidebar-button', function( event ) {
						var $this = $( this );

						// Stop the timer to remove "hover" CSS class
						clearTimeout( $this.data( 'note-hover-timer' ) );

						// Add the "hover" CSS classes
						$this.parent().addClass( 'hover' );

						$this.parents( '.note-sidebar' ).addClass( 'note-edit-border' );
					} );

					// Note Edit Sidebar Button Mouseleave
					self.$document.on( 'mouseleave.note', '.note-edit-sidebar-button', function( event ) {
						var $this = $( this );

						// Remove the "hover" CSS classes after 400ms
						$this.data( 'note-hover-timer', setTimeout( function() {
							$this.parent().removeClass( 'hover' );

							$this.parents( '.note-sidebar' ).removeClass( 'note-edit-border' );
						}, self.transition_duration ) );
					} );

					// Note Edit Sidebar Button Click
					self.$document.on( 'touch click', '.note-edit-sidebar-button', function( event ) {
						var $this = $( this ),
							$sidebar = $this.parents( '.note-sidebar' ),
							sidebar_id = $sidebar.attr( 'data-note-sidebar-id' );

						// Send the 'note-edit-sidebar' data to the Customizer
						self.preview.send( 'note-edit-sidebar', {
							sidebar_id: ( $sidebar.attr( 'data-note-sidebar' ) === 'true' ) ? note.sidebars.args[sidebar_id].customizer.section.sidebarId : sidebar_id
						} );
					} );

					// Note Secondary Buttons Mouseenter
					self.$document.on( 'mouseenter.note', '.note-secondary-button-wrap', function( event ) {
						var $this = $( this ),
							$edit_button = $this.parent().find( '.note-edit-sidebar-button' );

						// Stop the timer to remove "hover" CSS class
						clearTimeout( $edit_button.data( 'note-hover-timer' ) );
					} );

					// Note Secondary Buttons Mouseleave
					self.$document.on( 'mouseleave.note', '.note-secondary-button-wrap', function( event ) {
						var $this = $( this ),
							$edit_button = $this.parent().find( '.note-edit-sidebar-button' );

						// Remove the "hover" CSS classes after 400ms
						$edit_button.data( 'note-hover-timer', setTimeout( function() {
							$edit_button.parent().removeClass( 'hover' );

							$edit_button.parents( '.note-sidebar' ).removeClass( 'note-edit-border' );
						}, self.transition_duration ) );
					} );

					// Note Add Widget Button
					self.$document.on( 'touch click', '.note-add-widget-button', function( event ) {
						var $this = $( this ),
							$sidebar = $this.parents( '.note-sidebar' ),
							sidebar_id = $sidebar.attr( 'data-note-sidebar-id' );

						// Send the 'note-add-widget' data to the Customizer
						self.preview.send( 'note-add-widget', {
							sidebar_id: ( $sidebar.attr( 'data-note-sidebar' ) === 'true' ) ? note.sidebars.args[sidebar_id].customizer.section.sidebarId : sidebar_id
						} );
					} );

					// Note Add Note Widget Button
					self.$document.on( 'touch click', '.note-add-note-widget-button', function( event ) {
						var $this = $( this ),
							$sidebar = $this.parents( '.note-sidebar' ),
							sidebar_id = $sidebar.attr( 'data-note-sidebar-id' );

						// Send the 'note-add-note-widget' data to the Customizer
						self.preview.send( 'note-add-note-widget', {
							sidebar_id: ( $sidebar.attr( 'data-note-sidebar' ) === 'true' ) ? note.sidebars.args[sidebar_id].customizer.section.sidebarId : sidebar_id,
							widget_id: note.widget.id
						} );
					} );

					// Note Remove Note Sidebar Button
					self.$document.on( 'touch click', '.note-remove-note-sidebar-button', function( event ) {
						var $this = $( this ),
							$sidebar = $this.parents( '.note-sidebar' ),
							post_id = $sidebar.attr( 'data-post-id' ),
							sidebar_id = $sidebar.attr( 'data-note-sidebar-id' );

						// Render the modal
						api.NotePreview.views.modals.unregister_sidebar.modal.render( {
							command: 'note-unregister-sidebar',
							data: {
								post_id: post_id,
								note_sidebar_id: sidebar_id
							}
						} );
					} );
				}
			} );
		},
		/**
		 * Initialize a TinyMCE instance.
		 */
		initTinyMCE: function( editor_config_defaults, template_config, config_type ) {
			// Editor configuration
			var self = this,
				editor_config = _.defaults( editor_config_defaults, self.tinymce_config ),
				editor_tinymce_config;

			// Add the selector to array
			self.editor_selectors.push( editor_config.selector );

			// Add this editor config to array (will be populated with self.note.tinymce[self.default_note_template_config_type] data after TinyMCE init)
			self.editor_config.push( editor_config );

			// Setup TinyMCE config based on type
			if ( self.note.tinymce.hasOwnProperty( config_type ) && !_.isEmpty( self.note.tinymce[config_type] ) ) {
				editor_tinymce_config = self.note.tinymce[config_type];

				// TODO: Allow plugins?, blocks, and toolbar items to be spliced in at certain areas in the data

				// If there are any plugins that should added to this editor from the template config data
				if ( template_config.hasOwnProperty( 'plugins' ) && editor_tinymce_config.hasOwnProperty( 'plugins' ) ) {
					// Loop through plugins
					_.each( template_config.plugins, function( plugin ) {
						// Split the plugins into an array
						if ( ! editor_tinymce_config.hasOwnProperty( 'plugins_arr' ) ) {
							editor_tinymce_config.plugins_arr = editor_tinymce_config.plugins.split( ' ' );
						}

						// If we have plugins in the plugins array and this plugin doesn't already exist
						if ( editor_tinymce_config.plugins_arr.length && editor_tinymce_config.plugins_arr.indexOf( plugin ) === -1 ) {
							// Add this plugin to the array of existing plugins
							editor_tinymce_config.plugins_arr.push( plugin );

							// Append this plugin to the list of existing plugins
							editor_tinymce_config.plugins += ' ' + plugin;
						}
					} );
				}

				// If there are any blocks that should added to this editor from the template config data
				if ( template_config.hasOwnProperty( 'blocks' ) && editor_tinymce_config.hasOwnProperty( 'blocks' ) ) {
					// Loop through plugins
					_.each( template_config.blocks, function( block ) {
						// If this block doesn't already exist
						if ( editor_tinymce_config.blocks.indexOf( block ) === -1 ) {
							// Add this block to the list of existing blocks
							editor_tinymce_config.blocks.push( block );
						}
					} );
				}

				// If there are any toolbar items that should added to this editor from the template config data
				if ( template_config.hasOwnProperty( 'toolbar' ) && editor_tinymce_config.hasOwnProperty( 'toolbar' ) ) {
					// Loop through plugins
					_.each( template_config.toolbar, function( item ) {
						// If this toolbar item doesn't already exist
						if ( editor_tinymce_config.toolbars.indexOf( item ) === -1 ) {
							// Add this toolbar item to the list of existing toolbars
							editor_tinymce_config.toolbars.push( item );
						}
					} );
				}
			}
			// Otherwise fallback to the default setup
			else {
				editor_tinymce_config = self.note.tinymce[self.default_note_template_config_type];
			}

			// Init TinyMCE (using _.defaults() instead of _.extend() to make sure we're not altering default Note data)
			self.tinymce.init( _.defaults( editor_config, editor_tinymce_config ) );
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
							target = targets.media && targets.media.events;
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
					content = editor && editor.getContent() || '', // Get the editor content
					data = $.extend( true, editor && editor.note && editor.note.widget_data || {}, { widget: { content: content } } ), // Deep copy
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
							sub_target = wp.media.events;
						break;

						// wp.media Frame
						case 'wp.media.frame':
							// Reference to wp.media.frame
							sub_target = wp.media.frame;
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
		},
		// Note WP/Backbone Views
		Views: {
			// Modal
			Modal: wp.Backbone.View.extend( {
				el: '#note-modal',
				overlay_el: '#note-modal-overlay',
				content_el: '#note-modal-content',
				// Initialize
				initialize: function() {
					// Bind "this" to all functions
					_.bindAll(
						this,
						'render',
						'open',
						'close'
					);
				},
				// Render
				render: function( data ) {
					// Setup submit data across subviews first
					if ( this.hasData( data, 'command' ) && this.hasData( data, 'data' ) ) {
						this.setupSubmitData( data.command, data.data );
					}

					// Verify that we've passed localStorage checks before rendering
					if ( this.hasData( data, 'localStorage' ) && this.checklocalStorageData( data.localStorage.key, data.localStorage.value ) ) {
						// "Close" the modal if localStorage data is set
						this.close( {}, true );

						return this;
					}

					// Call (apply) the default wp.Backbone.View render function
					wp.Backbone.View.prototype.render.apply( this, arguments );

					// "Open" the modal
					this.open();

					// Setup localStorage data across subviews
					if ( this.hasData( data, 'localStorage' ) ) {
						this.setuplocalStorageData( data.localStorage.key, data.localStorage.value );
					}

					return this;
				},
				// This function runs on the opening of the modal overlay
				open: function() {
					var subviews = this.views.all();

					// Show the modal element
					this.$el.show();

					// Loop through subviews
					_.each( subviews, function ( view ) {
						// If the sub-vew has an open function
						if ( view.hasOwnProperty( 'open' ) && _.isFunction( view.open ) ) {
							// Open the sub-view
							view.open();
						}
					} );

					// Trigger an event on the document
					api.NotePreview.$document.trigger( 'note-modal-open', this );

					// Allow chaining
					return this;
				},
				// This function runs on the closing of the modal overlay
				close: function( event, submit ) {
					var subviews = this.views.all();

					// Trigger an event on the document
					api.NotePreview.$document.trigger( 'note-modal-close', this );

					// Hide the modal element
					this.$el.hide();

					// Reset the rendered flag
					this.views.rendered = false;

					// Loop through subviews
					_.each( subviews, function ( view ) {
						// If the sub-vew has a close function
						if ( view.hasOwnProperty( 'close' ) && _.isFunction( view.close ) ) {
							// Close the sub-view
							view.close( event, submit );

							// Reset the rendered flag
							view.views.rendered = false;
						}
					} );

					// Allow chaining
					return this;
				},
				// This function passes render data to subviews
				setupSubmitData: function( command, data ) {
					var subviews = this.views.all();

					// Loop through subviews
					_.each( subviews, function ( view ) {
						// Add submit command
						view.options.submit_command = command;

						// Add submit data
						view.options.submit_data = data;
					} );
				},
				// This function passes localStorage data to subviews
				setuplocalStorageData: function( key, value ) {
					var subviews = this.views.all();

					// Loop through subviews
					_.each( subviews, function ( view ) {
						// Create the localStorage option
						view.options.localStorage = view.options.localStorage || {};

						// Add submit command
						view.options.localStorage.key = key;

						// Add submit data
						view.options.localStorage.value = value;
					} );
				},
				// This function checks to see if data exists
				hasData: function( data, key ) {
					return data.hasOwnProperty( key );
				},
				// This function checks localStorage data to verify
				checklocalStorageData: function( key, value ) {
					var localStorageData = ( localStorage['note'] !== undefined ) ? JSON.parse( localStorage['note'] ) : {};

					// Determine if we have a key and the value matches
					return localStorageData['modals'] && localStorageData['modals'][key] && localStorageData['modals'][key] === value;
				}
			} ),
			// Modal Content
			ModalContent: wp.Backbone.View.extend( {
				template: wp.template( 'note-modal-content' ),
				// Events
				events: {
					'click.note .note-modal-close': 'closeModal',
					'click.note .note-modal-cancel': 'closeModal',
					'click.note .note-modal-submit': function( event ) {
						// Prevent default
						event.preventDefault();

						// Close the modal
						this.closeModal( event, true );
					}
				},
				// Initialize
				initialize: function() {
					// Bind "this" to all functions
					_.bindAll(
						this,
						'render',
						'open',
						'close',
						'closeModal',
						'sendSubmitData',
						'setlocalStorageData'
					);
				},
				// Render
				render: function( data ) {
					// Call (apply) the default wp.Backbone.View render function
					wp.Backbone.View.prototype.render.apply( this, arguments );
				},
				// This function runs on the opening of the modal TODO
				open: function() {
					// Show the content element (parent element)
					this.$el.parent().show();

					// TODO: Reset HTML here if necessary
					// TODO: Open logic here if necessary
				},
				// This function runs on the closing of the modal TODO
				close: function( event, submit ) {
					// Hide the content element (parent element)
					this.$el.parent().hide();

					// If the modal was "submit"ed
					if ( submit ) {
						// Set the localStorage data
						if ( this.hasData( this.options, 'localStorage' ) ) {
							this.setlocalStorageData();
						}

						// Send the submission data
						if ( this.hasData( this.options, 'submit_command' ) && this.hasData( this.options, 'submit_data' ) ) {
							this.sendSubmitData( event );
						}
					}

					// Clear the html
					this.$el.html( '' );

					// TODO: Close logic here if necessary
				},
				// This function closes the modal
				closeModal: function( event, submit ) {
					// Prevent default
					if ( event.preventDefault && _.isFunction( event.preventDefault ) )  {
						event.preventDefault();
					}

					// Since this is a sub-view, call the parent view close() method, which calls all sub-view close() methods if they exist
					this.views.parent.close( event, submit );

					// Allow chaining
					return this;
				},
				// This function sends data to the Customizer
				sendSubmitData: function( event ) {
					var self = this,
						$inputs = this.$( 'input, textarea', this.$( '.note-modal-content' ) );

					// Prevent default
					if ( event.hasOwnProperty( 'preventDefault' ) && _.isFuncton( event.preventDefault ) )  {
						event.preventDefault();
					}

					// Determine if there were any input elements, merge their data
					if ( $inputs.length ) {
						// Loop through inputs
						$inputs.each( function() {
							var $this = $( this ),
								type = $this.attr( 'type' );

							// Checkboxes and radio buttons
							if ( type === 'checkbox' || type === 'radio' ) {
								self.options.submit_data[$this.attr( 'name' )] = $this.prop( 'checked' );
							}
							// All other inputs
							else {
								self.options.submit_data[$this.attr( 'name' )] = $this.val();
							}
						} );
					}

					// Send the command data to the Customizer
					api.NotePreview.preview.send( this.options.submit_command, this.options.submit_data );

					// Allow chaining
					return this;
				},
				// This function checks to see if data exists
				hasData: function( data, key ) {
					return data.hasOwnProperty( key );
				},
				// This function sets localStorage data
				setlocalStorageData: function() {
					var self = this,
						$inputs = this.$( 'input, textarea', this.$( '.note-modal-content' ) ),
						localStorageData = ( localStorage['note'] !== undefined ) ? JSON.parse( localStorage['note'] ) : {};

					// Add the modals key
					localStorageData['modals'] = localStorageData['modals'] || {};

					// Determine if there were any input elements, merge their data
					if ( $inputs.length ) {
						// Loop through inputs
						$inputs.each( function() {
							var $this = $( this ),
								type = $this.attr( 'type' );

							// Checkboxes and radio buttons
							if ( ( type === 'checkbox' || type === 'radio' ) && $this.attr( 'name' ) === self.options.localStorage.key ) {
								localStorageData['modals'][$this.attr( 'name' )] = $this.prop( 'checked' );
							}
							// All other inputs
							else if ( $this.attr( 'name' ) === self.options.localStorage.key ) {
								localStorageData['modals'][$this.attr( 'name' )] = $this.val();
							}
						} );

						// store the localStorage data
						localStorage['note'] = JSON.stringify( localStorageData );
					}

					// Allow chaining
					return this;
				}
			} ),
			// Modal Overlay
			ModalOverlay: wp.Backbone.View.extend( {
				//template: wp.template( 'note-modal-overlay' ),
				initialize: function() {
					// Bind "this" to all functions
					_.bindAll(
						this,
						'render',
						'open',
						'close'
					);
				},
				// Render
				render: function( data ) {
					// Call (apply) the default wp.Backbone.View render function
					wp.Backbone.View.prototype.render.apply( this, arguments );

					// "Open" the overlay
					this.open();
				},
				// This function runs on the opening of the modal overlay
				open: function() {
					// Add the modal-open CSS class to the <body> element
					api.NotePreview.$body.addClass( 'modal-open' );

					// Show the overlay (parent element)
					this.$el.parent().show();

					// Allow chaining
					return this;
				},
				// This function runs on the closing of the modal overlay
				close: function() {
					// Remove the modal-open CSS class to the <body> element
					api.NotePreview.$body.removeClass( 'modal-open' );

					// Hide the overlay (parent element)
					this.$el.parent().hide();

					// Allow chaining
					return this;
				}
			} )
		},
		// Reference to all views created be NotePreviewer
		views: {
			// Modal views
			modals: {
				// Register Sidebar
				register_sidebar: {},
				// Unregister (Remove) Sidebar
				unregister_sidebar: {}
			}
		},
		// Note WP/Backbone Models TODO
		Models: {},
		// Reference to all models created be NotePreviewer
		models: {
			// Modal models
			modals: {
				// Register Sidebar
				register_sidebar: {},
				// Unregister (Remove) Sidebar
				unregister_sidebar: {}
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
			$( document.body ).on( 'click.note', '.media-modal a, .wp-link-wrap a, #note-modal a', function( event ) {
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
		var note = window.note,
			$note_sidebar_placeholder = $( '.note-sidebar-placeholder' ),
			$note_sidebar_placeholder_register = $( '.note-sidebar-placeholder-register' ),
			note_modal_models = api.NotePreview.models.modals,
			note_modal_views = api.NotePreview.views.modals;

		if ( ! note ) {
			return;
		}

		// Extend our Note Preview parameters with Note data
		$.extend( api.NotePreview, note );

		// Initialize our custom Preview
		api.NotePreview.init();


		/*
		 * Note Sidebars
		 */

		/*
		 * Note Sidebars - WP/Backbone Models & Views for registering a sidebar
		 */

		// Modal Content Model
		note_modal_models.register_sidebar.modal_content = new Backbone.Model( {
			title: note.modals.register_sidebar.title,
			content: note.modals.register_sidebar.content,
			submit_label: note.modals.register_sidebar.submit_label
		} );

		// Modal Content View
		note_modal_views.register_sidebar.modal_content = new api.NotePreview.Views.ModalContent( {
			model: note_modal_models.register_sidebar.modal_content, // Model
			title: note_modal_models.register_sidebar.modal_content.get( 'title' ), // Title
			content: note_modal_models.register_sidebar.modal_content.get( 'content' ), // Content
			submit_label: note_modal_models.register_sidebar.modal_content.get( 'submit_label' ) // Submit Button Label
		} );

		// Modal Overlay View
		note_modal_views.register_sidebar.modal_overlay = new api.NotePreview.Views.ModalOverlay();

		// Modal View
		note_modal_views.register_sidebar.modal = new api.NotePreview.Views.Modal();

		// Modal Subviews
		note_modal_views.register_sidebar.modal.views.set(
			note_modal_views.register_sidebar.modal.overlay_el,
			note_modal_views.register_sidebar.modal_overlay,
			{ silent: true } // No DOM modifications
		); // Attach modal overlay view
		note_modal_views.register_sidebar.modal.views.set(
			note_modal_views.register_sidebar.modal.content_el,
			note_modal_views.register_sidebar.modal_content,
			{ silent: true } // No DOM modifications
		); // Attach modal content view


		/*
		 * Note Sidebars - WP/Backbone Models & Views for unregistering (removing) a sidebar
		 */

		// Modal Content Model
		note_modal_models.unregister_sidebar.modal_content = new Backbone.Model( {
			title: note.modals.unregister_sidebar.title,
			content: note.modals.unregister_sidebar.content,
			submit_label: note.modals.unregister_sidebar.submit_label
		} );

		// Modal Content View
		note_modal_views.unregister_sidebar.modal_content = new api.NotePreview.Views.ModalContent( {
			model: note_modal_models.unregister_sidebar.modal_content, // Model
			title: note_modal_models.unregister_sidebar.modal_content.get( 'title' ), // Title
			content: note_modal_models.unregister_sidebar.modal_content.get( 'content' ), // Content
			submit_label: note_modal_models.unregister_sidebar.modal_content.get( 'submit_label' ) // Submit Button Label
		} );

		// Modal Overlay View
		note_modal_views.unregister_sidebar.modal_overlay = new api.NotePreview.Views.ModalOverlay();

		// Modal View
		note_modal_views.unregister_sidebar.modal = new api.NotePreview.Views.Modal();

		// Modal Subviews
		note_modal_views.unregister_sidebar.modal.views.set(
			note_modal_views.unregister_sidebar.modal.overlay_el,
			note_modal_views.unregister_sidebar.modal_overlay,
			{ silent: true } // No DOM modifications
		); // Attach modal overlay view
		note_modal_views.unregister_sidebar.modal.views.set(
			note_modal_views.unregister_sidebar.modal.content_el,
			note_modal_views.unregister_sidebar.modal_content,
			{ silent: true } // No DOM modifications
		); // Attach modal content view


		/*
		 * Note Sidebars - Placeholders
		 */

		// Mouseover
		$note_sidebar_placeholder.on( 'mouseover', function( event ) {
			var $this = $( this );

			// Stop the timer to remove "hover" CSS class
			clearTimeout( $this.data( 'note-hover-timer' ) );

			// Stop the timer to remove "pulse" CSS class
			clearTimeout( $this.data( 'note-pulse-timer' ) );

			// Add the "hover pulse" CSS classes
			$this.addClass( 'hover pulse' );
		} );

		// Mousemove
		$note_sidebar_placeholder.on( 'mousemove', function( event ) {
			var $this = $( this ),
				$edit = $this.find( '.note-sidebar-register' ),
				el_left = Math.ceil( event.pageX - $this.offset().left );


			// Stop the timer to remove "hover" CSS class
			clearTimeout( $this.data( 'note-hover-timer' ) );

			// Stop the timer to remove "pulse" CSS class
			clearTimeout( $this.data( 'note-pulse-timer' ) );

			// Stop the timer to remove "mousemove" CSS class
			clearTimeout( $this.data( 'note-mousemove-timer' ) );

			// Add the "hover pulse" CSS classes
			$this.addClass( 'mousemove' );

			// New left position is outside of placeholder boundary (right; width)
			if ( el_left > $this.width() ) {
				el_left = $this.width();
			}
			// New left position is outside of placeholder boundary (left; zero)
			else if ( el_left < 0 ) {
				el_left = 0;
			}

			// Adjust the left position of the edit button
			$edit.css( 'left', el_left );

			// Remove the "mousemove" CSS class after 400ms
			$this.data( 'note-mousemove-timer', setTimeout( function() {
				$this.removeClass( 'mousemove' );
			}, api.NotePreview.transition_duration ) );
		} );

		// Mouseout
		$note_sidebar_placeholder.on( 'mouseout', function( event ) {
			var $this = $( this ),
				$edit = $this.find( '.note-sidebar-register' );

			// Remove the "pulse" and "mousemove" CSS classes
			$this.removeClass( 'mousemove' );

			// Remove the "pulse" CSS class after 200ms
			$this.data( 'note-pulse-timer', setTimeout( function() {
				$this.removeClass( 'pulse' );
			}, ( api.NotePreview.transition_duration - 200 ) ) );

			// Remove the "hover" CSS class after 400ms
			$this.data( 'note-hover-timer', setTimeout( function() {
				$this.removeClass( 'hover' );
			}, api.NotePreview.transition_duration ) );

			// Reset the left position of the edit button
			//$edit.css( 'left', 'auto' );
		} );

		// Click
		$note_sidebar_placeholder_register.on( 'click', function( event ) {
			var $this = $( this );

			// Render the modal
			api.NotePreview.views.modals.register_sidebar.modal.render( {
				command: 'note-register-sidebar',
				data: {
					post_id: $this.attr( 'data-post-id' ),
					note_sidebar_id: $this.attr( 'data-note-sidebar-id' )
				},
				// localStorage data
				localStorage: {
					key: 'ignore-register-sidebar',
					value: true
				}
			} );
		} );
	} );
} )( wp, jQuery );