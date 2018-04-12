const Mainloop = imports.mainloop;
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Log = Extension.imports.helpers.logging.Logger("window");
const NodeSplit = Extension.imports.helpers.tiling.NodeSplit;


/*
 * Window wrapper class for MetaWindow objects.
 */
var Window = {

	// Variables
	meta: null,


	// Methods
	initialize: function(metaWindow) {
		/*
		* Initialize window instance.
		*/
		// Clone object
		var self = Object.assign({}, this);

		// Assign meta
		self.meta = metaWindow;

		return self;
	},


	destroy: function() {
		/*
		* Destroy window instance.
		*/
		if (this.doesNotHaveMeta("destroy")) {
			return;
		}

		this.meta.disconnect("position-changed");
		this.meta.disconnect("size-changed");
	},


	toString: function() {
		/*
		* String representation of window instance.
		*/
		if (this.doesNotHaveMeta("toString")) {
			return undefined;
		}

		return `[Window id=${this.getID()} class="${this.getClass()}"]`;
	},


	doesNotHaveMeta: function(methodName) {
		let metaUndefined = typeof this.meta === "undefined";

		if (metaUndefined) {
			Log.warning(methodName + "(); MetaWindow is undefined.")
		}

		return metaUndefined;
	},


	connectSignal: function(self, name, callback) {
		/*
		* Connect signal to meta object.
		*/
		if (this.doesNotHaveMeta("connectSignal")) {
			return;
		}

		this.meta.connect(name, function(metaWindow) {
			callback.call(self, metaWindow);
		});
	},


	getID: function() {
		/*
		* Get stable window ID from meta window.
		*/
		if (this.doesNotHaveMeta("getID")) {
			return -1;
		}

		return this.meta.get_stable_sequence().toString();
	},


	getClass: function() {
		/*
		* Get wm class from meta window.
		*/
		if (this.doesNotHaveMeta("getClass")) {
			return undefined;
		}

		return this.meta.get_wm_class();
	},


	getBounds: function() {
		/*
		* Get window bounds from meta window.
		*/
		if (this.doesNotHaveMeta("getBounds")) {
			return null;
		}

		return this.meta.get_frame_rect();
	},


	setBounds: function(x, y, width, height) {
		/*
		* Set size and position of meta window.
		*/
		if (this.doesNotHaveMeta("setBounds")) {
			return;
		}

		var windowMeta = this.meta;
		Mainloop.idle_add(function() {
			return windowMeta.move_resize_frame(true, x, y, width, height);
		});
	},


	setBoundsFromNode: function(node) {
		/*
		* 
		*/
		node.class = this.getClass();

		// Set node bounds to new variables so we don't overwrite them
		let x = node.x,
			y = node.y,
			width = node.width,
			height = node.height;

		// Vertical split
		if (node.splitOrientation === NodeSplit.VERTICAL) {
			width *= node.splitPercentage;
		}

		// Horizontal split
		else if (node.splitOrientation === NodeSplit.HORIZONTAL) {
			height *= node.splitPercentage;
		}

		// Handle gaps
		// ...

		// Set bounds
		this.setBounds(x, y, width, height);
	},
	
};