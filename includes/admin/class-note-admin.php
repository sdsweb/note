<?php
/**
 * Note Admin
 *
 * @class Note_Admin
 * @author Slocum Studio
 * @version 1.4.1
 * @since 1.2.0
 */

// Bail if accessed directly
if ( ! defined( 'ABSPATH' ) )
	exit;

if( ! class_exists( 'Note_Admin' ) ) {
	final class Note_Admin {
		/**
		 * @var string
		 */
		public $version = '1.4.1';

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
			// Load required assets
			$this->includes();
		}

		/**
		 * Include required core files used in admin and on the frontend.
		 */
		private function includes() {
			include_once 'class-note-admin-options.php'; // Note Admin Options
			//include_once 'class-note-admin-help.php'; // Note Admin Help TODO
		}
	}
}

/**
 * Create an instance of the Note_Admin class.
 */
function Note_Admin() {
	return Note_Admin::instance();
}

Note_Admin(); // Note your content!