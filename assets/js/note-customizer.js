/**
 * Note Customizer
 */

var note = note || {};

( function ( exports, $ ) {
	"use strict";

	// Bail if the Customizer or Note isn't initialized
	if ( ! wp || ! wp.customize || ! note ) {
		return;
	}

	var api = wp.customize, OldPreviewer,
		wp_version = parseFloat( note.wp_version ),
		wp_major_version = parseInt( note.wp_major_version, 10 );

	// Note Previewer
	api.NotePreviewer = {
		// Flag to determine if a Note widget is currently active (focused) in the Previewer
		is_widget_focused: false,
		// Flag to determine if a Note widget editor currently has a modal window active (open)
		is_widget_modal_active: false,
		// Flag to determine if the Previewer needs a refresh
		needs_refresh: false,
		// Reference to the Previewer
		previewer: false,
		// Reference to the current WordPress version (float; e.g. 4.1 or 4.0; does not contain minor version at this time)
		wp_version: 0,
		// Reference to the current major WordPress version (int, i.e. 4 or 5)
		wp_major_version: 0,
		// jQuery reference to the Customizer Sidebar header element
		$customize_sidebar_header: false,
		// jQuery reference to the Customizer Sidebar content element
		$customize_sidebar_content: false,
		// jQuery Reference to the Widgets Panel element
		$widgets_panel: false,
		// Initialization
		init: function( previewer ) {
			previewer = ( previewer === undefined ) ? this.previewer : previewer;

			// Store a reference to "this"
			var self = this;

			// Store a reference to the current major WordPress version (major version number only)
			self.wp_major_version = parseInt( note.wp_version, 10 );

			// Store a reference to the current WordPress version (major and minor version numbers only)
			self.wp_version = parseFloat( note.wp_version );

			// Store a jQuery reference the Customizer Sidebar header element
			self.$customize_sidebar_header = $( '.wp-full-overlay-header' );

			// Store a jQuery the Customizer Sidebar content element
			self.$customize_sidebar_content = $( '.wp-full-overlay-sidebar-content' );

			// Store a jQuery reference to the Widgets Panel
			self.$widgets_panel = $( '#accordion-panel-widgets' );

			// Listen for click events on the Customizer Sidebar header/content elements and reset the focus/active flags to help ensure the Previewer will refresh on setting changes made by the user
			self.$customize_sidebar_header.add( self.$customize_sidebar_content ).click( function() {
				// If the focus flag is set
				if ( self.is_widget_focused ) {
					// Reset the focus flag
					self.is_widget_focused = false;
				}

				// If the active flag is set
				if ( self.is_widget_modal_active ) {
					// Reset the active flag
					self.is_widget_modal_active = false;
				}
			} );

			// Listen for the "note-widget-update" event from the Previewer
			previewer.bind( 'note-widget-update', function( data ) {
				// Allow jQuery selectors to be overwritten if passed
				var selectors = ( data.hasOwnProperty( 'selectors' ) ) ? data.selectors : {};

				_.defaults( selectors, {
					widget_root: '.widget:first', // Widget Root
					widget_content_container: '.widget-content:first', // Widget Content Container
					widget_content: '.note-content', // Widget Content
					widget_content_data: 'note' // Widget Content Data Slug
				} );

				var form_control = api.Widgets.getWidgetFormControlForWidget( data.widget.id ),
					$widget_root = form_control.container.find( selectors.widget_root ),
					$widget_content_container = $widget_root.find( selectors.widget_content_container ),
					$widget_content = $widget_content_container.find( selectors.widget_content ),
					widget_content_data = $widget_content.data( selectors.widget_content_data ), // We need to store data instead of checking the textarea value due to the way that $.text() and $.val() function in jQuery
					saved;


				// Store the data on this widget
				$widget_root.data( selectors.widget_content_data, data );

				// Store the data on the widget content element if needed (usually on initial load)
				if ( widget_content_data === undefined ) {
					widget_content_data = {
						content: data.widget.content, // TODO: $widget_content.val()?
						updateCount: 0
					};
				}

				// Compare the content to make sure it's actually changed
				// TODO: Might need to account for "processing" API state here?
				if ( widget_content_data.updateCount > 0 && data.widget.content !== widget_content_data.content ) {
					// Set the content value
					$widget_content.val( data.widget.content );

					// Update the API saved state (content has been updated, API data is not saved)
					api.state( 'saved' ).set( false );
					api.state.trigger( 'change', api.state.create( 'saved' ) ); // trigger the saved flag

					// Unbind the preview refresh before saving
					form_control.setting.unbind( form_control.setting.preview );

					// Set the isWidgetUpdating flag to true to prevent Previewer refreshes
					form_control.isWidgetUpdating = true;

					// Update the widget data in the Customizer
					form_control.updateWidget( {
						// Complete callback function
						complete: function( message, args ) {
							// If this request wasn't aborted (there might be multiple values updated, requiring multiple AJAX requests that may be canceled as new values are updated and new AJAX requests are created)
							if ( ! message || message !== 'abort' ) {
								// Re-bind the preview refresh after saving
								this.setting.bind( form_control.setting.preview );

								// Remove the loading CSS class
								this.container.removeClass( 'previewer-loading' );

								// Reset the isWidgetUpdating flag
								form_control.isWidgetUpdating = false;
							}
						}
					} );
				}

				// Increase widget update count
				widget_content_data.updateCount++;

				// Update widget content
				widget_content_data.content = data.widget.content;

				// Store this data on the widget content element
				$widget_content.data( selectors.widget_content_data, widget_content_data );
			} );

			// Listen for the "note-widget-focus" event from the Previewer
			previewer.bind( 'note-widget-focus', function( data ) {
				// Set the focus flag
				self.is_widget_focused = data;
			} );

			// Listen for the "note-widget-blur" event from the Previewer
			previewer.bind( 'note-widget-blur', function( data ) {
				// If a modal window is not currently active (open)
				if ( ! self.is_widget_modal_active ) {
					// Reset the focus flag
					self.is_widget_focused = false;
				}
			} );

			// Listen for the "note-widget-modal-active" event from the Previewer
			previewer.bind( 'note-widget-modal-active', function( data ) {
				// Set the active flag
				self.is_widget_modal_active = data;
			} );

			// Listen for the "note-widget-modal-inactive" event from the Previewer
			previewer.bind( 'note-widget-modal-inactive', function( data ) {
				// Reset the active flag
				self.is_widget_modal_active = false;
			} );

			// Listen for the "note-widget-edit" event from the Previewer
			previewer.bind( 'note-widget-edit', function( data ) {
				// Edit Note Widget
				self.editNoteWidget( data );
			} );

			// When the "Edit Content" button is clicked
			$( document ).on( 'click', '.note-edit-content', function( event ) {
				var $el = $( this ),
					$widget_root = $el.parents( '.widget:first' ),
					data = $widget_root.data( 'note' );

				// TODO: Widget data is empty on first iteration (new Note widget)

				// If data is empty, populate it
				if ( data === undefined ) {
					// We only need partial widget data here, we'll get the sidebar data once the widget is updated
					data = {
						widget: {
							number: $widget_root.find( '.widget_number' ).val(),
							id: $widget_root.find( '.widget-id' ).val()
						},
						// This data will be populated upon the 'note-widget-update' event from the Previewer
						sidebar: {
							name: '',
							id: ''
						}
					};

					// Store partial data on widget
					$widget_root.data( 'note', data );
				}

				// Prevent Default
				event.preventDefault();

				// Send the "note-widget-edit" event to the Previewer
				previewer.send( 'note-widget-edit', data );
			} );


			/*
			 * Note Sidebars
			 */

			// Convert registered sidebars to an object if it's empty since wp_localize_script() doesn't allow use of JSON_FORCE_OBJECTS at the time of development
			note.sidebars.registered = ( Array.isArray( note.sidebars.registered ) && note.sidebars.registered.length === 0 ) ? {} : note.sidebars.registered;

			// Listen for the "note-sidebar-args" event from the Previewer
			previewer.bind( 'note-sidebar-args', function( data ) {
				var note_widget_reorder_tmpl = wp.template( 'note-widget-reorder' );

				// Loop through all Note Sidebars
				_.each( note.sidebars.args, function( value, key ) {
					// Determine if the data from the Previewer is different
					if ( ! _.isEqual( value, data[key] ) ) {
						// Update Note Sidebar arguments (overwrite value with new data)
						_.extend( value, data[key] );

						// Add the template data
						value.customizer.widget_reorder_template = note_widget_reorder_tmpl( {
							id: value.id,
							description: value.description,
							name: value.name
						} );
					}
				} );
			} );

			// Listen for the "note-register-sidebar" event from the Previewer
			previewer.bind( 'note-register-sidebar', function( data ) {
				var note_sidebars_section = api.section( note.sidebars.customizer.section ),
					$note_sidebars_input,
					note_sidebar,
					post_id = data.post_id; // was previously parseInt( data.post_id, 10 );

				// Add the post ID property to the registered settings
				if ( ! note.sidebars.registered.hasOwnProperty( post_id ) ) {
					note.sidebars.registered[post_id] = [];
				}

				// Note Sidebars
				if ( note_sidebars_section ) {
					$note_sidebars_input = note_sidebars_section.container.find( 'input.note-sidebars' );

					// Note Sidebars input (if we don't have this, we can't save the data)
					if ( $note_sidebars_input.length ) {
						// Grab the Note Sidebar settings for this post
						note_sidebar = note.sidebars.registered[post_id];

						// If this sidebar isn't already registered
						if ( note_sidebar.indexOf( data.note_sidebar_id ) === -1 ) {
							// Add the sidebar
							note_sidebar.push( data.note_sidebar_id );

							// "Register" the new sidebar for use in the Customizer
							self.registerNoteSidebar( data.note_sidebar_id, data.post_id );

							// Add the sidebar to the data string (compare the data string to current data)
							if ( $note_sidebars_input.val() !== JSON.stringify( note.sidebars.registered ) ) {
								// Add data string to Note Sidebars setting (hidden input elements do not automatically trigger the "change" method)
								$note_sidebars_input.val( JSON.stringify( note.sidebars.registered ) ).trigger( 'change' );
							}
						}
					}
				}
			} );

			// Listen for the "note-edit-sidebar" event from the Previewer
			previewer.bind( 'note-edit-sidebar', function( data ) {
				// Edit Note Sidebar
				self.editNoteSidebar( {
					sidebar: {
						id: data.sidebar_id
					}
				} );
			} );

			// Listen for the "note-add-widget" event from the Previewer
			previewer.bind( 'note-add-widget', function( data ) {
				// Add Widget to Sidebar (open "Add Widgets" Panel)
				self.addWidgetToSidebar( data.sidebar_id );
			} );

			// Listen for the "note-add-note-widget" event from the Previewer
			previewer.bind( 'note-add-note-widget', function( data ) {
				// Add Widget to Sidebar (open "Add Widgets" Panel)
				self.addWidgetToSidebar( data.sidebar_id, data.widget_id );
			} );

			// Listen for the "note-unregister-sidebar" event from the Previewer
			previewer.bind( 'note-unregister-sidebar', function( data ) {
				var note_sidebars_section = api.section( note.sidebars.customizer.section ),
					$note_sidebars_input,
					note_sidebar,
					note_sidebar_index,
					note_sidebar_args,
					widgets_panel = api.panel( 'widgets' ),
					sidebar_section, // Grab the sidebar from the collection of sections
					post_id = data.post_id; // was previously parseInt( data.post_id, 10 );

				// Add the post ID property to the registered settings
				if ( ! note.sidebars.registered.hasOwnProperty( post_id ) ) {
					note.sidebars.registered[post_id] = [];
				}

				// Note Sidebars
				if ( note_sidebars_section ) {
					$note_sidebars_input = note_sidebars_section.container.find( 'input.note-sidebars' );

					// Note Sidebars input (if we don't have this, we can't save the data)
					if ( $note_sidebars_input.length ) {
						// Grab the Note Sidebar settings for this post
						note_sidebar = note.sidebars.registered[post_id];

						// Grab the Note Sidebar index
						note_sidebar_index = note.sidebars.registered[post_id].indexOf( data.note_sidebar_id );

						// If this sidebar is registered
						if ( note_sidebar_index !== -1 ) {
							// Grab the sidebar arguments
							note_sidebar_args = note.sidebars.args[data.note_sidebar_id];

							// Grab the sidebar from the collection of sections
							sidebar_section = api.section( note_sidebar_args.customizer.section.id );

							// If the sidebar section is currently open
							if ( sidebar_section && sidebar_section.expanded() && sidebar_section.active() ) {
								// Collapse the section
								sidebar_section.collapse( { duration: 0 } );

								// Deactivate the section
								sidebar_section.deactivate();

								// Activate the Widget Panel
								widgets_panel.activate();

								// Expand the Widget Panel
								widgets_panel.expand( { duration: 0 } );
							}

							// "Unregister" the new sidebar for use in the Customizer
							self.unregisterNoteSidebar( data.note_sidebar_id, data.post_id );

							// Remove the sidebar from the list of registered Note Sidebars
							note_sidebar.splice( note_sidebar_index, 1 );

							// Remove the sidebar from the data string (compare the data string to current data)
							if ( $note_sidebars_input.val() !== JSON.stringify( note.sidebars.registered ) ) {
								// Add data string to Note Sidebars setting (hidden input elements do not automatically trigger the "change" method)
								$note_sidebars_input.val( JSON.stringify( note.sidebars.registered ) ).trigger( 'change' );
							}
						}
					}
				}
			} );
		},
		// Open (edit) a Note widget in the Customizer Sidebar
		editNoteWidget: function( data ) {
			// Open the Customizer Sidebar first
			this.openCustomizerSidebar();

			// Open the Customizer Sidebar (and then the Note Widget)
			this.openSidebarSection( data.sidebar.id, data.widget.id );
		},
		// Open (edit) a Note Sidebar in the Customizer Sidebar
		editNoteSidebar: function( data ) {
			// Open the Customizer Sidebar first
			this.openCustomizerSidebar();

			// Open the Customizer Sidebar
			this.openSidebarSection( data.sidebar.id );
		},
		// Open the Customizer Sidebar
		openCustomizerSidebar: function() {
			// If the "overlay" (Customizer Sidebar) is collapsed, open it
			if ( $( '.wp-full-overlay' ).hasClass( 'collapsed' ) ) {
				// Trigger a click event on the collapse sidebar element
				$( '.collapse-sidebar' ).trigger( 'click' );
			}
		},
		// Open the Customizer Widgets Panel and Sidebar Section
		openSidebarSection: function( sidebar_id, widget_id ) {
			var self = this,
				sidebar_section,
				$sidebar_panel,
				widgets_panel;

			// WordPress 4.1 and above
			if ( self.wp_version > 4 ) {
				widgets_panel = api.panel( 'widgets' );
				sidebar_section = api.section( 'sidebar-widgets-' + sidebar_id ); // Grab the sidebar from the collection of sections

				// If the sidebar section is not currently open
				if ( sidebar_section && ( ! sidebar_section.expanded() || ! widgets_panel.expanded() ) ) {
					// If the Widget Panel isn't expanded
					if ( ! widgets_panel.expanded() ) {
						// Collapse the sidebar section first (this prevents issues where the Widget Panel isn't active but the sidebar section is still expanded)
						sidebar_section.collapse( { duration: 0 } );

						// Expand the Widget Panel
						widgets_panel.expand( { duration: 0 } );
					}

					// Expanding the sidebar section will also open the Widgets Panel
					sidebar_section.expand( {
						duration: 0, // Open immediately (no animation)
						// On completion
						completeCallback: function() {
							// If a widget ID was passed
							if ( widget_id ) {
								// Open the control
								self.openNoteWidgetControl( sidebar_id, widget_id );
							}
						}
					} );
				}
				// Otherwise attempt to open the Note Widget control
				else {
					// If a widget ID was passed
					if ( widget_id ) {
						// Open the control
						self.openNoteWidgetControl( sidebar_id, widget_id );
					}
				}
			}
			// WordPress 4.0
			else if ( self.wp_major_version === 4 ) {
				$sidebar_panel = self.$widgets_panel.find( '.accordion-section[id$="' + sidebar_id + '"]' ); // Grab the sidebar element

				// If we have a sidebar section
				if ( $sidebar_panel.length ) {
					// Open the Widgets panel
					self.openCustomizerWidgetsPanel( self.$widgets_panel );

					// If a widget ID was passed
					if ( widget_id ) {
						// Find the correct widget (first list item is the description of the widget area)
						var $widget = $sidebar_panel.find( '.accordion-section-content #customize-control-widget_' + widget_id );

						// If we have a widget
						if ( $widget.length ) {
							// Open the Sidebar Panel (if it's not already open)
							if ( ! $sidebar_panel.hasClass( 'open' ) ) {
								$sidebar_panel.find( '.accordion-section-title' ).trigger( 'click' );
							}

							// Open the widget for editing (if it's not already open)
							if ( ! $widget.hasClass( 'expanded' ) ) {
								$widget.find( '.widget-top' ).trigger( 'click' );
							}

							// Scroll to sidebar panel in Customizer sidebar (wait for other animations to finish)
							self.scrollCustomizerSidebar( $sidebar_panel, self );
						}
					}
					// Otherwise just open the sidebar panel
					else {
						// Open the Sidebar Panel (if it's not already open)
						if ( ! $sidebar_panel.hasClass( 'open' ) ) {
							$sidebar_panel.find( '.accordion-section-title' ).trigger( 'click' );
						}
					}
				}
			}
		},
		// Open a Note Widget Control
		openNoteWidgetControl: function( sidebar_id, widget_id ) {
			var form_control = api.Widgets.getWidgetFormControlForWidget( widget_id ); //  Grab the form control for the particular widget

			// If we have a form control and it's not currently open
			if ( form_control && ! form_control.expanded() ) {
				// Expand the form control
				form_control.expand( {
					duration: 0, // Open immediately (no animation)
					// On completion
					completeCallback: function() {
						// Set a timeout to ensure the input element can be focused properly after all expansion events
						setTimeout( function() {
							// Select the first input element (title)
							form_control.container.find( 'input:first' ).focus();
						}, 100 ); // 100ms delay
					}
				} );
			}
			// Otherwise just focus the first input element (title)
			else if ( form_control ) {
				// Select the first input element (title)
				form_control.container.find( 'input:first' ).focus();
			}
		},
		// Open the Customizer widgets panel if it's not already open
		openCustomizerWidgetsPanel: function( $widgets_panel ) {
			if ( ! $widgets_panel.hasClass( 'current-panel' ) ) {
				$widgets_panel.find( '.accordion-section-title' ).trigger( 'click' );
			}
		},
		// Scroll to the sidebar panel in the Customizer sidebar (wait for other animations to finish)
		scrollCustomizerSidebar: function( $sidebar_panel, self ) {
			setTimeout( function() {
				self.$customize_sidebar_content.scrollTop( 0 );

				self.$customize_sidebar_content.animate( {
					scrollTop: $sidebar_panel.offset().top - self.$customize_sidebar_header.height()
				}, 100 );
			}, 400 ); // 400ms ensures that most (if not all) other animations have completed
		},
		// "Register" a sidebar within the Customizer
		registerNoteSidebar: function( note_sidebar_id, post_id ) {
			var sidebar_section_priority = -1,
				sidebar_section_prefix = note.sidebars.customizer.section_prefix,
				note_sidebar_args = note.sidebars.args[note_sidebar_id],
				inactive_sidebar_widgets,
				note_inactive_sidebars_widgets,
				is_setting_dirty = false,
				// Customizer data
				note_customizer_setting = note_sidebar_args.customizer.setting,
				note_customizer_section = note_sidebar_args.customizer.section,
				note_customizer_control = note_sidebar_args.customizer.control,
				// Customizer Setting
				setting = {
					id: note_customizer_setting.id,
					transport: note_customizer_setting.transport,
					value: note_customizer_setting.value,
					dirty: note_customizer_setting.dirty
				},
				// Customizer Section
				section = note_customizer_section,
				// Customizer Control
				control = note_customizer_control,
				customizer_setting_value = [],
				sectionConstructor, customizer_section, customizer_control_control,
				controlConstructor, customizer_control,
				control_priority = 0;

			// Generate the correct priority for this sidebar section
			api.section.each( function ( section ) {
				var priority = section.priority();

				// Sidebar section
				if ( section.id.indexOf( sidebar_section_prefix ) !== -1 && priority > sidebar_section_priority ) {
					sidebar_section_priority = priority;
				}
			} );

			// Increase the priority by 1 to make sure there are no conflicts
			sidebar_section_priority++;

			// Set the priority on the section object
			section.priority = sidebar_section_priority;

			// Set the instance number on the section object
			section.instanceNumber = _.size( api.settings.sections );

			// Set the instance number on the control object
			control.instanceNumber = _.size( api.settings.controls );

			// Add our sidebar to the list of registered sidebars (omitting our 'customizer' key)
			api.Widgets.registeredSidebars.add( _.omit( note_sidebar_args, 'customizer' ) );

			// Grab inactive sidebar widgets for this sidebar
			note_inactive_sidebars_widgets = note.sidebars.customizer.inactive_sidebars_widgets;
			inactive_sidebar_widgets = note_inactive_sidebars_widgets[control.sidebar_id];

			// Determine if we have any widgets that were previously inactive
			if ( inactive_sidebar_widgets ) {
				// Loop through inactive sidebar widgets
				_.each( inactive_sidebar_widgets, function( widget, index ) {
					// Add the widget to the setting value for this sidebar at the correct priority
					if ( customizer_setting_value.indexOf( widget.widget_id ) === -1 ) {
						customizer_setting_value.splice( index, 0, widget.widget_id );
					}
				} );

				// Mark this setting as dirty since new widgets have been added
				setting.dirty = true;
			}

			/*
			 * Customizer Setting
			 */

			// Add setting data to api.settings.settings
			api.settings.settings[setting.id] = {
				transport: setting.transport,
				value: setting.value
			};

			// Add Customizer setting (value will be an empty array if there are no widgets previously assigned)
			api.create( setting.id, setting.id, setting.value, {
				transport: setting.transport,
				previewer: api.previewer,
				dirty: !! setting.dirty
			} );

			// If there is a difference in setting values
			if ( _.difference( customizer_setting_value, setting.value ).length ) {
				// set() the setting (make it _dirty)
				api( setting.id ).set( customizer_setting_value );
			}
			// Otherwise, no difference, but let's check the indexes just to be sure
			else {
				// Loop through each of the setting values (we know they will both contain the same values)
				_.each( setting.value, function( value, index ) {
					// Only if the setting is not already dirty and the indexs do not match
					if ( ! is_setting_dirty && index !== customizer_setting_value.indexOf( value ) ) {
						// set() the setting (make it _dirty)
						api( setting.id ).set( customizer_setting_value );

						// Set the dirty flag
						is_setting_dirty = true;
					}
				} );
			}


			/*
			 * Customizer Section
			 */

			// Add section data to api.settings.sections
			api.settings.sections[note_customizer_section.id] = section;

			// Determine the correct constructor (should be sidebar constructor in our case; fallback to default section)
			sectionConstructor = api.sectionConstructor[section.type] || api.Section;

			// Create the section
			customizer_section = new sectionConstructor( note_customizer_section.id, {
				params: section
			} );

			// Add the section to the Backbone collection
			api.section.add( note_customizer_section.id, customizer_section );


			/*
			 * Customizer Control
			 */

			// Add control data to api.settings.controls
			api.settings.controls[note_customizer_control.id] = control;

			// Determine the correct constructor (should be sidebar constructor in our case; fallback to default control)
			controlConstructor = api.controlConstructor[control.type] || api.Control;

			// Create the control
			customizer_control = new controlConstructor( note_customizer_control.id, {
				params: control,
				previewer: api.previewer
			} );

			// Add the control
			api.control.add( note_customizer_control.id, customizer_control );

			// Loop through controls
			api.control.each( function( control ) {
				// Widget form controls only
				if ( control.params && control.params.type === 'widget_form' ) {
					// Find the re-order element and add the new sidebar element
					control.container.find( '.widget-area-select' ).append( note_sidebar_args.customizer.widget_reorder_template );
				}
			} );

			// Determine if we have any widgets that were previously inactive
			if ( inactive_sidebar_widgets ) {
				// Grab the control for this sidebar
				customizer_control_control = api.control( note_customizer_control.id );

				// Loop through inactive sidebar widgets
				_.each( inactive_sidebar_widgets, function( widget, index ) {
					// Find the control for this widget
					var widget_control = api.control( widget.setting_id );

					// Adjust the section for this widget (move it to the new sidebar)
					widget_control.section( note_customizer_section.id );

					// Adjust the priority for this widget
					widget_control.priority( index );

					// Increase the priority value used for the sidebar control
					control_priority++;

					// This widget is no longer inactive, remove it
					note.sidebars.customizer.inactive_widgets.splice( note.sidebars.customizer.inactive_widgets.map( function( widget ) { return widget.setting_id; } ).indexOf( widget.setting_id ), 1 );
				} );

				// Adjust the priority of the section to ensure the sidebar control remains at end
				customizer_control_control.priority( control_priority );

				// Refresh the sortable positions in the section
				api.section( note_customizer_section.id ).container.find( '.accordion-section-content:first' ).sortable( 'refreshPositions' );

				// This sidebar is no longer inactive, remove it
				delete note.sidebars.customizer.inactive_sidebars_widgets[control.sidebar_id];
				note.sidebars.customizer.inactive_sidebars.splice( note.sidebars.customizer.inactive_sidebars.indexOf( control.sidebar_id ), 1 );
			}
		},
		// "Unregister" a sidebar within the Customizer
		unregisterNoteSidebar: function( note_sidebar_id, post_id ) {
			var note_sidebar_args = note.sidebars.args[note_sidebar_id],
				inactive_sidebar_widgets,
				note_inactive_sidebars_widgets,
				// Customizer data
				note_customizer_setting = note_sidebar_args.customizer.setting,
				note_customizer_section = note_sidebar_args.customizer.section,
				note_customizer_control = note_sidebar_args.customizer.control,
				// Registered sidebar model
				registered_sidebar = api.Widgets.registeredSidebars.findWhere( {
					id: note_sidebar_args.id
				} ),
				customizer_section,
				customizer_control,
				customizer_control_section;


			// Grab inactive sidebar widgets for this sidebar
			note_inactive_sidebars_widgets = note.sidebars.customizer.inactive_sidebars_widgets;

			// Remove our sidebar to the list of registered sidebars
			if ( registered_sidebar ) {
				api.Widgets.registeredSidebars.remove( registered_sidebar );
			}


			/*
			 * Customizer Control
			 */

			// Grab the control
			customizer_control = api.control( note_customizer_control.id );

			// Grab the control section
			customizer_control_section = customizer_control.section();

			// Loop through controls
			api.control.each( function( control ) {
				// Widget form controls that are in this control section only
				if ( control.params && control.params.type === 'widget_form' && control.section() === customizer_control_section ) {
					// Create inactive sidebar widgets for this sidebar if it doesn't already exist
					if ( ! note_inactive_sidebars_widgets[note_customizer_control.sidebar_id] ) {
						note.sidebars.customizer.inactive_sidebars.push( note_customizer_control.sidebar_id );
						note_inactive_sidebars_widgets[note_customizer_control.sidebar_id] = [];
						inactive_sidebar_widgets = note_inactive_sidebars_widgets[note_customizer_control.sidebar_id];
					}

					// Add the data for this inactive widget
					inactive_sidebar_widgets[control.priority()] = {
						widget_id: control.params.widget_id,
						setting_id: control.setting.id
					};
					note.sidebars.customizer.inactive_widgets.push( inactive_sidebar_widgets[control.priority()] );

					// Collapse the the widget first
					control.collapse();

					// Adjust the section for this widget (move it to a temporary/hidden section)
					control.section( 'sidebar-widgets-note-temporary-inactive-sidebar' );
				}

				// Widget form controls only
				if ( control.params && control.params.type === 'widget_form' ) {
					// Find the re-order elements and remove the sidebar element (this prevents errors upon api.Widgets.WidgetControl::updateAvailableSidebars())
					control.container.find( '.widget-area-select li[data-id="' + note_sidebar_args.id + '"]' ).remove();
				}
			} );

			// Remove Customizer control
			api.control.remove( note_customizer_control.id );

			// Remove control data from api.settings.controls
			delete api.settings.controls[note_customizer_control.id];


			/*
			 * Customizer Section
			 */

			// Remove the Customizer section HTML element
			customizer_section = api.section( note_customizer_section.id );

			if ( customizer_section ) {
				customizer_section.container.remove();
			}

			// Remove Customizer section
			api.section.remove( note_customizer_section.id );

			// Remove section data from api.settings.sections
			delete api.settings.sections[note_customizer_section.id];


			/*
			 * Customizer Setting
			 */

			// Remove Customizer setting
			api.remove( note_customizer_setting.id );

			// Remove setting data from api.settings.settings
			delete api.settings.settings[note_customizer_setting.id];
		},
		// Add a widget to a sidebar
		addWidgetToSidebar: function( sidebar_id, widget_id ) {
			var self = this,
				sidebar_section;

			// Open the Customizer Sidebar first
			this.openCustomizerSidebar();

			// In WordPress 4.1 and above the process has been simplified for us
			if ( self.wp_version > 4 ) {
				sidebar_section = api.section( 'sidebar-widgets-' + sidebar_id ); // Grab the sidebar from the collection of sections

				// If we have a Sidebar Section
				if ( sidebar_section ) {
					// Open the Customizer Sidebar
					self.openSidebarSection( sidebar_id );

					// Trigger a click on the "Add a Widget" button
					sidebar_section.container.find( '.add-new-widget' ).trigger( 'click' );

					// Add a Note Widget (api.Widgets.availableWidgetsPanel is a Backbone View)
					api.Widgets.availableWidgetsPanel.$( '.widget-tpl[data-widget-id^="' + widget_id + '"]' ).trigger( 'click' );
				}
			}
			// WordPress 4.0
			else if ( self.wp_major_version === 4 ) {
				var $sidebar_panel = self.$widgets_panel.find( '.accordion-section[id$="' + sidebar_id + '"]' ); // Grab the sidebar element

				// Open the Customizer Sidebar
				self.openSidebarSection( sidebar_id );

				// If we have a Sidebar Panel
				if ( $sidebar_panel.length ) {
					// Open the Sidebar Panel (if it's not already open)
					if ( ! $sidebar_panel.hasClass( 'open' ) ) {
						$sidebar_panel.find( '.accordion-section-title' ).trigger( 'click' );
					}

					// Open the "Add a Widget" panel (if it's not already open)
					if ( ! self.$body.hasClass( 'adding-widget' ) ) {
						$sidebar_panel.find( '.add-new-widget' ).trigger( 'click' );
					}

					// Add a Note Widget (api.Widgets.availableWidgetsPanel is a Backbone View)
					api.Widgets.availableWidgetsPanel.$( '.widget-tpl[data-widget-id^="' + widget_id + '"]' ).trigger( 'click' );
				}
			}
		}
	};



	/**
	 * Capture the instance of the Previewer
	 */
	OldPreviewer = api.Previewer;
	api.Previewer = OldPreviewer.extend( {
		// Init
		initialize: function( params, options ) {
			// Below WordPress 4.0
			if ( wp_major_version < 4 ) {
				// Store reference to the Previewer
				api.NotePreviewer.previewer = this;

				// Initialize our Previewer
				api.NotePreviewer.init();
			}

			// Initialize the old previewer
			OldPreviewer.prototype.initialize.call( this, params, options );
		},
		// Refresh
		refresh: function() {
			// Refresh if a Note widget is not currently active (focused) in the Previewer
			if ( ! api.NotePreviewer.is_widget_focused && ! api.NotePreviewer.is_widget_modal_active ) {
				// Refresh the old previewer
				OldPreviewer.prototype.refresh.call( this );

				// Reset the refresh flag
				api.NotePreviewer.needs_refresh = false;
			}
			// Set a flag that a refresh is needed once all Note widgets are not active
			else {
				api.NotePreviewer.needs_refresh = true;
			}

			if ( this.hasOwnProperty( 'loading' ) ) {
				// When the Previewer is done loading
				this.loading.done( function( data ) {
					// Reset the focus flag
					api.NotePreviewer.is_widget_focused = false;

					// Reset the active flag
					api.NotePreviewer.is_widget_modal_active = false;
				} );
			}
		}
	} );

	// When the API is "ready"
	api.bind( 'ready', function() {
		// 4.0 and above
		if ( wp_major_version >= 4 ) {
			/*
			 * WordPress 4.4 introduces logic to defer loading of widget controls and content. We need
			 * to ensure that Note Widget control and content have been populated to ensure that data
			 * in the Previewer can be properly sent over to the Customizer.
			 *
			 * We're calling control.embedWidgetControl() and control.embedWidgetContent() to ensure
			 * that both the control and content is populated for all Note Widgets.
			 *
			 * @see https://core.trac.wordpress.org/ticket/33901
			 */
			if ( wp_version >= 4.4 ) {
				// Loop through controls
				api.control.each( function( control ) {
					// Widget form controls only
					if ( control.params && control.params.type === 'widget_form' ) {
						// Note Widgets
						if ( control.params.widget_id_base === note.widget.id ) {
							// Embed the widget control markup
							if ( control.embedWidgetControl ) {
								control.embedWidgetControl();
							}

							// Embed the widget content markup
							if ( control.embedWidgetContent ) {
								control.embedWidgetContent();
							}
						}
					}
				} );
			}

			// Initialize our Previewer
			api.NotePreviewer.init( api.previewer );
		}
	} );

	// Document Ready
	$( function() {
		var $document = $( document ),
			is_widget_focused = false,
			is_widget_modal_active = false;

		// Widget jQuery Sortable start
		$document.on( 'sortstart', '#widgets-right .accordion-section-content', function( event, ui ) {
			// Store a reference to the is_widget_focused flag
			is_widget_focused = api.NotePreviewer.is_widget_focused;

			// Store a reference to the is_widget_modal_active flag
			is_widget_modal_active = api.NotePreviewer.is_widget_modal_active;

			// Reset the is_widget_focused flag
			api.NotePreviewer.is_widget_focused = false;

			// Reset the is_widget_modal_active flag
			api.NotePreviewer.is_widget_modal_active = false;
		} );


		// Widget jQuery Sortable stop
		$document.on( 'sortstop', '#widgets-right .accordion-section-content', function( event, ui ) {
			// Set the is_widget_focused flag
			api.NotePreviewer.is_widget_focused = is_widget_focused;

			// Set the is_widget_modal_active flag
			api.NotePreviewer.is_widget_modal_active = is_widget_modal_active;

			// Reset the is_widget_focused flag
			is_widget_focused = false;

			// Reset the is_widget_modal_active flag
			is_widget_modal_active = false;
		} );
	} );
} )( wp, jQuery );