<?php
/**
 * Note Uninstall
 *
 * @author Slocum Studio
 * @version 1.0.0
 * @since 1.0.0
 */

// Bail if not actually uninstalling
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) )
	exit;

/**
 * Includes
 */
include_once 'note.php'; // Note Plugin
include_once 'includes/class-note-options.php'; // Note Options
include_once 'includes/class-note-sidebars.php'; // Note Template Functions
include_once 'includes/widgets/class-note-widget.php'; // Note Widget


/**
 * Uninstall
 */

// Fetch Note options
$note_options = Note_Options::get_options();

// Remove Note data upon uninstall
if ( $note_options['uninstall']['data'] ) {
	// Widgets grouped by sidebar
	$sidebars_widgets = wp_get_sidebars_widgets();

	if ( empty( $sidebars_widgets ) )
		$sidebars_widgets = wp_get_widget_defaults();

	// Unregister Note Sidebars
	if ( is_array( $note_options['sidebars'] ) ) {
		// Loop through posts
		foreach ( $note_options['sidebars'] as $post_id => $note_sidebar_ids )
			// Loop through Note Sidebar IDs
			foreach ( $note_sidebar_ids as $sidebar_id ) {
				// Find the Note Sidebar ID for this sidebar
				$note_sidebar_id = Note_Sidebars::get_sidebar_id( $sidebar_id, $post_id );

				// Remove this sidebar if it was found in sidebars widgets
				if ( isset( $sidebars_widgets[$note_sidebar_id] ) )
					unset( $sidebars_widgets[$note_sidebar_id] );
			}

		// Update the sidebars/widgets
		wp_set_sidebars_widgets( $sidebars_widgets );
	}

	// Grab an instance of the Note Widget and remove the settings
	$note_widget = Note_Widget();
	delete_option( $note_widget->option_name );

	// Delete the Note option
	delete_option( Note_Options::$option_name );
}