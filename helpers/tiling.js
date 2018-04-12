var Extension, Log;

// Browser JavaScript
if (typeof console === "object") {
	Log = {
		log(message) {
			console.log(message);
		},

		debug(message) {
			console.log(message);
		}
	};
}

// GNOME JavaScript
else {
	Extension = imports.misc.extensionUtils.getCurrentExtension();
	Log = Extension.imports.helpers.logging.Logger("tiling");
}


var NodeSplit = {
	VERTICAL: 0,
	HORIZONTAL: 1
};


var NodeType = {
	NORMAL: 0,
	FLOATING: 1,
	PSUEDO: 2
};


var NodeDirection = {
	TOP: 0,
	LEFT: 1,
	BOTTOM: 2,
	RIGHT: 3
}


/*
 * The node class is the container class for windows.
 */
var Node = {

	// Variables
	parent: null,
	child: null,
	content: null,

	geometry: null,
	contentGeometry: null,

	splitOrientation: null,
	splitPercentage: null,


	// Methods
	initialize(content, kwargs={}) {
		/*
		* Initialize node instance by copying itself.
		*/
		let self = Object.assign({}, this);

		// Properties that may be set on initialization
		let properties = ["parent", "splitPercentage", "splitOrientation"];

		// Update object properties
		for (var i = 0; i < properties.length; i++) {
			if (kwargs.hasOwnProperty(properties[i])) {
				self[properties[i]] = kwargs[properties[i]];
			}
		}

		// Set content
		self.content = content;

		return self;
	},


	isContainer() {
		/*
		* Determine if node is a conatiner node.
		*/
		return (
			this.content !== null &&
			this.content.hasOwnProperty("content")

			//this.child !== null &&
			//this.child.hasOwnProperty("content")
		);
	},


	isChild() {
		/*
		* Determine if node is the 'child' of the parent.
		*
		* If parent is null, undefined is returned.
		* Returns true if it is, otherwise returns false (content).
		*/
		if (this.parent === null) {
			return undefined;
		}

		return this.parent.child.content === this.content;
	},


	sibling() {
		/*
		* Get sibling node, only works if parent is a container node.
		*
		* If parent is not a container node, undefined will be returned.
		*/
		if (!(
			this.parent !== null &&
			this.parent.content.hasOwnProperty("content") &&
			this.parent.child.hasOwnProperty("content")
		)) {
			return undefined;
		}

		if (this.parent.content.content === this.content) {
			return this.parent.child;
		}

		if (this.parent.child.content === this.content) {
			return this.parent.content;
		}
	},


	traverse(callback) {
		/*
		* Traverse this node by traversing its nested nodes.
		*
		* Callback will be called with 'this' as the current node.
		*/
		if (typeof callback === "function") {
			if (callback.call(this) === false) {
				return;
			}
		}

		// Traverse through child nodes of current chute first
		if (this.child !== null) {
			this.child.traverse(callback);
		}

		// Continue to the next chute in array
		if (this.content !== null && this.content.hasOwnProperty("content")) {
			this.content.traverse(callback);
		}
	},


	find(content) {
		/*
		* Find node instance by content value.
		*/
		let result;

		this.traverse(function() {
			if (this.content !== content) {
				return true;  // Continue
			} 

			result = this;
			return false;  // Stop
		});

		return result;
	},


	append(node) {
		/*
		* Append new node to last nested node's child.
		*/
		let parent = this;

		this.traverse(function() {
			if (this.child !== null) {
				return true;  // Continue
			}

			// Set new node to child of node
			this.child = node;

			// Set new node's parent to the current node
			node.parent = this;

			return false;  // Stop
		});
	},


	attach(node, direction) {
		/*
		* Attach new node to directional edge of current node.
		*/
		// Clone this to currentNode so it can be moved around inside of the
		// container node.
		let currentNode = Object.assign({}, this);

		// Container node must be used to hold, both, the current and new nodes.
		let containerNode;

		// If the current node's child is null then we can use the current node
		// as the container node.
		if (this.child === null) {
			containerNode = this;
			containerNode.content = null;
		}

		// If the current node already has a child, we must create the container
		// node.
		else {
			containerNode = Node.initialize();
			this.content = containerNode;
		}

		switch (direction) {
			// Attach to top, left
			case NodeDirection.TOP:
			case NodeDirection.LEFT:
				containerNode.content = node;
				containerNode.child = currentNode;
				break;

			// Attach to bottom, right
			case NodeDirection.BOTTOM:
			case NodeDirection.RIGHT:
				containerNode.content = currentNode;
				containerNode.child = node;
				break;

			// Other direction?
			default:
				break;
		}

		containerNode.content.parent = containerNode;
		containerNode.child.parent = containerNode;

		return containerNode;
	},


	clean() {
		/*
		* Clean node and its children by removing unneeded nodes.
		*/
	},


	remove(content) {
		/*
		* Remove node by content value.
		*/
		let node = this.find(content);


		// Node was not found
		if (node === undefined || node === null) {
			return;
		}

		// When child exists...
		// Move (child's content) to content and set child to null
		if (node.child !== null) {
			console.log("1");
			node.content = node.child.content;
			node.child = null;
		}

		// When child doesn't exist...
		// Determine which 'side' the node of the parent is on
		else {
			console.log("2");
			// Content
			if (node.isChild()) {
				node.parent.content = node.parent.child;
			}

			// Child
			node.parent.child = null;
		}

		// When parent's child is null...
		// Replace parentNode values with parentNode's content's values
		if (node.parent.child === null) {
			node.parent.child = node.parent.content.child;
			node.parent.content = node.parent.content.content;
		}
	}

};


