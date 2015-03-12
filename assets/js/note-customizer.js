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
						content: data.widget.content,
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
							// Reset the isWidgetUpdating flag
							form_control.isWidgetUpdating = false;

							// Re-bind the preview refresh after saving
							this.setting.bind( form_control.setting.preview );

							// Remove the loading CSS class
							this.container.removeClass( 'previewer-loading' );
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
		},
		// Open (edit) a Note widget in the Customizer Sidebar
		editNoteWidget: function( data ) {
			// Open the Customizer Sidebar first
			this.openCustomizerSidebar();

			// Open the Note Widget
			this.openNoteWidgetSidebar( data.sidebar.id, data.widget.id );
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
		openNoteWidgetSidebar: function( sidebar_id, widget_id ) {
			var self = this,
				sidebar_section,
				$sidebar_panel;

			// WordPress 4.1 and above
			if ( self.wp_version > 4 ) {
				sidebar_section = api.section( 'sidebar-widgets-' + sidebar_id ); // Grab the sidebar from the collection of sections

				// If the sidebar section is not currently open
				if ( sidebar_section && ! sidebar_section.expanded() ) {
					// Expanding the sidebar section will also open the Widgets Panel
					sidebar_section.expand( {
						duration: 0, // Open immediately (no animation)
						// On completion
						completeCallback: function() {
							// Open the control
							self.openNoteWidgetControl( sidebar_id, widget_id );
						}
					} );
				}
				// Otherwise attempt to open the Note Widget control
				else {
					// Open the control
					self.openNoteWidgetControl( sidebar_id, widget_id );
				}
			}
			// WordPress 4.0
			else if ( self.wp_major_version === 4 ) {
				$sidebar_panel = self.$widgets_panel.find( '.accordion-section[id$="' + sidebar_id + '"]' ); // Grab the sidebar element

				// If we have a sidebar section
				if ( $sidebar_panel.length ) {
					// Open the Widgets panel
					self.openCustomizerWidgetsPanel( self.$widgets_panel );

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
			else {
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
			// Initialize our Previewer
			api.NotePreviewer.init( api.previewer );
		}
	} );

	// Document Ready
	// TODO
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