<?php
/**
 * Note Scripts & Styles
 *
 * TODO
 * @author Slocum Studio
 * @version 1.1.2
 * @since 1.0.0
 */

// Bail if accessed directly
if ( ! defined( 'ABSPATH' ) )
	exit;

if ( ! class_exists( 'Note_Scripts_Styles' ) ) {
	final class Note_Scripts_Styles {
		/**
		 * @var string
		 */
		public $version = '1.1.2';

		/**
		 * @var Note, Instance of the class
		 */
		protected static $_instance;

		/**
		 * Function used to create instance of class.
		 */
		public static function instance() {
			if ( is_null( self::$_instance ) )
				self::$_instance = new self();

			return self::$_instance;
		}


		/**
		 * This function sets up all of the actions and filters on instance. It also loads (includes)
		 * the required files and assets.
		 */
		function __construct() {
			// Hooks
			add_action( 'wp_enqueue_scripts', array( $this, 'wp_enqueue_scripts' ) ); // Enqueue Scripts & Styles (front-end)
		}


		/**
		 * This function enqueues scripts & styles on the front-end for Note.
		 */
		// TODO: Minify/consolidate all scripts
		public function wp_enqueue_scripts() {
			// Note Widget Styles (only enqueue styles if this widget is active)
			if ( function_exists( 'Note_Widget' ) ) {
				// Grab the Note Widget instance
				$note_widget = Note_Widget();

				if ( is_active_widget( false, false, $note_widget->id_base, true ) )
					// Note Widget
					wp_enqueue_style( 'note-widget', Note::plugin_url() . '/assets/css/widgets/note-widget.css', false, Note::$version );
			}
		}
	}
}

/**
 * Create an instance of the Note_Scripts_Styles class.
 */
function Note_Scripts_Styles() {
	return Note_Scripts_Styles::instance();
}

Note_Scripts_Styles(); // Note your content!