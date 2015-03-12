<?php
/**
 * Note Widget
 *
 * @class Note_Widget
 * @author Slocum Studio
 * @version 1.1.2
 * @since 1.0.0
 */

// Bail if accessed directly
if ( ! defined( 'ABSPATH' ) )
	exit;

if ( ! class_exists( 'Note_Widget' ) ) {
	final class Note_Widget extends WP_Widget {
		/**
		 * @var string
		 */
		public $version = '1.1.2';

		/**
		 * @var string
		 */
		public $name = 'Note Widget';

		/**
		 * @var array
		 */
		public $widget_options = array();

		/**
		 * @var array
		 */
		public $control_options = array();

		/**
		 * @var array
		 */
		public $defaults = array();

		/**
		 * @var Note_Widget, Instance of the class
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
		 * This function sets up all of the actions and filters on instance. It also initializes widget options
		 * including class name, description, width/height, and creates an instance of the widget
		 */
		function __construct( ) {
			// Load required assets
			$this->includes();

			$id_base = 'note-widget';

			// Widget/Control options
			$this->widget_options = array(
				'classname' => $id_base,
				'description' => __( 'A simple and easy to use widget for editing bits of text.', 'note' )
			);
			$this->widget_options = apply_filters( 'note_widget_widget_options', $this->widget_options, $this );

			$this->control_options = apply_filters( 'note_widget_control_options', array( 'id_base' => $id_base ), $this );

			// Defaults
			$this->defaults = apply_filters( 'note_widget_defaults', array(
				'title' => false,
				'hide_title' => true,
				'content' => false,
				'css_class' => false
			), $this ); // Set up the default widget settings

			// New WP_Widget
			self::WP_Widget( $id_base, sprintf( __( '%1$s', 'note' ), $this->name ), $this->widget_options, $this->control_options );

			// Hooks
			if ( ! has_action( 'admin_enqueue_scripts', array( $this, 'admin_enqueue_scripts' ) ) )
				add_action( 'admin_enqueue_scripts', array( $this, 'admin_enqueue_scripts' ) ); // Enqueue admin scripts
			if ( ! has_action( 'note_widget', array( get_class(), 'note_widget' ) ) )
				add_action( 'note_widget', array( get_class(), 'note_widget' ), 10, 3 ); // Output standard Note Widget content
		}

		/**
		 * Include required core files used in admin and on the frontend.
		 */
		private function includes() {
			do_action( 'note_widget_includes', $this );
		}


		/**
		 * This function configures the form on the Widgets Admin Page.
		 */
		public function form( $instance ) {
			$instance = wp_parse_args( ( array ) $instance, $this->defaults ); // Parse any saved arguments into defaults
		?>
			<?php do_action( 'note_widget_settings_before', $instance, $this ); ?>

			<?php do_action( 'note_widget_settings_title_before', $instance, $this ); ?>

			<div class="note-widget-setting note-widget-title">
				<?php // Widget Title ?>
				<label for="<?php echo $this->get_field_id( 'title' ) ; ?>"><strong><?php _e( 'Title', 'note' ); ?></strong></label>
				<br />

				<div class="note-widget-title-container">
					<input type="text" class="note-input" id="<?php echo $this->get_field_id( 'title' ); ?>" name="<?php echo $this->get_field_name( 'title' ); ?>" value="<?php echo esc_attr( $instance['title'] ); ?>" />
					<span class="note-hide-widget-title">
						<?php // Hide Widget Title ?>
						<input id="<?php echo $this->get_field_id( 'hide_title' ); ?>" name="<?php echo $this->get_field_name( 'hide_title' ); ?>" type="checkbox" <?php checked( $instance['hide_title'], true ); ?> />
						<label for="<?php echo $this->get_field_id( 'hide_title' ) ; ?>"><span class="dashicons dashicons-visibility"></span></label>
					</span>
				</div>
				<small class="description note-description"><?php _e( 'Click the eyeball to show/hide your Note widget title.', 'note' ); ?></small>
			</div>

			<?php do_action( 'note_widget_settings_title_after', $instance, $this ); ?>

			<?php // TODO: "Featured" Image/Images in widget content ?>

			<?php do_action( 'note_widget_settings_content_before', $instance, $this ); ?>

			<div class="note-widget-setting note-widget-content">
				<?php // Widget Content ?>

				<?php if ( $this->is_customizer() ) : // Customizer ?>
					<a href="#" class="button button-primary note-button note-edit-content note-edit-content-customizer"><?php _e( 'Edit Content', 'note' ); ?></a>
					<br />
					<small class="description note-description"><?php _e( 'Click this button to start editing content for this widget.', 'note' ); ?></small>
				<?php else: // Widget Admin (Appearance > Widgets) ?>
					<a href="<?php echo esc_url( wp_customize_url() ); ?>" class="button button-primary note-button note-edit-content"><?php _e( 'Edit Content', 'note' ); ?></a>
					<br />
					<small class="description note-description"><?php _e( 'Click this button to open the Customizer and start editing content for this widget.', 'note' ); ?></small>
				<?php endif; ?>

				<textarea class="note-input note-hidden note-content" id="<?php echo $this->get_field_id( 'content' ); ?>" name="<?php echo $this->get_field_name( 'content' ); ?>" rows="16" cols="20"><?php echo $instance['content']; ?></textarea>
			</div>

			<?php do_action( 'note_widget_settings_content_after', $instance, $this ); ?>

			<?php do_action( 'note_widget_settings_css_class_before', $instance, $this ); ?>

			<div class="note-widget-setting note-css-class">
				<?php // CSS Class ?>
				<label for="<?php echo $this->get_field_id( 'css_class' ); ?>"><strong><?php _e( 'CSS Class(es)', 'note' ); ?></strong></label>
				<br />
				<input type="text" class="note-input" id="<?php echo $this->get_field_id( 'css_class' ); ?>" name="<?php echo $this->get_field_name( 'css_class' ); ?>" value="<?php echo esc_attr( $instance['css_class'] ); ?>" />
				<br />
				<small class="description note-description"><?php printf( __( 'Target this widget on the front-end (e.g. my-custom-note-widget). <a href="%1$s" target="_blank">Learn more about CSS</a>.', 'note' ), esc_url( 'http://codex.wordpress.org/CSS/' ) ); ?></small>
			</div>

			<?php do_action( 'note_widget_settings_css_class_after', $instance, $this ); ?>

			<?php do_action( 'note_widget_settings_after', $instance, $this ); ?>

			<div class="clear"></div>

			<p class="note-widget-slug">
				<?php printf( __( 'Content management brought to you by <a href="%1$s" target="_blank">Conductor</a>','note' ), esc_url( 'https://conductorplugin.com/?utm_source=note&utm_medium=link&utm_content=note-widget-branding&utm_campaign=note' ) ); ?>
			</p>
		<?php
		}

		/**
		 * This function handles updating (saving) widget options
		 */
		public function update( $new_instance, $old_instance ) {
			// Widget Title
			$new_instance['title'] = ( ! empty( $new_instance['title'] ) ) ? sanitize_text_field( $new_instance['title'] ) : false; // Widget Title
			$new_instance['hide_title'] = ( isset( $new_instance['hide_title'] ) ) ? true : false; // Hide Widget Title

			// Widget Content
			//$new_instance['content'] = ( ! empty( $new_instance['content'] ) ) ? stripslashes( wp_filter_post_kses( addslashes( $new_instance['content'] ) ) ) : false; // Widget Content - wp_filter_post_kses() expects slashed content
			//$new_instance['content'] = ( ! empty( $new_instance['content'] ) ) ? format_to_edit( $new_instance['content'], true ) : false; // Widget Content - wp_filter_post_kses() expects slashed content
			$new_instance['content'] = ( ! empty( $new_instance['content'] ) ) ? wp_unslash( sanitize_post_field( 'post_content', $new_instance['content'], 0, 'db' ) ) : false; // Widget Content - Sanitize as post_content; Fake a Post ID

			// CSS Class
			if ( ! empty( $new_instance['css_class'] ) ) {
				// Split classes
				$new_instance['css_class'] = explode( ' ', $new_instance['css_class'] );

				// Sanitize classes
				foreach ( $new_instance['css_class'] as &$css_class )
					$css_class = sanitize_html_class( $css_class );

				// Bring them back together
				$new_instance['css_class'] = implode( ' ', $new_instance['css_class'] );
			}
			else
				$new_instance['css_class'] = false;

			return apply_filters( 'note_widget_update', $new_instance, $old_instance, $this );
		}

		/**
		 * This function controls the display of the widget on the website.
		 */
		public function widget( $args, $instance ) {
			// Instance filter
			$instance = apply_filters( 'note_widget_instance', $instance, $args, $this );

			extract( $args ); // $before_widget, $after_widget, $before_title, $after_title

			// Start of widget output
			echo $before_widget;

			do_action( 'note_widget_before', $instance, $args, $this );
			do_action( 'note_widget', $instance, $args, $this );
			do_action( 'note_widget_after', $instance, $args, $this );

			echo $after_widget;
			// End of widget output
		}

		/**
		 * This function enqueues the necessary styles associated with this widget on admin.
		 */
		public function admin_enqueue_scripts( $hook ) {
			// Only on Widgets Admin Page
			if ( $hook === 'widgets.php' )
				wp_enqueue_style( 'note-widget-admin', Note::plugin_url() . '/assets/css/widgets/note-widget-admin.css', array( 'dashicons' ) );
		}

		/**
		 * ------------------
		 * Internal Functions
		 * ------------------
		 */

		/**
		 * This function generates CSS classes for widget output.
		 */
		public function get_css_classes( $instance ) {
			$classes = array( 'note-widget-wrapper' );

			// Custom CSS Classes
			if ( ! empty( $instance['css_class'] ) )
				$classes[] = str_replace( '.', '', $instance['css_class'] );

			$classes = apply_filters( 'note_widget_css_classes', $classes, $instance, $this );

			return implode( ' ', $classes );
		}

		/**
		 * This function outputs the widget title.
		 */
		public function widget_title( $before_title, $after_title, $instance, $args ) {
			if ( ( ! isset( $instance['hide_title'] ) || empty( $instance['title'] ) ) || ( isset( $instance['hide_title'] ) && $instance['hide_title'] ) )
				return;

			do_action( 'note_widget_title_before', $instance, $args, $this );
			echo $before_title . apply_filters( 'widget_title', $instance['title'], $instance, $this->id_base, $this ) . $after_title;
			do_action( 'note_widget_title_after', $instance, $args, $this );
		}

		/**
		 * This function outputs the widget content.
		 */
		public function widget_content( $instance, $args ) {
			do_action( 'note_widget_content_before', $instance, $args, $this );
		?>
			<div class="widget-content"><?php echo isset( $instance['content'] ) ? do_shortcode( $instance['content'] ) : false; ?></div>
		<?php
			do_action( 'note_widget_content_after', $instance, $args, $this );
		}

		/**
		 * This function determines if we're currently in the Customizer.
		 */
		function is_customizer() {
			return did_action( 'customize_controls_init' );
		}


		/**********
		 * Output *
		 **********/

		/**
		 * This function outputs standard Note Widget content.
		 */
		public static function note_widget( $instance, $args, $widget ) {
			extract( $args ); // $before_widget, $after_widget, $before_title, $after_title
		?>
			<div class="note-wrapper <?php echo esc_attr( $widget->get_css_classes( $instance ) ); ?>">
				<?php $widget->widget_title( $before_title, $after_title, $instance, $args ); // Widget Title ?>

				<?php $widget->widget_content( $instance, $args ); // Widget Content ?>
			</div>
		<?php
		}
	}

	/**
	 * Create an instance of the Note_Widget class.
	 */
	function Note_Widget() {
		return Note_Widget::instance();
	}
}

register_widget( 'Note_Widget' );