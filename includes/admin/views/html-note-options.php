<div class="wrap about-wrap">
	<h1><?php _e( 'Note Options', 'note' ); ?></h1>

	<!--div class="about-text note-about-text">
		<?php // _e( 'Welcome to Note!', 'note' ); ?>
	</div-->

	<?php do_action( 'note_options_notifications' ); ?>

	<?php
		settings_errors( 'general' ); // General Settings Errors
		settings_errors( Note_Options::$option_name ); // Note Settings Errors
	?>

	<h3 class="nav-tab-wrapper note-nav-tab-wrapper note-options-tab-wrap">
		<a href="#general" id="general-tab" class="nav-tab note-tab nav-tab-active"><?php _e( 'General', 'note' ); ?></a>
		<!--a href="#advanced" id="advanced-tab" class="nav-tab note-tab"><?php _e( 'Advanced', 'note' ); ?></a-->
		<?php do_action( 'note_options_navigation_tabs' ); // Hook for extending tabs ?>
	</h3>

	<form method="post" action="options.php" enctype="multipart/form-data" id="note-form">
		<?php settings_fields( Note_Options::$option_name ); ?>
		<input type="hidden" name="note_options_tab" id="note_options_tab" value="" />

		<div id="general-tab-content" class="note-tab-content note-tab-content-active">
			<?php
				/**
				 * Note General Settings
				 */
				do_settings_sections( Note_Options::$option_name . '_general' );
			?>
		</div>

		<!--div id="advanced-tab-content" class="note-tab-content">
			<?php
				/**
				 * Note Advanced Settings
				 */
				do_settings_sections( Note_Options::$option_name . '_advanced' );
			?>
		</div-->

		<?php do_action( 'note_options_settings' ); // Hook for extending settings ?>

		<p class="submit">
			<?php submit_button( __( 'Save Options', 'note' ), 'primary', 'submit', false ); ?>
			<?php // submit_button( __( 'Restore Defaults', 'note' ), 'secondary', 'note[reset]', false ); ?>
		</p>
	</form>

	<?php include_once 'html-note-options-sidebar.php'; ?>
</div>