const GLib = imports.gi.GLib;
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Log = Extension.imports.helpers.logging.Logger("workspace");
const Tiling = Extension.imports.helpers.tiling.Tiling;
const Window = Extension.imports.wrappers.window.Window;


/*
 * Workspace wrapper class for MetaWorkspace objects.
 */
var Workspace = {

	// Variables
	meta: null,
	tiling: null,
	windows: {},


	// Methods
	initialize: function(metaWorkspace) {
		/*
		* Initialize workspace instance.
		*/
		// Clone object
		var self = Object.assign({}, this);

		// Set variables
		self.meta = metaWorkspace;

		// Populate windows array
		self.setupWindows();

		// Initialize tiling addon
		self.tiling = Tiling.initialize(self);

		// Connect Signals
		self.connectSignals();

		Log.log(`Workspace ${self.getIndex()} initialized.`);

		return self;
	},


	destroy: function() {
		/*
		* Destroy workspace instance.
		*/
		if (this.doesNotHaveMeta("destroy")) {
			return;
		}

		this.meta.disconnect("window-added");
		this.meta.disconnect("window-removed");
	},


	toString: function() {
		/*
		* String representation of workspace instance.
		*/
		return `[Workspace index=${this.getIndex()}]`;
	},


	doesNotHaveMeta: function(methodName) {
		let metaUndefined = typeof this.meta === "undefined";

		if (metaUndefined) {
			Log.warning(methodName + "(); MetaWorkspace is undefined.")
		}

		return metaUndefined;
	},


	connectSignals: function() {
		/*
		* Connect signals to meta object.
		*/
		if (this.doesNotHaveMeta("connectSignals")) {
			return;
		}
		let self = this;

		// On window added signal
		this.meta.connect("window-added", function(metaWorkspace, metaWindow) {
			self.onWindowAdded.call(self, metaWindow);
		});

		// On window removed signal
		this.meta.connect("window-removed", function(metaWorkspace, metaWindow) {
			self.onWindowRemoved.call(self, metaWindow);
		});
	},


	getIndex: function(metaWorkspace=undefined) {
		/*
		* Get workspace index.
		*/
		// Public
		if (metaWorkspace !== undefined) {
			return metaWorkspace.index();
		}

		// Private
		if (this.doesNotHaveMeta("getIndex")) {
			return -1;
		}

		return this.meta.index();
	},


	getBounds: function() {
		/*
		* Get list of workspace bounds from all monitors.
		*/
		if (this.doesNotHaveMeta("getBounds")) {
			return;
		}

		return this.meta.get_work_area_for_monitor(0);
	},


	addWindow: function(metaWindow) {
		/*
		* Initialize window and add it to windows array.
		*/
		// Initialize window
		let window_ = Window.initialize(metaWindow);

		// Connect signals
		//window_.connectSignal(this, "position-changed", this.onWindowMoved);
		//window_.connectSignal(this, "focus", this.sayNigger);

		// Add window to windows array
		this.windows[window_.getID()] = window_;

		return window_;
	},


	removeWindow: function(windowID) {
		/*
		* Destroy window wrapper and remove it from windows array.
		*/
		this.windows[windowID].destroy();
		delete this.windows[windowID];
	},


	setupWindows: function() {
		/*
		* Setup pre-existing windows.
		*/
		if (this.doesNotHaveMeta("setupWindows")) {
			return;
		}

		// Reset windows array
		this.windows = {};

		// Get list of windows
		let windowList = this.meta.list_windows();

		// Loop over each meta window in windowList
		for (var i = 0; i < windowList.length; i++) {
			this.addWindow(windowList[i]);
		}
	},


	onWindowAdded: function(metaWindow) {
		/*
		* Callback for a signal when a window is added to the workspace.
		*/
		if (metaWindow.is_skip_taskbar()) {
			return;
		}

		// Create window wrapper, connect signals
		let id = this.addWindow(metaWindow).getID();

		// Add node to tiling helper, and re-tile nodes
		this.tiling.appendNode(id);
		this.tiling.tileNodes();
	},


	onWindowRemoved: function(metaWindow) {
		/*
		* Callback for a signal when a window is removed from the workspace.
		*/
		if (metaWindow.is_skip_taskbar()) {
			return;
		}

		let id = metaWindow.get_stable_sequence().toString();

		// Destroy window wrapper, removing signals etc
		this.removeWindow(id);

		// Remove node by window ID and re-tile nodes
		this.tiling.removeNode(id);
		this.tiling.tileNodes();
	},


	onWindowMoving: function(metaWindow) {
		/*
		* Callback for signal when a window's position moves.
		*/
	},


	onWindowMoved: function(metaWindow) {
		/*
		* Called from onWindowMove() when window has stopped moving.
		*/
		if (metaWindow.is_skip_taskbar()) {
			return;
		}

		let position = global.get_pointer();
		let node = this.tiling.findNodeAtPosition(position[0], position[1]);

		if (node === undefined || typeof node.master !== "string") {
			return;
		}

		let id = metaWindow.get_stable_sequence().toString();

		if (id !== node.master) {
			this.tiling.swapNodes(id, node.master);
		}

		this.tiling.tileNodes();
	},


	onWindowResizing: function(metaWindow) {
		/*
		* Callback for signal when window's size has changed.
		*/
		Log.log("Resizing!");
	},

	onWindowResized: function(metaWindow, previousBounds) {
		/*
		* Called from onWindowResize() when window has been resized.
		*/
		if (metaWindow.is_skip_taskbar()) {
			return;
		}

		let id = metaWindow.get_stable_sequence().toString();
		let node = this.tiling.findNode(id);
		let newBounds = metaWindow.get_frame_rect();

		let xDiff = newBounds.x - previousBounds.x,
			yDiff = newBounds.y - previousBounds.y;
		
		let widthDiff = (newBounds.width - previousBounds.width) - xDiff,
			heightDiff = (newBounds.height - previousBounds.height) - yDiff;


		// Master container
		if (widthDiff < 0) {
			log("Expand left!");
		}
		else if (widthDiff > 0) {
			log("Expand right!");
		}

		//Log.log(previousBounds);
		this.tiling.tileNodes();
	}
	
};