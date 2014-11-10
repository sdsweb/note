<?php
/**
 * Note Customizer (Customizer functionality)
 *
 * @class Note_Customizer
 * @author Slocum Studio
 * @version 1.0.0
 * @since 1.0.0
 */

// Bail if accessed directly
if ( ! defined( 'ABSPATH' ) )
	exit;

if( ! class_exists( 'Note_Customizer' ) ) {
	final class Note_Customizer {
		/**
		 * @var string
		 */
		public $version = '1.0.0';

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
		function __construct( ) {
			// Hooks
			add_action( 'customize_register', array( $this, 'customize_register' ), 0 ); // Customizer Register (before anything else)
			add_action( 'customize_controls_enqueue_scripts', array( $this, 'customize_controls_enqueue_scripts' ) ); // Enqueue scripts in Customizer
			add_action( 'customize_preview_init', array( $this, 'customize_preview_init' ) ); // Customizer Preview Initialization
		}

		/**
		 * Include required core files used in admin and on the frontend.
		 */
		private function includes() {
		}

		/**
		 * This function registers sections and settings for use in the Theme Customizer.
		 */
		public function customize_register( $wp_customize ) {
			// Load required assets
			$this->includes();
		}

		/**
		 * This function enqueues scripts within the Customizer.
		 */
		function customize_controls_enqueue_scripts() {
			// Note Customizer
			wp_enqueue_script( 'note-customizer', Note::plugin_url() . '/assets/js/note-customizer.js', array( 'customize-widgets' ), Note::$version, true );
		}

		/**
		 * This function fires on the initialization of the Customizer. We add actions that pertain to the
		 * Customizer preview window here. The actions added here are fired only in the Customizer preview.
		 */
		public function customize_preview_init() {
			add_action( 'wp_enqueue_scripts', array( $this, 'wp_enqueue_scripts' ) ); // Previewer Scripts/Styles
			add_action( 'dynamic_sidebar_params', array( $this, 'dynamic_sidebar_params' ) ); // Filter Dynamic Sidebar Parameters (Note Widgets)
			add_action( 'wp_footer', array( $this, 'wp_footer' ) ); // Output WordPress Link Dialog Template
		}

		/**
		 * This function outputs scripts and styles in the the Customizer preview only.
		 */
		// TODO: SCRIPT_DEBUG support
		public function wp_enqueue_scripts() {
			global $tinymce_version, $concatenate_scripts, $compress_scripts;

			// Concatenate Scripts
			if ( ! isset( $concatenate_scripts ) )
				script_concat_settings();

			// TinyMCE Compressed
			if ( $compress_scripts && $concatenate_scripts && isset( $_SERVER['HTTP_ACCEPT_ENCODING'] ) && stripos( $_SERVER['HTTP_ACCEPT_ENCODING'], 'gzip' ) !== false )
				wp_enqueue_script( 'note-tinymce', includes_url( 'js/tinymce' ) . '/wp-tinymce.php?c=1', false, $tinymce_version, true );
			// TinyMCE Uncompressed
			else {
				wp_enqueue_script( 'note-tinymce', includes_url( 'js/tinymce' ) . '/tinymce.min.js', false, $tinymce_version, true );
				wp_enqueue_script( 'note-tinymce-compat3x', includes_url( 'js/tinymce' ) . '/plugins/compat3x/plugin.min.js', array( 'note-tinymce' ), $tinymce_version, true );
			}

			// TinyMCE Theme
			wp_enqueue_script( 'note-tinymce-theme', Note::plugin_url() . '/assets/js/note-tinymce-theme.js', array( 'note-tinymce' ), Note::$version, true );

			// Note Core
			wp_enqueue_script( 'note', Note::plugin_url() . '/assets/js/note.js', array( 'note-tinymce', 'wp-util', 'editor', 'wp-lists', 'customize-preview-widgets' ), Note::$version, true );
			wp_localize_script( 'note', 'note', apply_filters( 'note_localize', array(
				// TinyMCE Config Parameters
				// TODO: https://github.com/WordPress/WordPress/blob/cd0ba24e9583a707b0ba055f0a3d9cd0f9b36549/wp-includes/class-wp-editor.php#L469
				'tinymce' => array(
					'selector' => '.note-widget .widget-content',
					// Allow filtering of plugins on an array instead of a space separated string
					'plugins' => implode( ' ', array_unique( apply_filters( 'note_tinymce_plugins', array(
						'wplink',
						'wpview',
						'paste',
						'lists' // TODO
					) ) ) ),
					// Custom TinyMCE theme expects separate "rows"
					'toolbar' => apply_filters( 'note_tinymce_toolbar', array(
						'formatselect',
						'bold',
						'italic',
						'link',
						'unlink',
						'alignleft',
						'aligncenter',
						'alignright',
						'alignjustify'
					) ),
					// Alignment Formats
					'formats' => array(
						// Align Left
						'alignleft' => array(
							array(
								'selector' => 'p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li',
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
								'selector' => 'p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li',
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
								'selector' => 'p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li',
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
					'theme' => 'note',
					'inline' => true,
					'relative_urls' => false,
					'convert_urls' => false,
					'browser_spellcheck' => true,
					'entity_encoding' => 'named',
					'placeholder' => apply_filters( 'note_widget_content_placeholder', __( 'Start typing here&hellip;', 'note' ) )
				)
			) ) );

			// WordPress Lists
			wp_enqueue_script( 'wp-lists' );
			wp_localize_script( 'wp-lists', 'ajaxurl', admin_url( 'admin-ajax.php' ) );

			// WordPress Links
			wp_enqueue_script( 'wplink' );
			wp_localize_script( 'wplink', 'ajaxurl', admin_url( 'admin-ajax.php' ) );

			// WordPress Core/Modal Styles
			wp_enqueue_style( 'wp-core-ui', Note::plugin_url() . '/assets/css/wp-core-ui.css', false, Note::$version );
			wp_enqueue_style( 'buttons' );
			wp_enqueue_style( 'note-link-modal' , Note::plugin_url() . '/assets/css/link-modal.css', false, Note::$version );

			// TinyMce Core CSS
			wp_enqueue_style( 'tinymce-core' , Note::plugin_url() . '/assets/css/tinymce-core.css', false, Note::$version );

			// Note Theme CSS
			wp_enqueue_style( 'note' , Note::plugin_url() . '/assets/css/note.css', false, Note::$version );

			// Dashicons
			wp_enqueue_style( 'dashicons' );
		}

		/**
		 * This function prepends input elements to Note widgets
		 * for use in the Previewer JS scripts.
		 */
		function dynamic_sidebar_params( $params ) {
			$note_widget = Note_Widget();

			// Only on Note Widgets
			if ( $params[0]['widget_name'] === $note_widget->name ) {
				$widget_after = '<input type="hidden" name="widget_number" class="widget-number" value="' . esc_attr( $params[1]['number'] ) . '" />'; // Widget Number
				$widget_after .= '<input type="hidden" name="widget_id" class="widget-id" value="' . esc_attr( $params[0]['widget_id'] ) . '" />'; // Widget ID
				$widget_after .= '<input type="hidden" name="sidebar_name" class="sidebar-name" value="' . esc_attr( $params[0]['name'] ) . '" />'; // Sidebar Name
				$widget_after .= '<input type="hidden" name="sidebar_id" class="sidebar-id" value="' . esc_attr( $params[0]['id'] ) . '" />'; // Sidebar ID

				// Modify the 'after_widget' param to include data we'll  send to Customizer
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