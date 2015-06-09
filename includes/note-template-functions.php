<?php
/**
 * Note Template Functions
 *
 * @author Slocum Studio
 * @version 1.0.0
 * @since 1.2.0
 */

// Bail if accessed directly
if ( ! defined( 'ABSPATH' ) )
	exit;

/**
 * This function registers a Note Sidebar location based on arguments.
 *
 * @param string, $location_id, The filter name for where Note should
 * 		  hook into and create sidebars based on $sidebar_args
 * @param string, $location, 'before' or 'after' are the only possible
 * 		  values currently
 * @param string, $sidebar_id, Unique ID for this sidebar
 * @param bool $in_the_loop, Should an in_the_loop() check be made?
 */
// TODO: More robust checking to see if a "sub"-location exists
// TODO: Allow global sidebar (not specific to a page)
// TODO: Allow non-singular sidebars to be registered (like global, but specific to each page)
function note_register_sidebar_location( $args ) {
	// Parse arguments
	$defaults = array(
		'location_id' => '',
		'location' => '',
		'sidebar_id' => '',
		'in_the_loop' => true
	);

	$args = wp_parse_args( $args, $defaults );

	// Grab the Note Sidebars instance
	$note_sidebars = Note_Sidebars();

	// Populate sidebar arguments
	$sidebar_args = array(
		$args['location'] => $args['sidebar_id']
	);

	// Determine if this Note Sidebar location already exists
	if ( array_key_exists( $args['location_id'], $note_sidebars->registered_sidebar_locations) ) {
		// Store a reference to the sidebar location
		$sidebar_location = $note_sidebars->registered_sidebar_locations[$args['location_id']];

		// Merge the data
		$note_sidebars->registered_sidebar_locations[$args['location_id']] = array_merge( $sidebar_location, $sidebar_args );
	}
	// Otherwise just add it to the data
	else {
		// Add the data
		$note_sidebars->registered_sidebar_locations[$args['location_id']] = $sidebar_args;

		// Add the filter tag data
		$note_sidebars->registered_sidebar_location_filters[$args['location_id']] = array(
			'filter' => $args['location_id'],
			'in_the_loop' => $args['in_the_loop']
		);
	}
}

// TODO: Introduce a note_unregister_sidebar_location function

// TODO: Introduce a note_sidebar() function to output a sidebar in a particular location within a template