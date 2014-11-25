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
		previewer: false,
		// Initialization
		init: function( previewer ) {
			previewer = ( previewer === undefined ) ? this.previewer : previewer;

			var self = this,
				$body = $( 'body' ), // Body Element
				$customize_sidebar_header = $body.find( '.wp-full-overlay-header' ), // Customizer Sidebar Header
				$customize_sidebar_content = $body.find( '.wp-full-overlay-sidebar-content' ), // Customizer Sidebar Content
				$customize_theme_controls = $customize_sidebar_content.find( '#customize-theme-controls' ), // Theme Controls
				$widgets_panel = $customize_theme_controls.find( '#accordion-panel-widgets' ); // Widgets Panel

			// Listen for the "note-widget-update" event from the Previewer
			previewer.bind( 'note-widget-update', function( data ) {
				var form_control = api.Widgets.getWidgetFormControlForWidget( data.widget.id ),
					$widget_root = form_control.container.find( '.widget:first' ),
					$widget_content_container = $widget_root.find( '.widget-content:first' ),
					$widget_content = $widget_content_container.find( '.note-content' ),
					widget_content_data = $widget_content.data( 'note' ), // We need to store data instead of checking the textbox value due to the way that $.text() and $.val() function in jQuery
					saved;

				// Store the data on this widget
				$widget_root.data( 'note', data );

				// Store the data on the widget content element if needed (usually on initial load)
				if ( widget_content_data === undefined ) {
					widget_content_data = {
						content: data.widget.content,
						updateCount: 0
					};
				}

				// Compare the content to make sure it's actually changed
				if ( widget_content_data.updateCount > 0 && data.widget.content !== widget_content_data.content ) {
					// TODO: Might need to account for "processing" API state here?

					// Set the content value
					$widget_content.val( data.widget.content );

					// TODO: Update the widget content data again
					$widget_content.data( 'note', { content: data.widget.content } );

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

				// Store this data on the widget content element
				$widget_content.data( 'note', widget_content_data );
			} );

			// Listen for the "note-widget-edit" event from the Previewer
			previewer.bind( 'note-widget-edit', function( data ) {
				var $sidebar_panel = $widgets_panel.find( '.accordion-section[id$="' + data.sidebar.id + '"]' );

				// Open the Customizer sidebar
				self.openCustomizerSidebar( $body );

				// Open the Widgets panel
				self.openCustomizerWidgetsPanel( $widgets_panel );

				// Sidebar Panel
				if ( $sidebar_panel.length ) {
					// Find the correct widget (first list item is the description of the widget area)
					var $widget = $sidebar_panel.find( '.accordion-section-content .customize-control-widget_form[id$="' + data.widget.id + '"]' );

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
						self.scrollCustomizerSidebar( $customize_sidebar_content, $customize_sidebar_header, $sidebar_panel, self );

						// Send the "note-widget-focus" event to the Previewer
						previewer.send( 'note-widget-focus', data );
					}
				}
			} );

			// When the "Edit Content" button is clicked
			$( document ).on( 'click', '.note-edit-content', function( event ) {
				var $el = $( this ),
					$widget_root = $el.parents( '.widget:first'),
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
		// Open the Customizer sidebar if it's not already open
		openCustomizerSidebar: function( $body ) {
			if ( $body.children( '.wp-full-overlay' ).hasClass( 'collapsed' ) ) {
				$( '.collapse-sidebar' ).trigger( 'click' );
			}
		},
		// Open the Customizer widgets panel if it's not already open
		openCustomizerWidgetsPanel: function( $widgets_panel ) {
			if ( ! $widgets_panel.hasClass( 'current-panel' ) ) {
				$widgets_panel.find( '.accordion-section-title' ).trigger( 'click' );
			}
		},
		// Scroll to the sidebar panel in the Customizer sidebar (wait for other animations to finish)
		scrollCustomizerSidebar: function( $customize_sidebar_content, $customize_sidebar_header, $sidebar_panel, self ) {
			setTimeout( function() {
				$customize_sidebar_content.scrollTop( 0 );

				$customize_sidebar_content.animate( {
					scrollTop: $sidebar_panel.offset().top - $customize_sidebar_header.height()
				}, 100 );
			}, 400 ); // 400ms ensures that most (if not all) other animations have completed
		}
	};


	// Below WordPress 4.0
	if ( wp_major_version < 4 ) {
		/**
		 * Capture the instance of the Previewer since it is private
		 */
		OldPreviewer = api.Previewer;
		api.Previewer = OldPreviewer.extend( {
			initialize: function( params, options ) {
				// Store reference to the Previewer
				api.NotePreviewer.previewer = this;

				// Initialize our Previewer
				api.NotePreviewer.init();

				// Initialize the old previewer
				OldPreviewer.prototype.initialize.call( this, params, options );
			}
		} );
	}

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
	$( function() { } );
} )( wp, jQuery );