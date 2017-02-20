<?php
/**
 * Note Admin Views (controller)
 *
 * @class Note_Admin_Options_Views
 * @author Slocum Studio
 * @version 1.4.1
 * @since 1.2.0
 */

// Bail if accessed directly
if ( ! defined( 'ABSPATH' ) )
	exit;

if ( ! class_exists( 'Note_Admin_Options_Views' ) ) {
	final class Note_Admin_Options_Views {
		/**
		 * @var string
		 */
		public $version = '1.4.1';

		/**
		 * @var array
		 */
		public static $options = false;
		/**
		 * @var Note_Admin_Options_Views, Instance of the class
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
			// Load options
			self::$options = Note_Options::get_options();
		}


		/**
		 * This function renders the Note General Settings Section.
		 */
		public static function note_general_section() {
			include_once 'views/html-note-options-general-section.php';
		}

		/**
		 * This function renders the Note Uninstall Settings Section.
		 */
		public static function note_uninstall_section() {
			include_once 'views/html-note-options-uninstall-section.php';
		}

		/**
		 * This function renders the Note Uninstall Data Settings Field.
		 */
		public static function note_uninstall_data_field() {
			include_once 'views/html-note-options-uninstall-data-field.php';
		}

		/**
		 * This function renders the Note options page.
		 */
		public static function render() {
			// Render the main view
			include_once 'views/html-note-options.php';
		}
	}
}

/**
 * Create an instance of the Note_Admin_Options_Views class.
 */
function Note_Admin_Options_Views() {
	return Note_Admin_Options_Views::instance();
}

Note_Admin_Options_Views(); // Note your content!