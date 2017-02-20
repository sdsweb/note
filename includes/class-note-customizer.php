<?php
/**
 * Note Customizer (Customizer functionality)
 *
 * @class Note_Customizer
 * @author Slocum Studio
 * @version 1.4.1
 * @since 1.0.0
 */

// Bail if accessed directly
if ( ! defined( 'ABSPATH' ) )
	exit;

if ( ! class_exists( 'Note_Customizer' ) ) {
	final class Note_Customizer {
		/**
		 * @var string
		 */
		public $version = '1.4.1';

		/**
		 * @var array
		 */
		public $note_editor_types = array( 'default', 'media', 'rich_text_only' );

		/**
		 * @var array
		 */
		public $note_customizer_localize = array();

		/**
		 * @var array
		 */
		public $note_localize = array();

		/**
		 * @var array
		 */
		public $note_tinymce_localize = array();

		/**
		 * @var array
		 */
		public $note_sidebar_args = array();

		/**
		 * @var array
		 */
		public $note_sidebar_locations = array();

		/**
		 * @var array
		 */
		public $note_registered_sidebars = array();

		/**
		 * @var array
		 */
		public $note_unregistered_sidebars = array();

		/**
		 * @var array
		 */
		public $note_inactive_sidebars = array();

		/**
		 * @var array
		 */
		public $note_inactive_widgets = array();

		/**
		 * @var array
		 */
		public $note_inactive_sidebars_widgets = array();

		/**
		 * @var array
		 */
		public $old_sidebars_widgets = array();

		/**
		 * @var Note_Customizer, Instance of the class
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
			add_action( 'init', array( $this, 'init' ) ); // Init
			add_action( 'wp_loaded', array( $this, 'wp_loaded' ), 1 ); // WP Loaded (early; before core Customizer)
			add_action( 'customize_register', array( $this, 'customize_register' ) ); // Customizer Register (before anything else)
			add_action( 'customize_controls_enqueue_scripts', array( $this, 'customize_controls_enqueue_scripts' ) ); // Enqueue scripts in Customizer
			add_action( 'customize_controls_print_footer_scripts', array( $this, 'customize_controls_print_footer_scripts' ) ); // Print scripts in Customizer
			add_action( 'customize_preview_init', array( $this, 'customize_preview_init' ) ); // Customizer Preview Initialization
		}

		/**
		 * Include required core files used in admin and on the frontend.
		 */
		private function includes() {
			include_once 'customizer/class-note-customizer-sidebar-section.php'; // Note Sidebar Section
			include_once 'customizer/class-note-customizer-sidebar-control.php'; // Note Sidebar Control
		}

		/**
		 * This function sets up properties on this class and allows other plugins and themes
		 * to adjust those properties by filtering.
		 */
		public function init() {
			global $wp_version, $wp_customize, $wp_registered_widgets, $wp_registered_sidebars;

			// Load required assets
			$this->includes();

			// Grab the Note Widget instance
			if ( function_exists( 'Note_Widget' ) )
				$note_widget = Note_Widget();

			// Determine HTML5 support
			$caption_html5_support = current_theme_supports( 'html5', 'caption' ); // Captions
			$gallery_html5_support = current_theme_supports( 'html5', 'gallery' ); // Galleries

			// Grab Note options
			$note_options = Note_Options::get_options();

			// Setup of Note Sidebar data if we're in the Customizer
			if ( is_customize_preview() ) {
				// Grab the Note Sidebars instance
				$note_sidebars = Note_Sidebars();

				// Grab Note Sidebar Customizer arguments
				$this->note_sidebar_args = Note_Sidebars::get_customizer_sidebar_args();

				// Loop through Note sidebars
				foreach ( $note_sidebars->sidebars as $post_id => $note_sidebar_ids ) {
					// Loop through Note sidebar locations
					foreach ( $note_sidebars->sidebar_locations as $sidebar_location )
						// Loop through each sidebar within this location
						foreach ( $sidebar_location as $sidebar_id )
							// Add the sidebar ID to the list of registered sidebars
							$this->note_sidebar_locations[] = Note_Sidebars::get_sidebar_id( $sidebar_id, $post_id );

					// Loop through registered Note Sidebar IDs
					foreach ( $note_sidebar_ids as $sidebar_id )
						// Add the sidebar ID to the list of registered sidebars
						$this->note_registered_sidebars[] = Note_Sidebars::get_sidebar_id( $sidebar_id, $post_id );
				}

				$this->note_unregistered_sidebars = array_values( array_diff( $this->note_sidebar_locations, $this->note_registered_sidebars ) );

				$sidebars_widgets = array_merge(
					array( 'wp_inactive_widgets' => array() ),
					array_fill_keys( array_keys( $wp_registered_sidebars ), array() ),
					wp_get_sidebars_widgets()
				);

				// Loop through sidebar widgets
				foreach ( $sidebars_widgets as $sidebar_id => $sidebar_widget_ids ) {
					if ( empty( $sidebar_widget_ids ) )
						$sidebar_widget_ids = array();

					// Unregistered Note Sidebars only
					if ( in_array( $sidebar_id, $this->note_unregistered_sidebars ) ) {
						// Store a reference to sidebars that were previously active but are now inactive
						$this->note_inactive_sidebars[] = $sidebar_id;

						// Add a control for each inactive widget
						foreach ( $sidebar_widget_ids as $i => $widget_id )
							// Only widgets that are still registered
							if ( isset( $wp_registered_widgets[$widget_id] ) ) {
								// Customizer is ready
								if ( is_a( $wp_customize, 'WP_Customize_Manager' ) ) {
									$setting_id = $wp_customize->widgets->get_setting_id( $widget_id );

									// Store a reference to the Customizer setting ID for this inactive widget
									$this->note_inactive_widgets[] = array(
										'widget_id' => $widget_id,
										'setting_id' => $setting_id
									);

									if ( ! isset( $this->note_inactive_sidebars_widgets[$sidebar_id] ) )
										$this->note_inactive_sidebars_widgets[$sidebar_id] = array();

									// Store a reference to the inactive widget attached to the sidebar ID
									$this->note_inactive_sidebars_widgets[$sidebar_id][$i] = array(
										'widget_id' => $widget_id,
										'setting_id' => $setting_id
									);
								}
							}
					}
				}
			}


			// Note Widget Editor Types
			$this->note_editor_types = apply_filters( 'note_tinymce_editor_types', $this->note_editor_types, $this );


			// Setup Customizer localization
			$this->note_customizer_localize = apply_filters( 'note_customizer_localize', array(
				'wp_version' => $wp_version,
				'wp_major_version' => ( int ) substr( $wp_version, 0, 1 ),
				// Note Sidebars
				'sidebars' => array(
					// Registered sidebars
					'registered' => $note_options['sidebars'],
					// Customizer data
					'customizer' => array(
						'setting' => 'note[sidebars]',
						'section' => 'note_sidebars',
						'control' => 'note_sidebars',
						'section_prefix' => 'sidebar-widgets-',
						'inactive_sidebars' => $this->note_inactive_sidebars,
						'inactive_widgets' => $this->note_inactive_widgets,
						'inactive_sidebars_widgets' => $this->note_inactive_sidebars_widgets
					),
					// Note Sidebar args
					'args' => $this->note_sidebar_args
				)
			), $this );


			// Setup Previewer localization
			$this->note_localize = apply_filters( 'note_localize', array(
				// TinyMCE Config Parameters
				// TODO: https://github.com/WordPress/WordPress/blob/cd0ba24e9583a707b0ba055f0a3d9cd0f9b36549/wp-includes/class-wp-editor.php#L469
				'tinymce' => array(
					'selector' => '.note-widget .widget-content',
					// Allow filtering of plugins on an array instead of a space separated string
					'plugins' => implode( ' ', array_unique( apply_filters( 'note_tinymce_plugins', array(
						// General
						'colorpicker', // TinyMCE Color Picker
						'hr', // TinyMCE Horizontal Rule
						'lists', // TinyMCE Lists
						'media', // TinyMCE Media
						'paste', // TinyMCE Paste
						'textcolor', // TinyMCE Text Color
						// WordPress
						'wordpress', // WordPress
						'wpeditimage', // WordPress Edit Image
						'wpembed', // WordPress Embed
						'wpgallery', // WordPress Gallery
						'wplink', // WordPress Link
						'wptextpattern', // WordPress Text Pattern
						'wpview', // WordPress View
						// Note
						'note_insert', // Note Insert
						'note_placeholder', // Note Placeholder
					), $this ) ) ),
					// Block level elements
					'blocks' => apply_filters( 'note_tinymce_blocks', array(
						'wp_image',
						'note_edit'
					), $this ),
					// Custom TinyMCE theme expects separate "rows"
					'toolbar' => apply_filters( 'note_tinymce_toolbar', array(
						'formatselect',
						'styleselect',
						'forecolor',
						'backcolor',
						'bold',
						'italic',
						'link',
						'unlink',
						'bullist',
						'numlist',
						'outdent',
						'indent',
						'alignleft',
						'aligncenter',
						'alignright',
						'alignjustify'
					), $this ),
					// Alignment Formats
					'formats' => array(
						// Align Left
						'alignleft' => array(
							array(
								'selector' => 'p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li,address',
								'styles' => array(
									'textAlign' => 'left'
								)
							),
							array(
								'selector' => 'img,table,dl.wp-caption',
								'classes' => array(
									'alignleft'
								)
							)
						),
						// Align Center
						'aligncenter' => array(
							array(
								'selector' => 'p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li,address',
								'styles' => array(
									'textAlign' => 'center'
								)
							),
							array(
								'selector' => 'img,table,dl.wp-caption',
								'classes' => array(
									'aligncenter'
								)
							)
						),
						// Align Right
						'alignright' => array(
							array(
								'selector' => 'p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li,address',
								'styles' => array(
									'textAlign' => 'right'
								)
							),
							array(
								'selector' => 'img,table,dl.wp-caption',
								'classes' => array(
									'alignright'
								)
							)
						)
					),
					// Block Formats
					/*'block_formats' => implode( '', array_unique( apply_filters( 'note_tinymce_block_formats', array(
						'Paragraph=p;',
						'Address=address;',
						'Pre=pre;',
						'Heading 1=h1;',
						'Heading 2=h2;',
						'Heading 3=h3;',
						'Heading 4=h4;',
						'Heading 5=h5;',
						'Heading 6=h6;'
					), $this ) ) ),*/
					// Preview Styles, which CSS styles should the style_formats be allowed for the preview
					'preview_styles' => implode( ' ', array_unique( apply_filters( 'note_tinymce_preview_styles', array(
						'font-family',
						'font-size',
						'font-weight',
						'font-style',
						'text-decoration',
						'text-transform',
						'color',
						'background-color',
						'border',
						'border-radius',
						'outline',
						'text-shadow'
					), $this ) ) ),
					// Style Formats @see http://www.tinymce.com/wiki.php/Configuration:style_formats, @see http://www.tinymce.com/wiki.php/Configuration:formats
					'style_formats' => apply_filters( 'note_tinymce_style_formats', array(
						// 12px
						array(
							'title' => __( '12px', 'note' ),
							'inline' => 'span',
							'styles' => array(
								'fontSize' => '12px'
							)
						),
						// 14px
						array(
							'title' => __( '14px', 'note' ),
							'inline' => 'span',
							'styles' => array(
								'fontSize' => '14px'
							)
						),
						// 16px
						array(
							'title' => __( '16px', 'note' ),
							'inline' => 'span',
							'styles' => array(
								'fontSize' => '16px'
							)
						),
						// 18px
						array(
							'title' => __( '18px', 'note' ),
							'inline' => 'span',
							'styles' => array(
								'fontSize' => '18px'
							)
						),
						// 20px
						array(
							'title' => __( '20px', 'note' ),
							'inline' => 'span',
							'styles' => array(
								'fontSize' => '20px'
							)
						),
						// 22px
						array(
							'title' => __( '22px', 'note' ),
							'inline' => 'span',
							'styles' => array(
								'fontSize' => '22px'
							)
						),
						// 24px
						array(
							'title' => __( '24px', 'note' ),
							'inline' => 'span',
							'styles' => array(
								'fontSize' => '24px'
							)
						),
						// 28px
						array(
							'title' => __( '28px', 'note' ),
							'inline' => 'span',
							'styles' => array(
								'fontSize' => '28px'
							)
						),
						// 32px
						array(
							'title' => __( '32px', 'note' ),
							'inline' => 'span',
							'styles' => array(
								'fontSize' => '32px'
							)
						),
						// 36px
						array(
							'title' => __( '36px', 'note' ),
							'inline' => 'span',
							'styles' => array(
								'fontSize' => '36px'
							)
						),
						// 42px
						array(
							'title' => __( '42px', 'note' ),
							'inline' => 'span',
							'styles' => array(
								'fontSize' => '42px'
							)
						),
						// 48px
						array(
							'title' => __( '48px', 'note' ),
							'inline' => 'span',
							'styles' => array(
								'fontSize' => '48px'
							)
						),
						// 56px
						array(
							'title' => __( '56px', 'note' ),
							'inline' => 'span',
							'styles' => array(
								'fontSize' => '56px'
							)
						),
						// 64px
						array(
							'title' => __( '64px', 'note' ),
							'inline' => 'span',
							'styles' => array(
								'fontSize' => '64px'
							)
						),
						// 72px
						array(
							'title' => __( '72px', 'note' ),
							'inline' => 'span',
							'styles' => array(
								'fontSize' => '72px'
							)
						)
					), $this ),
					'theme' => 'note',
					'inline' => true,
					'relative_urls' => false,
					'convert_urls' => false,
					'browser_spellcheck' => true,
					'entity_encoding' => 'named',
					'placeholder' => apply_filters( 'note_tinymce_placeholder', __( 'Start typing here&hellip;', 'note' ), $this ),
					// HTML5 Support
					'html5_support' => array(
						// Captions
						'caption' => $caption_html5_support,
						// Galleries
						'gallery' => $gallery_html5_support
					),
					// Caption HTML
					'caption_html' => $caption_html5_support ? array(
						'itemtag' => 'figure',
						'icontag' =>'div',
						'captiontag' => 'figcaption'
					) : array(
						'itemtag' => 'dl',
						'icontag' => 'dt',
						'captiontag' => 'dd'
					),
					// Gallery HTML
					// TODO:
					'gallery_html5_support' => array()
				),
				/*
				 * TinyMCE Modal Commands (when/how to activate/deactivate our "modal" flag in Customizer).
				 * We need to have this in place because different modal windows trigger different events.
				 */
				'modal_commands' => array(
					// When should the modal flag be activated
					'activate' => array(
						// TinyMCE, events triggered in TinyMCE; editor.on()
						'tinymce' => array(
							// On the TinyMCE "BeforeExecCommand" command
							'BeforeExecCommand' => 'WP_Link', // Command name that we should look for, WP_Link is triggered when the link modal is opened
							// On the TinyMCE 'wpLoadImageForm' command
							'wpLoadImageForm'
						),
						// Document, events triggered on the document( $( document ) ); jQuery( document ).on()
						'document' => array(
							// On the document "note-modal-open" event
							'note-modal-open'
						),
						// wp.media.events, events triggered on the media frame
						'wp.media.events' => array(
							// On the wp.media editor:image-edit command, when an editor image is edited, bind the close event
							'editor:image-edit'
						)
					),
					// When should the modal flag be deactivated
					'deactivate' => array(
						// TinyMCE, events triggered in TinyMCE; editor.on()
						'tinymce' => array(
							// On the TinyMCE 'wpLoadImageData' command
							'wpLoadImageData',
							// On the TinyMCE 'wpLoadImageForm' command
							'wpLoadImageForm' => array(
								// wp.media.frame.modal, events triggered on the media frame
								'wp.media.frame' => 'close' // Command name that we should look for, close is triggered when the modal is closed
							)
						),
						// Document, events triggered on the document ( $( document ) ); jQuery( document ).on()
						'document' => array(
							// On the document "wplink-close" event
							'wplink-close',
							// On the document "note-modal-close" event
							'note-modal-close'
						),
						// wp.media.events, events triggered on the media frame
						'wp.media.events' => array(
							// When the editor frame is created, bind the close event
							'editor:frame-create' => array(
								// frame, events triggered on this particular frame (frame is passed as argument to callback, we use "event" in our logic)
								'event.frame' => 'close' // Command name that we should look for, close is triggered when the modal is closed
							)
						)
					)
				),
				// Note Widget
				'widget' => array(
					'id' => ( isset(  $note_widget ) ) ? $note_widget->id_base : 'note-widget' // Fallback for when Note_Widget() doesn't exist
				),
				// Widget Settings & Templates
				'widgets' => array(
					'defaults' => array(), // Note Widget defaults
					'settings' => array(), // Settings for individual widgets
					'templates' => array() // Available widget templates/config
				),
				// Note modal windows
				'modals' => array(
					// Register Sidebar
					'register_sidebar' => array(
						'title' => __( 'Add Note Widget Area', 'note' ),
						'content' => sprintf( '%1$s <div class="inputs"><input type="checkbox" name="ignore-register-sidebar" id="note-ignore-register-sidebar" class="ignore-register-sidebar ignore-register-sidebar-modal" value="true" /> <label for="note-ignore-register-sidebar">%2$s</label></div>',
							__( 'Are you sure you want to add a widget area to this location?', 'note' ),
							__( 'Don\'t display this confirmation in the future', 'note' )
						),
						'submit_label' => __( 'Add Note Widget Area', 'note' )
					),
					// Unregister (Remove) Sidebar
					'unregister_sidebar' => array(
						'title' => __( 'Remove Note Widget Area', 'note' ),
						'content' => sprintf( '%1$s',
							__( 'Are you sure you want to remove this widget area?', 'note' )
						),
						// TODO
						/*'content' => sprintf( '%1$s <div class="inputs"><input type="checkbox" name="remove-note-widgets" class="remove-note-widgets" value="true" /> <label for="remove-note-widgets">%2$s</label> <span class="description">%3$s</span></div>',
							__( 'Are you sure you want to remove this sidebar?', 'note' ),
							__( 'Remove all widgets in this sidebar', 'note' ),
							__( 'Widgets that are not removed will be placed in the Inactive Sidebar.', 'note' )
						),*/
						'submit_label' => __( 'Remove Note Widget Area', 'note' )
					)
				)
			) );


			// If we have editor types
			if ( is_array( $this->note_editor_types ) && ! empty( $this->note_editor_types ) ) {
				// Adjust Note localization data (store TinyMCE data in an array under the 'default' key)
				$this->note_localize['tinymce'] = array(
					'default' => $this->note_localize['tinymce']
				);

				// Shim for Conductor 1.2.* TODO: Remove in a future version
				if ( ! Note::conductor_has_flexbox_display() )
					$this->note_localize['tinymce'] = array_merge( $this->note_localize['tinymce'], $this->note_localize['tinymce']['default'] );

				// Loop through editor types for configuration
				foreach ( $this->note_editor_types as $editor_type ) {
					// Copy Note localization data
					$settings = $this->note_localize['tinymce']['default'];

					// Switch based on editor type
					switch ( $editor_type ) {
						// Rich Text Only
						case 'rich_text_only':
							// Search for the 'wp_image' TinyMCE block in existing settings
							$wp_image = array_search( 'wp_image', $settings['blocks'] );

							// If we have an index for the the 'wp_image' TinyMCE block
							if ( $wp_image !== false ) {
								// Remove the 'wp_image' TinyMCE block
								unset( $settings['blocks'][$wp_image] );

								// Reset array keys to ensure JavaScript logic receives an array
								$settings['blocks'] = array_values( $settings['blocks'] );
							}
						break;

						// Media
						case 'media':
							// Add media blocks
							$settings['media_blocks'] = array( 'wp_image' );

							// Reset the placeholder
							$settings['placeholder'] = '';
						break;

						// Rich Text (Also default; just inherit from Note)
						default:
							// Do nothing (for now)
						break;
					}

					// Allow filtering of plugins, toolbar items, and placeholder
					$settings['plugins'] = explode( ' ', $settings['plugins'] );
					$settings['plugins'] = implode( ' ', array_unique( apply_filters( 'note_tinymce_editor_plugins', $settings['plugins'], $editor_type, $this ) ) );
					$settings['blocks'] = apply_filters( 'note_tinymce_editor_blocks', $settings['blocks'], $editor_type, $this );
					$settings['toolbar'] = apply_filters( 'note_tinymce_editor_toolbar', $settings['toolbar'], $editor_type, $this );
					//$settings['block_formats'] = apply_filters( 'note_tinymce_editor_block_formats', $settings['block_formats'], $editor_type, $this );
					$settings['preview_styles'] = explode( ' ', $settings['preview_styles'] );
					$settings['preview_styles'] = implode( ' ', array_unique( apply_filters( 'note_tinymce_editor_preview_styles', $settings['preview_styles'], $editor_type, $this ) ) );
					$settings['style_formats'] = apply_filters( 'note_tinymce_editor_style_formats', $settings['style_formats'], $editor_type, $this );
					$settings['placeholder'] = apply_filters( 'note_tinymce_editor_placeholder', $settings['placeholder'], $editor_type, $this );

					// Add the Note editor type
					$settings['note_type'] = $editor_type;

					// Assign the configuration to the localization data
					$settings = apply_filters( 'note_tinymce_editor_settings', $settings, $editor_type, $this );
					$this->note_localize['tinymce'][$editor_type] = $settings;
				}
			}


			// Setup Previewer TinyMCE localization
			$this->note_tinymce_localize = apply_filters( 'note_tinymce_localize', array(
				'wp_version' => $wp_version,
				'wp_major_version' => ( int ) substr( $wp_version, 0, 1 )
			), $this );
		}

		/**
		 * This function checks to see if a theme is being previewed in the Customizer and attempts
		 * to keep Note Sidebars and widgets.
		 */
		public function wp_loaded() {
			global $wp_customize;

			// Bail if the Customizer isn't ready or we're doing AJAX or the theme is active
			if ( ! is_a( $wp_customize, 'WP_Customize_Manager' ) || $wp_customize->doing_ajax() || $wp_customize->is_theme_active() )
				return;

			// TODO: Possibly use $wp_customize->widgets->old_sidebars_widgets here
			// Grab the current version of the sidebar widgets
			$this->old_sidebars_widgets = wp_get_sidebars_widgets();

			// Filter the sidebars widgets
			add_filter( 'option_sidebars_widgets', array( $this, 'option_sidebars_widgets' ), 20 ); // After core Customizer
		}

		/**
		 * This function filters the sidebars_widgets option after it is returned from the database.
		 */
		public function option_sidebars_widgets( $value ) {
			global $wp_customize;

			// Bail if the Customizer isn't ready
			if ( ! is_a( $wp_customize, 'WP_Customize_Manager' ) )
				return $value;

			$note_sidebars = Note_Sidebars(); // Grab the Note Sidebars instance

			// Attempt to save Note sidebars/widgets
			$value = $note_sidebars->pre_update_option_sidebars_widgets( $value, $this->old_sidebars_widgets );

			return $value;
		}

		/**
		 * This function registers sections and settings for use in the Customizer.
		 */
		public function customize_register( $wp_customize ) {
			// Bail if lower than WordPress 4.1
			if ( Note::wp_version_compare( '4.1', '<' ) )
				return;

			$note_option_defaults = Note_Options::get_option_defaults();
			$note_sidebars = Note_Sidebars(); // Grab the Note Sidebars instance

			/**
			 * Note
			 */

			/*
			 * Note Sidebars
			 */

			// Setting (data is sanitized upon update_option() call using the sanitize function in Note_Admin_Options)
			$wp_customize->add_setting(
				new WP_Customize_Setting( $wp_customize,
					'note[sidebars]', // IDs can have nested array keys
					array(
						'default' => $note_option_defaults['sidebars'],
						'type' => 'option',
						'sanitize_callback' => array( $note_sidebars, 'sanitize_callback' ),
						'sanitize_js_callback' => array( $note_sidebars, 'sanitize_js_callback' )
					)
				)
			);

			// Section
			$wp_customize->add_section(
				new WP_Customize_Section(
					$wp_customize,
					'note_sidebars',
					array(
						'title' => __( 'Note Widget Areas', 'note' ),
						'priority' => 999
					)
				)
			);

			// Control
			$wp_customize->add_control(
				new WP_Customize_Control(
					$wp_customize,
					'note_sidebars',
					array(
						'label' => __( 'Note Widget Areas', 'note' ),
						'section' => 'note_sidebars',
						'settings' => 'note[sidebars]',
						'input_attrs' => array(
							'class' => 'note-sidebars note-hidden'
						),
						'active_callback' => '__return_false' // Hide this control by default
						//'type' => 'note_hidden', // Used in js controller (we're not registering this type of control constructor so a regular control will be created on init)
					)
				)
			);


			/*
			 * Note Temporary Sidebar
			 */

			// Setting
			$wp_customize->add_setting(
				new WP_Customize_Setting( $wp_customize,
					'sidebars_widgets[note-temporary-inactive-sidebar]', // IDs can have nested array keys
					array(
						'default' => array(),
						'type' => 'option',
						'sanitize_callback' => array( $wp_customize->widgets, 'sanitize_sidebar_widgets' ),
						'sanitize_js_callback' => array( $wp_customize->widgets, 'sanitize_sidebar_widgets_js_instance' )
					)
				)
			);

			// Section
			$wp_customize->add_section(
				new WP_Customize_Sidebar_Section(
					$wp_customize,
					'sidebar-widgets-note-temporary-inactive-sidebar',
					array(
						'title' => __( 'Note Temporary Inactive Sidebar', 'note' ),
						'description' => __( 'This is a temporary sidebar registered by Note in the Customizer only. It will hold inactive Note Widget Area widgets during a session', 'note' ),
						'priority' => 999,
						'panel' => 'widgets',
						'sidebar_id' => 'note-temporary-inactive-sidebar',
					)
				)
			);

			// Control
			$wp_customize->add_control(
				new WP_Widget_Area_Customize_Control(
					$wp_customize,
					'sidebars_widgets[note-temporary-inactive-sidebar]',
					array(
						'section'    => 'sidebar-widgets-note-temporary-inactive-sidebar',
						'sidebar_id' => 'note-temporary-inactive-sidebar',
						'priority'   => 999,
						'active_callback' => '__return_false' // Hide this control by default
					)
				)
			);


			/*
			 * Inactive Widgets
			 *
			 * WordPress does not create controls for inactive widgets, but we need those controls
			 * because sidebars can be removed and added dynamically. Only do this in the Customizer
			 * and only do this for Note Sidebars.
			 *
			 * The Previewer controls are added in Note_Customizer::wp() after the core filters have been run.
			 */

			// Admin
			if ( is_admin() )
				$this->register_inactive_note_widgets();
		}

		/**
		 * This function enqueues scripts within the Customizer.
		 */
		public function customize_controls_enqueue_scripts() {
			// Note Customizer
			wp_enqueue_script( 'note-customizer', Note::plugin_url() . '/assets/js/note-customizer.js', array( 'customize-widgets' ), Note::$version, true );

			// Setup Note Widget localize data
			$this->setup_note_widget_localize_data();

			// Merge Previewer localize data with Customizer localize data
			$this->note_customizer_localize = array_merge( $this->note_customizer_localize, $this->note_localize );

			// Localize the Note Customizer script information
			wp_localize_script( 'note-customizer', 'note', $this->note_customizer_localize );
		}

		/**
		 * This function prints scripts within the Customizer.
		 */
		public function customize_controls_print_footer_scripts() {
			// Note Widget Re-Order Template
			self::note_widget_reorder_template();
		}

		/**
		 * This function fires on the initialization of the Customizer. We add actions that pertain to the
		 * Customizer preview window here. The actions added here are fired only in the Customizer preview.
		 */
		public function customize_preview_init() {
			add_action( 'wp', array( $this, 'wp' ) ); // WP
			add_action( 'wp_enqueue_scripts', array( $this, 'wp_enqueue_scripts' ) ); // Previewer Scripts/Styles
			add_action( 'dynamic_sidebar_params', array( $this, 'dynamic_sidebar_params' ) ); // Filter Dynamic Sidebar Parameters (Note Widgets)
			add_action( 'wp_footer', array( $this, 'wp_footer' ) ); // Output WordPress Link Dialog Template
		}

		/**
		 * This function runs after the WP and WP_Query objects are set up.
		 */
		function wp() {
			// Bail if lower than WordPress 4.1
			if ( Note::wp_version_compare( '4.1', '<' ) )
				return;

			// Note Sidebars (single content types only or if filter returns true)
			if ( is_singular() || apply_filters( 'note_customizer_localize_sidebar_args', false, $this ) ) {
				// Grab Note Sidebar Customizer arguments (keep Customizer Sections/Controls active for Previewer)
				$this->note_sidebar_args = Note_Sidebars::get_customizer_sidebar_args( true );

				// Note Sidebar args
				if ( ! isset( $this->note_localize['sidebars'] ) )
					$this->note_localize['sidebars'] = array();

				$this->note_localize['sidebars']['args'] = apply_filters( 'note_localize_sidebar_args', $this->note_sidebar_args, $this );

				/*
				 * Inactive Widgets
				 *
				 * WordPress does not create controls for inactive widgets, but we need those controls
				 * because sidebars can be removed and added/re-added dynamically. Only do this in the
				 * Customizer and only do this for Note Sidebars.
				 */
				$this->register_inactive_note_widgets( true );
			}
		}

		/**
		 * This function outputs scripts and styles in the the Customizer preview only.
		 */
		// TODO: SCRIPT_DEBUG support
		public function wp_enqueue_scripts() {
			global $tinymce_version, $concatenate_scripts, $compress_scripts, $wp_version, $wp_registered_widgets;

			// Setup Note Widget localize data
			$this->setup_note_widget_localize_data();

			// Concatenate Scripts
			if ( ! isset( $concatenate_scripts ) )
				script_concat_settings();

			// TinyMCE Compressed
			if ( $compress_scripts && $concatenate_scripts && isset( $_SERVER['HTTP_ACCEPT_ENCODING'] ) && stripos( $_SERVER['HTTP_ACCEPT_ENCODING'], 'gzip' ) !== false )
				wp_enqueue_script( 'note-tinymce', includes_url( 'js/tinymce' ) . '/wp-tinymce.php?c=1', false, $tinymce_version, true );
			// TinyMCE Uncompressed (minified)
			else {
				wp_enqueue_script( 'note-tinymce', includes_url( 'js/tinymce' ) . '/tinymce.min.js', false, $tinymce_version, true );
				wp_enqueue_script( 'note-tinymce-compat3x', includes_url( 'js/tinymce' ) . '/plugins/compat3x/plugin.min.js', array( 'note-tinymce' ), $tinymce_version, true );
			}

			// Localize the Note TinyMCE script information
			wp_localize_script( 'note-tinymce', 'note_tinymce', $this->note_tinymce_localize );

			// Note TinyMCE Insert Plugin
			wp_enqueue_script( 'note-tinymce-insert', Note::plugin_url() . '/assets/js/note-tinymce-insert.js', array( 'note-tinymce' ), Note::$version, true );

			// Note TinyMCE Placeholder Plugin
			wp_enqueue_script( 'note-tinymce-placeholder', Note::plugin_url() . '/assets/js/note-tinymce-placeholder.js', array( 'note-tinymce' ), Note::$version, true );

			// Note TinyMCE Background Plugin
			wp_enqueue_script( 'note-tinymce-background', Note::plugin_url() . '/assets/js/note-tinymce-background.js', array( 'note-tinymce' ), Note::$version, true );

			// Note TinyMCE Theme
			wp_enqueue_script( 'note-tinymce-theme', Note::plugin_url() . '/assets/js/note-tinymce-theme.js', array( 'note-tinymce' ), Note::$version, true );

			// Note Core
			wp_enqueue_script( 'note', Note::plugin_url() . '/assets/js/note.js', array( 'note-tinymce', 'wp-util', 'editor', 'wp-lists', 'customize-preview-widgets', 'jquery-ui-core', 'underscore', 'wp-backbone' ), Note::$version, true );
			wp_localize_script( 'note', 'note', $this->note_localize );

			// WordPress Lists
			wp_enqueue_script( 'wp-lists' );
			wp_localize_script( 'wp-lists', 'ajaxurl', admin_url( 'admin-ajax.php' ) );

			// WordPress Links
			wp_enqueue_script( 'wplink' );
			wp_localize_script( 'wplink', 'ajaxurl', admin_url( 'admin-ajax.php' ) ); // TODO: Necessary?
			wp_enqueue_script( 'jquery-ui-autocomplete' ); // jQuery AutoComplete
			wp_enqueue_style( 'note-wplink' , Note::plugin_url() . '/assets/css/wplink.css', false, Note::$version );

			// WordPress Core/Modal Styles
			wp_enqueue_style( 'wp-core-ui', Note::plugin_url() . '/assets/css/wp-core-ui.css', false, Note::$version );
			wp_enqueue_style( 'buttons' );
			wp_enqueue_style( 'note-modal' , Note::plugin_url() . '/assets/css/note-modal.css', false, Note::$version );

			// WordPress Media (has to come after WordPress Core/Modal Styles)
			wp_enqueue_media();

			// TinyMCE Core CSS
			wp_enqueue_style( 'tinymce-core' , Note::plugin_url() . '/assets/css/tinymce-core.css', false, Note::$version );

			// Note Theme CSS
			wp_enqueue_style( 'note' , Note::plugin_url() . '/assets/css/note.css', false, Note::$version );

			// Dashicons
			wp_enqueue_style( 'dashicons' );

			// Open Sans
			wp_enqueue_style( 'open-sans' );
		}

		/**
		 * This function prepends input elements to Note widgets for use in the Previewer JS scripts.
		 */
		// TODO: Search to see if these elements have already been added to the wrapper <input[ a-zA-Z0-9=\"\'-_]+(class)
		function dynamic_sidebar_params( $params ) {
			$note_widget = Note_Widget();

			// Only on Note Widgets
			// TODO: Check id_base here to be sure, also check if elements already exist by checking the class attribute
			if ( $params[0]['widget_name'] === $note_widget->name ) {
				$widget_after = '<input type="hidden" name="widget_number" class="widget-number" value="' . esc_attr( $params[1]['number'] ) . '" />'; // Widget Number
				$widget_after .= '<input type="hidden" name="widget_id" class="widget-id" value="' . esc_attr( $params[0]['widget_id'] ) . '" />'; // Widget ID
				$widget_after .= '<input type="hidden" name="sidebar_name" class="sidebar-name" value="' . esc_attr( $params[0]['name'] ) . '" />'; // Sidebar Name
				$widget_after .= '<input type="hidden" name="sidebar_id" class="sidebar-id" value="' . esc_attr( $params[0]['id'] ) . '" />'; // Sidebar ID

				// Modify the 'after_widget' param to include data we'll send to Customizer
				$params[0]['after_widget'] = $widget_after . $params[0]['after_widget'];
			}

			return $params;
		}

		/**
		 * This function outputs the WordPress Link Dialog template.
		 */
		public function wp_footer() {
			// WordPress Link Dialog
			if ( ! class_exists( '_WP_Editors' ) )
				require( ABSPATH . WPINC . '/class-wp-editor.php' );

			_WP_Editors::wp_link_dialog();

			// Note Modal Templates
			self::note_modal_templates();
		}


		/**********************
		 * Internal Functions *
		 **********************/

		/**
		 * This function outputs a note sidebar placeholder element based on parameters.
		 */
		// TODO: Filter
		public static function note_sidebar_placeholder( $sidebar_id, $post_id, $inactive = false ) {
			// Base CSS Classes
			$css_classes = array(
				'note-sidebar',
				'note-sidebar-placeholder',
				'note-sidebar-placeholder-register',
				'note-sidebar-placeholder-' . $sidebar_id,
				'note-sidebar-placeholder-' . $sidebar_id . '-' . $post_id
			);

			// Inactive CSS classes
			if ( $inactive ) {
				// Remove the 'note-sidebar-placeholder-register' CSS class
				if ( ( $key = array_search( 'note-sidebar-placeholder-register', $css_classes ) ) !== false ) {
					unset( $css_classes[$key] );
				}

				$css_classes = array_merge( $css_classes, array(
					'note-sidebar-placeholder-inactive',
					'note-sidebar-placeholder-inactive-' . $sidebar_id,
					'note-sidebar-placeholder-inactive-' . $sidebar_id . '-' . $post_id
				) );
			}

			// Sanitize CSS classes
			$css_classes = array_filter( $css_classes, 'sanitize_html_class' );

			// Note Sidebar Placeholder (inactive sidebar)
			$placeholder = '<div class="' . esc_attr( implode( ' ', $css_classes ) ) . '" data-post-id="' . esc_attr( $post_id ) . '" data-note-sidebar-id="' . esc_attr( $sidebar_id ) . '" data-note-sidebar="true">';
				// Note UI Buttons for inactive sidebars, register sidebar button for non-registered sidebars
				$placeholder .= ( $inactive ) ? self::note_sidebar_ui_buttons() : '<div class="note-sidebar-register"></div>';
			$placeholder .='</div>';

			return $placeholder;
		}

		/**
		 * This function creates markup for all Note UI buttons.
		 */
		public static function note_sidebar_ui_buttons() {
			// Note UI buttons
			$note_ui_buttons = apply_filters( 'note_sidebar_ui_buttons', array(
				// Add Widget Button
				array(
				 	'id' => 'add-widget',
					'label' => 'W',
					'title' => __( 'Add Widget', 'note' )
				),
				// Add Note Widget Button
				array(
				 	'id' => 'add-note-widget',
					'label' => 'N',
					'title' => __( 'Add Note Widget', 'note' )
				),
				// Remove Sidebar Button
				array(
				 	'id' => 'remove-note-sidebar',
					'label' => '<span class="dashicons dashicons-no-alt"></span>',
					'title' => __( 'Remove Note Widget Area', 'note' )
				)
			) );

			$buttons_html = '<div class="note-sidebar-placeholder-edit-buttons">';
				// Note Edit Button
				$buttons_html .= '<span class="note-ui-button note-button note-edit-sidebar-button" title="Edit Sidebar">';
					$buttons_html .= '<span class="dashicons dashicons-edit note-button-label"></span>';
				$buttons_html .= '</span>';

				// Loop through each placeholder button
				foreach ( $note_ui_buttons as $number => $button )
					$buttons_html .= self::note_sidebar_ui_button( $button, ( $number + 1 ) );

			$buttons_html .= '</div>';

			// TODO: Filter
			return $buttons_html;
		}

		/**
		 * This function creates markup for a single Note UI button.
		 */
		public static function note_sidebar_ui_button( $button, $number ) {
			// CSS classes
			// TODO: Filter
			$css_classes = array(
				'note-ui-button',
				'note-button',
				'note-secondary-button',
				'note-secondary-button-' . $number,
				'note-' . $button['id'],
				'note-' . $button['id'] . '-button'
			);

			// Sanitize CSS classes
			$css_classes = array_filter( $css_classes, 'sanitize_html_class' );

			// Button HTML
			$button_html = '<span class="note-ui-button-wrap note-secondary-button-wrap note-secondary-button-wrap-' . esc_attr( $number ) . '">';
				$button_html .= '<span class="' . esc_attr( implode( ' ', $css_classes ) ) . '" title="' . esc_attr( $button['title'] ) . '">';
					$button_html .= ( strpos($button['label'], 'dashicons' ) ) ? '<span class="note-ui-button-label note-button-label note-button-label-dashicons">' : '<span class="note-ui-button-label note-button-label note-button-label-text">';
						$button_html .= $button['label'];
					$button_html .= '</span>';
				$button_html .= '</span>';
			$button_html .= '</span>';

			// TODO: Filter
			return $button_html;
		}

		/**
		 * This function outputs the Note modal UnderscoreJS templates.
		 */
		public static function note_modal_templates() {
			// Note Modal Overlay Template
			self::note_modal_overlay_template();

			// Note Modal Content Template
			self::note_modal_content_template();

			// Note Modal HTML Elements
			self::note_modal_html_elements();
		}

		/**
		 * This function outputs the Note modal overlay UnderscoreJS template.
		 */
		public static function note_modal_overlay_template() {
		?>
			<script type="text/template" id="tmpl-note-modal-overlay">
				<div class="note-overlay"></div>
			</script>
		<?php
		}

		/**
		 * This function outputs the Note modal content UnderscoreJS template.
		 */
		// TODO: i18n, l10n
		public static function note_modal_content_template() {
		?>
			<script type="text/template" id="tmpl-note-modal-content">
				<div class="note-modal wp-core-ui">
					<div class="note-modal-header">
						{{ data.title }}
						<a class="note-modal-close" href="#" title="<?php esc_attr_e( 'Close', 'note' ); ?>">
							<span class="dashicons dashicons-no"></span>
							<span class="screen-reader-text"><?php _e( 'Close', 'note' ); ?></span>
						</a>
					</div>
					<div class="note-modal-content">{{{ data.content }}}</div>
					<div class="note-modal-footer">
						<div class="note-modal-buttons note-modal-buttons-left">
							<a class="note-modal-cancel" href="#" title="<?php esc_attr_e( 'Cancel', 'note' ); ?>">
								<?php _e( 'Cancel', 'note' ); ?>
							</a>
						</div>
						<div class="note-modal-buttons note-modal-buttons-right">
							<button class="note-modal-submit button button-primary" name="note-modal-submit">{{ data.submit_label }}</button
						</div>
					</div>
				</div>
			</script>
		<?php
		}

		/**
		 * This function outputs the Note modal HTML elements.
		 */
		public static function note_modal_html_elements() {
		?>
			<div id="note-modal">
				<div id="note-modal-overlay"></div>
				<div id="note-modal-content"></div>
			</div>
		<?php
		}

		/**
		 * This function outputs the Note widget re-order UnderscoreJS template.
		 */
		public static function note_widget_reorder_template() {
		?>
			<script type="text/template" id="tmpl-note-widget-reorder" xmlns="http://www.w3.org/1999/html">
				<li class="" data-id="{{ data.id }}" title="{{ data.description }}" tabindex="0">{{ data.name }}</li>
			</script>
		<?php
		}

		/**
		 * This function registers controls for all inactive widgets inside of previously
		 * inactive Note Sidebars.
		 */
		public function register_inactive_note_widgets( $previewer = false ) {
			global $wp_customize, $wp_registered_widgets, $wp_registered_widget_controls;

			// Loop through inactive sidebars
			foreach ( $this->note_inactive_sidebars_widgets as $sidebar_id => $widgets )
				// Loop through widgets
				foreach ( $widgets as $i => $widget ) {
					$widget_id = $widget['widget_id'];
					$setting_id = $widget['setting_id'];
					$registered_widget = $wp_registered_widgets[$widget_id];
					$id_base = $wp_registered_widget_controls[$widget_id]['id_base'];

					$control_args = array(
						'label' => $registered_widget['name'],
						'section' => 'sidebar-widgets-note-temporary-inactive-sidebar', // Temporary/hidden section
						'sidebar_id' => $sidebar_id,
						'widget_id' => $widget_id,
						'widget_id_base' => $id_base,
						'priority' => $i,
						'width' => $wp_registered_widget_controls[$widget_id]['width'],
						'height' => $wp_registered_widget_controls[$widget_id]['height'],
						'is_wide' => $wp_customize->widgets->is_wide_widget( $widget_id ),
						'active_callback' => '__return_true' // Fake an active state
					);

					// Create the control
					$control = new WP_Widget_Form_Customize_Control( $wp_customize, $setting_id, $control_args );

					// Add the control
					$wp_customize->add_control( $control );
				}
		}

		/**
		 * This function sets up Note Widget localize data.
		 */
		public function setup_note_widget_localize_data() {
			global $wp_registered_widgets;

			$note_widget = Note_Widget(); // Note Widget instance

			// Re-add the widgets key if it doesn't exist (due to filtering above)
			if ( ! isset( $this->note_localize['widgets'] ) )
				$this->note_localize['widgets'] = array(
					'defaults' => array(), // Note Widget defaults
					'settings' => array(), // Settings for individual widgets
					'templates' => array() // Available widget templates/config
				);

			// Setup the defaults data
			$this->note_localize['widgets']['defaults'] = $note_widget->defaults;

			// Setup the template data
			$this->note_localize['widgets']['templates'] = $note_widget->templates;

			// Setup the background image CSS
			$this->note_localize['widgets']['background_image_css'] = $note_widget->background_image_css;

			// Find Note Widgets in sidebars
			// TODO: The following logic will fetch data for all Note Widgets in all sidebars, can we just output data for displayed widgets?
			$sidebars_widgets = wp_get_sidebars_widgets();
			$note_widget_settings = array();

			if ( is_array( $sidebars_widgets ) )
				// Loop through sidebars
				foreach ( $sidebars_widgets as $sidebar => $widgets ) {
					// Ignore inactive or orphaned
					if ( $sidebar !== 'wp_inactive_widgets' && substr( $sidebar, 0, 16 ) !== 'orphaned_widgets' && is_array( $widgets ) )
						// Loop through widgets
						foreach ( $widgets as $widget ) {
							// Verify that this is a Note Widget
							if ( $note_widget->id_base === _get_widget_id_base( $widget ) ) {
								// Make sure this widget has a callback
								if ( isset( $wp_registered_widgets[$widget] ) ) {
									// Store a reference to this widget object
									$wp_widget = $wp_registered_widgets[$widget];
									$widget_number = $wp_widget['params'][0]['number'];

									// Store a reference to the widget settings (all Note Widgets)
									if ( empty( $note_widget_settings ) )
										$note_widget_settings = $note_widget->get_settings();

									// Find this widget in settings
									if ( array_key_exists( $widget_number, $note_widget_settings ) ) {
										// Widget settings (parse with Note Widget defaults to prevent PHP warnings and missing setting values)
										$this->note_localize['widgets']['settings'][$widget_number] = wp_parse_args( ( array ) $note_widget_settings[$widget_number], $note_widget->defaults );

										// Store a reference to the widget number
										$this->note_localize['widgets']['settings'][$widget_number]['widget_number'] = $widget_number;

										// Store a reference to the widget ID
										$this->note_localize['widgets']['settings'][$widget_number]['widget_id'] = $widget;

										// Store a reference to the sidebar ID
										$this->note_localize['widgets']['settings'][$widget_number]['sidebar_id'] = $sidebar;
									}
								}
							}
						}
				}

			// Allow for filtering of localization widget data
			$this->note_localize['widgets'] = apply_filters( 'note_localize_widgets', $this->note_localize['widgets'], $this );
		}
	}

	/**
	 * Create an instance of the Note_Customizer class.
	 */
	function Note_Customizer() {
		return Note_Customizer::instance();
	}

	Note_Customizer(); // Note your content!
}