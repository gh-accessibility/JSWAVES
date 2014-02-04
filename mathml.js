console.log( "FILE --- mathml.js" );

WAVES.MathML = {};

( function ()  {
	"use strict";
	
	WAVES.MathML.empty = "\u2B1A";
	WAVES.MathML.fn = "\u2061";
	WAVES.MathML.error = "\u2757";

	
	// Returns the name of the object from the Elements array with the specified character.
	 function getElementFromChar( character ) {
		var value = "";
		
		for( var name in WAVES.config.elements ) {
			if( isOutfix( name ) ) {
				if( element( name ).character.open === character || element( name ).character.close === character ) {
					value = name;
					break;
				}
			}
			else if( element( name ).character === character ) {
				value = name;
				break;
			}
		}
		
		return value;
	}
	
	// Returns the element with the specified name.
	function element( name ) {
		return WAVES.config.elements[ name ];
	}
	
	function isOutfix( name ) {
		return element( name ).notation === "outfix";
	}
	
	String.prototype.nextIndexOf = function ( strings, start, forward ) {
		var index = -1;
		
		for( var i = 0; i < strings.length; i++ ) {
			var newIndex = forward ? this.indexOf( strings[ i ], start ) : this.lastIndexOf( strings[ i ], start );
			if( newIndex !== -1 ) {
				if( index === -1 ) {
					index = newIndex;
				}
				else {
					index = forward ? Math.min( index, newIndex ) : Math.max( index, newIndex );
				}
			}
		}
		
		return index;
	}
	
	// Escape special RegExp characters.
	RegExp.escape = function ( str ) {
		return str.replace( /[-\/\\^$*+?.()|[\]{}]/g, "\\$&" );
	};
	
	// Determines if the specified character represents a row, element, number, identifier, or operator.
	function tokenType( c ) {
		var matchLetter = new RegExp(
			"[" + 
			"A-Za-z" +													// Basic Latin
			"\u0386\u0388-\u0481\u048A-\u0527" +						// Greek and Coptic, Cyrllic, Cyrillic Supplement
			"\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u024F" +					// Latin-1 Supplement, Latin Extended-A, Latin Extended-B
			"\u0250-\u02AF" +											// IPA Extensions
			"\u1E00-\u1FBC" +											// Latin Extended Additional, Greek Extended
			"\u1FC2-\u1FCC\u1FD0-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FFC" +	// Greek Extended
			"\u2100-\u214F" +											// Letterlike Symbols
			"\u221E" + 													// Infinity
			"\u2C60-\u2C7F" +											// Latin Extended-C
			"\uA720-\uA7FF" +											// Latin Extended-D
			WAVES.MathML.empty +										// Dotted Square
			"]" );
		
		// Test for cluster brackets.
		if( getElementFromChar( c ) === "row" ) {
			return "row";
		}
		
		// Test for defined elements.
		var chars = [];
		for( name in WAVES.config.elements ) {
			var character = element( name ).character;
			
			if( c === character || c === character.open || c === character.close ) {
				return "element";
			}
		}
		
		// Test for the error character.
		if( c === WAVES.MathML.error ) {
			return "error";
		}
		// Test for digits.
		if( /\d/.test( c ) ) {
			return "number";
		}
		// Test for letters.
		else if( matchLetter.test( c ) ) {
			return "identifier";
		}
		// Other characters.
		else {
			return "operator";
		}
	}
	
	// Returns the XML that is represented by the specified string.
	WAVES.MathML.GetXml = function( str ) {		
		var open = RegExp.escape( element( "row" ).character.open );
		var close = RegExp.escape( element( "row" ).character.close );
		
		// Remove whitespace.
		str = str.replace( /\s+/g, "\0" );
		
		// Mark off numbers.
		str = str.replace( /\d*\.\d+|\d+/g, open + "n $&" + close );
		
		// Mark off functions.
		str = str.replace( new RegExp( WAVES.config.functions.join( "|" ), "g" ), open + "f $&" + close );
		
		// Remove null characters.
		str = str.replace( /\0/g, "" );
		
		// Removes unmatched cluster brackets.
		str = markUnmatched( str );
		
		// Add implied cluster brackets.
		str = cluster( str );
		
		// Reverse the arguments of root elements.
		str = reverseRoots( str );
		
		// Functions are identifiers.
		str = str.replace( /f /g, "i " );
		
		// Add function application tokens.
		if( typeof WAVES.config.functionPrecedence !== "undefined" ) {
			str = str.replace( new RegExp( WAVES.MathML.fn, "g" ),
				element( "row" ).character.open + "o " + WAVES.MathML.fn + element( "row" ).character.close );
		}
		
		// Mark off identifiers and operators.
		for( var i = 0; i < str.length; i++ ) {
			if( !isMarkedOff( str, i ) ) {
				var type = tokenType( str.substr( i, 1 ) );
				
				var mark = "";
				if( type === "identifier" ) {
					mark = "i ";
				}
				else if( type === "operator" ) {
					mark = "o ";
				}
				else if (type === "error" ) {
					mark = "error ";
				}
				
				if( mark !== "" ) {
					str = str.substr( 0, i ) + element( "row" ).character.open + mark + str.substr( i, 1 ) + element( "row" ).character.close + str.substr( i + 1 );
					// Move past the new characters.
					i += 4;
				}
			}
		}
		
		// Mark off elements.
		for( var i = 0; i < str.length; i++ ) {
			if( !isMarkedOff( str, i ) && tokenType( str.charAt( i ) ) === "element" ) {
				var name = getElementFromChar( str.charAt( i ) );
				var isElement = true;
				
				// Remove the closing bracket of outfix elements.
				if( isOutfix( name ) ) {
					if( bracketInfo( str.charAt( i ) ).type === "open" ) {
						var matchIndex = findMatchingBracket( str, i );
						str = str.substr( 0, i + 1 ) + element( "row" ).character.open + str.substring( i + 1, matchIndex ) + element( "row" ).character.close + str.substr( matchIndex + 1 );
					}
					else {
						str = str.substr( 0, i ) + element( "row" ).character.open + "o " + str.charAt( i ) + element( "row" ).character.close + str.substr( i + 1 );
						isElement = false;
						i += 4;
					}
				}
				
				if( isElement ) {
					var clusterInfo = getCluster( str, i );
					str = str.substr( 0, clusterInfo.begin + 1 ) + name + " " + str.substring( clusterInfo.begin + 1, i ) + str.substring( i + 1, str.length );
					i += name.length + 1;
				}
			}
		}
		
		// Mark off the math element.
		str = str.replace( new RegExp( "^" + open, "g" ), element( "row" ).character.open + "ath " );
		
		// Mark off the row elements.
		var matchRow = new RegExp( element( "row" ).character.open + element( "row" ).character.open, "g" );
		while( matchRow.test( str ) ) {
			str = str.replace( matchRow, element( "row" ).character.open + "row " + element( "row" ).character.open );
		}
		
		// Escape special XML characters.
		str = str.replace( /&/g, "&amp;" )
				 .replace( /</g, "&lt;" )
				 .replace( />/g, "&gt;" )
				 .replace( /"/g, "&quot;" )
				 .replace( /'/g, "&apos;" );
		
		// Mark the ends of each tag.
		var index = 0;
		do {
			var matchedIndex = findMatchingBracket( str, index );
			var name = str.substring( index + 1, str.indexOf( " ", index + 1 ) );
			
			str = str.substr( 0, index + 1 ) + "m" + str.substring( index + 1, matchedIndex ) + " /m" + name + str.substr( matchedIndex );
			
			index = str.indexOf( element( "row" ).character.open, index + 2 );
		} while( index !== -1 );
		
		// Replace cluster brackets with XML brackets.
		str = str.replace( new RegExp( open, "g" ), "<" ).replace( new RegExp( close, "g" ), ">" );
		
		// Convert spaces to XML brackets.
		str = str.replace( / \//g, "</" ).replace( / /g, ">" );
		
		// Set errors to something that displays better.
		str = str.replace( /<merror>[^<]*<\/merror>/g, "<mtext mathcolor=\"red\">" + WAVES.MathML.error + "</mtext>" );
		
		// Make sure that the empty character isn't italic.
		str = str.replace( new RegExp( "<mi>" + WAVES.MathML.empty + "</mi>", "g" ), "<mi mathvariant=\"normal\">" + WAVES.MathML.empty + "</mi>" );
		
		// Set the attributes on the math tag.
		str = str.replace( "<math", "<math display=\"block\" xmlns=\"http://www.w3.org/1998/Math/MathML\"" ); 
		
		return str;
		
		// Reverses the arguments of root elements.
		function reverseRoots( str ) {
			// If the root element is not defined, return the string unchanged.
			if( !WAVES.config.elements.root ) {
				return str;
			}
			
			var index = -1;
			var indexes = [];
			while( ( index = str.indexOf( WAVES.config.elements.root.character, index + 1 ) ) !== -1 ) {
				indexes.push( index );
			}
			
			// TODO: Nested roots can cause problems.
			for( var i = 0; i < indexes.length; i++ ) {
				var index = indexes[ i ];
				
				var cluster = getCluster( str, index );
				var newCluster = "";
				
				// Get the left argument.
				var begin;
				var left = getCluster( str, index - 1 );
				var leftSide;
				if( left.value === cluster.value ) {
					begin = index - 1;
					leftSide = str.charAt( begin );
				}
				else  {
					begin = left.begin;
					leftSide = left.value;
				}
				
				// Get the right argument.
				var end;
				var right = getCluster( str, index + 1 );
				var rightSide;
				if( right.value === cluster.value ) {
					end = index + 2;
					rightSide = str.charAt( index + 1 );
				}
				else {
					end = right.end;
					rightSide = right.value;
				}
				
				var leftDistance = rightSide.length + 1;
				var rightDistance = -leftSide.length - 1;
				
				for( var j = 0; j < indexes.length; j++ ) {
					var moved = indexes[ j ];
					if( j !== i && moved > begin && moved < end ) {
						indexes[ j ] += moved < index ? leftDistance : rightDistance;
					}
				}
				
				str = str.substr( 0, begin ) + rightSide + WAVES.config.elements.root.character + leftSide + str.substr( end );
			}
			
			return str;
		}
	};
	
	function markUnmatched( str ) {
		for( var i = 0; i < str.length; i++ ) {
			if( getElementFromChar( str.charAt( i ) ) === "row" && bracketInfo( str.charAt( i ) ).type !== "none" && findMatchingBracket( str, i ) === -1 ) {
				str = str.substr( 0, i ) + WAVES.MathML.error + str.substr( i + 1 );
			}
		}
		return str;
	}
	
	function isMarkedOff( str, index ) {
	// If the open cluster character is "{", matches "{i x}", "{o *}", "{xx some {text}}", etc.
	// /^{[{} ]+ /
		return ( new RegExp( "^" + element( "row" ).character.open
			+ "[^" + element( "row" ).character.open + element( "row" ).character.close + " ]+ " ) )
			.test( getCluster( str, index ).value );
	}
	
	function getCluster( str, index ) {
		var begin;
		var end;
		
		var level = str.charAt( index ) === element( "row" ).character.open ? 0 : 1;
		while( level > 0 && index >= 0 ) {
		
			index--;
			if( str.charAt( index ) === element( "row" ).character.open ) {
				level--;
			}
			else if( str.charAt( index ) === element( "row" ).character.close ) {
				level++;
			}
		}
		
		if( level !== 0 ) {
			return { "value": str, "begin": 0, "end": str.length };
		}
		else {
			begin = index;
			end = findMatchingBracket( str, begin ) + 1;
			return { "value": str.substring( begin, end ), "begin": begin, "end": end };
		}
	}
	
	// Adds implied cluster brackets to the string.
	function cluster( str ) {		
		// Surround the entire expression in brackets.
		str = element( "row" ).character.open + str + element( "row" ).character.close;
		
		// Add an dotted square between empty brackets.
		str = str.replace( element( "row" ).character.open + element( "row" ).character.close,
			element( "row" ).character.open + WAVES.MathML.empty + element( "row" ).character.close );
		
		// If a named function is followed by fence characters, mark it off.
		if( element( "fenced" ) && isOutfix( "fenced" ) ) {
			var fenceOpen = RegExp.escape( element( "fenced" ).character.open );
			var fenceClosed = RegExp.escape( element( "fenced" ).character.close );
			str = str.replace(
				new RegExp( element( "row" ).character.open + "f (?:" + WAVES.config.functions.join( "|" ) + ")"
				+ element( "row" ).character.close + fenceOpen + "[^" + fenceClosed + "]*" + fenceClosed, "g" ),
				element( "row" ).character.open + "$&" + element( "row" ).character.close );
		}
		
		for( var i = 0; i < getMaxPrecedence() + 1; i++ ) {
			var elements = getElementsByPrecedence( i );
			var clusterFunctions = typeof WAVES.config.functionPrecedence !== "undefined" &&  WAVES.config.functionPrecedence === i;
			var clusterNegatives = typeof WAVES.config.negativePrecedence !== "undefined" &&  WAVES.config.negativePrecedence === i;
			
			if( elements.length === 0 && !clusterFunctions && !clusterNegatives ) {
				continue;
			}
			
			var associativity = elements.length === 0 ? "rtl" : element( elements[ 0 ] ).associativity;
			var forward = associativity === "ltr";
			var index = forward ? -1 : str.length;
			
			var strings = [];
			for( var j = 0; j < elements.length; j++ ) {
				if( elements[ j ] !== "row" ) {
					var character = element( elements[ j ] ).character;
					if( isOutfix( elements[ j ] ) ) {
						strings.push( character.open );
					}
					else {
						strings.push( character );
					}
				}
			}
			
			if( clusterFunctions ) {
				strings.push( "f " );
			}
			
			if( clusterNegatives ) {
				strings.push( "-" );
				strings.push( "+" );
			}
			
			// Loop through ever character in str with precedence i.		
			while( ( index = str.nextIndexOf( strings, index + ( forward ? 1 : 0 ), forward ) ) != -1 ) {
				var character = str.charAt( index );
				
				if( character !== "f" && isMarkedOff( str, index ) ) {
					index -= forward ? 0 : 1;
					continue;
				}
				
				// Mark off functions.
				if( character === "f" ) {
					var begin;
					var end;
					var middle;
					var next = findMatchingBracket( str, index - 1 ) + 1
					var character = str.charAt( next );
					if( tokenType( character ) === "element" ) {
						var el = element( getElementFromChar( character ) );
						if( el.notation === "infix" && el.precedence <= WAVES.config.functionPrecedence ) {
							var clusterInfo = getCluster( str, next );
							begin = clusterInfo.begin;
							end = clusterInfo.end;
						}
					}
					else if( tokenType( character ) === "operator" ) {
						begin = index - 1;
						end = next - 1;
					}
					else {
						begin = index - 1;
						end = next;
					}
					
					middle = end + 1;
					
					if( str.charAt( end ) === element( "row" ).character.open ) {
						end = findMatchingBracket( str, end ) + 1;
					}
					else {
						end++;
					}
					
					// Add the brackets and the function application character.
					str = str.substr( 0, begin ) + element( "row" ).character.open
						+ str.substring( begin, end ) + element( "row" ).character.close + str.substr( end );
					str = str.substr( 0, middle ) + WAVES.MathML.fn + str.substr( middle );
					
					// Add a dotted box if no argument is given.
					if( str.charAt( middle + 1 ) === element( "row" ).character.close ) {
						str = str.substr( 0, middle + 1 ) + WAVES.MathML.empty + str.substr( middle + 1 );
					}
				}
				// Mark off negative signs.
				else if( character === "-" || character === "+" ) {
					var prevChar = str.charAt( index - 1 );
					var prevElement = getElementFromChar( prevChar );
					var isNegative = tokenType( prevChar ) === "operator";
					
					// If the previous element is a function.
					if( prevElement === "row" && ( new RegExp( "^" + element( "row" ).character.open + "f " ) ).test( getCluster( str, index - 2 ).value ) ) {
						isNegative = true;
					}
					
					if( !isNegative && prevElement !== "" ) {
						var notation = element( prevElement ).notation;
						
						if( bracketInfo( prevChar ).type === "open" || notation === "prefix" || notation === "infix" ||
							( new RegExp( "^" + element( "row" ).character.open + "o " ) ).test( getCluster( str, index - 1 ) ) ) {
							isNegative = true;
						}
					}
					
					// Mark of the negative sign and its argument.
					if( isNegative  ) {
						var start = index;
						var end;
						if( str.charAt( index + 1 ) === element( "row" ).character.open ) {
							end = findMatchingBracket( str, index + 1 ) + 1;
						}
						else {
							end = index + 2;
						}
						str = str.substr( 0, start ) + element( "row" ).character.open
							+ str.substring( start, end ) + element( "row" ).character.close + str.substr( end );
					}
				}
				// Mark off other elements.
				else {
					var notation = element( getElementFromChar( character ) ).notation;
					var start;
					var end;
					
					// Find the start of the element.
					if( notation === "prefix" || notation === "outfix" ) {
						start = index;
					}
					else {
						start = findMatchingBracket( str, index - 1 );
						if( start === -1 ) {
							start = index - 1;
						}
						
						// If there is no left argument.
						if( tokenType( str.charAt( index - 1 ) ) === "element" || start > index ) {
							// Add a dotted square.
							str = str.substr( 0, index ) + WAVES.MathML.empty + str.substr( index );
							index++;
							start = index - 1;
						}
					}
					
					// Find the end of the element.
					if( notation === "postfix" ) {
						end = index + 1;
					}
					else if( notation === "outfix" ) {
						end = findMatchingBracket( str, index ) + 1;
						
						// If no matching bracket was found.
						if( end === 0 ) {
							str = str.substr( 0, index ) + "o " + str.substr( index );
							index += 2;
							end = index + 1;
						}
						
						if( end === start + 2 ) {
							str = str.substr( 0, index + 1 ) + WAVES.MathML.empty + str.substr( index + 1 );
							index++;
							end++;
						}
					}
					else {
						var temp = index;
						
						// Find the next one or two arguments.
						for( var t = 0; t < ( notation === "infix2" ? 2 : 1 ); t++ ) {
							end = findMatchingBracket( str, temp + 1 );							
							
							// There is no first or second right argument.
							if( temp + 1 >= getCluster( str, index ).end ) {
								str = str.substr( 0, temp ) + WAVES.MathML.empty + str.substr( temp );
								end = temp + 2;
							}
							else if( ( end === -1 || tokenType( str.charAt( temp + 1 ) ) === "element" ) && bracketInfo( str.charAt( temp + 1 ) ).type !== "close" ) {
								end = temp + 2;
								temp = end - 1;
							}
							// If there is no first right argument.
							else if( end < temp ) {
								// Add a dotted square.
								str = str.substr( 0, temp + 1 ) + WAVES.MathML.empty + str.substr( temp + 1 );
								end = temp + 2;
							}
							
							if( temp !== end - 1 ) {
								temp = end;
							}
						}
					}
					
					str = str.substr( 0, start ) +
						element( "row" ).character.open +
						str.substr( start, end - start ) +
						element( "row" ).character.close + 
						str.substr( end );
				}
				index += forward ? 1 : -1;
			}
		}
		
		return str;
	}
	
	// Returns an array of elements with the specified precedence.
	function getElementsByPrecedence( p ) {
		var elements = [];
		
		for( name in WAVES.config.elements ) {
			if( element( name ).precedence === p ) {
				elements.push( name );
			}
		}
		
		return elements;
	}
	
	// Returns the highest value of precedence in Elements.
	function getMaxPrecedence() {
		var max = 0;
		
		for( name in WAVES.config.elements ) {
			max = Math.max( max, element( name ).precedence || 0 );
		}
		return max;
	}
	
	// Tells whether the given character is a defined open or close bracket and its matching bracket.
	function bracketInfo( character ) {
		var info = { "type": "none", "match": "" };
		
		// Look up if the character is an open or close bracket and find its matching bracket character.
		for( name in WAVES.config.elements ) {
			if( isOutfix( name ) ) {
				if( element( name ).character.open === character ) {
					info.type = "open";
					info.match = element( name ).character.close;
					break;
				}
				else if( element( name ).character.close === character ) {
					info.type = "close";
					info.match = element( name ).character.open;
					break;
				}
			}
		}
		
		return info;
	}
	
	// Returns the index of the closing bracket that matches the bracket at the specified index.
	function findMatchingBracket( str, index ) {
		var character = str.charAt( index );
		var open;
		var close;
		var searchForward;
		var info = bracketInfo( character );
		
		switch( info.type ) {
			case "none": {
				return -1;
			}
			case "open": {
				open = character;
				close = info.match;
				searchForward = true;
				break;
			}
			case "close": {
				open = info.match;
				close = character;
				searchForward = false;
				break;
			}
		}
		
		var count = searchForward ? 1 : -1;
		
		if( open === close ) {		
			var cluster = getCluster( str, index );
			
			// Determine whether the specified character opens or closes its contents.
			var closes = ( str.substr( index ).split( open ).length - 1 ) % 2;
			if( closes ){
				index = cluster.start + str.substring( cluster.start, index ).lastIndexOf( open );
			}
			else {
				index = index + 1 + str.substr( index + 1, cluster.end ).indexOf( open );
			}
			
			// TODO: Fix this.
			return -1;
		}
		else {
			// Loop through the characters in the string until the matching bracket is found.
			do {
				index += searchForward ? 1 : -1;
				
				// If the matching bracket wasn't found.
				if( index === -1 || index === str.length ) {
					return -1;
				}
				
				if( str.charAt( index ) === open ) {
					count += 1;
				}
				else if( str.charAt( index ) === close ) {
					count -= 1;
				}
			} while( count != 0 );
		}
		return index;
	}
} )();
