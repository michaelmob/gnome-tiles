*Author's Notes:*

I became busy with school work (Jan 30th, 2018) and stopped
developing this, during this time I switched to a different desktop environment
because of GNOME 3's performance issues and rapidly changing API and ABI.
So as of this time (April 12th, 2018), I've decided to release the source should
anyone else want to pick up the torch. Most things work, including: tiling
(appending, inserting, attaching), window resize and move callbacks, and
I believe that the foundation for window gaps is there.

When I stopped working on this, I was working on the `removeNode`
method in "tiling.js", which would have removed a node by the window ID (which
GNOME sets) and cleaned up all children in the main Node container. I can't
remember the exact problem I was having, but I remember that because there is
no way to use a "reference" to replace an object (node) inside of another
larger dictionary. I also remember researching binary tree removal for this
specific issue.


# Tiles

Tiles should be a GNOME extension that automatically tiles windows for a user.
Tiles should be primarily mouse-based, e.g. resizing windows, and swapping
window positions with mouse.  Keyboard shortcuts for modifying windows should
exist too.



## Wrappers

GNOME's Meta* objects should be wrapped into instances so a unified style
can be used in other modules.

Wrapping the Meta* objects could also be useful for porting this extension to
other desktop environments or future GNOME releases, as only small changes
will need to be made to their wrappers.

As compared to the wrapping option, I believe that extending/prototyping the
Meta* objects will lead to significantly more code breakage in the future.

[`MetaScreen`, `MetaWindow`, `MetaWorkspace`] should have wrappers.

MetaScreen docs: https://developer.gnome.org/meta/stable/MetaScreen.html
MetaWindow docs: https://developer.gnome.org/meta/stable/MetaWindow.html
MetaWorkspace docs: https://developer.gnome.org/meta/stable/MetaWorkspace.html



## Tiling

Only the `tiling` module should do any sort of window management.



## Nodes

The container that contains a window should be referred to as a *node*.  Nodes
should have two sub-nodes: master and child.  The master node should hold a
*window id* but can also hold another node for deeper nesting.  The child node
must either be null or hold another node.  This method allows for very
customizable layouts.


### Splits

The master and child nodes will be split by a split percentage.  If the
child node is null then the split percentage will be 100% or `1.0`.  The
orientation of the split must also be specified in the parent node.

Split orientations
1. vertical = 0
2. horizontal = 1


### Sizing

Nodes should be sized relatively to the parent's size and split percentage.

When resizing, if the node that is being resized collides with another node,
then the other node's split percentage must be decreased in order to allow for
the resizing of the node.


### Styles

Nodes should have three styles:
1. normal = 0 (default)
    * Window size is based on node size.
2. floating = 1
  * Window is not tiled and can be placed anywhere.
3. psuedo = 2
  * Window is tiled but not automatically resized.



## Modules, methods, and design

./wrappers/screen.js
  * Screen
    * Description: Screen is a wrapper for MetaScreen.
    * Methods:
      * getWorkspaces()
        * Returns list of workspaces.
      * getActiveWindow()
        * Returns ID of active window.

./wrappers/window.js
  * Window
    * Description:
    * Methods:
      * initialize(metaWindow)
        * Initialize window instance.
      * destroy()
        * Destroy window instance.
      * toString()
        * String representation of window instance.
      * getID()
        * Get stable window ID from meta window.
      * getClass()
        * Get wm class from meta window.
      * getBounds()
        * Get window bounds from meta window.
      * setBounds()
        * Set size and position of meta window.
      * onMoved()
        * Callback for a signal when a window's position changes.
      * onResized()
        * Callback for a signal when a window's size changes.

./wrappers/workspace.js
  * Workspace
    * initialize(metaWorkspace)
      * Initialize workspace instance.
    * destroy()
      * Destroy workspace instance.
    * toString()
      * String representation of workspace instance.
    * getBounds()
      * Get list of workspace bounds from all monitors.
    * onWindowAdded()
      * Callback for a signal when a window is added to the workspace.
    * onWindowRemoved()
      * Callback for a signal when a window is removed from the workspace.

./tiling.js
  * Tiling
    * initialize(workspace)
      * Initialize tiling instance.
    * destroy()
      * Destroy tiling instance.
    * tileNodes()
      * Tile the nodes array.
    * traverseNode(callback)
      * Traverse through nested node array.
      * Callback will be supplied with (node, nodeParent)
    * buildNode(windowID)
      * Returns node template from windowID.
    * findNode(windowID)
      * Return pre-existing node from layout of windowID.
    * attachNode(windowID, insertWindowID, direction)
      * Build and attach node to windowID depending on direction.
    * appendNode(windowID)
      * Build and append node to layout.
    * removeNode(windowID)
      * Remove node from layout.
    * resizeNode(windowID, newBounds)
      * Calculate new split percentage for node.
      * Resize colliding nodes.
    * swapNodes(windowID1, windowID2)
      * Swap two node masters.