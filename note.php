<?php
/**
 * Plugin Name: Note - A live edit text widget
 * Plugin URI: http://www.conductorplugin.com/note/
 * Description: Note is a simple and easy to use widget for editing bits of text, live, in your WordPress Customizer
 * Version: 1.4.2
 * Author: Slocum Studio
 * Author URI: http://www.slocumstudio.com/
 * Requires at least: 4.3
 * Tested up to: 4.5.2
 * License: GPLv2 or later
 * License URI: http://www.gnu.org/licenses/gpl-2.0.html
 *
 * Text Domain: note
 * Domain Path: /languages/
 *
 * @see attribution.txt for credits and references
 */

// Bail if accessed directly
if ( ! defined( 'ABSPATH' ) )
	exit;

if ( ! class_exists( 'Note' ) ) {
	final class Note {
		/**
		 * @var string
		 */
		public static $version = '1.4.2';

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
		function __construct( ) {
			// Load required assets
			$this->includes();

			// Hooks
			add_action( 'widgets_init', array( $this, 'widgets_init' ) ); // Init Widgets
		}

		/**
		 * Include required core files used in admin and on the frontend.
		 */
		private function includes() {
			// All
			include_once 'includes/class-note-options.php'; // Note Options Class
			include_once 'includes/class-note-sidebars.php'; // Note Sidebars Class
			include_once 'includes/class-note-customizer.php'; // Note Customizer Class
			include_once 'includes/class-note-scripts-styles.php'; // Note Scripts & Styles Class
			include_once 'includes/admin/class-note-admin.php'; // Core/Main Note Admin Class
			include_once 'includes/note-template-functions.php'; // Note Template Functions

			// Admin Only
			if ( is_admin() ) {
				if ( ! ( $note_option = get_option( Note_Options::$option_name ) ) )
					include_once 'includes/admin/class-note-admin-install.php'; // Note Install Class

			}

			// Front-End Only
			if ( ! is_admin() ) { }
		}

		/**
		 * This function includes and initializes Note widgets.
		 */
		function widgets_init() {
			include_once 'includes/widgets/class-note-widget.php';
		}

		/********************
		 * Helper Functions *
		 ********************/

		/**
		 * This function returns the plugin url for Note without a trailing slash.
		 *
		 * @return string, URL for the Note plugin
		 */
		public static function plugin_url() {
			return untrailingslashit( plugins_url( '', __FILE__ ) );
		}

		/**
		 * This function returns the plugin directory for Note without a trailing slash.
		 *
		 * @return string, Directory for the Note plugin
		 */
		public static function plugin_dir() {
			return untrailingslashit( plugin_dir_path( __FILE__ ) );
		}

		/**
		 * This function returns a reference to this Note class file.
		 *
		 * @return string
		 */
		public static function plugin_file() {
			return __FILE__;
		}

		/**
		 * This function returns the template path for which themes should place their
		 * templates into to override Note default templates (i.e. your-theme/note/).
		 *
		 * @return string, Directory for Note theme templates
		 */
		public static function theme_template_path() {
			return untrailingslashit( apply_filters( 'note_template_path', 'note' ) );
		}

		/**
		 * This function returns a boolean result comparing against the current WordPress version.
		 *
		 * @return Boolean
		 */
		public static function wp_version_compare( $version, $operator = '>=' ) {
			global $wp_version;

			return version_compare( $wp_version, $version, $operator );
		}


		/**********************
		 * Internal Functions *
		 **********************/

		/**
		 * This function checks to see if Conductor has the new flexbox display.
		 */
		// TODO: Remove in a future version as necessary
		public static function conductor_has_flexbox_display( $conductor_widget = false ) {
			// Bail if Conductor doesn't exist
			if ( ! class_exists( 'Conductor' ) || ! function_exists( 'Conduct_Widget' ) )
				return false;

			// If we don't have a Conductor Widget reference, grab one now
			$conductor_widget = ( ! $conductor_widget ) ? Conduct_Widget() : $conductor_widget;

			// If Conductor is greater than 1.2.9 or Conductor Widget instance has the "displays" property, we can check to see if the custom display exists
			return ( ( version_compare( Conductor::$version, '1.2.9', '>' ) || property_exists( $conductor_widget, 'displays' ) ) && isset( $conductor_widget->displays['flexbox'] ) );
		}
	}

	/**
	 * Create an instance of the Note class.
	 */
	function Note() {
		return Note::instance();
	}

	Note(); // Note your content!
}