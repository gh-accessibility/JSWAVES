console.log( "FILE --- toolbar.js" );

// Globar variable for all global Toolbar variables.
WAVES.Toolbar = {};

( function () {
	"use strict";
	
	// Represents the number of button levels that are visible.
	WAVES.Toolbar.level;
	
	// The number of milliseconds between each display update.
	WAVES.Toolbar.updateSpeed = 200;
	
	// Used to tell if the text has changed.
	var lastText;
	
	// When the document is ready, run main.
	$( main );
	
	// Add the Toolbar to the document.
	function main() {
		// Configure the Toolbar based on the config property of the query object or the default config file.
		//configure( WAVES.config );
		
		var wait = window.setInterval( function() {
			if( WAVES.config && WAVES.config.ready ) {
				window.clearInterval( wait );
				configure( WAVES.config );
			}
		}, 100 );
	}
	
	// Load the config file and apply the settings.
	function configure( config ) {
		
		// The order in which that main control areas should be added.
		var panelOrder = config.panelOrder || [ "display", "input", "tokens", "actions" ];
		
		// The order in which the action buttons should be added.
		var actionOrder = config.actionOrder || [ "collapse", "expand", "cluster", "done" ];
		
		// Build the Toolbar and add it to the document.
		buildToolbar( panelOrder ).appendTo( "body" );
		
		// Make the toolbar draggable.
		makeDraggable();
		
		// Add the specified or default theme to the document.
		if( !config.theme ) {
			config.theme === ( WAVES.dir + "defaults/theme.css" );
		}
		
		$( "head" ).append( "<link rel=\"stylesheet\" href=\"" + config.theme + "\" type=\"text/css\" />" );
		
		WAVES.Toolbar.level = config.initialLevel;
		
		addButtons( WAVES.config.buttons, actionOrder );
		
		// Update the Done button and add replacement text.
		window.setInterval( function () {
			var pos = getSelection().start;
			var text = $( "#waves-input" ).val();
			
			$( "#waves-done" ).prop( "disabled", !text.length );
			
			var replace = nextReplacement( text );
			while( replace.start !== -1 ) {
				replace = nextReplacement( text );
				text = text.substr( 0, replace.start ) + unescape( replace.replacement ) + text.substr( replace.end );
				$( "#waves-input" ).val( text );
				setCaretPosition( pos + ( replace.replacement.length - ( replace.end - replace.start ) ) );
				break;
			}
		}, 100 );
		
		function nextReplacement( str ) {
			var value = { "start": -1, "end": -1, "replacement": "" };
				
			for( var i = 0; i < WAVES.config.replacements.length; i++ ) {
				var r = WAVES.config.replacements[ i ];
				var key = unescape( r[ 0 ] );
				if( str.indexOf( key ) !== -1 ) {
					value.start = str.indexOf( key );
					value.end = value.start + key.length;
					value.replacement = r[ 1 ];
					break;
				}
			}
			
			return value;
		}
		
		// Update the math display every 200ms if the text changes.
		window.setInterval( function() {
			var text = $( "#waves-input" ).val();
			if( lastText !== text ) {
				lastText = text;
				
				// Append MathML to the display.
				$( "#waves-display" ).html( WAVES.MathML.GetXml( text ) );
				MathJax.Hub.Queue( [ "Typeset", MathJax.Hub, "waves-display" ] );
			}
		}, WAVES.Toolbar.updateSpeed );
	}
	
	// Returns the base HTML for the Toolbar.
	function buildToolbar( panelOrder ) {
		// Initialize each element.
		var $toolbar = $( "<div id=waves-toolbar/>" );
		var $titlebar = $( "<div id=waves-titlebar>WAVES Toolbar</div>" );
		var $panel = $( "<div id=waves-panel/>" );
		var $display = $( "<div id=waves-display/>" );
		var $inputContainer = $( "<div id=waves-input-container/>" );
		var $input = $( "<input id=waves-input>" );
		var $tokens = $( "<div id=waves-tokens/>" );
		var $actions = $( "<div id=waves-actions/>" );
		
		// Attach the elements.
		$titlebar.appendTo( $toolbar );
		$input.appendTo( $inputContainer );
		$panel.appendTo( $toolbar );
		
		// Add the main control areas in the correct order.
		var dictionary = { "display": $display, "input": $inputContainer, "tokens": $tokens, "actions": $actions };
		for( var i = 0; i < panelOrder.length; i++) {
			dictionary[ panelOrder[ i ] ].appendTo( $panel );
		}
		
		return $toolbar;
	}
	
	// Makes the Toolbar draggable.
	function makeDraggable() {
		var drag = {};
		var $toolbar = $( "#waves-toolbar" );
		var $handle = $( "#waves-titlebar" );
		var $body = $( "body" );
		
		var dragging = false;
		var toolbarPos = $handle.offset();
		var dragStart = toolbarPos;
		var clickPos = { x: -1, y: -1 };
		
		$handle.mousedown( mouseDown );
		$body.mousemove( mouseMove );
		$body.mouseup( cancelDrag );
		$body.mouseleave( cancelDrag );
		
		function mouseDown( e ) {
			if( e.button === 0 && e.buttons === 1 && !( e.altKey || e.ctrlKey  || e.metaKey || e.shiftKey ) ) {
				dragging = true;
				e.preventDefault();
				toolbarPos = $toolbar.offset();
				dragStart = toolbarPos;
				clickPos = { x: e.pageX, y: e.pageY };
			}
		}
		
		function mouseMove( e ) {
			if( dragging ) {
				e.preventDefault();
				toolbarPos = {
					top: dragStart.top + e.pageY - clickPos.y,
					left: dragStart.left + e.pageX - clickPos.x
				};
				$toolbar.offset( toolbarPos );
			}
		}
		
		function cancelDrag() {
			dragging = false;
		}
	};
	
	// Adds the buttons to the Toolbar.
	function addButtons( buttons, actionOrder ) {
		var level = ( typeof WAVES.config.initialLevel === "undefined" ) ? WAVES.config.buttons.tokens.length : WAVES.config.initialLevel;
		
		// Add the token buttons.
		for( var level = 0; level < buttons.tokens.length; level++ ) {
			var $container = $( "<div></div>" );
			for( var index = 0; index < buttons.tokens[ level ].length; index++ ) {
				var buttonData = buttons.tokens[ level ][ index ];
				var $button = createButton( buttonData );
				
				buttonData.value = unescape( buttonData.value );
				
				addClick( $button, buttonData.value );
				$button.appendTo( $container );
				
				addShortcut( $button, buttonData.shortcut );
			}
			
			if( level >= WAVES.Toolbar.level ) {
				$container.css( "display", "none" );
			}
			
			$container.appendTo( $( "#waves-tokens" ) );
		}
		
		// Add the action buttons in the correct order.
		for( var i = 0; i < actionOrder.length; i++ ) {
			createButton( buttons[ actionOrder[ i ] ], "waves-" + actionOrder[ i ] ).appendTo( $( "#waves-actions" ) );
		}
		
		// Disable the buttons if they should be.
		$( "#waves-collapse" ).prop( "disabled", WAVES.Toolbar.level === 0 );
		$( "#waves-expand" ).prop( "disabled", WAVES.Toolbar.level === $( "#waves-tokens > *" ).length );
		
		update();
		
		// Add events to the buttons.
		$( "#waves-done" ).click( function () {
			var text = $( "#waves-input" ).val();
			if( text ) {
				// Output the MathML.
				$( ".waves-xml-output" ).text( WAVES.MathML.GetXml( $( "#waves-input" ).val() ) );
			
				// Make sure that the display was updated before sending the Math to the outputs.
				setTimeout( function () {
					$( ".waves-output" ).html( $( "#waves-display" ).html() );
					$( "#waves-input" ).val( "" );
					$( "#waves-display" ).html( "" );
				}, WAVES.Toolbar.updateSpeed );
			}
		} );
		addShortcut( $( "#waves-done" ), buttons.done.shortcut );
		
		$( "#waves-cluster" ).click( function () { fenceSelection( WAVES.config.elements.row.character.open, WAVES.config.elements.row.character.close ); } );
		addShortcut( $( "#waves-cluster" ), buttons.cluster.shortcut );
		
		$( "#waves-collapse" ).click( function () { changeLevel( true ); } );
		addShortcut( $( "#waves-collapse" ), buttons.collapse.shortcut );
		
		$( "#waves-expand" ).click( function () { changeLevel( false ); } );
		addShortcut( $( "#waves-expand" ), buttons.expand.shortcut );
		
		// Creates a button using the specified data.
		function createButton( data, id ) {
			var $button = $( "<button></button>" );
			
			$button.attr( "id", id );
			$button.attr( "title", data.text + ( data.shortcut ? " (" + data.shortcut + ")" : "" ) );
			$button.append( data.img ? "<img src=\"" + data.img + "\"/>" : data.text );
			
			return $button;
		}
		
		// This is a separate function because of closure.
		// Adds a click event to the button.
		function addClick( $button, value ) {
			if( false ) {
				$button.click( function () { fenceSelection( open, close ) } );
			}
			else {
				$button.click( function () { insertText( value, -1 ); } );
			}
		}
		
		// This is a separate function because of closure.
		// Adds a keyboard shortcut to click the button.
		function addShortcut( $button, shortcut ) {
			var hotkey = shortcut.toLowerCase().replace( /\+/g, "_" ).replace( "ctrl_alt", "alt_ctrl" ).replace( "ctrl_shift_alt", "alt_ctrl_shift" ).replace( "enter", "return" );
			$( "#waves-input" ).bind( "keydown." + hotkey, function () {
				if( !$button.is( ":disabled" ) ) {
					$button.click();
				}
			} );
			if( hotkey !== "return" ) {
				$( "#waves-toolbar" ).bind( "keydown." + hotkey, function () {
					if( !$button.is( ":disabled" ) ) {
						$button.click();
					}
				} );
			}
		}
	}
	
			
	// Converts escaped element names with the appropriate character.
	function unescape( str ) {
		while ( str.indexOf( "'" ) >= 0 ) {
			var open = str.indexOf( "'" );
			var close = str.indexOf( "'", open + 1 );
			var name = str.substring( open + 1, close );
			
			// Default to "?" if the name is not a valid element.
			var character;
			if( typeof WAVES.config.elements[ name ] === "undefined" ) {
				character = "?";
			}
			else {
				character = WAVES.config.elements[ name ].character;
				if( $.isPlainObject( character ) ) {
					character = character.open + character.close;
				}
			}
			str = str.substr( 0, open ) + character + str.substr( close + 1 );
		}
		return str;
	}
	
	// Increase or decrease the level.
	function changeLevel( decrease ) {
		if( decrease ) {
			$( "#waves-tokens > *" ).eq( --WAVES.Toolbar.level ).css( "display", "none" );
		}
		else {
			$( "#waves-tokens > *" ).eq( WAVES.Toolbar.level++ ).css( "display", "block" );
		}
		
		// Disable the buttons if they should be.
		$( "#waves-collapse" ).prop( "disabled", WAVES.Toolbar.level === 0 );
		$( "#waves-expand" ).prop( "disabled", WAVES.Toolbar.level === $( "#waves-tokens > *" ).length );
	}
	
	// Returns information about the selection in the input box.
	function getSelection() {
		var selection = {};
		var input = document.getElementById( "waves-input" );
		
		// IE.
		if( document.selection ) {
			input.focus();
			var sel = document.selection.createRange();
			sel.moveStart( "character", -input.value.length );
			selection.start = sel.text.length;
			// TODO:
			selection.length = 0;
		}
		else if( input.selectionStart || input.selectionStart == "0" ) {
			selection.start = input.selectionStart;
			selection.length = input.selectionEnd - input.selectionStart;
		}
		
		selection.text = $( "#waves-input" ).val().substr( selection.start, selection.length );
		
		return selection;
	}
	
	// Set the position of the caret within the input box.
	function setCaretPosition( pos ) {
		var input = document.getElementById( "waves-input" );
		
		// IE.
		if( input.setSelectionRange ) {
			input.focus();
			input.setSelectionRange( pos, pos );
		}
		else if( input.createTextRange ) {
			var range = input.createTextRange();
			range.collapse( true );
			range.moveEnd( "character", pos );
			range.moveStart( "character", pos );
			range.select();
		}
	}
	
	// Insert a string of text into the input box at the specified position or the current caret position.
	function insertText( str, index ) {
		var text = $( "#waves-input" ).val();
		var selection = index >= 0 ? { start: index, length: 0 } : getSelection();
		
		$( "#waves-input" ).val( text.substr( 0, selection.start ) + str + text.substr( selection.start + selection.length ) );
		
		// Set the caret position to the end of the inserted text.
		setCaretPosition( selection.start + str.length );
		
		update();
	}
	
	function fenceSelection( open, close ) {
		var selection = getSelection();
		
		// Insert the brackets.
		insertText( open, selection.start );
		insertText( close, selection.start + selection.length + 1 );
		
		// Move the caret to right before the closing bracket.
		setCaretPosition( selection.start + selection.length + open.length );
	}
	
	// Updates the states of controls on the Toolbar.
	function update() {
		$( "#waves-done" ).prop( "disabled", !$( "#waves-input" ).val() );
	}
} )();
