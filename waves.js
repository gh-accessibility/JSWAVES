console.log( "FILE --- waves.js" );


/****    WAVES.JS    **************************************************************************************************
 *	This script doesn't do anything except load all of the required JavaScript and CSS files into the document.
 *	To add the WAVES Toolbar onto an HTML document, only one tag is needed:
 *		<script type="text/javascript" src="[...]/waves.js?option-config.json">
 *	
 *	The actual program starts in the main() method of toolbar.js after the document loads.
 **********************************************************************************************************************/

 
 // All global variables should be properties of this object.
var WAVES = {};


( function () {
	"use strict";
	
	// Save the directory of this script relative to the page.
	WAVES.dir = ( function () {
		var scripts = document.getElementsByTagName( "script" ),
			// Matches a URL for waves.js and captures the directory path.
			regex = /^((?:[^?#]*\/)?)waves\.js(?:[?#].*)?$/;
		
		// Finds the script tag for waves.js and returns the directory part of the path.
		for( var i = 0; i < scripts.length; i++ ) {
			if( regex.test( scripts[ i ].src ) ) {
				return regex.exec( scripts[ i ].getAttribute( "src" ) )[ 1 ];
			}
		}
	} )();
	
	include(
		// MathJax      (http://www.mathjax.org/)
		"http://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML",
		
		// jQuery       (http://jquery.com/)
		"http://code.jquery.com/jquery-1.10.1.min.js",
		
		// jQuery Hotkeys (https://github.com/tzuryby/jquery.hotkeys)
		WAVES.dir + "jquery.hotkeys.js",
		
		// Loads the settings.
		WAVES.dir + "config.js",
		
		// WAVES MathML Library
		WAVES.dir + "mathml.js",
		
		// WAVES Toolbar
		WAVES.dir + "toolbar.js"
	);
	
	// Loads JavaScript or CSS files into the document.
	// Paths must be absolute.
	function include() {
		var urls = arguments;
		
		createFn( 0 )();
		
		// Recursively create a function that calls loadSingleFile and loads the next script in the callback.
		function createFn( i ) {
			var fn;
		
			if ( i == urls.length ) {
				return;
			}
			else {
				fn = createFn( i + 1 );
				return function() { loadSingleFile( urls[ i ], fn ) };
			}
			
			// Loads a single JavaScript or CSS file into the document.
			function loadSingleFile( url, callback ) {
				var tag;
								
				// Create the appropriate tag based on the file extension.
				// The regex matches a URL and captures the file extension.
				switch ( /^[^?#]*\.([^?#]+)(?:[?#].*)?$/.exec( url )[ 1 ] ) {
					// JavaScript
					case "js": {
						tag = document.createElement( "script" );
						tag.type = "text/javascript";
						tag.src = url;
						break;
					}
					// CSS
					case "css": {
						tag = document.createElement( "link" );
						tag.rel = "stylesheet";
						tag.href = url;
						break;
					}
					default: {
						return;
					}
				}
				
				//NOTE: The onreadystatechange event may also be needed for IE.			
				tag.onload = callback;
				
				// Add the tag to the head of the document.
				document.getElementsByTagName( "head" )[ 0 ].appendChild( tag );
			}
		}
	}
} )();
