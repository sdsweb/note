<?php $note_options = Note_Admin_Options_Views::$options; // Option values are loaded in the Note_Admin_Options_Views Class on instantiation. ?>

<div class="checkbox note-checkbox note-checkbox-enable" data-label-left="<?php esc_attr_e( 'Yes', 'note' ); ?>" data-label-right="<?php esc_attr_e( 'No', 'note' ); ?>">
	<input type="checkbox" id="note_uninstall_data" name="note[uninstall][data]" <?php checked( $note_options['uninstall']['data'] ); ?> />
	<label for="note_uninstall_data">| | |</label>
</div>
