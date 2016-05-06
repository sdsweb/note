<?php
/**
 * Note Widget
 *
 * @class Note_Widget
 * @author Slocum Studio
 * @version 1.4.1
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
		public $version = '1.4.1';

		/**
		 * @var string
		 */
		public $name = 'Note Widget'; // TODO: i18n, l10n

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
		 * @var array, Note Widget template configuration
		 */
		public $templates = array();

		/**
		 * @var array, Note Widget template types (id => label)
		 */
		public $template_types = array();

		/**
		 * @var array, Note Widget templates organized by their 'type'
		 */
		public $templates_by_type = array();

		/**
		 * @var string, directory location of template files within theme template directory or Note template directory
		 */
		// TODO: Necessary?
		public $base_template_dir = '';

		/**
		 * @var int
		 */
		public $max_content_areas = 1;

		/**
		 * @var int
		 */
		public $max_columns = 6;

		/**
		 * @var int
		 */
		public $max_rows = 10;

		/**
		 * @var string, CSS properties (excluding url) used in "background" shorthand
		 */
		public $background_image_css = 'center / cover no-repeat';

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
		function __construct() {
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
				'title' => false, // Widget Title
				'hide_title' => true, // Hide Widget Title
				'content' => false, // Widget Content (Standard)
				'content_areas' => array(), // Widget Content (Templates/Columns/Rows)
				'css_class' => false, // Widget CSS Classes
				'template' => 'default', // Widget Template
				'columns' => 1, // Number of Columns
				'rows' => 1, // Number of Rows
				// Extras
				'extras' => array(
					// Background Image Attachment ID
					'background_image_attachment_id' => false
				)
			), $this ); // Set up the default widget settings


			// Maximum number of rows
			$this->max_rows = ( int ) apply_filters( 'note_widget_max_rows', $this->max_rows, $this );

			// Maximum number of columns
			$this->max_columns = ( int ) apply_filters( 'note_widget_max_columns', $this->max_columns, $this );

			// Background image CSS properties
			$this->background_image_css = apply_filters( 'note_widget_background_image_css', $this->background_image_css, $this );

			/*
			 * Set up the default widget templates
			 *
			 * Valid content area types:
			 * - rich_text - Default type (if not specified)
			 * - rich_text_only - Rich text only (no media)
			 *
			 * Format:
			 *	'template-id' => array( // ID for the template (unique)
			 *		'label' => __( 'Template Label', 'note' ), // Label for the template
			 *      // Please Note: TinyMCE does not like white space with nested elements inside of placeholder configuration data and extra white space could lead to placeholder display issues/undesired results in the Previewer
			 *		'placeholder' => '<p>Placeholder</p>', // Global placeholder text/html for this template (this placeholder will be used if an individual config does not specify a placeholder property); data-note-placeholder="false" may be used to specify an element that should not inherit Note placeholder styles
			 *		'template' => 'template', // Template name for this template (optional; without .php suffix; the widget will search through $this->base_template_dir and theme assets first, then load the fallback)
			 *		'type' => 'simple', // Type of display layout (used for grouping in Note Widget settings; should match a "template types" value)
			 *		'config' => array( // Customizer Previewer Configuration (array key to start at 1, not 0, and is a string)
			 *			'type' => 'rich_text_only', // Type for this content area (optional)
			 *  		// Placeholder Content (optional)
			 *			'placeholder' => '<p>Placeholder</p>', // Content area placeholder text/html for this template (optional); data-note-placeholder="false" may be used to specify an element that should not inherit Note placeholder styles
			 *			// Plugins, Additional elements and features that this editor supports (optional)
			 *			'plugins' => array(
			 *				'note_background' // Allow for addition of a background image
			 *          ),
			 * 			// Blocks, Additional blocks to be added to the "insert" toolbar
			 * 			'blocks' => array(
			 * 			    'note_background' // Matches plugin name above
			 * 			),
			 *          // Allow for the customization of columns and rows by the end user through widget settings (optional)
			 *          'customize' => array(
			 *              'columns' => true, // Columns
			 *              'rows' => true, // Rows
			 *              'note_background' => true // Note Background
			 *          ),
			 *          // Column Support, Integer (will inherit default Note TinyMCE editor config) or an array of individual column configurations
			 *          'columns' => 6 // (1-6) 6 columns is the default maximum number of columns that Note Widgets support
			 *                       ||
			 *                       array(
			 *                          // Column 1
			 *                          1 => array( // First content area
			 *				                'type' => 'rich_text_only', // Type for this content area (optional)
			 *			                   	// Placeholder Content (optional)
			 *				                'placeholder' => '<p>Placeholder</p>', // Content area placeholder text/html for this template (optional); data-note-placeholder="false" may be used to specify an element that should not inherit Note placeholder styles
			 *				                   // Plugins, Additional elements and features that this editor supports (optional)
			 *				                    'plugins' => array(
			 *				                    	'note_background' // Allow for addition of a background image
			 *                               ),
			 *  			                // Blocks, Additional blocks to be added to the "insert" toolbar
			 *  			                'blocks' => array(
			 *  			                    'note_background' // Matches plugin name above
			 *  			                )
			 *                          ...
			 *			             )
			 *		)
			 *	)
			 *
			 * TODO: Placeholder/default content could be set in the template possibly
			 * TODO: Allow for different columns to specify a template?
			 */
			$this->templates = apply_filters( 'note_widget_templates', array(
				// 2 Columns
				'2-col' => array(
					// Label
					'label' => __( '2 Columns', 'note' ),
					// Placeholder Content
					'placeholder' => '<h2>Heading 2</h2>
						<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed eros tortor, molestie eget tortor sit amet, feugiat semper ante. Aliquam a pellentesque purus, quis vulputate lacus.</p>',
					// Type
					'type' => 'simple',
					// Customizer Previewer Configuration
					'config' => array(
						// Allow for the customization of the following
						'customize' => array(
							'rows' => true // Rows
						),
						// Column configuration
						'columns' => array(
							// Column 1 (Content Area)
							'1' => array(),
							// Column 2 (Content Area)
							'2' => array()
						)
					)
				),
				// 2 Columns - Media Left/Content Right
				'2-col-media-content' => array(
					// Label
					'label' => __( '2 Columns - Media Left/Content Right', 'note' ),
					// Placeholder Content
					'placeholder' => '<h2>Heading 2</h2>
						<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed eros tortor, molestie eget tortor sit amet, feugiat semper ante. Aliquam a pellentesque purus, quis vulputate lacus.</p>',
					// Template
					'template' => '2-col',
					// Type
					'type' => 'simple',
					// Customizer Previewer Configuration
					'config' => array(
						// Allow for the customization of the following
						'customize' => array(
							'rows' => true // Rows
						),
						// Column configuration
						'columns' => array(
							// Column 1 (Content Area)
							'1' => array(
								// Type of editor
								'type' => 'media', // Media Only (no text)
								// Placeholder Content (empty)
								'placeholder' => ''
							),
							// Column 2 (Content Area)
							'2' => array()
						)
					)
				),
				// 2 Columns - Content Left/Media Right
				'2-col-content-media' => array(
					// Label
					'label' => __( '2 Columns - Content Left/Media Right', 'note' ),
					// Placeholder Content
					'placeholder' => '<h2>Heading 2</h2>
						<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed eros tortor, molestie eget tortor sit amet, feugiat semper ante. Aliquam a pellentesque purus, quis vulputate lacus.</p>',
					// Template
					'template' => '2-col',
					// Type
					'type' => 'simple',
					// Customizer Previewer Configuration
					'config' => array(
						// Allow for the customization of the following
						'customize' => array(
							'rows' => true // Rows
						),
						// Column configuration
						'columns' => array(
							// Column 1 (Content Area)
							'1' => array(),
							// Column 2 (Content Area)
							'2' => array(
								// Type of editor
								'type' => 'media', // Media Only (no text)
								// Placeholder Content
								'placeholder' => ''
							)
						)
					)
				),
				// 3 Columns
				'3-col' => array(
					// Label
					'label' => __( '3 Columns', 'note' ),
					// Placeholder Content
					'placeholder' => '<h2>Heading 2</h2>
								<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed eros tortor, molestie eget tortor sit amet, feugiat semper ante. Aliquam a pellentesque purus, quis vulputate lacus.</p>',
					// Type
					'type' => 'simple',
					// Customizer Previewer Configuration
					'config' => array(
						// Allow for the customization of the following
						'customize' => array(
							'rows' => true // Rows
						),
						// Column configuration
						'columns' => array(
							// Column 1 (Content Area)
							'1' => array(),
							// Column 2 (Content Area)
							'2' => array(),
							// Column 3 (Content Area)
							'3' => array()
						)
					)
				),
				// 4 Columns
				'4-col' => array(
					// Label
					'label' => __( '4 Columns', 'note' ),
					// Placeholder Content
					'placeholder' => '<h2>Heading 2</h2>
								<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed eros tortor, molestie eget tortor sit amet, feugiat semper ante. Aliquam a pellentesque purus, quis vulputate lacus.</p>',
					// Type
					'type' => 'simple',
					// Customizer Previewer Configuration
					'config' => array(
						// Allow for the customization of the following
						'customize' => array(
							'rows' => true // Rows
						),
						// Column configuration
						'columns' => array(
							// Column 1 (Content Area)
							'1' => array(),
							// Column 2 (Content Area)
							'2' => array(),
							// Column 3 (Content Area)
							'3' => array(),
							// Column 4 (Content Area)
							'4' => array()
						)
					)
				),
				// 5 Columns
				'5-col' => array(
					// Label
					'label' => __( '5 Columns', 'note' ),
					// Placeholder Content
					'placeholder' => '<h2>Heading 2</h2>
								<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed eros tortor, molestie eget tortor sit amet, feugiat semper ante. Aliquam a pellentesque purus, quis vulputate lacus.</p>',
					// Type
					'type' => 'simple',
					// Customizer Previewer Configuration
					'config' => array(
						// Allow for the customization of the following
						'customize' => array(
							'rows' => true // Rows
						),
						// Column configuration
						'columns' => array(
							// Column 1 (Content Area)
							'1' => array(),
							// Column 2 (Content Area)
							'2' => array(),
							// Column 3 (Content Area)
							'3' => array(),
							// Column 4 (Content Area)
							'4' => array(),
							// Column 5 (Content Area)
							'5' => array()
						)
					)
				),
				// 6 Columns
				'6-col' => array(
					// Label
					'label' => __( '6 Columns', 'note' ),
					// Placeholder Content
					'placeholder' => '<h2>Heading 2</h2>
								<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed eros tortor, molestie eget tortor sit amet, feugiat semper ante. Aliquam a pellentesque purus, quis vulputate lacus.</p>',
					// Type
					'type' => 'simple',
					// Customizer Previewer Configuration
					'config' => array(
						// Allow for the customization of the following
						'customize' => array(
							'rows' => true // Rows
						),
						// Column configuration
						'columns' => array(
							// Column 1 (Content Area)
							'1' => array(),
							// Column 2 (Content Area)
							'2' => array(),
							// Column 3 (Content Area)
							'3' => array(),
							// Column 4 (Content Area)
							'4' => array(),
							// Column 5 (Content Area)
							'5' => array(),
							// Column 6 (Content Area)
							'6' => array()
						)
					)
				)
			), $this );

			// Set up the default widget template types
			$this->template_types = apply_filters( 'note_widget_template_types', array(
				'simple' => __( 'Simple', 'note' )
			), $this );

			// Organize templates by type and determine the maximum number of content areas
			if ( ! empty( $this->templates ) ) {
				foreach ( $this->templates as $template_id => $template ) {
					/*
					 * Templates by Type
					 */
					// TODO: Ensure the simple templates are at the "top" of the list using array_splice? Use order of $this->template_types array keys for order of $this->templates_by_type if possible
					// If this template has a type
					if ( isset( $template['type'] ) ) {
						// Create the template type array if it doesn't exist
						if ( ! isset( $this->templates_by_type[$template['type']] ) )
							$this->templates_by_type[$template['type']] = array();

						// Store a reference to the template ID in it's type
						$this->templates_by_type[$template['type']][] = $template_id;
					}
					else {
						// Create the template type array if it doesn't exist
						if ( ! isset( $this->templates_by_type['simple'] ) )
							$this->templates_by_type['simple'] = array();

						// Store a reference to the template ID in the default simple type
						$this->templates_by_type['simple'][] = $template_id;
					}

					/*
					 * Maximum Content Areas
					 */
					$template_content_areas = 1;

					// Count the number of content areas for this template
					if ( isset( $template['config']['columns'] ) ) {
						$template_columns = ( is_array( $template['config']['columns'] ) ) ? count( $template['config']['columns'] ) : ( int ) $template['config']['columns'];
						$template_content_areas = ( $this->max_rows * $template_columns );

						if ( $template_columns < $this->max_columns )
							$template_content_areas = ( $this->max_rows * $this->max_columns );
					}


					// If this template has more content areas than the current maximum number, adjust the value
					if ( $template_content_areas > $this->max_content_areas )
						$this->max_content_areas = $template_content_areas;
				}
			}

			// Allow for filtering of the base template directory
			$this->base_template_dir = apply_filters( 'note_widget_base_template_dir', $this->base_template_dir, $this );

			// Call the parent constructor element
			parent::__construct( $id_base, sprintf( __( '%1$s', 'note' ), $this->name ), $this->widget_options, $this->control_options );


			// Hooks
			if ( ! has_action( 'admin_enqueue_scripts', array( $this, 'admin_enqueue_scripts' ) ) )
				add_action( 'admin_enqueue_scripts', array( $this, 'admin_enqueue_scripts' ) ); // Enqueue admin scripts
			if ( ! has_action( 'note_widget', array( get_class(), 'note_widget' ) ) )
				add_action( 'note_widget', array( get_class(), 'note_widget' ), 10, 3 ); // Output standard Note Widget content
			if ( ! has_action( 'note_widget_after', array( get_class(), 'note_widget_after' ) ) )
				add_action( 'note_widget_after', array( get_class(), 'note_widget_after' ), 10, 3 ); // Output standard Note Widget content

			// Shim for Conductor 1.2.* TODO: Remove in a future version
			if ( ! Note::conductor_has_flexbox_display() && function_exists( 'Conduct_Note_Widget' ) ) {
				// Grab the Conductor Note Widget instance
				$conductor_note_widget = Conduct_Note_Widget();

				// Remove all hooks associated with Conductor Note Widget
				remove_filter( 'note_tinymce_plugins', array( $conductor_note_widget, 'note_tinymce_plugins' ) ); // Note TinyMCE Plugins
				remove_filter( 'note_tinymce_toolbar', array( $conductor_note_widget, 'note_tinymce_toolbar' ) ); // Note TinyMCE Toolbar
				remove_filter( 'note_widget_widget_options', array( $conductor_note_widget, 'note_widget_widget_options' ) ); // Note Widget Options
				remove_action( 'note_widget_defaults', array( $conductor_note_widget, 'note_widget_defaults' ) ); // Note Widget Defaults
				remove_action( 'note_widget_settings_content_before', array( $conductor_note_widget, 'note_widget_settings_content_before' ), 10, 2 ); // Note Widget Settings before content
				remove_filter( 'note_widget_update', array( $conductor_note_widget, 'note_widget_update' ) ); // Note Widget Update
				remove_filter( 'note_widget_instance', array( $conductor_note_widget, 'note_widget_instance' ) ); // Note Widget Instance

				remove_action( 'note_widget_before', array( $conductor_note_widget, 'note_widget_before' ), 1); // Note Widget Output (early)
				remove_action( 'note_widget_after', array( $conductor_note_widget, 'note_widget_after' ), 9999 ); // Note Widget Output After (late)
			}
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

			// Grab the template configuration for this widget
			// Determine if we have a template (other than default) selected for this Note Widget
			$widget_template = ( isset( $instance['template'] ) && $this->is_valid_template( $instance['template'] ) ) ? $this->templates[$instance['template']] : false; // Fetch the current template
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


			<?php do_action( 'note_widget_settings_template_before', $instance, $this ); ?>

			<p class="note-template">
				<?php // Widget Template (Display Layout) ?>
				<label for="<?php echo $this->get_field_id( 'template' ); ?>"><strong><?php _e( 'Display Layout', 'note' ); ?></strong></label>
				<br />
				<select name="<?php echo $this->get_field_name( 'template' ); ?>" id="<?php echo $this->get_field_id( 'template' ); ?>" class="note-template note-select">
					<option value=""><?php _e( '&mdash; Select &mdash;', 'note' ); ?></option>
					<option value="<?php echo esc_attr( $this->defaults['template'] ); ?>" <?php selected( ( isset( $instance['template'] ) && ! empty( $instance['template'] ) && $instance['template'] !== 'standard' ) ? $instance['template'] : 'default', $this->defaults['template'] ); ?>><?php _e( 'Standard', 'note' ); ?></option>

					<?php
						// If we have templates
						if ( ! empty( $this->templates_by_type ) ) :
							// Loop through each template type
							foreach ( $this->templates_by_type as $template_type => $template_ids ) :
					?>
							<optgroup label="<?php echo esc_attr( $this->template_types[$template_type] ); ?>">
								<?php
									// Loop through templates within this type
									foreach ( $template_ids as $template_id ) :
										// Sanitize Template ID
										$template_id = esc_attr( sanitize_text_field( $template_id ) );

										// Grab the template configuration
										$template = ( isset( $this->templates[$template_id] ) ) ? $this->templates[$template_id] : false;

										// Determine Template Label (fallback to ID)
										$template_label = ( isset( $template['label'] ) && ! empty( $template['label'] ) ) ? $template['label'] : $template_id;

										// Data Attributes
										$data_attrs = array(
											'data-note-customize-columns' => ( $template && ( isset( $template['config'] ) && isset( $template['config']['customize'] ) && isset( $template['config']['customize']['columns'] ) && $template['config']['customize']['columns'] ) ),
											'data-note-customize-rows' => ( $template && ( isset( $template['config'] ) && isset( $template['config']['customize'] ) && isset( $template['config']['customize']['rows'] ) && $template['config']['customize']['rows'] ) )
										);
										$data_attrs = apply_filters( 'note_widget_template_option_data_attributes', $data_attrs, $template, $template_id, $instance, $this );
										$data_attrs = $this->prepare_data_attributes( $data_attrs );
								?>
										<option value="<?php echo $template_id; ?>" <?php selected( $instance['template'], $template_id ); ?> <?php echo $data_attrs; ?>><?php echo $template_label; ?></option>
								<?php
									endforeach;
								?>
							</optgroup>
					<?php
							endforeach;
						endif;
					?>
				</select>
				<small class="description note-description"><?php _e( 'Select a layout for the Note widget to display.', 'note' ); ?></small>
			</p>

			<?php do_action( 'note_widget_settings_template_after', $instance, $this ); ?>


			<?php do_action( 'note_widget_settings_columns_before', $instance, $this ); ?>

			<div class="note-widget-setting note-range-input note-columns note-customize-columns <?php echo ( ! $this->template_supports_customize_property( $widget_template, 'columns' ) ) ? 'note-hidden' : false; ?>">
				<?php // Widget Columns ?>
				<label for="<?php echo $this->get_field_id( 'columns' ); ?>"><strong><?php _e( 'Number of Columns', 'note' ); ?></strong></label>
				<br />
				<input type="range" min="<?php echo esc_attr( $this->defaults['columns'] ); ?>" max="<?php echo esc_attr( $this->max_columns ); ?>" class="note-input note-range-input-range note-columns-range" id="<?php echo $this->get_field_id( 'columns' ); ?>" name="<?php echo $this->get_field_name( 'columns' ); ?>" value="<?php echo esc_attr( $instance['columns'] ); ?>" />
				<span class="note-range-value note-columns-value"><?php echo $instance['columns']; ?></span>
				<small class="description note-description"><?php _e( 'Select the number of columns to display (zero will honor the current template configuration defaults).', 'note' ); // TODO: Adjust description ?></small>
			</div>

			<?php do_action( 'note_widget_settings_columns_after', $instance, $this ); ?>


			<?php do_action( 'note_widget_settings_rows_before', $instance, $this ); ?>

			<div class="note-widget-setting note-range-input note-rows note-customize-rows <?php echo ( ! $this->template_supports_customize_property( $widget_template, 'rows' ) ) ? 'note-hidden' : false; ?>">
				<?php // Widget Rows ?>
				<label for="<?php echo $this->get_field_id( 'rows' ); ?>"><strong><?php _e( 'Number of Rows', 'note' ); ?></strong></label>
				<br />
				<input type="range" min="<?php echo esc_attr( $this->defaults['rows'] ); ?>" max="<?php echo esc_attr( $this->max_rows ); ?>" class="note-input note-range-input-range note-rows-range" id="<?php echo $this->get_field_id( 'rows' ); ?>" name="<?php echo $this->get_field_name( 'rows' ); ?>" value="<?php echo esc_attr( $instance['rows'] ); ?>" />
				<span class="note-range-value note-rows-value"><?php echo $instance['rows']; ?></span>
				<small class="description note-description"><?php _e( 'Select the number of rows to display (zero will honor the current template configuration defaults).', 'note' ); // TODO: Adjust description ?></small>
			</div>

			<?php do_action( 'note_widget_settings_rows_after', $instance, $this ); ?>


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

				<?php
					// If we have content areas, output the correct amount of textareas
					if ( $this->max_content_areas > 1 ) :
						// Loop through content areas
						for ( $i = 1; $i <= $this->max_content_areas; $i++ ) :
				?>
					<textarea class="note-input note-hidden note-column-content note-content-<?php echo $i; ?>" id="<?php echo $this->get_field_id( 'content-area-' . $i ); ?>" name="<?php echo ( Note::wp_version_compare( '4.4' ) ) ? $this->get_field_name( 'content_area[' . $i . ']' ) : $this->get_field_name( 'content_area][' . $i ); ?>" rows="16" cols="20"><?php echo ( isset( $instance['content_areas'][$i] ) ) ? $instance['content_areas'][$i] : false; ?></textarea>
				<?php
						endfor;
					endif;
				?>
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

			
			<?php do_action( 'note_widget_settings_extras_before', $instance, $this ); ?>

			<div class="note-widget-setting note-widget-extras note-hidden">
				<?php do_action( 'note_widget_settings_extras_inner_before', $instance, $this ); ?>

				<?php // Background Image Attachment ID ?>
				<input type="text" class="note-input note-background-image-id" id="<?php echo $this->get_field_id( 'extras_background_image_attachment_id' ); ?>" name="<?php echo ( Note::wp_version_compare( '4.4' ) ) ? $this->get_field_name( 'extras[background_image_attachment_id]' ) : $this->get_field_name( 'extras][background_image_attachment_id' ); ?>" value="<?php echo esc_attr( $instance['extras']['background_image_attachment_id'] ); ?>" />

				<?php do_action( 'note_widget_settings_extras_inner_after', $instance, $this ); ?>
			</div>

			<?php do_action( 'note_widget_settings_extras_after', $instance, $this ); ?>
			

			<?php do_action( 'note_widget_settings_after', $instance, $this ); ?>

			<div class="clear"></div>

			<p class="note-widget-slug">
				<?php printf( __( 'Content management brought to you by <a href="%1$s" target="_blank">Conductor</a>','note' ), esc_url( 'https://conductorplugin.com/note/?utm_source=note&utm_medium=link&utm_content=note-widget-branding&utm_campaign=note' ) ); ?>
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

			// Widget Template
			$new_instance['template'] = ( ! empty( $new_instance['template'] ) ) ? sanitize_text_field( $new_instance['template'] ) : $this->defaults['template']; // Widget Template
			$new_instance['template'] = ( ! empty( $new_instance['template'] ) && $this->is_valid_template( $new_instance['template'] ) ) ? $new_instance['template'] : $this->defaults['template']; // Further sanitization of Widget Template

			// Widget Columns
			$new_instance['columns'] = ( ! empty( $new_instance['columns'] ) ) ? ( int ) $new_instance['columns'] : $this->defaults['columns']; // Widget Columns

			// Widget Rows
			$new_instance['rows'] = ( ! empty( $new_instance['rows'] ) ) ? ( int ) $new_instance['rows'] : $this->defaults['rows']; // Widget Rows

			// Widget Content
			//$new_instance['content'] = ( ! empty( $new_instance['content'] ) ) ? stripslashes( wp_filter_post_kses( addslashes( $new_instance['content'] ) ) ) : false; // Widget Content - wp_filter_post_kses() expects slashed content
			//$new_instance['content'] = ( ! empty( $new_instance['content'] ) ) ? format_to_edit( $new_instance['content'], true ) : false; // Widget Content - wp_filter_post_kses() expects slashed content
			$new_instance['content'] = ( ! empty( $new_instance['content'] ) ) ? $this->sanitize_widget_content( $new_instance['content'] ) : false; // Widget Content - Sanitize as post_content; Fake a Post ID

			// Widget Content (further sanitization; if we have a template other than the default)
			// TODO: Allow for sanitizing based on type of content area in $this->templates and $new_instance['template']?
			if ( $new_instance['template'] !== $this->defaults['template'] ) {
				// Values for direct comparison
				$compare_placeholder = $this->sanitize_widget_content( $this->get_template_placeholder( $new_instance ), 'compare' ); // Fetch the template's placeholder and sanitize it for comparing
				$compare_content = $this->sanitize_widget_content( $new_instance['content'], 'compare' );

				$new_instance['content'] = ( $compare_content !== $compare_placeholder ) ?  $new_instance['content'] : false;

				// Widget Content (Columns)
				if ( is_array( $new_instance['content_area'] ) && ! empty( $new_instance['content_area'] ) ) {
					// Loop through content areas
					foreach ( $new_instance['content_area'] as $number => &$content_area ) {
						// Sanitize the content area first
						$content_area = ( ! empty( $content_area ) ) ? $this->sanitize_widget_content( $content_area ) : false; // Widget Content - Sanitize as post_content; Fake a Post ID

						// Values for direct comparison
						$compare_placeholder = $this->sanitize_widget_content( $this->get_template_placeholder( $new_instance, $number ), 'compare' ); ; // Fetch the template's placeholder and sanitize it for comparing
						$compare_content = $this->sanitize_widget_content( $content_area, 'compare' );

						$content_area = ( ! empty( $content_area ) && $compare_content !== $compare_placeholder ) ? $content_area : false;
					}

					// Widget Content (store in correct location)
					$new_instance['content_areas'] = $new_instance['content_area'];
					unset( $new_instance['content_area'] );
				}
			}

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


			// Extras
			$new_instance['extras']['background_image_attachment_id'] = ( ! empty( $new_instance['extras']['background_image_attachment_id'] ) ) ? ( int ) $new_instance['extras']['background_image_attachment_id'] : $this->defaults['extras']['background_image_attachment_id']; // Background Image Attachment ID

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
			if ( $hook === 'widgets.php' ) {
				// Note Widget Admin CSS
				wp_enqueue_style( 'note-widget-admin', Note::plugin_url() . '/assets/css/widgets/note-widget-admin.css', array( 'dashicons' ), Note::$version );

				//Note Widget Admin
				wp_enqueue_script( 'note-widget-admin', Note::plugin_url() . '/assets/js/widgets/note-widget-admin.js', array( 'jquery', 'underscore' ), Note::$version, true );

				// Only in the widgets admin
				if ( ! is_customize_preview() ) {
					// Grab the Note Customizer instance
					$note_customizer = Note_Customizer();

					// Setup Note Widget localize data (data is stored in $note_customizer->note_localize after this function runs)
					$note_customizer->setup_note_widget_localize_data();

					// Localize the Note Customizer script information
					wp_localize_script( 'note-widget-admin', 'note', $note_customizer->note_localize );
				}
			}
		}


		/**********
		 * Output *
		 **********/

		/**
		 * This function outputs standard Note Widget content.
		 *
		 * @var $widget Note_Widget
		 */
		public static function note_widget( $instance, $args, $widget ) {
			extract( $args ); // $before_widget, $after_widget, $before_title, $after_title

			// Check to see if we have a valid template
			if ( isset( $instance['template'] ) && $widget->is_valid_template( $instance['template'] ) ) :
			?>
				<div class="note-wrapper <?php echo esc_attr( $widget->get_css_classes( $instance ) ); ?>">
					<?php $widget->widget_title( $before_title, $after_title, $instance, $args ); // Widget Title ?>

					<?php $widget->load_template( $widget->get_template( $instance['template'] ), $instance['template'], 'template', $instance, $args, $widget ); // Load Template ?>
				</div>
			<?php
			// Otherwise, load the standard Note Widget template
			else:
			?>
				<div class="note-wrapper <?php echo esc_attr( $widget->get_css_classes( $instance ) ); ?>">
					<?php $widget->widget_title( $before_title, $after_title, $instance, $args ); // Widget Title ?>

					<?php $widget->widget_content( $instance, $args ); // Widget Content ?>
				</div>
			<?php
			endif;
		}

		/**
		 * This function outputs extra Note Widget data.
		 */
		public static function note_widget_after( $instance, $args, $widget ) {
			// Determine if we have a template (other than default) selected for this Note Widget
			$template = ( isset( $instance['template'] ) && $widget->is_valid_template( $instance['template'] ) ) ? $widget->templates[$instance['template']] : false; // Fetch the current template

			/*
			 * Extras
			 */
			$widget_css_selector = '';

			// Background Image
			if ( $widget->template_supports_customize_property( $template, 'note_background' ) && isset( $instance['extras']['background_image_attachment_id'] ) && ! empty( $instance['extras']['background_image_attachment_id'] ) ) :
				// If we don't have a widget CSS selector at this time
				if ( empty( $widget_css_selector ) )
					$widget_css_selector = $widget->get_widget_css_selector( $args['before_widget'], $widget->number );

				// Grab the background image source details ([0] is url, [1] is width, [2] is height)
				$background_image_src = wp_get_attachment_image_src( $instance['extras']['background_image_attachment_id'], 'full' );
			?>
				<style type="text/css" class="note-background-css">
					<?php echo $widget_css_selector; ?> .note-wrapper {
						background: url( '<?php echo $background_image_src[0]; ?>' ) <?php echo $widget->background_image_css; ?>;
					}
				</style>
			<?php
			endif;
		}


		/**********************
		 * Internal Functions *
		 **********************/

		/**
		 * This function generates CSS classes for widget output.
		 */
		public function get_css_classes( $instance ) {
			$classes = array(
				'note-widget-wrapper'
			);

			// Template
			if ( isset( $instance['template'] ) && $instance['template'] !== $this->defaults['template'] )
			     $classes = array_merge( $classes, array(
					'note-template-wrapper',
					'note-widget-template-wrapper',
					$instance['template'],
					'note-widget-' . $instance['template']
				) );

			// Custom CSS Classes
			if ( ! empty( $instance['css_class'] ) )
				$classes[] = str_replace( '.', '', $instance['css_class'] );

			// Type
			if ( isset( $instance['template'] ) && $this->is_valid_template( $instance['template'] ) ) {
				// Template
				$template = $this->templates[$instance['template']];

				if ( isset( $template['type'] ) ) {
					$classes[] = $template['type'];
					$classes[] = 'note-widget-' . $template['type'];
					$classes[] = 'note-widget-type-' . $template['type'];
				}
			}

			$classes = apply_filters( 'note_widget_css_classes', $classes, $instance, $this );

			// TODO: Sanitize CSS classes

			return implode( ' ', $classes );
		}

		/**
		 * This function returns a CSS selector for this widget based on the before_widget parameter.
		 */
		public function get_widget_css_selector( $before_widget, $widget_number ) {
			preg_match( '/id="([^"]+)/', $before_widget, $widget_css_id );
			$widget_css_id = ( ! empty( $widget_css_id ) ) ? $widget_css_id[1] : false;

			// Build a CSS selector
			$css_selector = '';

			// If this widget has an ID attribute
			if ( $widget_css_id )
				$css_selector .= '#' . $widget_css_id;
			// Find the best suitable CSS class
			else {
				preg_match( '/class="([^"]+)/', $before_widget, $widget_css_classes );
				$widget_css_classes = ( ! empty( $widget_css_classes ) ) ? explode( ' ', $widget_css_classes[1] ) : false;

				// Loop through widget CSS classes
				if ( ! empty( $widget_css_classes ) )
					foreach ( $widget_css_classes as $css_class )
						// Found a class that contains the widget id, we'll try it
						if ( strpos( $css_class, ( string ) $widget_number ) !== false ) {
							$css_selector .= '.' . $css_class;
							break;
						}
			}

			return $css_selector;
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

			// Note Widget content
			$widget_content = isset( $instance['content'] ) ? do_shortcode( $instance['content'] ) : false;
			$widget_content = apply_filters( 'note_widget_content', $widget_content, $instance, $args, $this );
		?>
			<div class="widget-content"><?php echo $widget_content; ?></div>
		<?php
			do_action( 'note_widget_content_after', $instance, $args, $this );
		}

		/**
		 * This function validates the selected widget template by checking if the template exists
		 * in template configuration.
		 */
		public function is_valid_template( $template_id ) {
			// Does this template id exist in templates?
			return array_key_exists( $template_id, $this->templates ) && $template_id !== $this->defaults['template'];
		}


		/**
		 * This function returns the correct template name for the selected template. It will use
		 * the template ID as the fallback template name.
		 */
		public function get_template( $template_id ) {
			// Does this template id exist in templates?
			if ( $this->is_valid_template( $template_id ) && isset( $this->templates[$template_id]['template'] ) && ! empty( $this->templates[$template_id]['template'] ) )
				$template_id = $this->templates[$template_id]['template'];

			// Fallback to the default template if the requested template doesn't exist
			if ( ! note_locate_template_part( $this->base_template_dir . '/' . $template_id ) )
				$template_id = 'default'; // TODO: Add a filter to allow for adjustments

			// Return the template
			return $template_id;
		}

		/**
		 * This function loads a template for display in the widget.
		 *
		 * Available Variables (if this function is called from within a template):
		 * @var $number int, Reference to the row/column/content area number that is being displayed
		 * @var $instance array, Reference to the widget instance (settings)
		 * @var $args array, Reference to the widget args
		 * @var $widget Note_Widget, Reference to the PHP instance of the Note Widget
		 * @var $template string, Template ID
		 */
		public function load_template( $template_name, $template, $context, $instance, $args, $widget, $number = 0, $extra_data = array() ) {
			// Data to pass to the template (will be extract()ed for use in the template)
			$data = array(
				'instance' => $instance, // Widget Instance
				'args' => $args, // Widget Args
				'widget' => $this, // Note Widget
				'number' => $number, // Content Area Number
				'template' => $template // Template
			);

			// TODO: Should we just merge the extra data with the default data?

			// Switch based on context
			switch ( $context ) {
				// Column
				case 'column':
					$data['column'] = $number;

					// If we have extra data for 'row'
					if ( ! empty( $extra_data ) && is_array( $extra_data ) && isset( $extra_data['row'] ) )
						$data['row'] = $extra_data['row'];
				break;

				// Row
				case 'row':
					$data['row'] = $number;
				break;

				// Template
				// TODO?

				// Default
				default:
				// TODO: Nothing for now
				break;
			}

			do_action( 'note_widget_content_before', $instance, $args, $this );
			do_action( 'note_widget_template_before', $template_name, $template, $data, $number, $instance, $args, $widget, $this );
			do_action( 'note_widget_' . $template_name . '_before', $template_name, $template, $data, $number, $instance, $args, $widget, $this );

			// Get the Note template part
			note_get_template_part( $this->base_template_dir . '/' . $template_name, '', $data );

			do_action( 'note_widget_' . $template_name . '_after', $template_name, $template, $data, $number, $instance, $args, $widget, $this );
			do_action( 'note_widget_template_after', $template_name, $template, $data, $number, $instance, $args, $widget, $this );
			do_action( 'note_widget_content_after', $instance, $args, $this );
		}

		/**
		 * This function generates CSS classes for widget template output based on context.
		 */
		public function get_template_css_class( $context, $instance, $number = 0 ) {
			$classes = array();
			$template = ( isset( $instance['template'] ) && $this->is_valid_template( $instance['template'] ) ) ? $this->templates[$instance['template']] : false; // Fetch the current template
			$template_columns = $this->get_column_count( $instance, $template );
			$column_num = ( int ) floor( $template_columns - ( ( ceil( $number / $template_columns ) * $template_columns ) - $number ) ); // TODO: We probably don't need the floor() wrapper here

			// Switch based on context
			switch ( $context ) {
				// Row
				case 'row':
					$classes[] = 'note-row';
					$classes[] = 'note-row-' . $template_columns . '-columns';
					$classes[] = 'note-flex';
					$classes[] = 'note-flex-' . $template_columns . '-columns';
					$classes[] = 'note-' . $template_columns . '-columns';

					// Number
					if ( $number ) {
						$classes[] = 'note-row-' . $number;
						$classes[] = ( $number % 2 ) ? 'note-row-odd' : 'note-row-even'; // Odd or even
					}
				break;

				// Column
				case 'column':
					$classes[] = 'note-col';

					// Number
					if ( $number && $number > $template_columns )
						$classes[] = 'note-col-' . $column_num;

					$classes[] = 'note-col-' . $number;
					$classes[] = ( $number % 2 ) ? 'note-col-odd' : 'note-col-even'; // Odd or even

					// Previewer only
					if ( $this->is_customize_preview() ) {
						$classes[] = 'note-col-has-editor';
						$classes[] = 'note-col-editor-' . $number;

						// Type
						if ( $template && $number ) {
							// Determine the type of configuration
							$type = ( $number && isset( $template['config']['columns'] ) && isset( $template['config']['columns'][$number] ) && isset( $template['config']['columns'][$number]['type'] ) ) ? $template['config']['columns'][$number]['type'] : false;
							$type = ( $column_num && ! $type && isset( $template['config']['columns'] ) && isset( $template['config']['columns'][$column_num] ) && isset( $template['config']['columns'][$column_num]['type'] ) ) ? $template['config']['columns'][$column_num]['type'] : $type;
							$type = ( ! $type && isset( $template['config'] ) && isset( $template['config']['type'] ) ) ? $template['config']['type'] : $type;
							$type = ( ! $type && isset( $template['type'] ) ) ? $template['type'] : $type;

							if ( $type ) {
								$classes[] = 'note-col-editor-' . $type;
								$classes[] = 'note-col-editor-' . $type . '-' . $number;
								$classes[] = 'note-col-editor-' . $type . '-' . $column_num;
							}
						}
					}
				break;

				// Content
				case 'content':
					// Previewer only
					if ( $this->is_customize_preview() ) {
						$classes[] = 'note-content';
						$classes[] = 'note-content-wrap';
						$classes[] = 'editor';
						$classes[] = 'editor-content';

						// Number
						if ( $number )
							$classes[] = 'editor-' . $number;

						// TODO: we need the placeholder class if the content isn't empty but contains class="note-placeholder"
						// Placeholder (Template/Number)
						if ( $template && $number ) {
							// Empty content
							if ( empty( $instance['content_areas'][$number] ) ) {
								$classes[] = 'editor-placeholder';
								$classes[] = 'editor-placeholder-content';
								$classes[] = 'note-has-placeholder';
								$classes[] = 'note-has-placeholder-content';
							}
							// Mixed content
							else if ( strpos( $instance['content_areas'][$number], 'class="note-placeholder"' ) !== false ) {
								$classes[] = 'editor-placeholder';
								$classes[] = 'editor-placeholder-mixed-content';
								$classes[] = 'note-has-placeholder';
								$classes[] = 'note-has-mixed-content';
							}
						}
						// Placeholder (Standard/Template Content)
						else if ( ( ! $template && ! $number ) || ( $template && ! $number ) ) {
							// Empty content
							if ( empty( $instance['content'] ) ) {
								$classes[] = 'editor-placeholder';
								$classes[] = 'editor-placeholder-content';
								$classes[] = 'note-has-placeholder';
								$classes[] = 'note-has-placeholder-content';
							}
							// Mixed content
							else if ( strpos( $instance['content'], 'class="note-placeholder"' ) !== false ) {
								$classes[] = 'editor-placeholder';
								$classes[] = 'editor-placeholder-mixed-content';
								$classes[] = 'note-has-placeholder';
								$classes[] = 'note-has-mixed-content';
							}
						}

						// Type
						if ( $template ) {
							// Determine the type of configuration
							$type = ( $number && isset( $template['config']['columns'] ) && isset( $template['config']['columns'][$number] ) && isset( $template['config']['columns'][$number]['type'] ) ) ? $template['config']['columns'][$number]['type'] : false;
							$type = ( $column_num && ! $type && isset( $template['config']['columns'] ) && isset( $template['config']['columns'][$column_num] ) && isset( $template['config']['columns'][$column_num]['type'] ) ) ? $template['config']['columns'][$column_num]['type'] : $type;
							$type = ( ! $type && isset( $template['config'] ) && isset( $template['config']['type'] ) ) ? $template['config']['type'] : $type;
							$type = ( ! $type && isset( $template['type'] ) ) ? $template['type'] : $type;

							$classes[] = 'editor-' . $type;
							$classes[] = 'editor-' . $type . '-content';
							$classes[] = 'note-editor-' . $type;
							$classes[] = 'note-editor-' . $type . '-content';

							// Placeholder (Template/Number)
							if ( $number && empty( $instance['content_areas'][$number] ) ) {
								$classes[] = 'editor-' . $type . '-placeholder';
								$classes[] = 'editor-' . $type . '-placeholder-content';
								$classes[] = 'note-' . $type . '-placeholder';
								$classes[] = 'note-' . $type . '-placeholder-content';
							}
							// Placeholder (Standard/Regular Content)
							else if ( ! $number && empty( $instance['content'] ) ) {
								$classes[] = 'editor-' . $type . '-placeholder';
								$classes[] = 'editor-' . $type . '-placeholder-content';
								$classes[] = 'note-' . $type . '-placeholder';
								$classes[] = 'note-' . $type . '-placeholder-content';
							}
						}
					}
					// Front end
					else {
						$classes[] = 'note-content';
						$classes[] = 'note-content-wrap';
					}
				break;
			}

			// TODO: Pass $number and other parameters here (if applicable)
			$classes = apply_filters( 'note_widget_template_css_classes', $classes, $context, $instance, $this );

			// TODO: Sanitize CSS classes

			return implode( ' ', $classes );
		}


		/**
		 * This function outputs a CSS class attribute with classes for widget template based on context.
		 */
		public function template_css_class( $context, $instance, $number = 0 ) {
			echo 'class="' . esc_attr( $this->get_template_css_class( $context, $instance, $number ) ) . '"';
		}

		/**
		 * This function fetches template placeholder content based on the content area number index.
		 * It will fetch a global placeholder on the template if set.
		 */
		public function get_template_placeholder( $instance, $number = 0 ) {
			// Template
			$template = ( isset( $instance['template'] ) && $this->is_valid_template( $instance['template'] ) ) ? $this->templates[$instance['template']] : false; // Fetch the current template
			$template_columns = $this->get_column_count( $instance, $template );
			// TODO: We probably don't need the floor wrapper here
			$template_column = ( int ) floor( $template_columns - ( ( ceil( $number / $template_columns ) * $template_columns ) - $number ) );

			// Placeholder
			$placeholder = false;
			$placeholder = ( $template && $number && isset( $template['config']['columns'] ) && is_array( $template['config']['columns'] ) && isset( $template['config']['columns'][$number] ) && isset( $template['config']['columns'][$number]['placeholder'] ) ) ? $template['config']['columns'][$number]['placeholder'] : $placeholder; // Fetch this column (based on $number) configuration placeholder
			$placeholder = ( $template && ! $placeholder && $number && isset( $template['config']['columns'] ) && is_array( $template['config']['columns'] ) && isset( $template['config']['columns'][$template_column] ) && isset( $template['config']['columns'][$template_column]['placeholder'] ) ) ? $template['config']['columns'][$template_column]['placeholder'] : $placeholder; // Fetch this column (based on $template_column) configuration placeholder
			$placeholder = ( $template && ! $placeholder && isset( $template['config']['placeholder'] ) ) ? $template['config']['placeholder'] : $placeholder; // Fetch this configuration placeholder
			$placeholder = ( $template && ( ! $placeholder || ! $number ) && isset( $template['placeholder'] ) ) ? $template['placeholder'] : $placeholder; // Fetch the template's placeholder
			$placeholder = $this->sanitize_widget_content( $placeholder, 'placeholder' ); // Sanitize the placeholder

			return apply_filters( 'note_widget_template_placeholder', $placeholder, $instance, $number, $template, $template_columns, $template_column, $this );
		}

		/**
		 * This function outputs template placeholder content based on the content area number index.
		 */
		public function template_placeholder( $instance, $number = 0 ) {
			echo $this->get_template_placeholder( $instance, $number );
		}

		/**
		 * This function fetches template content based on the content area number index.
		 */
		// TODO: We can possibly call sanitize_widget_content() here to know when content does actually match placeholder content (without attributes)
		public function get_template_content( $instance, $number = 0 ) {
			$template = ( isset( $instance['template'] ) && $this->is_valid_template( $instance['template'] ) ) ? $this->templates[$instance['template']] : false; // Fetch the current template
			$template_columns = $this->get_column_count( $instance, $template );
			// TODO: We probably don't need the floor wrapper here
			$template_column = ( int ) floor( $template_columns - ( ( ceil( $number / $template_columns ) * $template_columns ) - $number ) );

			// Placeholder
			$placeholder = $this->get_template_placeholder( $instance, $number ); // Fetch the template's placeholder

			// Content (already sanitized)
			$content = ( $template && $number ) ? do_shortcode( $instance['content_areas'][$number] ) : do_shortcode( $instance['content'] );

			return ( ! $this->is_customize_preview() || ! empty( $content ) ) ? apply_filters( 'note_widget_template_content', $content, $instance, $number, $template, $template_columns, $template_column, $this ) : $placeholder;
		}

		/**
		 * This function outputs template content based on the content area number index.
		 */
		public function template_content( $instance, $number = 0 ) {
			echo $this->get_template_content( $instance, $number );
		}

		/**
		 * This function determines the number of columns.
		 */
		public function get_template_column_count( $template ) {
			$template_content_areas = 1;

			// Count the number of content areas for this template
			if ( $template && isset( $template['config']['columns'] ) )
				$template_content_areas = ( is_array( $template['config']['columns'] ) ) ? count( $template['config']['columns'] ) : ( int ) $template['config']['columns'];

			return $template_content_areas;
		}

		/**
		 * This function determines the number of rows for a widget instance.
		 */
		public function get_row_count( $instance ) {
			return ( isset( $instance['rows'] ) ) ? $instance['rows'] : $this->defaults['rows'];
		}

		/**
		 * This function determines the number of columns for a widget instance.
		 */
		public function get_column_count( $instance, $template = false ) {
			// If we have a template configuration, use that data first and default to the default
			$columns = ( $template ) ? $this->get_template_column_count( $template ) : false;

			// If we have a a different amount of columns set than the template and this template allows for customization of columns
			if ( $template && $this->template_supports_customize_property( $template, 'columns' ) && isset( $instance['columns'] ) && $columns !== $instance['columns'] )
				$columns = $instance['columns'];

			// If we don't have any columns by this point, use the instance
			if ( ! $columns && isset( $instance['columns'] ) )
				$columns = $instance['columns'];

			// If we don't have any columns by now, fallback to the default
			if ( ! $columns )
				$columns = $this->defaults['columns'];

			return $columns;
		}

		/**
		 * This function sanitizes widget content. Allows for a context to determine sanitization method.
		 */
		public function sanitize_widget_content( $content, $context = 'content' ) {
			// Switch based on context
			switch ( $context ) {
				// Compare (expects previously sanitized $content)
				case 'compare':
					// Remove all tabs and newlines
					$content = preg_replace( "/\t|[\r?\n]/", '', $content );

					// Remove Note placeholder data
					$content = preg_replace( '/ class=\"note-placeholder(-parent)?\"| data-note-placeholder=\"[a-zA-z0-9-_]+\"/', '', $content );
				break;

				// Sanitized Compare (sanitize for direct comparison)
				case 'sanitized_compare':
					// Sanitize as post_content; Fake a Post ID
					$content = wp_unslash( sanitize_post_field( 'post_content', $content, 0, 'db' ) );

					// Remove all tabs and newlines
					$content = preg_replace( "/\t|[\r?\n]/", '', $content );
				break;

				// Placeholder
				case 'placeholder':
					// Sanitize as post_content; Fake a Post ID
					$content = wp_unslash( sanitize_post_field( 'post_content', $content, 0, 'db' ) );

					// Remove all tabs
					$content = preg_replace( "/\t/", '', $content );

					// Find all single newlines and add an extra (TinyMCE does this with content)
					$content = preg_replace( "([\r?\n]{1})", "\n\n", $content );
				break;

				// Content (default)
				default:
					// TODO: Remove Note placeholder CSS class
					//$content = preg_replace( '/ class=\"note-placeholder(-parent)?\"/', '', $content );

					// TODO: Remove Note placeholder data attribute
					//$content = preg_replace( '/ data-note-placeholder=\"[a-zA-z0-9-_]+\"/', '', $content );

					// Sanitize as post_content; Fake a Post ID
					$content = wp_unslash( sanitize_post_field( 'post_content', $content, 0, 'db' ) );
				break;
			}

			return $content;
		}

		/**
		 * This function prepares an array of data for use as HTML5 data attributes.
		 */
		public function prepare_data_attributes( $data_attrs ) {
			$the_data_attrs = '';

			// Loop through data attributes
			foreach ( $data_attrs as $key => &$value ) {
				// If we have a boolean value, change it to a string
				if ( is_bool( $value ) )
					$value = ( $value ) ? 'true' : 'false';

				$the_data_attrs .= $key . '="' . esc_attr( ( string ) $value ) . '" ';
			}

			return $the_data_attrs;
		}

		/**
		 * This function determines if a specific template supports 'customize' properties based on arguments.
		 */
		public function template_supports_customize_property( $template, $property ) {
			return ( $template && ( isset( $template['config'] ) && isset( $template['config']['customize'] ) && isset( $template['config']['customize'][$property] ) && $template['config']['customize'][$property] ) );
		}


		/********************
		 * Helper Functions *
		 ********************/

		/**
		 * This function determines if we're currently in the Customizer.
		 */
		function is_customizer() {
			return did_action( 'customize_controls_init' );
		}

		/**
		 * This function determines we're currently being previewed in the Customizer.
		 */
		public function is_customize_preview() {
			$is_gte_wp_4 = Note::wp_version_compare( '4.0' );

			// Less than 4.0
			if ( ! $is_gte_wp_4 ) {
				global $wp_customize;

				return is_a( $wp_customize, 'WP_Customize_Manager' ) && $wp_customize->is_preview();
			}
			// 4.0 or greater
			else
				return is_customize_preview();
		}
	}

	/**
	 * Create an instance of the Note_Widget class.
	 */
	function Note_Widget() {
		return Note_Widget::instance();
	}

	/**
	 * Register the Note Widget
	 */
	register_widget( 'Note_Widget' );
}