<?php
/**
 * Note Install
 *
 * @class Note_Admin_Install
 * @author Slocum Studio
 * @version 1.0.0
 * @since 1.2.0
 */

// Bail if accessed directly
if ( ! defined( 'ABSPATH' ) )
	exit;

if( ! class_exists( 'Note_Admin_Install' ) ) {
	final class Note_Admin_Install {
		/**
		 * @var string
		 */
		public $version = '1.0.0';

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
			add_action( 'admin_init', array( $this, 'admin_init' ) ); // Add Note option
		}

		/**
		 * This function creates the Note option in the database upon install.
		 */
		public function admin_init() {
			add_option( Note_Options::$option_name, Note_Options::get_option_defaults() );
		}
	}

	/**
	 * Create an instance of the Note_Admin_Install class.
	 */
	function Note_Admin_Install() {
		return Note_Admin_Install::instance();
	}

	Note_Admin_Install(); // Note your content!
}