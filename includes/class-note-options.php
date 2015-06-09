<?php
/**
 * Note Options
 *
 * @class Note_Options
 * @author Slocum Studio
 * @version 1.0.0
 * @since 1.2.0
 */

// Bail if accessed directly
if ( ! defined( 'ABSPATH' ) )
	exit;

if( ! class_exists( 'Note_Options' ) ) {
	final class Note_Options {
		/**
		 * @var string
		 */
		public $version = '1.0.0';

		/**
		 * @var string
		 */
		public static $option_name = 'note';

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
		}

		/**
		 * This function returns the current option values for Note.
		 */
		public static function get_options( $option_name = false ) {
			// If an option name is passed, return that value otherwise default to Note options
			if ( $option_name )
				return wp_parse_args( get_option( $option_name ), Note_Options::get_option_defaults( $option_name ) );

			return wp_parse_args( get_option( Note_Options::$option_name ), Note_Options::get_option_defaults() );
		}

		/**
		 * This function returns the default option values for Note.
		 */
		public static function get_option_defaults( $option_name = false ) {
			$defaults = false;

			// If an option name is passed, return that value otherwise default to Note options
			if ( $option_name )
				$defaults = apply_filters( 'note_options_defaults_' . $option_name, $defaults, $option_name );
			else
				$defaults = array(
					/*
					 * Sidebars
					 *
					 * Example format:
					 *
					 * array(
					 * 		// Post ID
					 * 		1 => array(
					 * 			// Registered Sidebar IDs
					 * 			'content-before',
					 * 			'post-thumbnail-after'
					 *  	)
					 * )
					 */
					'sidebars' => array(),
					// Uninstall TODO
					'uninstall' => array(
						'data' => true // Should Note data be removed upon uninstall?
					)
				);

			return apply_filters( 'note_options_defaults', $defaults, $option_name );
		}
	}

	/**
	 * Create an instance of the Note_Options class.
	 */
	function Note_Options() {
		return Note_Options::instance();
	}

	Note_Options(); // Note your content!
}