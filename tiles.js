const Meta = imports.gi.Meta;
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Log = Extension.imports.helpers.logging.Logger("tiles");
const Screen = Extension.imports.helpers.screen.Screen;
const Workspace = Extension.imports.wrappers.workspace.Workspace;


/**
 * Class for Tiles extension.
 */
var Tiles = {

	// Variables
	workspaces: {},


	// Methods
	initialize() {
		/*
		* Initialize Tiles extension.
		*/
		let self = this;

		// Initialize workspaces.
		let workspaces = Screen.getWorkspaces();
		for (var i = 0; i < workspaces.length; i++) {
			this.workspaces[i] = Workspace.initialize(workspaces[i]);
		}

		// Connect signals to catch window moving/resizing
		self.connectSignals();

		Log.log("Tiles extension initialized.");
	},


	destroy() {
		/*
		* Destroy Tiles extension.
		*/
		global.display.disconnect("grab-op-begin");
		global.display.disconnect("grab-op-end");
	},


	connectSignals() {
		/*
		* Connect signals above workspaces.
		*/
		// Operations
		let moveOperations = [Meta.GrabOp.MOVING];
		let resizeOperations = [
			Meta.GrabOp.RESIZING_NW,
			Meta.GrabOp.RESIZING_N,
			Meta.GrabOp.RESIZING_NE,
			Meta.GrabOp.RESIZING_E,
			Meta.GrabOp.RESIZING_SW,
			Meta.GrabOp.RESIZING_S,
			Meta.GrabOp.RESIZING_SE,
			Meta.GrabOp.RESIZING_W
		];

		// Cache
		let previousBounds;

		// Cursor down
		global.display.connect("grab-op-begin", (metaDisplay, metaScreen, metaWindow, grabOperation) => {
			if (metaWindow === null) {
				return;
			}

			let workspace = this.workspaces[metaWindow.get_workspace().index()];

			// Move operation
			if (moveOperations.includes(grabOperation)) {
				workspace.onWindowMoving(metaWindow);
			}

			// Resize operation
			else if (resizeOperations.includes(grabOperation)) {
				previousBounds = metaWindow.get_frame_rect();
				workspace.onWindowResizing(metaWindow);
			}
		});

		// Cursor up
		global.display.connect("grab-op-end", (metaDisplay, metaScreen, metaWindow, grabOperation) => {
			if (metaWindow === null) {
				return;
			}

			let workspace = this.workspaces[metaWindow.get_workspace().index()];

			// Move operation
			if (moveOperations.includes(grabOperation)) {
				workspace.onWindowMoved(metaWindow);
			}

			// Resize operation
			else if (resizeOperations.includes(grabOperation)) {
				workspace.onWindowResized(metaWindow, previousBounds);
			}

			previousBounds = undefined;
		});
	}

};