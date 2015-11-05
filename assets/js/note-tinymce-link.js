/**
 * Note TinyMCE Link (TinyMCE wplink plugin) - /assets/js/note-tinymce-link.js
 * License: GPLv2 or later
 * Copyright: WordPress Core (4.0), http://wordpress.org/
 *
 * @see https://github.com/WordPress/WordPress/blob/ce557062f4123d8513378cf415b4e8b612c33ccc/wp-includes/js/tinymce/plugins/wplink/plugin.js
 */

/* global tinymce */

/**
 * WordPress Link plugin.
 */
tinymce.PluginManager.add( 'wplink', function( editor ) {
	var toolbar;

	editor.addCommand( 'WP_Link', function() {
		window.wpLink && window.wpLink.open( editor.id );
	});

	// WP default shortcut
	editor.addShortcut( 'Alt+Shift+A', '', 'WP_Link' );
	// The "de-facto standard" shortcut, see #27305
	editor.addShortcut( 'Meta+K', '', 'WP_Link' );

	editor.addButton( 'link', {
		icon: 'link',
		tooltip: 'Insert/edit link',
		cmd: 'WP_Link',
		stateSelector: 'a[href]'
	});

	editor.addButton( 'unlink', {
		icon: 'unlink',
		tooltip: 'Remove link',
		cmd: 'unlink'
	});

	editor.addMenuItem( 'link', {
		icon: 'link',
		text: 'Insert/edit link',
		cmd: 'WP_Link',
		stateSelector: 'a[href]',
		context: 'insert',
		prependToContext: true
	});

	editor.on( 'pastepreprocess', function( event ) {
		var pastedStr = event.content,
			regExp = /^(?:https?:)?\/\/\S+$/i;

		if ( ! editor.selection.isCollapsed() && ! regExp.test( editor.selection.getContent() ) ) {
			pastedStr = pastedStr.replace( /<[^>]+>/g, '' );
			pastedStr = tinymce.trim( pastedStr );

			if ( regExp.test( pastedStr ) ) {
				editor.execCommand( 'mceInsertLink', false, {
					href: editor.dom.decode( pastedStr )
				} );

				event.preventDefault();
			}
		}
	} );
} );