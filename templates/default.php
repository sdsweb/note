<?php
/**
 * This is the default template used for displaying Note Widget content.
 *
 * Note will look for your-theme/note/default.php and load that file first if it exists.
 *
 * TODO: Global variables may be reset when $widget->load_template() is called within templates, should we keep track of them and introduce a global reset function similar to wp_reset_postdata()
 *
 * Available Variables:
 * @var $number int, Reference to the row/column/content area number that is being displayed
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
	// Determine number of rows for this Note Widget
	$rows = $widget->get_row_count( $instance );
	$rows = ( $rows !== $widget->defaults['rows'] ) ? $rows : 1; // Default to 1 row if there are none set

	// Determine if we have a template (other than default) selected for this Note Widget
	$template = ( isset( $instance['template'] ) && $widget->is_valid_template( $instance['template'] ) ) ? $widget->templates[$instance['template']] : false; // Fetch the current template
	$template_columns = $widget->get_column_count( $instance, $template );

	// If we have template content areas, load the individual column template
	if ( $template_columns ) :
		// Multiple Rows
		if ( $rows > 1 ) :
			// Loop through rows
			for ( $i = 1; $i <= $rows; $i++ )
				$widget->load_template( $widget->get_template( 'core/row' ), $instance['template'], 'row', $instance, $args, $widget, $i ); // Load Template

		// Single Row
		else :
			$widget->load_template( $widget->get_template( 'core/row' ), $instance['template'], 'row', $instance, $args, $widget, $rows ); // Load Template
		endif;
	// Otherwise
	else :
?>
		<div <?php $widget->template_css_class( 'content', $instance ); ?>>
			<?php $widget->template_content( $instance ); ?>
		</div>
<?php
	endif;
?>