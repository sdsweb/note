/**
 * Note TinyMCE Theme - /assets/js/note-tinymce-theme.js
 * License: GPLv2 or later
 * Copyright: Janneke Van Dorpe (iseulde), http://iseulde.com/
 *
 * @see https://github.com/iseulde/wp-front-end-editor/
 * @see https://github.com/iseulde/wp-front-end-editor/blob/master/js/tinymce.theme.js
 * @see https://wordpress.org/plugins/wp-front-end-editor/
 *
 * We've used Janneke Van Dorpe's TinyMCE theme as a base and modified it to suit our needs.
 */

/* global tinymce */

tinymce.ThemeManager.add( 'note', function( editor ) {
	var self = this,
		DOM = tinymce.DOM,
		Factory = tinymce.ui.Factory,
		each = tinymce.each,
		settings = editor.settings,
		adminBarHeight = 32,
		focus = false,
		open_window = false,
		toolbars = {},
		main_toolbar_id = 'main',
		WP_Link = false;

	/**
	 * Render the UI of the theme
	 */
	self.renderUI = function() {
		var panel,
			hasPlaceholder,
			upperMargin = 0;

		// Bail if we don't have a toolbar in settings
		if ( ! settings.toolbar || ! settings.toolbar.length ) {
			return {};
		}

		// Calculate the upper margin for the entire document
		if ( DOM.getStyle( document.body, 'position', true ) === 'relative' ) {
			upperMargin =
				parseInt( DOM.getStyle( document.body, 'margin-top', true ), 10 ) +
				parseInt( DOM.getStyle( document.documentElement, 'padding-top', true ), 10 ) +
				parseInt( DOM.getStyle( document.documentElement, 'margin-top', true ), 10 );
		}

		// Allow the content within the editor to be adjusted (instead of creating an editor element)
		settings.content_editable = true;


		/*
		 * TinyMCE Editor Events
		 */

		// Activate, focus events
		editor.on( 'activate focus', function( event ) {
			// Set the focus flag
			focus = true;

			// Add the focus CSS class
			DOM.addClass( editor.getBody(), 'mce-edit-focus' );
		} );

		// Deactivate, blur, hide events
		editor.on( 'deactivate blur hide', function( event ) {
			// Reset the focus flag
			focus = false;

			// Remove the focus CSS class
			DOM.removeClass( editor.getBody(), 'mce-edit-focus' );

			// If we have a panel
			if ( panel ) {
				// Hide the panel
				panel.hide();
			}
		} );

		// Remove event
		editor.on( 'remove', function() {
			// If we have a panel
			if ( panel ) {
				// Remove the panel
				panel.remove();

				// Reset the reference to the panel
				panel = null;
			}
		} );

		// Preinit event (once)
		editor.once( 'preinit', function( event ) {
			// If the WordPress plugin has been initialized and we can create a toolbar
			if ( editor.wp && editor.wp._createToolbar ) {
				/*
				 * Panel
				 */

				// Create the panel (no items)
				panel = self.panel = Factory.create( {
					type: 'floatpanel',
					role: 'application',
					classes: 'tinymce tinymce-inline',
					layout: 'stack',
					autohide: true,
					items: []
				} );

				/**
				 * This function repositions a toolbar (name) within the editor.
				 */
				panel.reposition = function( name ) {
					var toolbarEl = this.getEl(),
						selection = editor.selection.getRng(),
						boundary = selection.getBoundingClientRect(),
						boundaryMiddle = ( boundary.left + boundary.right ) / 2,
						windowWidth = window.innerWidth,
						toolbarWidth, toolbarHalf,
						margin = parseInt( DOM.getStyle( toolbarEl, 'margin-bottom', true ), 10 ) + upperMargin,
						top, left, className;

					toolbarEl.className = ( ' ' + toolbarEl.className + ' ' ).replace( /\smce-arrow-\S+\s/g, ' ' ).slice( 1, -1 );

					// Setup the toolbar
					name = name || main_toolbar_id;

					// Fallback to the main toolbar if we don't have a reference
					if ( ! toolbars[name] ) {
						name = main_toolbar_id;
					}

					// Loop through toolbars
					each( toolbars, function( toolbar ) {
						// Hide this toolbar if the flag is set
						if ( toolbar.note_hide ) {
							toolbar.hide();
						}
					} );

					// If the editor selection is not hidden
					if ( ! editor.selection.isCollapsed() ) {
						// Show this toolbar
						toolbars[name].show();
					}
					// Otherwise just hide the panel
					else {
						panel.hide();
					}

					/*
					 * Determine the position for this toolbar/panel
					 */

					toolbarWidth = toolbarEl.offsetWidth;
					toolbarHalf = toolbarWidth / 2;

					if ( boundary.top < toolbarEl.offsetHeight + adminBarHeight ) {
						className = ' mce-arrow-up';
						top = boundary.bottom + margin;
					}
					else {
						className = ' mce-arrow-down';
						top = boundary.top - toolbarEl.offsetHeight - margin;
					}

					left = boundaryMiddle - toolbarHalf;

					if ( toolbarWidth >= windowWidth ) {
						className += ' mce-arrow-full';
						left = 0;
					}
					else if ( ( left < 0 && boundary.left + toolbarWidth > windowWidth ) || ( left + toolbarWidth > windowWidth && boundary.right - toolbarWidth < 0 ) ) {
						left = ( windowWidth - toolbarWidth ) / 2;
					}
					else if ( left < 0 ) {
						className += ' mce-arrow-left';
						left = boundary.left;
					}
					else if ( left + toolbarWidth > windowWidth ) {
						className += ' mce-arrow-right';
						left = boundary.right - toolbarWidth;
					}

					toolbarEl.className += className;

					DOM.setStyles( toolbarEl, { 'left': left, 'top': top + window.pageYOffset } );

					return this;
				};

				// Show event
				panel.on( 'show', function() {
					setTimeout( function() {
						// If the panel is visible (checking state)
						if ( panel.state.get( 'visible' ) ) {
							// Add the active CSS class
							DOM.addClass( panel.getEl(), 'mce-inline-toolbar-active' );
						}
					}, 100 );
				} );

				// Hide event
				panel.on( 'hide', function() {
					// If we don't have an editor selector
					if ( ! editor.selection || ( editor.selection && editor.selection.isCollapsed() ) ) {
						DOM.removeClass( this.getEl(), 'mce-inline-toolbar-active' );
					}

					// Loop through toolbars
					each( toolbars, function( toolbar ) {
						// Loop through the button groups for this toolbar
						each( toolbar.items(), function ( buttonGroups ) {
							// Loop through individual button group for this toolbar
							each( buttonGroups.items(), function ( buttonGroup ) {
								// Loop through items for this button group
								each( buttonGroup.items(), function ( item ) {
									// If this item has a menu
									if ( item.state.get( 'menu' ) ) {
										// Hide the menu
										item.hideMenu();
									}
								} );
							} );
						} );

						// If this toolbar should be hidden
						if ( toolbar.note_hide ) {
							// Hide the toolbar
							toolbar.hide();
						}
					} );
				} );

				// Cancel event
				panel.on( 'cancel', function() {
					// Focus the editor
					editor.focus();
				} );


				// Render the panel to the body element
				panel.renderTo( document.body ).reflow().hide();

				/*
				 * Create the main toolbar.
				 *
				 * Because the WordPress TinyMCE plugin renders the toolbar to the DOM for us,
				 * we need to add it after the panel is rendered so that we can append it to our
				 * panel 'body' element.
				 */

				// Setup the main toolbar
				setupToolbar( editor.wp._createToolbar( settings.toolbar ), 'main', panel, {
					note_hide: true
				} );
			}

			// wptoolbar event (triggered after WordPress' logic)
			editor.on( 'wptoolbar', function( args ) {
				// If we have an element and a toolbar
				if ( args.element && args.toolbar ) {
					// Switch based on type of element
					switch ( args.element.nodeName ) {
						// Images
						case 'IMG':
							// If we don't already have a reference to this toolbar
							if ( ! toolbars['img'] ) {
								// Setup the toolbar
								setupToolbar( args.toolbar, 'img', panel, {
									note_hide: true
								} );
							}
						break;

						// Links
						case 'A':
							var href = args.element.getAttribute( 'href' ),
								$link = editor.$( editor.dom.getParent( args.element, 'a' ) );

							// If we don't already have a reference to this toolbar (editing link)
							if ( ! toolbars['link_edit'] || ! toolbars['link'] ) {
								// If this link is being edited (created)
								if ( ! toolbars['link_edit'] && href === '_wp_link_placeholder' || args.element.getAttribute( 'data-wplink-edit' ) ) {
									// Setup the toolbar
									setupToolbar( args.toolbar, 'link_edit', panel, {
										tempHide: true,
										note_hide: false
									} );
								}
								// Otherwise if this link was already existing
								else if ( ! toolbars['link'] && href && href !== '_wp_link_placeholder' && ! $link.find( 'img' ).length ) {
									// Setup the toolbar
									setupToolbar( args.toolbar, 'link', panel, {
										note_hide: true
									} );
								}
							}
						break;
					}
				}
			} );
		} );

		// Selectionchange, nodechange events
		editor.on( 'selectionchange nodechange', function( event ) {
			var element = event.element || editor.selection.getNode();

			// Bail if we don't have a selection
			if ( editor.selection.isCollapsed() ) {
				// Hide the panel
				panel.hide();

				return;
			}

			setTimeout( function() {
				var content, name;

				// Bail if this editor does not have focus or there is an open window
				if ( ! focus || open_window ) {
					return;
				}

				// If the selection isn't collapsed, we have content, and this is not a <hr> element
				if ( ! editor.selection.isCollapsed() && ( content = editor.selection.getContent() ) && ( content.replace( /<[^>]+>/g, '' ).trim() || content.indexOf( '<' ) === 0 ) && element.nodeName !== 'HR' || WP_Link ) {
					// Switch based on type of element
					switch ( element.nodeName ) {
						// Images
						case 'IMG':
							name = 'img';
						break;

						// Links
						case 'A':
							var href = element.getAttribute( 'href' ),
								$link = editor.$( editor.dom.getParent( element, 'a' ) );

							// Default to link_edit
							name = 'link_edit';

							// If this link was already existing
							if ( ! WP_Link && href && href !== '_wp_link_placeholder' && ! $link.find( 'img' ).length ) {
								name = 'main';
							}
						break;

						// Default
						default:
							name = 'main';
						break;
					}

					// Show the panel and reposition the toolbar
					panel.show().reposition( name );
				}
				// Otherwise hide the panel
				else {
					panel.hide();
				}
			}, 100 );
		} );

		// Beforeexeccommand event
		editor.on( 'beforeexeccommand', function( event ) {
			// If this is a WP_Link command
			if ( event.command === 'WP_Link' ) {
				// Set the flag
				WP_Link = true;
			}

			// If this is a wp_link_cancel or wp_link_apply command
			if ( event.command === 'wp_link_cancel' || event.command === 'wp_link_apply' ) {
				// Reset the flag
				WP_Link = false;
			}
		} );

		// Openwindow event
		editor.on( 'openwindow', function( event ) {
			// Set the flag
			open_window = true;

			// Hide the panel
			panel.hide();
		} );

		// Closewindow event
		editor.on( 'closewindow', function( event ) {
			// Reset the flag
			open_window = false;

			// Show the panel
			panel.show();
		} );


		// Placeholder
		if ( settings.placeholder ) {
			// Activate, focus events
			editor.on( 'activate focus', function() {
				if ( hasPlaceholder ) {
					editor.setContent( '' );

					// Make sure the cursor appears in editor
					editor.selection.select( editor.getBody(), true );
					editor.selection.collapse( false );
				}
			} );

			// Deactivate, blur, LoadContent events
			editor.on( 'deactivate blur LoadContent', function() {
				// If editor content is empty
				if ( isEmpty() ) {
					editor.setContent( settings.placeholder );
					hasPlaceholder = true;
					DOM.addClass( editor.getBody(), 'mce-placeholder' );
				}
			} );

			// Setcontent event
			editor.on( 'setcontent', function( event ) {
				if ( hasPlaceholder && ! event.load ) {
					hasPlaceholder = false;
					DOM.removeClass( editor.getBody(), 'mce-placeholder' );
				}
			} );

			// Postprocess event
			editor.on( 'postprocess', function( event ) {
				if ( hasPlaceholder && event.content ) {
					event.content = '';
				}
			} );

			// Beforeaddundo event
			editor.on( 'beforeaddundo', function( event ) {
				if ( hasPlaceholder ) {
					event.preventDefault();
				}
			} );
		}

		// Window resize event
		DOM.bind( window, 'resize', function() {
			// Hide the panel
			panel.hide();
		} );

		return {};
	};


	/**********************
	 * Internal Functions *
	 **********************/

	/**
	 * This function determines if the editor content is empty.
	 */
	function isEmpty() {
		return editor.getContent( { format: 'raw' } ).replace( /(?:<p[^>]*>)?(?:<br[^>]*>)?(?:<\/p>)?/, '' ) === '';
	}

	/**
	 * This function sets up a toolbar for use in our panel.
	 */
	function setupToolbar( toolbar, toolbar_name, panel, args ) {
		args = args || false;

		// Store a reference to the toolbar
		toolbars[toolbar_name] = toolbar;

		// If we have arguments to add
		if ( args ) {
			// Loop through them
			for ( var arg in args ) {
				// hasOwnProperty
				if ( args.hasOwnProperty( arg ) ) {
					// Add it to the toolbar
					toolbars[toolbar_name][arg] = args[arg];
				}
			}
		}

		// Add the toolbar to our panel
		panel.add( toolbars[toolbar_name] );

		// Append the toolbar to our panel in the DOM (grab the DOMQuery reference)
		toolbars[toolbar_name].$el.appendTo( panel.getEl( 'body' ) );

		// If this toolbar should be hidden
		if ( toolbars[toolbar_name].note_hide ) {
			// Hide the toolbar
			toolbars[toolbar_name].hide();
		}
	}
} );