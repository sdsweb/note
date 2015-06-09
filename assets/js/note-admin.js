/**
 * Note
 */
var note = note || {};

( function ( $ ) {
	"use strict";

	/**
	 * Document Ready
	 */
	$( function() {
		// TODO: Optimize the following
		/**
		 * Settings errors
		 *
		 * This functionality taken from /wp-admin/js/common.js.
		 */
		// Move .updated and .error alert boxes, don't move boxes designed to be inline, hide all boxes
		$( 'div.wrap h1:first' ).nextAll( 'div.updated, div.error' ).addClass( 'below-h1' );
		$( 'div.updated, div.error' ).not( '.below-h1, .inline' ).remove();

		// Only show errors associated with the Note settings panel
		$( 'div.updated[id*="settings_updated"], div.updated[id*="note"], div.error[id*="note"]' ).show();

		/**
		 * Navigation Tabs
		 */
		$( '.note-options-tab-wrap a' ).on( 'click', function ( e ) {
			var $this = $( this ), tab_id_prefix = $this.attr( 'href' );

			// Remove active classes
			$( '.note-tab-content' ).removeClass( 'note-tab-content-active' );
			$( '.note-tab' ).removeClass( 'nav-tab-active' );

			// Activate new tab
			$( tab_id_prefix + '-tab-content' ).addClass( 'note-tab-content-active' );
			$this.addClass( 'nav-tab-active' );
			$( '#note_options_tab' ).val( tab_id_prefix );
		} );

		/**
		 * Window Hash
		 */
		if ( window.location.hash && $( window.location.hash + '-tab-content' ).length ) {
			var tab_id_prefix = window.location.hash;

			// Remove active classes
			$( '.note-tab-content' ).removeClass( 'note-tab-content-active' );
			$( '.note-tab' ).removeClass( 'nav-tab-active' );

			// Activate tab
			$( tab_id_prefix + '-tab-content' ).addClass( 'note-tab-content-active' );
			$( tab_id_prefix + '-tab').addClass( 'nav-tab-active' );
			$( '#note_options_tab' ).val( tab_id_prefix );
		}

		// FitVids
		$( '#note-form' ).fitVids();
	} );
} )( jQuery );