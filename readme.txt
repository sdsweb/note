=== Note - A live edit text widget ===
Contributors: slocumstudio
Donate link: 
Tags: note, widget, customizer, live edit, wysiwyg, text, text widget, plugin, sidebar
Requires at least: 4.0
Tested up to: 4.1.1
Stable tag: 1.1.1
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Note is a simple and easy to use widget for editing bits of text, live, in your WordPress front-end Customizer.


== Description ==

Note is a simple and easy to use widget for editing bits of text, live, in your WordPress front-end Customizer. Add Notes into any sidebar to visualize how your copy will appear within the unique layout and design of your website. 

With Note, there's no more painful back and forth from the WordPress dashboard to the front-end of your site to refresh. Simply add your Note widget into a sidebar and begin typing. It's that easy.

Note is brought to you by the team at [Conductor Plugin](https://conductorplugin.com/). We're making content layout and display a cinch with [Conductor](https://conductorplugin.com/).

https://vimeo.com/111458576

**Features**

* Fast & lightweight
* Live front-end Customizer support
* Live text editing in a widget
* Apply common text styles to your copy
* Create links using the WordPress pop-up modal
* Works in any WordPress sidebar
* Visualize the right look & feel of your copy without guessing

[View Note on Github](https://github.com/sdsweb/note/) | [Issue Tracker](https://github.com/sdsweb/note/issues/)


== Installation ==

1. Upload Note to the '/wp-content/plugins/' directory
2. Activate the plugin through the 'Plugins' menu in WordPress
3. A Note widget is now available for use in the Customizer


== Frequently Asked Questions ==

= How do I add text to the widget? =

You must be in the front-end Customizer of your WordPress website. Once you're there, add the Note widget under sidebar settings.

= Why can't I type text in the admin screen? =

Note was created so you could visualize the look & feel of your copy in the context of your website's design. The best way to experience Note is - do it live.

= When will you support images and other features in Note? =

We're happy to take your feedback at [https://conductorplugin.com/contact/](https://conductorplugin.com/contact/).


== Screenshots ==
1. Note Widget UI in the Customizer
2. Creating a Note widget in the Customizer

See the video in our [Description](https://wordpress.org/plugins/note/) for a live demo.


== Changelog ==

= 1.1.1 // March 02 2015 =
* Added do_shortcode() wrapper around Note Widget output

= 1.1.0 // February 27 2015 =
* Added is_customizer() function to Note Widget to determine if the current page was the Customizer
* Added logic to scroll Previewer window to focused Note Widget on "Edit Content" button click
* Added CSS background color/transition to newly focused editors
* Added ability to create number and bullet lists within content
* Added ability to indent or outdent content
* Added modal CSS styles to Previewer within Customizer
* Added ability to insert images into Note Widgets
* Added Toolbar above Note Widgets in Previewer within Customizer
* Removed unused Customizer JavaScript logic
* Fixed bug where Note Widgets output slashed data (I\'ve, I\'ll, etc...) on front-end while not in Customizer
* Fixed bug where Previewer refresh was triggered while editing content inside of a Note Widget
* Fixed bug where Note Widgets were not focused properly in Previewer
* Fixed bug in where Note was not functioning due to JavaScript error in WordPress versions less than 4.0

= 1.0.1 // November 25 2014 =
* Output Note widget title on front end and added ability to show/hide title (hidden by default)
* Fixed bug where "Edit Content" button on new Note widgets would not function due to lack of widget data
* Fixed bug where first iteration of Note widget content would not sync in Customizer
* Added backwards compatibility support for WordPress 3.9

= 1.0.0 // November 07 2014 =
* Initial Release


== Upgrade Notice ==

Version 1.1.0 adds image and list support to Note Widgets


== Other Notes ==

= Features =

* Fast & lightweight
* Live front-end Customizer support
* Live text editing in a widget
* Apply common text styles to your copy
* Create links using the WordPress pop-up modal
* Works in any WordPress sidebar
* Visualize the right look & feel of your copy without guessing

= Issues/Bugs =

Please report any issues or bugs on the [GitHub Issue Tracker](https://github.com/sdsweb/note/issues/).