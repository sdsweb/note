<?php
/**
 * Note Admin Options
 *
 * @class Note_Admin_Options
 * @author Slocum Studio
 * @version 1.4.1
 * @since 1.2.0
 */

// Bail if accessed directly
if ( ! defined( 'ABSPATH' ) )
	exit;

if( ! class_exists( 'Note_Admin_Options' ) ) {
	final class Note_Admin_Options {
		/**
		 * @var string
		 */
		public $version = '1.4.1';

		/**
		 * @var string
		 */
		public static $menu_page = 'note';

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

			// Hooks
			// TODO
			add_action( 'admin_menu', array( $this, 'admin_menu' ) ); // Set up admin menu item
			add_action( 'admin_menu', array( $this, 'admin_menu_sub_menu' ), 9999 ); // Adjust the main Note sub-menu item
			add_action( 'admin_enqueue_scripts', array( $this, 'admin_enqueue_scripts' ) ); // Load CSS/JavaScript
			add_filter( 'wp_redirect', array( $this, 'wp_redirect' ) ); // Add "hash" (tab) to URL before re-direct
			add_action( 'admin_init', array( $this, 'admin_init' ) ); // Register setting
		}

		/**
		 * Include required core files used in admin and on the frontend.
		 */
		private function includes() {
			include_once 'class-note-admin-options-views.php'; // Note Admin Options View Controller TODO
		}

		/**
		 * This function creates the admin sub-menu item for Note admin functionality
		 */
		public function admin_menu() {
			// Note Admin Page (under "Settings")
			self::$menu_page = add_submenu_page( 'options-general.php', __( 'Note', 'note' ), __( 'Note', 'note' ), 'manage_options', 'note', array( $this, 'render' ) );
		}

		/**
		 * This function adjusts the priority of the Note admin page in the Settings sub-menu.
		 */
		public function admin_menu_sub_menu() {
			global $submenu;

			$note_sub_menu_priority = $max_priority = -1;
			$note_sub_menu_item = array();

			// Find the Note sub-menu item
			foreach ( $submenu as $sub_menu => &$sub_menu_pages )
				// "Settings"
				if ( $sub_menu === 'options-general.php' ) {
					// Loop through sub-menu items
					foreach ( $sub_menu_pages as $priority => $sub_menu_page )
						// Note ([2] index is always the slug)
						if ( $sub_menu_page[2] === 'note' ) {
							// Store a reference to the priority
							$note_sub_menu_priority = $priority;

							// Store a reference to the item
							$note_sub_menu_item = $sub_menu_page;

							// Break out of the loop
							break;
						}

					// If we found Note
					if ( $note_sub_menu_priority ) {
						// Find the maximum priority for this section
						$max_priority = max( array_keys( $sub_menu_pages ) );

						// Unset the old sub-menu item
						unset( $sub_menu_pages[$note_sub_menu_priority] );

						// Add the new sub-menu item
						$sub_menu_pages[$max_priority . '.01001110'] = $note_sub_menu_item;
					}

					// Break out of loop
					break;
				}
		}

		/**
		 * This function enqueues CSS/JavaScript on the Note Options Page.
		 */
		public function admin_enqueue_scripts( $hook ) {
			// Bail if we're not on the note page
			if ( $hook !== Note_Admin_Options::$menu_page )
				return;

			// Stylesheets
			wp_enqueue_style( 'note-admin', Note::plugin_url() . '/assets/css/note-admin.css', false, Note::$version );

			// Scripts
			wp_enqueue_script( 'note-admin', Note::plugin_url() . '/assets/js/note-admin.js', array( 'jquery', 'common' ), Note::$version, true );
			wp_enqueue_script( 'jquery-fitvids', Note::plugin_url() . '/assets/js/fitvids.js', array( 'jquery' ), Note::$version, true );
		}

		/*
		 * This function appends the hash for the current tab based on POST data.
		 */
		function wp_redirect( $location ) {
			// Append tab "hash" to end of URL
			if ( strpos( $location, Note_Options::$option_name ) !== false && isset( $_POST['note_options_tab'] ) && $_POST['note_options_tab'] )
				$location .= esc_url( $_POST['note_options_tab'] );

			return $location;
		}

		/**
		 * This function registers a setting for Note and adds setting sections and setting fields.
		 */
		public function admin_init() {
			// Register Setting
			register_setting( Note_Options::$option_name, Note_Options::$option_name, array( $this, 'sanitize_option' ) );

			// Note General
			add_settings_section( 'note_general_section', __( 'Welcome', 'note' ), array( $this, 'note_general_section' ), Note_Options::$option_name . '_general' );

			// Note Uninstall
			add_settings_section( 'note_uninstall_section', __( 'Uninstall', 'note' ), array( $this, 'note_uninstall_section' ), Note_Options::$option_name . '_general' );
			add_settings_field( 'note_uninstall_data_field', __( 'Uninstall Data', 'note' ), array( $this, 'note_uninstall_data_field' ), Note_Options::$option_name . '_general', 'note_uninstall_section' );
		}

		/**
		 * This function renders the Note General Settings Section.
		 */
		public function note_general_section() {
			Note_Admin_Options_Views::note_general_section();
		}

		/**
		 * This function renders the Note Uninstall Settings Section.
		 */
		public function note_uninstall_section() {
			Note_Admin_Options_Views::note_uninstall_section();
		}

		/**
		 * This function renders the Note Uninstall Data Settings Field.
		 */
		public function note_uninstall_data_field() {
			Note_Admin_Options_Views::note_uninstall_data_field();
		}

		/**
		 * This function renders the Note options page.
		 */
		public function render() {
			// Render the main view
			Note_Admin_Options_Views::render();
		}

		/**
		 * This function sanitizes the option values before they are stored in the database.
		 */
		// TODO: We need filters here
		public function sanitize_option( $input ) {
			// TODO Reset to defaults?
			//if ( isset( $input['reset'] ) )
			//	return Note_Options::get_option_defaults();

			// Store the raw input values from the user which will be used in certain validation checks
			$raw_input = $input;

			// Parse arguments, replacing defaults with user input
			$input = wp_parse_args( $input, Note_Options::get_option_defaults() );

			// Note Sidebars
			if ( ! empty( $input['sidebars'] ) && is_array( $input['sidebars'] ) ) {
				$note_sidebars = Note_Sidebars(); // Grab the Note Sidebars instance

				// Sanitize sidebars
				$input['sidebars'] = $note_sidebars->sanitize_callback( $input['sidebars'] );
			}
			// For now, let's make sure we keep the Note Sidebar value (sidebars will be empty if submitting from Note Settings page)
			else {
				// Grab current version of Note Options
				$note_options = Note_Options::get_options();

				// Previously sanitized by the Customizer logic (@see Note_Sidebars::sanitize_callback())
				$input['sidebars'] = $note_options['sidebars'];
			}


			// Note Uninstall
			$input['uninstall']['data'] = ( isset( $raw_input['uninstall']['data'] ) && $input['uninstall']['data'] ) ? true : false; // Remove Note data on uninstall (checking isset() here due to the nested arrays)

			return $input;
		}
	}
}

/**
 * Create an instance of the Note_Admin_Options class.
 */
function Note_Admin_Options() {
	return Note_Admin_Options::instance();
}

Note_Admin_Options(); // Note your content!