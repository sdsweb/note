<?php
/**
 * Note Template Functions
 *
 * @author Slocum Studio
 * @version 1.3.0
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


/**
 * This function locates and loads templates based on arguments. Optionally an array of data can be passed
 * that will be extract()ed and the template will have access to the $data. If data is passed, WordPress
 * global variables can be included as well. The template file can also be required once if necessary.
 *
 * Verify if the file exists in the theme first, then load the plugin template if necessary as a fallback.
 */
function note_get_template_part( $slug, $name = '', $data = array(), $wp_globals = false, $require_once = false ) {
	// note_get_template_part filter
	$template = apply_filters( 'note_get_template_part', note_locate_template_part( $slug, $name ), $slug, $name );

	// Finally, if we have a template, lets load it
	if ( $template ) {
		// If data was passed we have to require() the files
		if ( is_array( $data ) && ! empty( $data ) ) {
			$data = apply_filters( 'note_get_template_part_data', $data, $slug, $name );

			// WordPress Globals
			if ( $wp_globals )
				global $posts, $post, $wp_did_header, $wp_query, $wp_rewrite, $wpdb, $wp_version, $wp, $id, $comment, $user_ID;

			// Extract the data for use in the template
			extract( $data, EXTR_SKIP ); // Skip collisions
			unset( $data ); // We don't need the $data var anymore

			// Require Once
			if ( $require_once )
				require_once( $template );
			// Require
			else
				require( $template );

		}
		// Otherwise we can load_template()
		else
			load_template( $template, $require_once );
	}
}

/**
 * This function locates templates based on arguments.
 *
 * Verify if the file exists in the theme first, then locate the plugin template if necessary as a fallback.
 */
function note_locate_template_part( $slug, $name = '' ) {
	$template = '';
	$templates = array();

	// Find the more specific template in the theme first
	if ( $name ) {
		//$templates[] = $slug . '-' . $name . '.php';
		$templates[] = Note::theme_template_path() . '/' . $slug . '-' . $name . '.php';
		$template = locate_template( $templates );

		// Find the more specific template in Note if it was not found in the theme
		if ( ! $template && file_exists( Note::plugin_dir() . '/templates/' . $slug . '-' . $name . '.php' ) )
			$template = Note::plugin_dir() . '/templates/' . $slug . '-' . $name . '.php';
	}

	// Find the more generic template in the theme if the more specific template doesn't exist
	if ( ! $template ) {
		$templates = array(); // Reset templates array first
		//$templates[] = $slug . '.php';
		$templates[] = Note::theme_template_path() . '/' . $slug . '.php';
		$template = locate_template( $templates );

		// Find the more generic template in Note if it was not found in the theme
		if ( ! $template && file_exists( Note::plugin_dir() . '/templates/' . $slug . '.php' ) )
			$template = Note::plugin_dir() . '/templates/' . $slug . '.php';
	}

	return $template;
}