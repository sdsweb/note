<?php
/**
 * Note Customizer Sidebar Control
 *
 * @class Note_Customizer_Sidebar_Control
 * @author Slocum Studio
 * @version 1.0.0
 * @since 1.2.0
 */

// Bail if accessed directly
if ( ! defined( 'ABSPATH' ) )
	exit;

// Bail if the Customizer Control classes do not exist
if ( ! class_exists( 'WP_Customize_Control' ) || ! class_exists( 'WP_Widget_Area_Customize_Control' ) )
	return;

if( ! class_exists( 'Note_Customizer_Sidebar_Control' ) ) {
	final class Note_Customizer_Sidebar_Control extends WP_Widget_Area_Customize_Control {
		/**
		 * @var string
		 */
		public $version = '1.0.0';

		/**
		 * @var string
		 */
		public $section_prefix = 'sidebar-widgets-';


		/**
		 * This function determines whether the current sidebar is rendered on the front-end.
		 */
		public function active_callback() {
			// Grab the Note Sidebars instance
			$note_sidebars = Note_Sidebars();

			// If we have a valid array of sidebars
			if ( is_array( $note_sidebars->sidebars ) )
				// Loop through posts
				foreach ( $note_sidebars->sidebars as $post_id => $note_sidebar_ids )
					// Loop through Note Sidebar IDs
					foreach ( $note_sidebar_ids as $sidebar_id ) {
						// Note Sidebar arguments for this sidebar
						$sidebar_args = Note_Sidebars::note_sidebar_args( $sidebar_id, $post_id, false );

						// Generate a section ID
						$section_id = $this->section_prefix . Note_Sidebars::get_sidebar_arg( 'id', $sidebar_args );

						// If this sidebar ID matches the section ID, it is rendered on the front-end
						if ( $this->section === $section_id )
							return true;
					}

			// Otherwise, the sidebar is not rendered on the front-end
			return false;
		}
	}
}