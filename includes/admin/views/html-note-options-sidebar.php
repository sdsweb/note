<div id="note-sidebar" class="sidebar">
	<?php do_action( 'note_admin_options_sidebar_before' ); ?>

	<div class="note-ads">
		<div class="note-ad note-upgrade-ad note-upgrade-ad-dark-gray">
			<a href="https://conductorplugin.com/note/?utm_source=note&utm_medium=link&utm_content=sidebar&utm_campaign=note" target="_blank">
				<h3><?php _e( 'Introducing Conductor Plugin', 'modern-business' ); ?></h3>
				<ul>
					<li><?php _e( 'Custom Layouts', 'modern-business' ); ?></li>
					<li><?php _e( 'Custom Content Displays', 'modern-business' ); ?></li>
					<li><?php _e( 'No Code Required!', 'modern-business' ); ?></li>
				</ul>

				<span class="note-btn-yellow"><?php _e( 'Get Conductor!', 'modern-business' ); ?></span>
			</a>
		</div>
	</div>

	<div class="note-rating note-widget">
		<?php printf( __( 'Please rate <strong>Note</strong> <a href="%1$s" target="_blank">&#9733;&#9733;&#9733;&#9733;&#9733;</a> on <a href="%1$s" target="_blank">WordPress.org</a>.', 'note' ), 'https://wordpress.org/support/view/plugin-reviews/note?filter=5' ); ?>
	</div>

	<br />

	<div class="yt-subscribe note-widget">
		<div class="g-ytsubscribe" data-channel="slocumstudio" data-layout="default"></div>
		<script src="https://apis.google.com/js/plusone.js"></script>
	</div>

	<div class="twitter-subscribe note-widget">
		<a href="https://twitter.com/slocumstudio" class="twitter-follow-button" data-show-count="false" data-size="large" data-dnt="true">Follow @slocumstudio</a>
		<script>!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0],p=/^http:/.test(d.location)?'http':'https';if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src=p+'://platform.twitter.com/widgets.js';fjs.parentNode.insertBefore(js,fjs);}}(document, 'script', 'twitter-wjs');</script>
	</div>

	<br />

	<div class="slocum-studio note-widget note-widget-last">
		<?php printf( __( 'Brought to you by <a href="%1$s" target="_blank">Slocum Studio</a>', 'note' ), 'https://conductorplugin.com/note/?utm_source=note&utm_medium=link&utm_content=note-sidebar-branding&utm_campaign=note' ); ?>
	</div>

	<?php do_action( 'note_admin_options_sidebar_after' ); ?>
</div>