const DEBUG = imports.gi.GLib.getenv("DEBUG_TILES") || false;


/*
 * Logger class to output messages.
 */
var Logger = function(moduleName) {
	
	const log = function(messageType, message) {
		/*
		* Custom log message.
		*/
		// Output object
		if (typeof message === "object") {
			message = JSON.stringify(message, null, 2);
		}

		global.log(`[Tiles.${moduleName}] ${messageType}: ${message}`);
	};

	return {
		log: function(message) {
			/*
			* Output default message.
			*/
			log("LOG", message);
		},

		error: function(message) {
			/*
			* Output error message.
			*/
			log("ERROR", message);
		},

		warning: function(message) {
			/*
			* Output warning message.
			*/
			log("WARNING", message);
		},

		debug: function(message) {
			/*
			* Output debug message.
			*/
			if (true /*DEBUG*/) {
				log("DEBUG", message);
			}
		}
	};

};