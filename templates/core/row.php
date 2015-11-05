<?php
/**
 * This is the default template used for displaying Note Widget content in a row.
 *
 *
 * Available Variables:
 * @var $number int, Reference to the content area number that is being displayed
 * @var $row int, Reference to the row number that is being displayed
 * @var $instance array, Reference to the widget instance (settings)
 * @var $args array, Reference to the widget args
 * @var $widget Note_Widget, Reference to the PHP instance of the Note Widget
 * @var $template string, Template ID
 *
 * Widget Functions:
 * $widget->template_css_class( $context, $instance ) - Output an HTML class attribute pre-populated with CSS classes based on
 * 													    parameters. Valid $context - 'content'.
 * $widget->template_content( $instance ) - Output content for a particular content area based on parameters.
 * 											Will output placeholder if content area is empty.
 */

// Bail if accessed directly
if ( ! defined( 'ABSPATH' ) )
	exit;
?>

<?php
	// Determine if we have a template (other than default) selected for this Note Widget
	$template = ( isset( $instance['template'] ) && $widget->is_valid_template( $instance['template'] ) ) ? $widget->templates[$instance['template']] : false; // Fetch the current template
	$template_columns = $widget->get_column_count( $instance, $template );
?>

<div <?php $widget->template_css_class( 'row', $instance, $number ); ?> data-note-row="<?php echo esc_attr( $number ); ?>">
	<?php
		// Loop through content areas
		for ( $i = 1; $i <= $template_columns; $i++ )
			$widget->load_template( $widget->get_template( 'core/column' ), $instance['template'], 'column', $instance, $args, $widget, $i, array( 'row' => $row ) ); // Load Template
	?>
</div>