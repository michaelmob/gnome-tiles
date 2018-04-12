const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Log = Extension.imports.helpers.logging.Logger("screen");


/*
 * Screen helper for the MetaScreen object.
 */
var Screen = {
	
	// Variables
	// ...

	
	// Methods
	getWorkspaces: function() {
		/*
		* Returns list of MetaWorkspace objects.
		*/
		let result = [];

		// Get count of workspaces
		const workspaceCount = global.screen.get_n_workspaces();

		// Loop over number of workspaces
		for (var i = 0; i < workspaceCount; i++) {
			// Get WorkspaceMeta object by index and add it to result
			result.push(global.screen.get_workspace_by_index(i));
		}

		return result;
	},

	getActiveWindow: function() {
		/*
		* Get active window.
		*/
	}

};