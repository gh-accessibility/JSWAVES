console.log( "FILE --- config.js" );

WAVES.config = { "defaultPath": "defaults/test.json" };

( function () {
	"use strict";
	
	// Get the query object from the script tag.
	WAVES.query = parseQueryString( getQueryString() );
	
	// Load the config file into WAVES.config.
	$.getJSON( WAVES.query.config || ( WAVES.dir + WAVES.config.defaultPath ), function ( config ) {
		WAVES.config = config;
		WAVES.config.ready = true
	} );

	
	// Returns the query string on the script tag for waves.js.
	function getQueryString() {
		// Matches a script for waves.js and captures the query string.
		var regex = /^(?:(?:[^?#]*\/)?)waves\.js(?:\?([^?#]*))?(?:#.*)?$/;
		var scripts = document.getElementsByTagName( "script" );
		var queryString = "";
		
		// Find the script tag that contains waves.js and return its query string.
		for( var i = 0; i < scripts.length; i++ ) {
			if( regex.test( scripts[ i ].src ) ) {
				queryString = regex.exec( scripts[ i ].src )[ 1 ] || "";
				break;
			}
		}
		return queryString;
	}
	
	// Returns an object representing the specified query string.
	function parseQueryString( queryString ) {
		// Captures a key and its value in a query string.
		var regex = /([^&;=]+)=?([^&;]*)/g;
		var value = {};
		var decode = function ( s ) { return decodeURIComponent( s.replace( "+", " " ) ); };
		var match;
		
		// Convert the query string into an object.
		while( match = regex.exec( queryString ) ) {
			value[ decode( match[ 1 ] ) ] = decode( match[ 2 ] );
		}
		
		return value;
	}
} )();
