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
		$ = window.jQuery,
		DOM = tinymce.DOM,
		Factory = tinymce.ui.Factory,
		each = tinymce.each,
		settings = editor.settings,
		admin_bar_height = 32,
		focus = false,
		open_window = false,
		note_toolbar_name = 'main',
		toolbars = {},
		wp_toolbar_names = {
			img: 'img',
			link_edit: 'link_edit',
			link: 'link'
		},
		visible_toolbars = {
			link_edit: [note_toolbar_name]
		},
		WP_Link = false,
		wplink_toolbar_visible = false,
		IE_unlink = false,
		linkNode = false;

	/**
	 * Render the UI of the theme
	 */
	self.renderUI = function() {
		var panel,
			has_placeholder,
			upper_margin = 0;

		// Bail if we don't have a toolbar in settings
		if ( ! settings.toolbar || ! settings.toolbar.length ) {
			return {};
		}

		// Calculate the upper margin for the entire document
		if ( DOM.getStyle( document.body, 'position', true ) === 'relative' ) {
			upper_margin =
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
		editor.on( 'activate focus', function() {
			// Set the focus flag
			focus = true;

			// Add the focus CSS class
			DOM.addClass( editor.getBody(), 'mce-edit-focus' );
		} );

		// Deactivate, blur, hide events
		editor.on( 'deactivate blur hide', function() {
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
		editor.once( 'preinit', function() {
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
					items: []
				} );

				/**
				 * This function repositions a toolbar (name) within the editor.
				 */
				panel.reposition = function( name ) {
					var panelEl = this.getEl(),
						selection = editor.selection.getRng(),
						boundary = selection.getBoundingClientRect(),
						editorEl = editor.getElement(),
						editor_boundary = editorEl.getBoundingClientRect(),
						has_boundary = ( boundary.top && boundary.right && boundary.bottom && boundary.left ),
						boundary_top = ( has_boundary ) ? boundary.top : editor_boundary.top,
						boundary_right = ( has_boundary ) ? boundary.right : editor_boundary.right,
						boundary_bottom = ( has_boundary ) ? boundary.bottom : editor_boundary.bottom,
						boundary_left = ( has_boundary ) ? boundary.left : editor_boundary.left,
						boundary_middle = ( has_boundary ) ? ( ( boundary.left + boundary.right ) / 2 ) : ( ( editor_boundary.left + editor_boundary.right ) / 2 ),
						window_width = window.innerWidth,
						panel_width, panel_half,
						margin = parseInt( DOM.getStyle( panelEl, 'margin-bottom', true ), 10 ) + upper_margin,
						top, left, className;

					panelEl.className = ( ' ' + panelEl.className + ' ' ).replace( /\smce-arrow-\S+\s/g, ' ' ).slice( 1, -1 );

					// Setup the toolbar name
					name = name || note_toolbar_name;

					// Fallback to the main toolbar if we don't have a reference
					if ( ! toolbars[name] ) {
						name = note_toolbar_name;
					}

					// Loop through toolbars
					each( toolbars, function( toolbar, toolbar_name ) {
						// Hide this toolbar if the flag is set and it doesn't match the name
						if ( toolbar.note_hide && toolbar_name !== name && ( ! visible_toolbars[name] || visible_toolbars[name].indexOf( toolbar_name ) === -1 ) ) {
							toolbar.hide();
						}
					} );

					// If the editor selection is not hidden
					if ( ! editor.selection.isCollapsed() ) {
						if ( ! toolbars[name].state.get( 'visible' ) ) {
							// Show this toolbar
							toolbars[name].show();
						}
					}
					// Otherwise just hide the panel
					else {
						panel.hide();
					}

					/*
					 * Determine the position for this toolbar/panel
					 */
					panel_width = panelEl.offsetWidth;
					panel_half = panel_width / 2;

					if ( boundary_top < panelEl.offsetHeight + admin_bar_height ) {
						className = ' mce-arrow-up';
						top = boundary_bottom + margin;
					}
					else {
						className = ' mce-arrow-down';
						top = boundary_top - panelEl.offsetHeight - margin;
					}

					left = boundary_middle - panel_half;

					if ( panel_width >= window_width ) {
						className += ' mce-arrow-full';
						left = 0;
					}
					else if ( ( left < 0 && boundary_left + panel_width > window_width ) || ( left + panel_width > window_width && boundary_right - panel_width < 0 ) ) {
						left = ( window_width - panel_width ) / 2;
					}
					else if ( left < 0 ) {
						className += ' mce-arrow-left';
						left = boundary_left;
					}
					else if ( left + panel_width > window_width ) {
						className += ' mce-arrow-right';
						left = boundary_right - panel_width;
					}

					panelEl.className += className;

					DOM.setStyles( panelEl, { 'left': left, 'top': top + window.pageYOffset } );

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
					// If we don't have an editor selection
					if ( ! editor.selection || ( editor.selection && editor.selection.isCollapsed() ) ) {
						DOM.removeClass( panel.getEl(), 'mce-inline-toolbar-active' );
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
						if ( toolbar.note_hide && toolbar.state.get( 'visible' ) ) {
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
				setupToolbar( editor.wp._createToolbar( settings.toolbar ), note_toolbar_name, panel, {
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
							if ( ! toolbars[wp_toolbar_names.img] ) {
								// Setup the toolbar
								setupToolbar( args.toolbar, wp_toolbar_names.img, panel, {
									note_hide: true
								} );

								// Add an event listener to the editor:image-edit event
								if ( wp.media ) {
									// Editor - Image Edit event
									wp.media.events.on( 'editor:image-edit', function() {
										// Add an event listener once to the editor:frame-create event (triggered right after editor:image-edit)
										wp.media.events.once( 'editor:frame-create', function( data ) {
											// If the frame is not attached
											if ( ! data.frame.modal.views.attached ) {
												// Attach the frame (fixes a bug in FireFox and IE where the $el is initially visible so the rendering process is never completed @see https://github.com/WordPress/WordPress/blob/4.5-branch/wp-includes/js/media-views.js#L6764)
												data.frame.attach();
											}
										} );
									} );
								}
							}
						break;

						// Links
						case 'A':
							var href = args.element.getAttribute( 'href' );
								//$link = editor.$( editor.dom.getParent( args.element, 'a' ) );

							// Setup a reference to the link node
							linkNode = editor.dom.getParent( args.element, 'a' );

							// If we don't already have a reference to this toolbar (editing link)
							if ( ! toolbars[wp_toolbar_names.link_edit] || ! toolbars[wp_toolbar_names.link] ) {
								// If this link is being edited (created)
								if ( ! toolbars[wp_toolbar_names.link_edit] && ( href === '_wp_link_placeholder' || args.element.getAttribute( 'data-wplink-edit' ) ) ) {
									// Setup the toolbar
									setupToolbar( args.toolbar, wp_toolbar_names.link_edit, panel, {
										tempHide: true,
										note_hide: false
									} );

									// In IE, set the WP_Link flag here
									if ( tinymce.Env.ie ) {
										// Set the flag
										WP_Link = true;
									}

									// Show event
									args.toolbar.on( 'show', function() {
										// Set the wplink_toolbar_visible flag
										wplink_toolbar_visible = true;

										// In IE, set the WP_Link flag here
										if ( tinymce.Env.ie ) {
											// Set the flag
											WP_Link = true;

											// If the panel is not visible (checking state)
											if ( ! panel.state.get( 'visible' ) ) {
												// Show the panel (fixes a bug in IE)
												panel.show();
											}
										}
									} );

									// Hide event
									args.toolbar.on( 'hide', function() {
										// Reset the wplink_toolbar_visible flag
										wplink_toolbar_visible = false;

										// In IE, if the panel is not visible (checking state)
										if ( tinymce.Env.ie && ! panel.state.get( 'visible' ) ) {
											// Show the panel (fixes a bug in IE)
											panel.show();
										}
									} );
								}
								// TODO: We may not need this toolbar for the time being
								// Otherwise if this link was already existing
								/*else if ( ! toolbars[wp_toolbar_names.link] && href && href !== '_wp_link_placeholder' && ! $link.find( 'img' ).length ) {
									// Setup the toolbar
									setupToolbar( args.toolbar, wp_toolbar_names.link, panel, {
										note_hide: true
									} );
								}*/
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
							name = wp_toolbar_names.img;
						break;

						// Links
						case 'A':
							var href = element.getAttribute( 'href' ),
								$link = editor.$( editor.dom.getParent( element, 'a' ) ),
								$img = $link.find( 'img' ).eq( 0 ); // Select the first image, if it exists

							// Setup a reference to the link node
							linkNode = editor.dom.getParent( element, 'a' );

							// Default to link_edit
							name = wp_toolbar_names.link_edit;

							// If this link was already existing
							if ( ! WP_Link && href && href !== '_wp_link_placeholder' && ! $link.find( 'img' ).length ) {
								name = note_toolbar_name;
							}

							// In IE, if we have an href value and it's not the placeholder, use the main toolbar
							if ( tinymce.Env.ie && href && href !== '_wp_link_placeholder' ) {
								name = note_toolbar_name;
							}

							// If there is an image inside of this link, show the image toolbar instead
							if ( $img.length ) {
								// Select the image (prevents a bug in Firefox and IE where the link is selected and then editing the image results in a broken reference in the media modal)
								editor.selection.select( $img[0] );
								editor.fire( 'nodechange', {
									element: $img[0],
									note: true
								} );

								// In IE, trigger a click on the image
								if ( tinymce.Env.ie ) {
									$img.trigger( 'click' );
								}

								name = wp_toolbar_names.img
							}
						break;

						// Default
						default:
							name = note_toolbar_name;
						break;
					}

					// If the panel is not visible, show the panel first
					if ( ! panel.state.get( 'visible' ) ) {
						// Show the panel and reposition the toolbar
						panel.show();
					}

					// Reposition the toolbar
					panel.reposition( name );
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

				// If the wplink toolbar is visible (user clicked on "link" button again)
				if ( wplink_toolbar_visible ) {
					// Reset the temporary hide flag
					toolbars[wp_toolbar_names.link_edit].tempHide = false;

					// Execute the wp_link_cancel command
					editor.execCommand( 'wp_link_cancel' );

					// Prevent default (prevent WP_Link)
					event.preventDefault();
				}

				// In IE, we want to make sure we open the advanced link editor if it exists to fix bugs with rendering the WordPress 4.5 link editor toolbar
				if ( tinymce.Env.ie && typeof window.wpLink !== 'undefined' ) {
					var node = editor.selection.getNode(),
						content = editor.selection.getContent(),
						url, href;

					// If this is an existing link only
					if ( node.nodeName === 'A' || content.indexOf( '<a' ) === 0 ) {
						url = content.match( /href=["|'](.+)["|']/ );
						url = ( url ) ? url[1] : null;
						href = ( linkNode ) ? editor.dom.getAttrib( linkNode, 'href' ) : url;

						/*
						 * Unfortunately IE looses the selection when the editor iframe
						 * looses focus, so without returning focus to the editor, the code
						 * in the modal will not be able to get the selection, place the caret
						 * at the same location, etc.
						 */
						editor.focus();

						// wpLink modal
						window.wpLink.open( editor.id, url || null );

						/*
						 * TODO: Fix the non-selection case in the editor
						 * For some reason when the wpLink modal is open, our editor
						 * doesn't have a selection. Set the URL value manually.
						 */
						if ( linkNode && href !== '_wp_link_placeholder' ) {
							$( '#wp-link-url' ).val( href );
							$( '#wp-link-target' ).prop( 'checked', '_blank' === editor.dom.getAttrib( linkNode, 'target' ) );
							$( '#wp-link-submit' ).val( window.wpLinkL10n.update );
						}

						// Prevent default (prevent WP_Link)
						event.preventDefault();
					}
				}
			}

			// In IE, if this is an unlink command
			if ( tinymce.Env.ie && event.command === 'unlink' ) {
				// If the wplink toolbar is visible
				if ( wplink_toolbar_visible ) {
					// Set the flag
					IE_unlink = true;

					// Reset the temporary hide flag
					toolbars[wp_toolbar_names.link_edit].tempHide = false;

					// Execute the wp_link_cancel command
					editor.execCommand( 'wp_link_cancel' );

					// Prevent default (prevent WP_Link)
					event.preventDefault();
				}
			}

			// If this is a wp_link_cancel or wp_link_apply command
			if ( event.command === 'wp_link_cancel' || event.command === 'wp_link_apply' ) {
				// In IE, if this is a wp_link_cancel command and the wplink toolbar is visible or this is an IE_unlink action
				if ( tinymce.Env.ie && event.command === 'wp_link_cancel' && ( wplink_toolbar_visible || IE_unlink ) ) {
					// If the flag is not set
					if ( ! IE_unlink ) {
						// Prevent default
						event.preventDefault();

						return;
					}

					// If the flag is set
					if ( IE_unlink ) {
						// Reset the flag
						IE_unlink = false;

						return;
					}
				}

				// Reset the flag
				WP_Link = false;

				// Reset the link node reference
				linkNode = false;
			}
		} );


		// Execcommand event
		editor.on( 'execcommand', function( event ) {
			// If this is a wp_link_cancel or wp_link_apply command
			if ( event.command === 'wp_link_cancel' || event.command === 'wp_link_apply' ) {
				// If the panel is visible and the editor selection is collapsed hide it (fixes bug in Firefox where selectionchange isn't triggered in some cases)
				if ( ! WP_Link && panel.state.get( 'visible' ) && ( editor.selection.isCollapsed() || ( toolbars[wp_toolbar_names.link_edit] && toolbars[wp_toolbar_names.link_edit].state.get( 'visible' ) ) ) ) {
					panel.hide();
				}
			}
		} );

		// Openwindow event
		editor.on( 'openwindow', function() {
			// Set the flag
			open_window = true;

			// Hide the panel
			panel.hide();
		} );

		// Closewindow event
		editor.on( 'closewindow', function() {
			// Reset the flag
			open_window = false;

			// Show the panel
			panel.show();
		} );


		/*
		 * Placeholder
		 */
		if ( settings.placeholder ) {
			// Activate, focus events
			editor.on( 'activate focus', function() {
				if ( has_placeholder ) {
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
					has_placeholder = true;
					DOM.addClass( editor.getBody(), 'mce-placeholder' );
				}

				// If WP_Link or the wplink toolbar is visible
				// TODO: The wp_link_cancel command focuses the editor
				/*if ( WP_Link ||wplink_toolbar_visible ) {
					// Reset the temporary hide flag
					toolbars[wp_toolbar_names.link_edit].tempHide = false;

					// Execute the wp_link_cancel command
					editor.execCommand( 'wp_link_cancel' );
				}*/
			} );

			// Setcontent event
			editor.on( 'setcontent', function( event ) {
				if ( has_placeholder && ! event.load ) {
					has_placeholder = false;
					DOM.removeClass( editor.getBody(), 'mce-placeholder' );
				}
			} );

			// Postprocess event
			editor.on( 'postprocess', function( event ) {
				if ( has_placeholder && event.content ) {
					event.content = '';
				}
			} );

			// Beforeaddundo event
			editor.on( 'beforeaddundo', function( event ) {
				if ( has_placeholder ) {
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
	function setupToolbar( toolbar, toolbar_name, panel, args, delay ) {
		args = args || false;
		delay = delay || 0;

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

		// setTimeout to ensure this happens on another thread
		setTimeout( function() {
			// Add the toolbar to our panel
			panel.add( toolbars[toolbar_name] );

			// Append the toolbar to our panel in the DOM (grab the DOMQuery reference)
			toolbars[toolbar_name].$el.appendTo( panel.getEl( 'body' ) );

			// If this toolbar should be hidden
			if ( toolbars[toolbar_name].note_hide ) {
				// Hide the toolbar
				toolbars[toolbar_name].hide();
			}
		}, delay );
	}
} );