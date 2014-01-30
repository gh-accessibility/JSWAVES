JSWAVES
=======

A JavaScript implementation of the WAVES Toolbar.


JSWAVES Deployment Notes:
1/17/2014
J. Hufford; gh, llc

Adding JSWAVES to a Webpage:
1. Add a script tag to the head of the HTML.
  <html>
  <head>
  ...
  <script type=”text/javascript” scr=”dir/waves.js”></script>
  </head>
  ...

2.	Mark the output locations with a class of waves-output.
  <div class=”waves-output”>
  When the “Done” button on the Toolbar is clicked, the contents of the Toolbar Display will replace the contents of all elements with a class of waves-output.

Using a Custom Configuration:
  Using the method above will create a Toolbar on the page using the Default Configuration. A separate Configuration File can be used to customize the Toolbar. The Configuration file must be a valid JSON file containing the following properties:
  
  theme: (Optional) The CSS to apply to the Toolbar. If this is omitted, the Default Theme will be used.
  	Relevant selectors to use in the CSS:
  	#waves-toolbar: The main container of the Toolbar.
  	#waves-titlebar: The handle used to move the Toolbar.
  	#waves-panel: The part of the Toolbar under the Titlebar.
  	#waves-display: The part of the Toolbar that displays the rendered math.
  	#waves-input-container: A container for the Math Input Box.
  	#waves-input: The Math Input Box.
  	#waves-tokens: The container for the Token buttons.
  	#waves-actions: The container for the Action buttons.
  	#waves-collapse: The “Collapse” button.
  	#waves-expand: The “Expand” button.
  	#waves-cluster: The “Cluster” button.
  	#waves-done: The “Done” button.
  actionOrder: (Optional) The order that the Action buttons will be added to the Toolbar. This can help with styling. Defaults to [ “collapse”, “expand”, “cluster”, “done” ].
  initialLevel: (Optional) The number of initially visible rows of Token buttons. Defaults to the total number of rows.
  buttons: Contains information about each button on the Toolbar.
    tokens: Defines what Token buttons should be on the Toolbar. This is an array of Button Rows. Each Button Row is an array of Buttons. Each Button should contain the following properties:
      img: (Optional) A path to an image to be displayed on the button.
      text: The text to be displayed on the button if there is no image. Also, the text to be displayed in the tooltip.
      value: The characters to be added to the Math Input Box when the button is clicked. Element names can be used if escaped by single quotes. (e.g., ‘frac’)
      shortcut: (Optional) A keyboard shortcut to activate the button. Also displayed in the tooltip after the text.
    expand, collapse, cluster, and done: Same as Token buttons, but without a value property.
  replacements: An array of replacements. Each replacement is an array containing two strings. If the first string is typed into the Math Input Box, it will be replaced by the second string.
  functions: An array of strings that represent function names. (e.g., “sin”, “log”, etc.)
  negativePrecedence and functionPrecedence: These values should not be changed. 
  elements: The only value that should be changed here is the character property of each element (see notes). When the value of character is typed into the Math Input Box, it will be treated as a special MathML element. Unneeded elements can safely be removed from this list (except row, which is required).
  
  To use a custom Configuration File, reference it in the script tag as a query string:
    <script type=”text/javascript”
      scr=”dir/waves.js?config=path-to-config.json”></script>

Notes:
JSWAVES has been tested on Internet Explorer 10, Firefox 26.0, and Google Chrome 25.0.
Because of the same-origin policy, JSWAVES will not work on certain browsers if the files are stored locally, even if they are in the same directory as the HTML. Google Chrome has the tightest restrictions, so to use local files with Chrome, start it with the option --allow-file-access-from-files.
All paths must be relative to waves.js. Absolute paths are not currently supported.
The values of elements are set to produce the best MathML. They are editable so that the behavior of the original WAVES Toolbar can be set if needed. The Classic theme uses this configuration.

