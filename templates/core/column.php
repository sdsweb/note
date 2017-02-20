<?php
/**
 * This is the default template used for displaying Note Widget content in a column.
 *
 *
 * Available Variables:
 * @var $number int, Reference to the content area number that is being displayed
 * @var $row int, Reference to the row number that is being displayed
 * @var $column int, Reference to the column number that is being displayed
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

	// Determine the correct content area number
	$content_area_number = $number + ( $template_columns * ( $row - 1 ) );
?>

<div <?php $widget->template_css_class( 'column', $instance, $content_area_number ); ?> data-note-column="<?php echo esc_attr( $number ); ?>" data-note-editor-id="<?php echo esc_attr( $content_area_number ); ?>">
	<div <?php $widget->template_css_class( 'content', $instance, $content_area_number ); ?>>
		<?php $widget->template_content( $instance, $content_area_number ); ?>
	</div>
</div>