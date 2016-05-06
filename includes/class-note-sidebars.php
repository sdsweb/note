<?php
/**
 * Note Sidebars
 *
 * @class Note_Sidebars
 * @author Slocum Studio
 * @version 1.4.1
 * @since 1.2.0
 */

// Bail if accessed directly
if ( ! defined( 'ABSPATH' ) )
	exit;

if ( ! class_exists( 'Note_Sidebars' ) ) {
	final class Note_Sidebars {
		/**
		 * @var string
		 */
		public $version = '1.4.1';

		/**
		 * @var array
		 */
		public $sidebar_locations = array();

		/**
		 * @var array
		 */
		public $registered_sidebar_locations = array();

		/**
		 * @var array
		 */
		public $registered_sidebar_location_filters = array();

		/**
		 * @var array
		 */
		public $sidebars = array();

		/**
		 * @var array
		 */
		public $sidebar_args = array();

		/**
		 * @var WP_Query, Reference to the current WP_Query that is being executed on (i.e. "in_the_loop")
		 */
		public $current_wp_query;

		/**
		 * @var Note_Sidebars, Instance of the class
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
			// Note Options
			$note_options = Note_Options::get_options();

			// Sidebars
			$this->sidebars = $note_options['sidebars'];

			// Hooks
			add_action( 'after_switch_theme', array( $this, 'after_switch_theme' ), 1, 2 ); // After Switch Theme (keep Note Sidebars)
			add_action( 'widgets_init', array( $this, 'widgets_init' ) ); // Widgets Init
			add_filter( 'note_sidebar_locations', array( $this, 'note_sidebar_locations' ) ); // Note Sidebar Locations (register Note Sidebar locations)
			add_action( 'wp', array( $this, 'wp' ) ); // WP
			add_action( 'loop_start', array( $this, 'loop_start' ) ); // Loop Start
			add_action( 'loop_end', array( $this, 'loop_end' ) ); // Loop End
			// TODO: Remove?
			//add_action( 'dynamic_sidebar_before', array( $this, 'dynamic_sidebar_before' ), 10, 2 ); // Dynamic Sidebar Before
			//add_action( 'dynamic_sidebar_after', array( $this, 'dynamic_sidebar_after' ), 10, 2 ); // Dynamic Sidebar After
		}

		/**
		 * Include required core files used in admin and on the frontend.
		 */
		private function includes() {
		}


		/**
		 * This function fires when the user switches their theme and attempts to carry over Note Sidebars/widgets
		 * to the new theme.
		 */
		public function after_switch_theme( $old_theme_name, $old_theme ) {
			// $old_theme will be empty if the old theme does not exist
			if ( ! empty( $old_theme ) ) {
				$this->_sidebars_widgets = get_option( 'sidebars_widgets', array() ); // Get the current sidebar widgets
				add_filter( 'pre_update_option_sidebars_widgets', array( $this, 'pre_update_option_sidebars_widgets' ), 10, 2 );
			}
		}

		/**
		 * This function filters the sidebars_widgets option before it is saved in the database.
		 */
		// TODO: Should we look for Note widgets elsewhere? (i.e. Note widget exists in "footer" sidebar, should we carry that over if the new theme has the same "footer" sidebar?)
		public function pre_update_option_sidebars_widgets( $value, $old_value ) {
			// Make sure we have an old value that is an array
			if ( ! empty( $old_value ) && is_array( $old_value ) ) {
				global $wp_registered_sidebars; // Contains the most up-to-date list of registered sidebars at this point

				$note_sidebars = $this->find_note_sidebar_ids( $wp_registered_sidebars );
				$wp_inactive_widgets = $value['wp_inactive_widgets'];
				$wp_orphaned_widgets = $this->find_orphaned_widgets_sidebar_ids( $value );

				// If we have Note sidebars
				if ( ! empty( $note_sidebars ) ) {
					// Loop through each Note sidebar
					foreach ( $note_sidebars as $key ) {
						// Sidebar existed in previous theme
						if ( isset( $old_value[$key] ) ) {
							$sidebar_widgets = $old_value[$key];

							// Loop through the widgets
							foreach ( $sidebar_widgets as $widget_id => $widget ) {
								// Determine if any of the widgets are "inactive"
								foreach ( $wp_inactive_widgets as $inactive_widget_id => $inactive_widget ) {
									if ( $inactive_widget === $widget ) {
										unset( $value['wp_inactive_widgets'][$inactive_widget_id] );
										break; // We don't need to loop any further
									}
								}

								// Determine if any of the widgets are "orphaned"
								foreach ( $wp_orphaned_widgets as $orphaned_sidebar_id => $orphaned_widget )
									if ( is_array( $orphaned_widget ) && ! empty( $orphaned_widget ) && in_array( $widget, $orphaned_widget ) ) {
										unset( $value[$orphaned_sidebar_id] );
										break; // We don't need to loop any further
									}
							}

							// Carry this sidebar to the new theme
							$value[$key] = $sidebar_widgets;
						}
					}

					// Reset the array keys for inactive widgets
					$value['wp_inactive_widgets'] = array_values( $value['wp_inactive_widgets'] );
				}
			}

			return $value;
		}

		/**
		 * This function registers all Note Sidebars based on options. It also adds the Note Sidebars setting to the
		 * Customizer early to ensure widgets can be registered "on-time".
		 *
		 * This function also sets up properties on this class and allows other plugins and themes
		 * to adjust those properties by filtering.
		 */
		public function widgets_init() {
			// Bail if lower than WordPress 4.1
			if ( Note::wp_version_compare( '4.1', '<' ) )
				return;

			global $wp_customize;

			// Setup sidebar locations
			$this->sidebar_locations = apply_filters( 'note_sidebar_locations', array(
				// Featured Image (Thumbnail)
				/*'post_thumbnail' => array(
					// Location => Sidebar ID
					'before' => 'post-thumbnail-before',
					'after' => 'post-thumbnail-after'
				),*/
				// Title TODO: Should we allow this? Most of the time, the title is wrapped in a Heading (<h1>-<h6>) tag
				/*'title' => array(
					'before' => 'title-before',
					'after' => 'title-after'
				),*/
				// Content
				'content' => array(
					'before' => 'content-before',
					'after' => 'content-after'
				)
			), $this );

			// Customizer Previewer only
			if ( is_customize_preview() && ! is_admin() ) {
				// Register our Note Sidebar setting early to ensure the preview filter is triggered early enough
				$note_option_defaults = Note_Options::get_option_defaults();

				// Setting (data is sanitized upon update_option() call using the sanitize function in Note_Admin_Options)
				$setting = new WP_Customize_Setting( $wp_customize,
					'note[sidebars]', // IDs can have nested array keys
					array(
						'default' => $note_option_defaults['sidebars'],
						'type' => 'option',
						'sanitize_callback' => array( $this, 'sanitize_callback' )
					)
				);
				$wp_customize->add_setting( $setting );

				// Call the preview() function to enable Previewer filters
				$setting->preview();

				// Note Options
				$note_options = Note_Options::get_options();

				// Sidebars
				$this->sidebars = $note_options['sidebars'];
			}

			// Customizer only
			if ( is_customize_preview() )
				// Register Note temporary inactive sidebar
				register_sidebar( array(
					'name'          => __( 'Note Temporary Inactive Sidebar', 'note' ),
					'id'            => 'note-temporary-inactive-sidebar',
					'description'   => __( 'This is a temporary sidebar registered by Note in the Customizer only. It will hold inactive Note Widget Area widgets during a Customizer session only.', 'note' )
				) );

			// Register Note Sidebars
			if ( is_array( $this->sidebars ) )
				self::register_note_sidebars( $this->sidebars );
		}

		/**
		 * This function adds new Note Sidebar locations if they were registered using note_register_sidebar_location().
		 */
		// TODO: More robust checking to see if a "sub"-location exists and if not merge the data
		function note_sidebar_locations( $sidebar_locations ) {
			// First check to see if we have any registered sidebar locations
			if ( empty( $this->registered_sidebar_locations ) )
				return $sidebar_locations;

			// Loop through registered sidebar locations
			foreach ( $this->registered_sidebar_locations as $sidebar_location => $sidebar_args ) {
				// Only "register" this sidebar location if it doesn't already exist
				if ( ! array_key_exists( $sidebar_location, $sidebar_locations ) )
					$sidebar_locations[$sidebar_location] = $sidebar_args;
			}

			return $sidebar_locations;
		}

		/**
		 * This function runs after the WP and WP_Query objects are set up.
		 */
		function wp() {
			// Bail if lower than WordPress 4.1
			if ( Note::wp_version_compare( '4.1', '<' ) )
				return;

			// Note Sidebars (single content types only)
			if ( is_singular() ) {
				// Featured Image (Thumbnail)
				if ( array_key_exists( 'post_thumbnail', $this->sidebar_locations ) )
					add_filter( 'post_thumbnail_html', array( $this, 'post_thumbnail_html' ), 9999, 2 ); // Late

				// Title TODO: Should we allow this? Most of the time, the title is wrapped in a Heading (<h1>-<h6>) tag
				// if ( array_key_exists( 'title', $note_sidebars->sidebar_locations ) )
					// add_filter( 'the_title', array( $this, 'the_title' ), 20, 2 );

				// Content
				if ( array_key_exists( 'content', $this->sidebar_locations ) )
					add_filter( 'the_content', array( $this, 'the_content' ), 9999 ); // Late

				// Note Registered Sidebar Locations
				if ( ! empty( $this->registered_sidebar_locations ) )
					// Loop through registered sidebar locations
					foreach ( $this->registered_sidebar_locations as $sidebar_location => $sidebar_args )
						// Make sure we have a filter for this location
						if ( array_key_exists( $sidebar_location, $this->registered_sidebar_location_filters ) )
							// Add the filter for this location
							add_filter( $sidebar_location, array( $this, 'add_note_sidebars' ) );
			}
		}

		/**
		 * This function stores the current WP_Query reference on this class before The Loop has started.
		 * This reference is used to verify that we are truly in the main query (and not a query within
		 * that query).
		 */
		function loop_start( $query ) {
			// Store the reference to the query
			$this->current_wp_query = $query;
		}

		/**
		 * This function removes the current WP_Query reference from this class after The Loop has finished.
		 */
		function loop_end() {
			// Remove the reference to the query
			$this->current_wp_query = null;
		}

		/**
		 * This function prepends elements to sidebars for use in the Previewer JS scripts.
		 */
		function dynamic_sidebar_before( $sidebar_id, $has_widgets ) {
			// Bail if we're not in the Customizer Preview
			if ( ! is_customize_preview() || is_admin() || ! $has_widgets )
				return;

			// Generate a Note Sidebar ID for this sidebar
			$note_sidebar_id = self::get_sidebar_id( $sidebar_id, get_queried_object_id() );

			// CSS Classes
			$css_classes = array(
				'note-sidebar',
				'note-sidebar-active',
				'note-cf',
				sprintf( 'note-%1$s-sidebar', $sidebar_id ),
			);
		?>
			<div id="<?php echo esc_attr( $note_sidebar_id ); ?>" class="<?php echo esc_attr( implode( ' ', $css_classes ) ); ?>" data-note-sidebar-id="<?php echo esc_attr( $sidebar_id ); ?>">
				<?php add_filter( 'note_sidebar_ui_buttons', array( $this, 'note_sidebar_ui_buttons' ) ); // Remove "Remove Note Sidebar" Button ?>

				<?php echo Note_Customizer::note_sidebar_ui_buttons(); ?>

				<?php remove_filter( 'note_sidebar_ui_buttons', array( $this, 'note_sidebar_ui_buttons' ) ); // Add "Remove Note Sidebar" Button ?>
		<?php
		}


		/**
		 * This function appends elements to sidebars for use in the Previewer JS scripts.
		 */
		function dynamic_sidebar_after( $sidebar_id, $has_widgets ) {
			// Bail if we're not in the Customizer Preview
			if ( ! is_customize_preview() || is_admin() || ! $has_widgets )
				return;
		?>
			</div>
		<?php
		}


		/*****************
		 * Note Sidebars *
		 *****************/

		/**
		 * This function adds Note sidebar areas before/after the featured image (thumbnail). We're
		 * checking the stored WP_Query reference here to verify that we are truly in the main query.
		 * The is_main_query() function will return true here if there is a Loop within a Loop (i.e. a
		 * WP_Query instance is running inside of the main WP_Query instance) so we have to be sure.
		 */
		public function post_thumbnail_html( $html, $post_id ) {
			global $wp_the_query, $post;

			// Reference to sidebar locations for the post thumbnail
			$sidebar_locations = $this->sidebar_locations['post_thumbnail'];

			// Main query, global $post instance matches current query post, correct queried object ID, after wp_head, and sidebar locations exist
			if ( $this->current_wp_query === $wp_the_query && is_main_query() && $post === $wp_the_query->post && $post_id === get_queried_object_id() && $this->did_action( 'wp_head' ) && ! empty( $sidebar_locations ) ) {
				$before_sidebar = $after_sidebar = ''; // Reference to Note Sidebar HTML

				// Before Sidebar
				if ( array_key_exists( 'before', $sidebar_locations ) && ! empty( $sidebar_locations['before'] ) )
					$before_sidebar = self::sidebar( $sidebar_locations['before'], $post_id );

				// After Sidebar
				if ( array_key_exists( 'after', $sidebar_locations ) && ! empty( $sidebar_locations['after'] ) )
					$after_sidebar = self::sidebar( $sidebar_locations['after'], $post_id );

				// Update the HTML
				$html = $before_sidebar . $html . $after_sidebar;
			}

			return $html;
		}

		/**
		 * This function adds Note sidebar areas before/after the current post title. We're checking
		 * the stored WP_Query reference here to verify that we are truly in the main query. The
		 * is_main_query() function will return true here if there is a Loop within a Loop (i.e. a
		 * WP_Query instance is running inside of the main WP_Query instance) so we have to be sure.
		 */
		public function the_title( $title, $post_id ) {
			global $wp_the_query, $post;

			// Reference to sidebar locations for the title
			$sidebar_locations = $this->sidebar_locations['title'];

			// Main query, global $post instance matches current query post, correct queried object ID, after wp_head, and sidebar locations exist
			if ( $this->current_wp_query === $wp_the_query && is_main_query() && $post === $wp_the_query->post && $post_id === get_queried_object_id() && $this->did_action( 'wp_head' ) && ! empty( $sidebar_locations ) ) {
				$before_sidebar = $after_sidebar = ''; // Reference to Note Sidebar HTML

				// Before Sidebar
				if ( array_key_exists( 'before', $sidebar_locations ) && ! empty( $sidebar_locations['before'] ) )
					$before_sidebar = self::sidebar( $sidebar_locations['before'], $post_id );

				// After Sidebar
				if ( array_key_exists( 'after', $sidebar_locations ) && ! empty( $sidebar_locations['after'] ) )
					$after_sidebar = self::sidebar( $sidebar_locations['after'], $post_id );

				// Update the HTML
				$title = $before_sidebar . $title . $after_sidebar;
			}

			return $title;
		}

		/**
		 * This function adds Note sidebar areas before/after the current post content. We're checking
		 * the stored WP_Query reference here to verify that we are truly in the main query. The
		 * is_main_query() function will return true here if there is a Loop within a Loop (i.e. a
		 * WP_Query instance is running inside of the main WP_Query instance) so we have to be sure.
		 */
		public function the_content( $content ) {
			global $wp_the_query, $post;

			// Grab the post ID
			$post_id = get_the_ID();

			// Reference to sidebar locations for the content
			$sidebar_locations = $this->sidebar_locations['content'];

			// Main query, global $post instance matches current query post, correct queried object ID, after wp_head, and sidebar locations exist
			if ( $this->current_wp_query === $wp_the_query && is_main_query() && $post === $wp_the_query->post && $post_id === get_queried_object_id() && $this->did_action( 'wp_head' ) && ! empty( $sidebar_locations ) ) {
				$before_sidebar = $after_sidebar = ''; // Reference to Note Sidebar HTML

				// Before Sidebar
				if ( array_key_exists( 'before', $sidebar_locations ) && ! empty( $sidebar_locations['before'] ) )
					$before_sidebar = self::sidebar( $sidebar_locations['before'], $post_id );

				// After Sidebar
				if ( array_key_exists( 'after', $sidebar_locations ) && ! empty( $sidebar_locations['after'] ) )
					$after_sidebar = self::sidebar( $sidebar_locations['after'], $post_id );

				// Update the HTML
				$content = $before_sidebar . $content . $after_sidebar;
			}

			return $content;
		}

		/**
		 * This function adds Note sidebar areas before/after content on sidebars registered outside of Note.
		 */
		public function add_note_sidebars( $value ) {
			// Grab the current filter
			$filter = current_filter();

			// Grab the filter data
			$filter_data = $this->registered_sidebar_location_filters[$filter];

			// Grab the post ID
			$post_id = ( in_the_loop() ) ? get_the_ID() : 0;

			// Reference to sidebar locations for the content
			$sidebar_locations = $this->sidebar_locations[$filter];

			// Main query, correct queried object ID, after wp_head, and sidebar locations exist
			if ( $this->is_valid_note_sidebars_filter( $filter_data, $post_id, $sidebar_locations ) ) {
				$post_id = ( $post_id === 0 ) ? get_queried_object_id() : $post_id; // Make sure we have a post ID
				$before_sidebar = $after_sidebar = ''; // Reference to Note Sidebar HTML

				// Before Sidebar
				if ( array_key_exists( 'before', $sidebar_locations ) && ! empty( $sidebar_locations['before'] ) )
					$before_sidebar = self::sidebar( $sidebar_locations['before'], $post_id );

				// After Sidebar
				if ( array_key_exists( 'after', $sidebar_locations ) && ! empty( $sidebar_locations['after'] ) )
					$after_sidebar = self::sidebar( $sidebar_locations['after'], $post_id );

				// Update the value
				$value = $before_sidebar . $value . $after_sidebar;
			}

			return $value;
		}

		/**
		 * This function removes the "Remove Note Sidebar" button from the Note Sidebar UI Buttons.
		 */
		function note_sidebar_ui_buttons( $buttons ) {
			// Loop through each button
			foreach ( $buttons as $index => $button ) {
				// Find the "Remove Note Sidebar" button
				if ( $button['id'] === 'remove-note-sidebar' )
					// Remove it
					unset( $buttons[$index] );
			}

			return $buttons;
		}


		/**********************
		 * Internal Functions *
		 **********************/

		/**
		 * This function registers all Note sidebars based on sidebar locations.
		 */
		public static function register_note_sidebars( $sidebars ) {
			// Loop through posts
			foreach ( $sidebars as $post_id => $note_sidebar_ids )
				// Loop through Note Sidebar IDs
				foreach ( $note_sidebar_ids as $sidebar_id )
					// Register the sidebar
					self::register_note_sidebar( $sidebar_id, $post_id );
		}


		/**
		 * This function registers Note sidebars based on parameters.
		 */
		public static function register_note_sidebar( $sidebar_id, $post_id ) {
			$sidebar_args = self::note_sidebar_args( $sidebar_id, $post_id );

			register_sidebar( $sidebar_args );
		}

		/**
		 * This function creates Note sidebar arguments based on parameters.
		 */
		public static function note_sidebar_args( $sidebar_id, $post_id = false, $store_sidebar_args_reference = true ) {
			// Grab the Note Sidebars instance
			$note_sidebars = Note_Sidebars();

			// Get the sidebar name prefix for this layout
			$sidebar_id_sanitized = sanitize_html_class( $sidebar_id );
			$note_sidebar_id = self::get_sidebar_id( $sidebar_id, $post_id );
			$note_sidebar_id_sanitized = sanitize_html_class( $note_sidebar_id );
			$sidebar_name = str_replace( '-', ' ', $sidebar_id );
			$post_title = get_the_title( $post_id );
			$sidebar_name_prefix = ( ! empty( $post_title ) ) ? $post_title . ' - ' : '';

			$sidebar_args = array(
				'name'          => ( ! empty( $sidebar_name_prefix ) ) ? $sidebar_name_prefix . ucwords( $sidebar_name ) : ucwords( $sidebar_name ),
				'id'            => $note_sidebar_id,
				'description'   => sprintf( __( 'This is the %1$s widget area.', 'note' ), ( ! empty( $sidebar_name_prefix ) ) ? str_replace( ' -', '', $sidebar_name_prefix ) . $sidebar_name : $sidebar_name ),
				'before_widget' => '<div id="' . $note_sidebar_id_sanitized . '-widget-%1$s" class="' . $note_sidebar_id_sanitized . ' ' . $note_sidebar_id_sanitized . '-widget note-' . $sidebar_id_sanitized . '-widget %2$s">',
				'after_widget'  => '</div>',
				'before_title'  => '<h3 class="widgettitle widget-title ' . $note_sidebar_id_sanitized . '-widget-title note-' . $sidebar_id_sanitized . '-widget-title">',
				'after_title'   => '</h3>',
			);
			$sidebar_args = apply_filters( 'note_sidebar_args', $sidebar_args, $sidebar_id, $post_id );

			// Store Note Sidebar arguments for this sidebar
			if ( $store_sidebar_args_reference )
				$note_sidebars->sidebar_args[$sidebar_id] = $sidebar_args;

			return $sidebar_args;
		}

		/**
		 * This function creates a sidebar id for Note Sidebars.
		 */
		public static function get_sidebar_id( $sidebar_id, $post_id = false ) {
			$post_type = get_post_type( $post_id );

			// Create an ID based on parameters
			$id = 'note-';
			$id .= ( $post_type ) ? $post_type . '-' : '';
			$id .= ( $post_id ) ? $post_id . '-' : '';
			$id .= $sidebar_id . '-sidebar';

			return apply_filters( 'note_sidebar_id', $id, $sidebar_id, $post_id );
		}

		/**
		 * This function fetches an argument from an array of data created from Note_Sidebars::note_sidebar_args().
		 */
		// TODO: Filter?
		public static function get_sidebar_arg( $key, $sidebar_args ) {
			// Return this argument if it exists
			return ( isset( $sidebar_args[$key] ) ) ? $sidebar_args[$key] : false;
		}

		/**
		 * This function generates Note Sidebar argument data for use in the Customizer localization data.
		 */
		// TODO: Is there a way to not register these settings and controls and still have the data that we need?
		// TODO: Instead of calling get_content here, use an UnderscoreJS template
		public static function get_customizer_sidebar_args( $previewer = false ) {
			// Bail if lower than WordPress 4.1
			if ( Note::wp_version_compare( '4.1', '<' ) )
				return array();

			global $post, $wp_customize;

			// Grab the Note Sidebars instance
			$note_sidebars = Note_Sidebars();

			// Grab the sidebars widget option
			$sidebars_widgets = get_option( 'sidebars_widgets' );

			// Bail if in the Customizer isn't ready
			if ( ! is_a( $wp_customize, 'WP_Customize_Manager' ) )
				return $note_sidebars->sidebar_args;

			// Setup post ID, section prefix, and widgets panel flag
			$post_id = ( ! empty( $post ) && is_a( $post, 'WP_Post' ) ) ? $post->ID : false;
			$post_id = apply_filters( 'note_customizer_sidebar_args_post_id', $post_id, $previewer, $note_sidebars );
			$section_prefix = 'sidebar-widgets-';
			$remove_widgets_panel = false;

			// If the widgets panel doesn't exist yet, create a mock one now with a title for the json() methods used below
			if ( ! $wp_customize->get_panel( 'widgets' ) ) {
				// Widgets Panel
				$wp_customize->add_panel( 'widgets', array(
					'type' => 'widgets',
					'title' => __( 'Widgets', 'note' )
				) );

				// Set the flag
				$remove_widgets_panel = true;
			}

			// Format sidebar locations for localizations
			foreach ( $note_sidebars->sidebar_locations as $sidebar_location )
				// Loop through each sidebar within this location
				foreach ( $sidebar_location as $sidebar_id ) {
					// Note Sidebar arguments for this sidebar
					$sidebar_args = self::note_sidebar_args( $sidebar_id, $post_id );

					// Get the sidebar ID
					$customizer_sidebar_id = self::get_sidebar_arg( 'id', $sidebar_args );

					// Generate a setting ID
					$setting_id = 'sidebars_widgets[' . $customizer_sidebar_id . ']';

					// Create a mock Customizer Setting
					$wp_customize->add_setting( $setting_id, $wp_customize->widgets->get_setting_args( $setting_id ) );

					// Generate a section ID
					$section_id = $section_prefix . $customizer_sidebar_id;

					// Create a mock Customizer Section
					$customizer_section = new Note_Customizer_Sidebar_Section( $wp_customize, $section_id, array(
						'id' => $section_id,
						'title' => self::get_sidebar_arg( 'name', $sidebar_args ),
						'description' => self::get_sidebar_arg( 'description', $sidebar_args ),
						'sidebar_id' => $customizer_sidebar_id,
						'panel' => 'widgets'
					) );
					$wp_customize->add_section( $customizer_section );

					// Create a mock Customizer Control
					$customizer_control = new Note_Customizer_Sidebar_Control( $wp_customize, $setting_id, array(
						'description' => self::get_sidebar_arg( 'description', $sidebar_args ),
						'section' => $section_id,
						'sidebar_id' => $customizer_sidebar_id,
						'priority' => 0 // No active widgets
					) );
					$wp_customize->add_control( $customizer_control );

					// Customizer data
					$sidebar_args['customizer'] = array(
						// Setting
						'setting' => array(
							'id' => $setting_id,
							'transport' => 'refresh',
							'value' => ( isset( $sidebars_widgets[$customizer_sidebar_id] ) ) ? $sidebars_widgets[$customizer_sidebar_id] : array()
						),
						// Section
						'section' => ( $customizer_section && method_exists( $customizer_section, 'json' ) ) ? $customizer_section->json() : array(),
						// Control
						'control' => ( $customizer_control && method_exists( $customizer_control, 'json' ) ) ? $customizer_control->json() : array()
					);

					/*
					 * Adjust section data
					 */
					$sidebar_args['customizer']['section']['active'] = true; // Activate this section within the Customizer when it is created
					unset( $sidebar_args['customizer']['section']['instanceNumber'] ); // Remove instance number

					/*
					 * Adjust control data
					 */
					$sidebar_args['customizer']['control']['id'] = $setting_id; // ID
					$sidebar_args['customizer']['control']['active'] = true; // Activate this control within the Customizer when it is created
					$sidebar_args['customizer']['control']['priority'] = 0; // No active widgets
					unset( $sidebar_args['customizer']['control']['instanceNumber'] ); // Remove instance number

					// If we're not in the Previewer, remove the mock Settings, Sections, and Controls active
					if ( ! $previewer ) {
						// Remove Customizer mock setting, section, and control
						$wp_customize->remove_setting( $setting_id );
						$wp_customize->remove_section( $section_id );
						$wp_customize->remove_control( $setting_id );
					}

					// Store a reference to the sidebar arguments
					$note_sidebars->sidebar_args[$sidebar_id] = $sidebar_args;
				}

			return $note_sidebars->sidebar_args;
		}

		/**
		 * This function sanitizes Note Sidebar data from the Customizer. $input only contains Note Sidebar
		 * data and not other Note_Options data since it's being sent through the Customizer.
		 */
		public function sanitize_callback( $input ) {
			// Decode JSON data to an associative array if necessary
			$input = ( ! is_array( $input ) ) ? json_decode( $input, true ) : $input;

			// Note Sidebars
			if ( ! empty( $input ) && is_array( $input ) ) {
				// Loop through Note sidebars
				foreach ( $input as $post_id => &$value )
					// If the post was not found
					// TODO: What if the $post_id is an int for a category (i.e. category ID)?
					if ( is_int( $post_id ) && ! get_post_status( $post_id ) )
						unset( $input[$post_id] );
					// Otherwise, we have a valid post, sanitize the values
					else
						// TODO: Sanitize $post_id key here
						// Loop through sidebars
						foreach ( $value as $note_sidebar_id ) {
							$valid_sidebar = false; // Flag

							// Loop through sidebar locations ('before' and 'after')
							foreach ( $this->sidebar_locations as $note_sidebar_locations )
								// Sidebar was found in this Note Sidebar location
								if ( in_array( $note_sidebar_id, $note_sidebar_locations ) ) {
									// Set the flag to true
									$valid_sidebar = true;

									// Break out of loop
									break;
								}

							// If this isn't a valid sidebar, remove it
							if ( ! $valid_sidebar )
								unset( $value[$note_sidebar_id] );
						}
			}

			return $input;
		}

		/**
		 * This function sanitizes (json_encode) Note Sidebar data from the Customizer for use
		 * in JavaScript.
		 */
		public function sanitize_js_callback( $value, $wp_customize ) {
			return json_encode( $value );
		}

		/**
		 * This function determines if an action has already been completed. It also checks to make
		 * sure that the current filter does not match the $tag to ensure the action is not currently
		 * running, but rather has been completely executed.
		 */
		public function did_action( $tag ) {
			return ( int ) did_action( $tag ) - ( int ) doing_action( $tag );
		}

		/**
		 * This function outputs a Note Sidebar based on parameters. It will fallback to the placeholder if the current
		 * page is being output in the Previewer. Otherwise it will return an empty string.
		 */
		public static function sidebar( $sidebar_id, $post_id ) {
			// Reference to sidebar HTML
			$sidebar_html = '';

			// Grab the Note Sidebars instance
			$note_sidebars = Note_Sidebars();

			$registered_sidebars = isset( $note_sidebars->sidebars[$post_id] ) ? ( array ) $note_sidebars->sidebars[$post_id] : array();
			$note_sidebar_id = self::get_sidebar_id( $sidebar_id, $post_id );

			// If the sidebar ID is in the array of registered sidebars for this post, it is already registered on Note_Sidebars::widgets_init()
			if ( in_array( $sidebar_id, $registered_sidebars ) ) {
				// If the sidebar is active
				if ( is_active_sidebar( $note_sidebar_id ) ) {
					ob_start();
						// Note Sidebar arguments
						$sidebar_args = $note_sidebars->sidebar_args[$sidebar_id];

						// CSS Classes
						$css_classes = array(
							'note-sidebar',
							'note-sidebar-active',
							'note-cf',
							sprintf( 'note-%1$s-sidebar', $sidebar_id ),
						);

						// Sanitize CSS classes
						$css_classes = array_filter( $css_classes, 'sanitize_html_class' );
					?>
						<div id="<?php echo esc_attr( self::get_sidebar_arg( 'id', $sidebar_args ) ); ?>" class="<?php echo esc_attr( implode( ' ', $css_classes ) ); ?>"  data-post-id="<?php echo esc_attr( $post_id ); ?>" data-note-sidebar-id="<?php echo esc_attr( $sidebar_id ); ?>" data-note-sidebar="true">
							<?php echo ( is_customize_preview() && ! is_admin() ) ? Note_Customizer::note_sidebar_ui_buttons() : false; ?>

							<?php
								// Remove Note UI filters
								// TODO: Remove?
								//remove_filter( 'dynamic_sidebar_before', array( $note_sidebars, 'dynamic_sidebar_before' ) );
								//remove_filter( 'dynamic_sidebar_after', array( $note_sidebars, 'dynamic_sidebar_after' ) );
							?>

							<?php dynamic_sidebar( $note_sidebar_id ); ?>

							<?php
								// Re-add Note UI filters
								// TODO: Remove?
								//add_filter( 'dynamic_sidebar_before', array( $note_sidebars, 'dynamic_sidebar_before' ), 10, 2 );
								//add_filter( 'dynamic_sidebar_after', array( $note_sidebars, 'dynamic_sidebar_after' ), 10 ,2 );
							?>
						</div>
					<?php
					$sidebar_html = ob_get_clean();
				}
				// Otherwise the sidebar is inactive (no widgets)
				else if ( is_customize_preview() && ! is_admin() )
					// Note Sidebar Placeholder (inactive sidebar)
					$sidebar_html = Note_Customizer::note_sidebar_placeholder( $sidebar_id, $post_id, true );
			}
			// Customizer Previewer
			else if ( is_customize_preview() && ! is_admin() )
				// Note Sidebar Placeholder (no registered sidebar)
				$sidebar_html = Note_Customizer::note_sidebar_placeholder( $sidebar_id, $post_id );

			return $sidebar_html;
		}

		/**
		 * This function is used to determine Note Sidebars based on the $sidebars_widgets parameter. If
		 * $sidebars_widgets is not passed, get_option( 'sidebars_widgets' ) is used as a fallback.
		 */
		public function find_note_sidebar_ids( $sidebars_widgets = false ) {
			$keys = array();

			if ( empty( $sidebars_widgets ) )
				$sidebars_widgets = get_option( 'sidebars_widgets' );

			$sidebars_widgets_keys = array_keys( $sidebars_widgets );

			if ( ! empty( $sidebars_widgets_keys ) )
				foreach ( $sidebars_widgets_keys as $key )
					if ( strpos( $key, 'note' ) === 0 )
						$keys[] = $key;

			return $keys;
		}

		/**
		 * This function is used to find all orphaned widgets during a theme switch.
		 */
		public function find_orphaned_widgets_sidebar_ids( $sidebars_widgets = false ) {
			$orphans = array();

			if ( empty( $sidebars_widgets ) )
				$sidebars_widgets = get_option( 'sidebars_widgets', array() );

			foreach ( $sidebars_widgets as $key => $widgets )
				if ( strpos( $key, 'orphaned_widgets' ) === 0 )
					$orphans[$key] = $widgets;

			return $orphans;
		}

		/**
		 * This function determines if the filter is valid for Note Sidebar locations.
		 */
		public function is_valid_note_sidebars_filter( $filter_data, $post_id, $sidebar_locations ) {
			global $wp_the_query, $post;

			return ( $filter_data['in_the_loop'] ) ? $this->current_wp_query === $wp_the_query && is_main_query() && $post === $wp_the_query->post && $post_id === get_queried_object_id() && $this->did_action( 'wp_head' ) && ! empty( $sidebar_locations ) : $this->did_action( 'wp_head' ) && ! empty( $sidebar_locations );
		}
	}

	/**
	 * Create an instance of the Note_Sidebars class.
	 */
	function Note_Sidebars() {
		return Note_Sidebars::instance();
	}

	Note_Sidebars(); // Note your content!
}