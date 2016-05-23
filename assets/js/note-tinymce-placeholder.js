/**
 * Note TinyMCE Placeholder Plugin
 */

tinymce.PluginManager.add( 'note_placeholder', function( editor ) {
	'use strict';

	var DOM = tinymce.DOM,
		Factory = tinymce.ui.Factory,
		prev_node, // Reference to the previous node in the editor
		$prev_node,
		$ = jQuery,
		api = wp.customize, // Customizer API
		NotePreview = api.NotePreview, // NotePreview
		$el = $( editor.getElement() ),
		data_key = 'note',
		content_class = 'note-content',
		placeholder_class = 'note-has-placeholder',
		mixed_content_class = 'note-has-mixed-content',// Some placeholder content, some normal content
		placeholder_el_class = 'note-placeholder',
		placeholder_el_parent_class = 'note-placeholder-parent',
		$el_parent = $el.parent(),
		wp_media_active = false, // Flag to determine if wp.media modal was open
		media_panel,
		toolbar;


	/*
	 * TinyMCE Editor Events
	 */

	// Preinit
	editor.on( 'preinit', function() {
		var note_type = editor.getParam( 'note_type' );

		// Only on media editors
		if ( note_type && note_type === 'media' && editor.settings.hasOwnProperty( 'media_blocks' ) ) {
			// Create the panel (no items)
			media_panel = Factory.create( {
				type: 'panel',
				layout: 'flow',
				classes: 'insert-panel note-insert-panel media-insert-panel note-media-insert-panel',
				ariaRoot: true,
				ariaRemember: true,
				items: []
			} );

			/*
			 * This function sets the panel's position in the DOM.
			 */
			media_panel.setPosition = function() {
				var insert_el = this.getEl(); // Insert element

				// Set the styles on the insert element
				DOM.setStyles( insert_el, {
					//'left': parent_pos.x,
					//'top': parent_pos.y,
					//'width': $parent[0].offsetWidth,
					//'height': $parent[0].offsetHeight
				} );

				// Return this for chaining
				return this;
			};
		}
	} );

	// Init
	editor.on( 'init', function( event ) {
		var note_type = editor.getParam( 'note_type' );

		// Note Placeholder
		setupNotePlaceholder( true );

		// Remove the note-placeholder data attributes
		/*$el.find( '*[data-note-placeholder]' ).each( function() {
			// Remove the note-placeholder data attribute
			$( this ).removeAttr( 'data-note-placeholder' );
		} );*/

		// Only on media editors
		if ( note_type && note_type === 'media' ) {
			// If the WordPress plugin has been initialized and we can create a toolbar
			if ( editor.wp && editor.wp._createToolbar ) {
				// Render the panel to the editor
				media_panel.renderTo( $el_parent[0] );

				// Hide the media panel
				media_panel.hide();

				/*
				 * Create the toolbar.
				 *
				 * Because the WordPress TinyMCE plugin renders the toolbar to the DOM for us,
				 * we need to add it after the panel is rendered so that we can append it to our
				 * panel 'body' element.
				 */

				// Create the toolbar
				toolbar = editor.wp._createToolbar( editor.settings.media_blocks );

				// Add the toolbar to our panel
				media_panel.add( toolbar );

				// Append the toolbar to our panel in the DOM (grab the DOMQuery reference)
				toolbar.$el.appendTo( media_panel.getEl( 'body' ) );

				// Note Placeholder
				if ( $el.hasClass( placeholder_class ) ) {
					// Remove all content
					editor.setContent( '' );

					// Add CSS class to parent
					$el_parent.addClass( 'has-media-placeholder' );

					// Show the toolbar (WordPress hides it by default)
					toolbar.show();

					// Show the media panel
					media_panel.show();
				}
			}
		}
	} );

	// Editor NodeChange
	editor.on( 'NodeChange', function( event ) {
		var node = editor.selection.getNode(),
			$node = $( node ),
			node_editor_id = $node.parents( '.editor' ).attr( 'id' ),
			text = $node.text(),
			note_data = $node.data( data_key ),
			placeholder = ( note_data && note_data.hasOwnProperty( 'placeholder' ) ) ? note_data.placeholder : false,
			note_type = editor.getParam( 'note_type' );

		// Note Placeholder element
		if ( node_editor_id === editor.id && $node.hasClass( placeholder_el_class ) && text === placeholder ) {
			// Set flag to stop Note Widget updates
			editor.note.placeholder_el = true;
			editor.note.prevent_widget_update = true;

			// Remove the placeholder CSS
			$node.removeClass( placeholder_el_class ).parentsUntil( '.' + content_class ).removeClass( placeholder_el_parent_class );

			// Remove the placeholder content
			$node.html( '<br />' ); // Set a break to preserve the element editing capability, TinyMCE will handle the rest for us
		}
		// Otherwise we have normal element
		else {
			// Reset flag to stop Note Widget updates
			editor.note.placeholder_el = false;
			editor.note.prevent_widget_update = false;
		}

		// Determine if this node is different than the previous (ignoring TinyMCE paste bin element)
		if ( node_editor_id === editor.id && $node.attr( 'id' ) !== 'mcepastebin' && ! compareNodes( node, prev_node ) ) {
			// Determine if previous node is empty and reset the placeholder
			if ( prev_node && $prev_node.length && ! $prev_node.text() && ! $prev_node.has( 'img' ).length ) {
				// Previous node placeholder
				note_data = $prev_node.data( data_key );
				placeholder = ( note_data && note_data.hasOwnProperty( 'placeholder' ) ) ? note_data.placeholder : false;

				// If we have placeholder data
				if ( placeholder ) {
					// Reset placeholder
					$prev_node.html( DOM.decode( placeholder ) ).addClass( placeholder_el_class ).parentsUntil( '.' + content_class ).addClass( placeholder_el_parent_class );
				}
			}

			// Update the previous node
			prev_node = node;
			$prev_node = $( prev_node );
		}

		// Reset the wp.media flag
		if ( wp_media_active ) {
			wp_media_active = false;
		}

		// Only on media editors
		if ( note_type && note_type === 'media' ) {
			// Adjust the position of the media panel
			media_panel.setPosition();
		}
	} );

	// Editor change & keypress
	editor.on( 'change keypress', function( event ) {
		// If the editor placeholder element flag is set
		if ( editor.note.hasOwnProperty( 'placeholder_el' ) && editor.note.placeholder_el ) {
			// Reset the placeholder element flag
			editor.note.placeholder_el = false;

			// Reset the widget update flag
			editor.note.prevent_widget_update = false;
		}
	} );

	// TODO: Editor undo/redo (placeholder doesn't always return on undo/redo events)
	/*editor.on( 'undo', function( event ) {
		var node = editor.selection.getNode(),
			$node = $( node );

		// Setup Note Placeholder (setTimeout ensures default placeholder data exists before re-init)
		setTimeout( function() {
			setupNotePlaceholder();
		}, 20 );
	} );*/

	// Editor paste (post-process)
	editor.on( 'PastePostProcess', function( event ) {
		// If the editor placeholder element flag is set
		if ( editor.note.hasOwnProperty( 'placeholder_el' ) && editor.note.placeholder_el ) {
			// Reset the placeholder element flag
			editor.note.placeholder_el = false;

			// Reset the widget update flag
			editor.note.prevent_widget_update = false;
		}
	} );

	// Editor wpLoadImageForm
	editor.on( 'wpLoadImageForm', function() {
		// If we don't have focus
		if ( ! DOM.hasClass( editor.getBody(), 'mce-edit-focus' ) ) {
			// Focus the editor first (skip focusing and just set the active editor)
			editor.focus( true );

			// Since we're skipping the DOM focusing, we need to set the global wpActiveEditor ID, which is used as a fallback when WordPress is determining the active TinyMCE editor (@see https://github.com/WordPress/WordPress/blob/4.5-branch/wp-includes/js/tinymce/plugins/wordpress/plugin.js#L89)
			window.wpActiveEditor = editor.id;
		}

		// Set the wp.media flag
		wp_media_active = true;
	} );

	// Editor wpLoadImageForm once
	editor.once( 'wpLoadImageForm', function( event ) {
		// Listen for the close event on the frame
		event.frame.on( 'close', function() {
			var node = editor.selection.getNode(),
				$node = $( node ),
				node_editor_id = $node.parents( '.editor' ).attr( 'id' ),
				text = $node.text(),
				note_data = $node.data( data_key ),
				placeholder = ( note_data && note_data.hasOwnProperty( 'placeholder' ) ) ? note_data.placeholder : false;

			// Note Placeholder element
			if ( node_editor_id === editor.id && $node.hasClass( placeholder_el_class ) && text === placeholder ) {
				// Remove the placeholder CSS
				$node.removeClass( placeholder_el_class ).parentsUntil( '.' + content_class ).removeClass( placeholder_el_parent_class );

				// Remove the placeholder content
				$node.html( '<br />' ); // Set a break to preserve the element editing capability, TinyMCE will handle the rest for us

				// Focus the editor
				editor.focus();
			}
		} );

		// Listen for the insert event on the frame
		event.frame.on( 'insert', function() {
			// Remove the placeholder
			editor.dom.remove( editor.dom.select( '.note-placeholder' ) );

			// Remove CSS class from parent
			$el_parent.removeClass( 'has-media-placeholder' );

			// Hide the media panel
			if ( media_panel ) {
				media_panel.hide();
			}
		} );
	} );

	// Editor note-editor-focus
	editor.on( 'note-editor-focus', function() {
		var node = editor.selection.getNode(),
			$node = $( node ),
			node_editor_id = $node.parents( '.editor' ).attr( 'id' ),
			text = $node.text(),
			note_data = $node.data( data_key ),
			placeholder = ( note_data && note_data.hasOwnProperty( 'placeholder' ) ) ? note_data.placeholder : false;

		// Note Placeholder element
		if ( node_editor_id === editor.id && $node.hasClass( placeholder_el_class ) && text === placeholder ) {
			// Set flag to stop Note Widget updates
			editor.note.placeholder_el = true;
			editor.note.prevent_widget_update = true;

			// Remove the placeholder CSS
			$node.removeClass( placeholder_el_class ).parentsUntil( '.' + content_class ).removeClass( placeholder_el_parent_class );

			// Remove the placeholder content
			$node.html( '<br />' ); // Set a break to preserve the element editing capability, TinyMCE will handle the rest for us
		}
	} );

	// Editor blur
	editor.on( 'blur', function( event ) {
		var note_data,
			placeholder,
			note_type = editor.getParam( 'note_type' ),
			$body = $( editor.getBody() );

		// Determine if previous node is empty and reset the placeholder
		if ( prev_node && $prev_node.length && ! $prev_node.text() && ! $prev_node.has( 'img' ).length ) {
			note_data = $prev_node.data( data_key );
			placeholder = ( note_data && note_data.hasOwnProperty( 'placeholder' ) ) ? note_data.placeholder : false;

			// If we have placeholder data
			if ( placeholder ) {
				// Reset placeholder (setTimeout fixes a bug where the previous node would remain empty when switching focus between editors)
				setTimeout( function() {
					// Reset the placeholder text
					$prev_node.html( DOM.decode( placeholder ) ).addClass( placeholder_el_class ).parentsUntil( '.' + content_class ).addClass( placeholder_el_parent_class );
				}, 10 );

				// Note Widget update (setTimeout ensures placeholder element has finished inserting into element)
				setTimeout( function() {
					var content = editor.getContent(),
						// Deep copy
						data = $.extend( true, editor.note.widget_data, { widget: { content: content } } );

					// Trigger a Note Widget update event (after placeholder data has been put back into element)
					NotePreview.preview.send( 'note-widget-update', data );

					// Update the previous content reference
					editor.note.prev_content = content;
				}, 100 );
			}
		}

		// Only on media editors
		if ( note_type && note_type === 'media' && ( ! $body.text() && ! $body.has( 'img' ).length ) ) {
			// Remove all content
			editor.setContent( '' );

			// Add CSS class to parent
			$el_parent.addClass( 'has-media-placeholder' );

			// Show the media panel
			media_panel.show();
		}
	} );


	/**********************
	 * Internal Functions *
	 **********************/

	/**
	 * This function sets up Note Placeholder logic.
	 */
	function setupNotePlaceholder() {
		if ( $el.hasClass( placeholder_class ) ) {
			// Placeholder content only
			if ( ! $el.hasClass( mixed_content_class ) ) {
				// Loop through nodes // TODO: Optimize this call if possible (can we loop through children() only?)
				$el.find( '*:not([data-note-placeholder="false"])' ).each( function() {
					var $this = $( this );

					// Add the Note Placeholder CSS classes
					$this.addClass( placeholder_el_class ).parentsUntil( '.' + content_class ).addClass( placeholder_el_parent_class );

					// Add the Note Placeholder data attribute (set to current content value)
					$this.data( data_key, { placeholder: DOM.encode( $this.text() ) } );
				} );
			}
			// Mixed content
			else {
				// Loop through placeholder nodes // TODO: Optimize this call if possible (can we loop through children() only?)
				$el.find( '.' + placeholder_el_class ).each( function() {
					var $this = $( this );

					// Add the Note Placeholder CSS classes
					$this.parentsUntil( '.' + content_class ).addClass( placeholder_el_parent_class );

					// Add the Note Placeholder data attribute (set to current content value)
					$this.data( data_key, { placeholder: DOM.encode( $this.text() ) } );
				} );
			}
		}
	}

	/**
	 * Compares two nodes and checks if it's attributes and styles matches.
	 * This doesn't compare classes as items since their order is significant.
	 * We've modified this function to also compare the content of the nodes.
	 *
	 * Copyright, Moxiecode Systems AB
	 * Released under LGPL License.
	 *
	 * License: http://www.tinymce.com/license
	 * Contributing: http://www.tinymce.com/contributing
	 *
	 * @param node1
	 * @param node2
	 * @returns {boolean}
	 */
	function compareNodes(node1, node2) {
		// Not the same element (simple check first)
		if (node1 && node2 && node1 !== node2) {
			return false;
		}

		/**
		 * Returns all the nodes attributes excluding internal ones, styles and classes.
		 *
		 * @private
		 * @param {Node} node Node to get attributes from.
		 * @return {Object} Name/value object with attributes and attribute values.
		 */
		function getAttribs(node) {
			var attribs = {};

			tinymce.util.Tools.each(DOM.getAttribs(node), function(attr) {
				var name = attr.nodeName.toLowerCase();

				// Don't compare internal attributes or style
				if (name.indexOf('_') !== 0 && name !== 'style' && name !== 'data-mce-style') {
					attribs[name] = DOM.getAttrib(node, name);
				}
			});

			return attribs;
		}

		/**
		 * Compares two objects checks if it's key + value exists in the other one.
		 *
		 * @private
		 * @param {Object} obj1 First object to compare.
		 * @param {Object} obj2 Second object to compare.
		 * @return {boolean} True/false if the objects matches or not.
		 */
		function compareObjects(obj1, obj2) {
			var value, name;

			for (name in obj1) {
				// Obj1 has item obj2 doesn't have
				if (obj1.hasOwnProperty(name)) {
					value = obj2[name];

					// Obj2 doesn't have obj1 item
					if (typeof value == "undefined") {
						return false;
					}

					// Obj2 item has a different value
					if (obj1[name] != value) {
						return false;
					}

					// Delete similar value
					delete obj2[name];
				}
			}

			// Check if obj 2 has something obj 1 doesn't have
			for (name in obj2) {
				// Obj2 has item obj1 doesn't have
				if (obj2.hasOwnProperty(name)) {
					return false;
				}
			}

			return true;
		}

		// Attribs are not the same
		if (!compareObjects(getAttribs(node1), getAttribs(node2))) {
			return false;
		}

		// Styles are not the same
		if (!compareObjects(DOM.parseStyle(DOM.getAttrib(node1, 'style')), DOM.parseStyle(DOM.getAttrib(node2, 'style')))) {
			return false;
		}

		// Content (innerHTML) is not the same
		if( node1 && node2 && DOM.encode( node1.innerHTML ) !== DOM.encode( node2.innerHTML ) ) {
			return false;
		}

		return !tinymce.dom.BookmarkManager.isBookmarkNode(node1) && !tinymce.dom.BookmarkManager.isBookmarkNode(node2);
	}
} );