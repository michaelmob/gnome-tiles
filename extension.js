const Mainloop = imports.mainloop;
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Tiles = Extension.imports.tiles.Tiles;


var tiles;


function init() {
	/*
	* Initialize extension.
	*/
	Mainloop.idle_add(function() {
		tiles = Tiles.initialize();
	});
}

function enable() {
	/*
	* Enable extension.
	*/
	if (typeof tiles === "undefined") {
		return;
	}
}

function disable() {
	/*
	* Disable extension.
	*/
	if (typeof tiles === "undefined") {
		return;
	}

	tiles.destroy();
	//delete tiles;
}