/*
 * Tiling helper class to assist in tiling a workspace's windows.
 */
var Tiling = {

	// Variables
	node: null,
	workspace: null,
	isBusy: false,


	// Methods
	initialize: function(workspace) {
		/*
		* Initialize tiling instance.
		*/
		var self = Object.assign({}, this);

		// Set workspace object
		self.workspace = workspace;

		// Build initial node array
		self.node = self.buildNode2();

		// Initial tiling
		//self.tileNodes();

		Log.debug(self.node.child.content);

		return self;
	},


	destroy: function() {
		/*
		* Destroy tiling instance.
		*/
	},


	buildNode2: function() {
		/*
		* Build initial node.
		*/
		let result = Node.initialize(0, {
			splitOrientation: NodeSplit.VERTICAL,
			splitPercentage: 0.5
		});

		let previousNode = result;

		for (let key in this.workspace.windows) {
			previousNode.setChild(Node.initialize(key));
		}

		return result;
	},


	tileNodes: function() {
		/*
		* Tile the nodes array
		*/
		let workspaceBounds = this.workspace.getBounds();
		let self = this;

		// Set nodes position and size to the workspace bounds
		this.nodes.x = workspaceBounds.x;
		this.nodes.y = workspaceBounds.y;
		this.nodes.width = workspaceBounds.width;
		this.nodes.height = workspaceBounds.height;

		this.traverseNodes(function(windowID, node, parentNode) {
			let masterContainer = node.master.hasOwnProperty("master");
			let childContainer = node.child !== null && node.child.hasOwnProperty("master");

			// Set initial master node position and size.
			// Master can be a window id so in that case we can't assign the
			
			// position and size to it.
			if (masterContainer) {
				node.master.x = node.x;
				node.master.y = node.y;
				node.master.height = node.height;
				node.master.width = node.width;
				node.isMaster = true;
			}

			// Set initial child node position and size
			// Only if child is a node and not null
			if (childContainer) {
				node.child.x = node.x;
				node.child.y = node.y;
				node.child.height = node.height;
				node.child.width = node.width;
				node.isMaster = false;
			}

			// Vertical split
			if (node.splitOrientation === NodeSplit.VERTICAL) {
				if (masterContainer) {
					// Set position and size of master node
					node.master.x = node.x;
					node.master.width = node.width * node.splitPercentage;

					// Set position and size of child node
					if (childContainer) {
						node.child.x = node.master.width + node.master.x;
						node.child.width = node.master.width;
					}
				}
				else if (childContainer) {
					node.child.width = node.width * node.splitPercentage;
					node.child.x = node.child.width + node.x;
				}
			}

			// Horizontal split
			else if (node.splitOrientation === NodeSplit.HORIZONTAL) {
				if (masterContainer) {
					// Set position and size of master node
					node.master.y = node.y;
					node.master.height = node.height * node.splitPercentage;

					// Set position and size of child node
					if (childContainer) {
						node.child.y = node.master.height + node.master.y;
						node.child.height = node.master.height;
					}
				}
				else if (childContainer) {
					node.child.height = node.height * node.splitPercentage;
					node.child.y = node.child.height + node.y;
				}
			}

			if (typeof windowID === "string") {
				self.workspace.windows[windowID].setBoundsFromNode(node);
			}
		}, this.nodes);
	},


	traverseNodes: function(callback, _parentNode) {
		/*
		* Traverse through nested node array.
		* Callback will be supplied with (node, parentNode).
		*/
		//this.traverseNode(this.nodes, callback, _parentNode);
	},


	traverseNode: function(node, callback, _parentNode) {
		/*
		* Traverse through all nested nodes.
		*/
		let windowID;

		// Test for master node
		if (node.master !== undefined) {
			windowID = typeof node.master === "string" ? node.master : undefined;

			if (callback(windowID, node, _parentNode) === false) {
				return;
			}

			// Check if master node has children
			if (node.master !== null && node.master.hasOwnProperty("master")) {
				this.traverseNode(node.master, callback, node);
			}
		}

		// Test for child node
		if (node.child !== undefined) {
			windowID = typeof node.child === "string" ? node.child : undefined;

			if (callback(windowID, node, _parentNode) === false) {
				return;
			}

			// Check if child node has children
			if (node.child !== null && node.child.hasOwnProperty("master")) {
				this.traverseNode(node.child, callback, node);
			}
		}
	},


	findNode: function(windowID) {
		/*
		* Return pre-existing node from layout of windowID.
		*/
		let foundNode;

		this.traverseNodes(function(windowID_, node, parentNode) {
			if (foundNode !== undefined) {
				return false;
			}

			// Attempt to find window id in master node
			if (typeof windowID_ == "string" && windowID_ === windowID) {
				foundNode = node;
				return false;
			}
		});

		return foundNode;
	},


	findNodeAtPosition: function(x, y) {
		/*
		* Find node at coordinates.
		*
		* Since node parents also keep the size of the node children and the
		* node parents are higher in the hierarchy, we need to go deeper to
		* find when the next node does not contain the coordinates.
		*/
		let foundNode;

		this.traverseNodes(function(windowID, node, parentNode) {
			// Does the node contain the coordinates?
			if (
				node.x <= x && x <= node.x + node.width &&
				node.y <= y && y <= node.y + node.height
			) {
				foundNode = node;
				return;  // Continue to next node
			}

			// Does next node NOT contain coordinates?
			if (foundNode !== undefined) {
				// The previous node 'foundNode' is the deepest node with the
				// coordinates provided.
				return false;  // Stop traversing
			}
		});

		return foundNode;
	},


	insertNode: function(insertWindowID, windowID, direction) {
		/*
		* Build and insert node after/before a node of a window ID.
		*/
		let existingNode = this.findNode(windowID);
		let newNode = this.buildNode(insertWindowID);

		// Verify node exists
		if (existingNode === undefined) {
			return;
		}

		// Set toNode's child to be newNode
		if (existingNode.child === null) {
			existingNode.child = newNode;
		}

		// toNode's child already exists, so move that child to the new
		// node's child node.
		else {
			newNode.child = existingNode.child;
			existingNode.child = newNode;
		}

		existingNode.splitPercentage = 0.5;

		// Place window on specified edge
		switch (direction) {
			// Top
			case NodeDirection.TOP:
				this.swapNodes(windowID, insertWindowID);
				existingNode.splitOrientation = NodeSplit.HORIZONTAL;
				break;

			// Left
			case NodeDirection.LEFT:
				this.swapNodes(windowID, insertWindowID);
				existingNode.splitOrientation = NodeSplit.VERTICAL;
				break;

			// Bottom
			case NodeDirection.BOTTOM:
				existingNode.splitOrientation = NodeSplit.HORIZONTAL;
				break;

			// Right
			default:
				existingNode.splitOrientation = NodeSplit.VERTICAL;
				break;
		}

	},


	appendNode: function(windowID) {
		/*
		* Build and append node to layout.
		*/
		let newNode = this.buildNode(windowID);

		// Create initial node
		if (Object.keys(this.nodes).length < 1) {
			this.nodes = newNode;
			return this.nodes;
		}

		// Append node to last node in nodes
		this.traverseNodes(function(windowID_, node, parentNode) {
			if (node.child !== null)
				return;

			// Set split percentage to half
			node.splitPercentage = 0.5;

			// Invert split orientation for next node
			newNode.splitOrientation = (
				node.splitOrientation === NodeSplit.HORIZONTAL ?
					NodeSplit.VERTICAL : NodeSplit.HORIZONTAL
			);

			node.child = newNode;

			return false;
		});
	},


	attachNode: function(attachWindowID, windowID, direction) {
		/*
		* Build and attach node to windowID depending on direction.
		*/
		let existingNode = this.findNode(windowID);

		// Verify node exists
		if (existingNode === undefined) {
			return;
		}

		// Preemptively remove node with attachWindowID master from the node
		// list to prevent duplicate nodes.
		this.removeNode(attachWindowID);

		if (existingNode.child === null) {
			return this.insertNode(attachWindowID, windowID, direction);
		}

		// Clone existing node
		let cloneNode = Object.assign({}, existingNode);
		cloneNode.splitPercentage = 1;
		cloneNode.child = null;

		// Create new node
		let newNode = this.buildNode(attachWindowID);

		// Reset existing node
		existingNode.master = {
			splitPercentage: 0.5
		};

		// Set node split orientation as HORIZONTAL
		if (direction === NodeDirection.TOP || direction === NodeDirection.BOTTOM) {
			existingNode.master.splitOrientation = NodeSplit.HORIZONTAL;
		}

		// Set node split orientation as VERTICAL
		else if (direction === NodeDirection.LEFT || direction === NodeDirection.RIGHT) {
			existingNode.master.splitOrientation = NodeSplit.VERTICAL;
		}

		// Set node positions based on TOP and LEFT edge
		if (direction === NodeDirection.TOP || direction === NodeDirection.LEFT) {
			existingNode.master.master = newNode;
			existingNode.master.child = cloneNode;
		}

		// Set node positions based on BOTTOM and RIGHT edge
		else if (direction === NodeDirection.BOTTOM || direction === NodeDirection.RIGHT) {
			existingNode.master.master = cloneNode;
			existingNode.master.child = newNode;
		}
	},


	removeNode: function(windowID) {
		/*
		* Remove node from layout.
		*/
		this.traverseNodes(function(windowID_, node, parentNode) {
			if (windowID_ !== windowID) {
				return;
			}

			// Replace master node with child node
			if (node.child !== null) {
				// Cache child node, since it will be overwritten
				let child = node.child;

				// Set all master key values to child key values
				let keys = Object.keys(node);
				for (var i = 0; i < keys.length; i++) {
					node[keys[i]] = child[keys[i]];
				}
			}

			// Node has no children and is last in nest
			// Must find out parent node's key
			else if (typeof parentNode !== "undefined") {
				// Is this node in the 'master' key of the parent?
				if (parentNode.master !== null && parentNode.master.master === windowID_) {
					parentNode.master = null;
				}

				// Is this node in the 'child' key of the parent?
				else if (parentNode.child !== null && parentNode.child.master === windowID_) {
					parentNode.child = null;
				}
			}

			// Master node must not be null, move child node into it if it exists
			if (
				typeof parentNode !== "undefined" &&
				parentNode.master === null && parentNode.child !== null
			) {
				parentNode.master = parentNode.child;
				parentNode.child = null;
			}

			// Resize split percentage back to 1 when there is no child
			if (typeof parentNode !== "undefined" && parentNode.child == null) {
				parentNode.splitPercentage = 1;
			}

			return false;
		});
	},


	resizeNode: function(windowID, newSplitPercentage) {
		/*
		* Calculate new split percentage for node.
		* Resize colliding nodes.
		*/
		// traverse nodes, compare split orientation with the width/height resize
		// 
	},


	swapNodes: function(windowID1, windowID2) {
		/*
		* Swap two node masters.
		*/
		if (windowID1 === windowID2) {
			return;
		}

	},

};


// Export classes for tests
if (typeof module === "object") {
	module.exports = {
		Node
	};
}