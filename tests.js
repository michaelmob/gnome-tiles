#!/usr/bin/node
var Tiling = require("./helpers/tiling.js");
const Node = Tiling.Node;

/*
 * Test class.
 */
var Test = {
	assertEqual(message, valueA, valueB) {
		/*
		* Assert two values are equal.
		*/
		console.log(message);

		if (valueA === valueB) {
			console.log("PASS\n");
			return;
		}

		console.log("FAIL\n");
		throw `${valueA} !== ${valueB}`;
	},

	assertNotEqual(message, valueA, valueB) {
		/*
		* Assert two values are not equal.
		*/
		console.log(message);

		if (valueA !== valueB) {
			console.log("PASS\n");
			return;
		}

		console.log("FAIL\n");
		throw `${valueA} === ${valueB}`;
	},

	assertTrue(message, value) {
		/*
		* Assert value is true.
		*/
		this.assertEqual(message, value, true);
	},

	assertFalse(message, value) {
		/*
		* Assert value is false.
		*/
		this.assertEqual(message, value, false);
	},

	assertNull(message, value) {
		/*
		* Assert value is not null.
		*/
		this.assertEqual(message, value, null);
	},

	assertNotNull(message, value) {
		/*
		* Assert value is not null.
		*/
		this.assertNotEqual(message, value, null);
	},
};


/*
 * Test suite for testing Node class.
 */
var NodeTest = () => {
	let message;

	// Test 'initialize' method
	const testInitialize = (() => {
		console.log("::: Testing 'initialize' method :::");
		let node = Node.initialize("1", {
			"splitPercentage": 0.9,
			"splitOrientation": 1
		});


		Test.assertEqual(
			"Assert content equals '1'",
			node.content, "1"
		);

		Test.assertEqual(
			"Assert splitPercentage equals 0.9",
			node.splitPercentage, 0.9
		);

		Test.assertEqual(
			"Assert splitOrientation equals 1",
			node.splitOrientation, 1
		);
	});


	// Test 'traverse' method
	const testTraverse = (() => {
		console.log("::: Testing 'traverse' method :::");
		// Appended Nodes
		let node1 = Node.initialize("1");
		let node2 = Node.initialize("2");
		let node3 = Node.initialize("3");

		// Attached node
		let node4 = Node.initialize("4");

		// Must manually append nodes
		node1.child = node2;
		node2.parent = node1;

		node2.child = node3;
		node3.parent = node2;

		// Must manually attach nodes
		node1.content = Node.initialize(node1.content);
		node1.content.parent = node1;
		node1.content.child = node4;
		node1.content.child.parent = node1.content.child;

		// Verify that all values are different and count valid number of nodes
		// starting from the top node
		let i = 0;
		let values = [];
		node1.traverse(function() {
			if (values.includes(this.content)) {
				throw "Content already exists";
			}
			values.push(this.content);
			i++;
		});
		Test.assertEqual(
			"Assert 'i' (from top node) is 5",
			i, 5
		);

		// Count nodes starting from the 3rd node
		i = 0;
		node3.traverse(function() { i++; });
		Test.assertEqual(
			"Assert 'i' (from 3rd node) is 1",
			i, 1
		);

	});


	// Test 'attach' method
	const testAttach = (() => {
		console.log("::: Testing 'attach' method :::");
		let node1 = Node.initialize("1");
		let node2 = Node.initialize("2");
		let node3 = Node.initialize("3");
		let node4 = Node.initialize("4");
		let node5 = Node.initialize("5");


		// Attach node2 to right side of node1
		node1.attach(node2, 3);
		/*
		node1
			content -> node1 (clone)
			child -> node2
		*/
		Test.assertEqual(
			"Assert '1' is node1's content's content",
			node1.content.content, "1"
		);

		Test.assertEqual(
			"Assert '2' is node1's child's content",
			node1.child.content, "2"
		);


		// Attach node3 to top side of node2
		node2.attach(node3, 0);
		/*
		node1
			content -> node1 (clone)
			child ->
				content -> node3
				child -> node2 (clone)
		*/
		Test.assertEqual(
			"Assert '3' is node1's child's content's content",
			node1.child.content.content, "3"
		);

		Test.assertEqual(
			"Assert '2' is node1's child's content's content",
			node1.child.child.content, "2"
		);


		// Attach node4 to left side of node1
		node1.attach(node4, 1);
		/*
		node1
			content ->
				content -> node4
				child -> node1 (clone)
			child ->
				content -> node3
				child -> node2 (clone)
		*/
		Test.assertEqual(
			"Assert '4' is node1's content's content's content",
			node1.content.content.content, "4"
		);

		Test.assertEqual(
			"Assert '1' is node1's content's child's content's content",
			node1.content.child.content.content, "1"
		);


		// Attach node5 to bottom side of node4
		node4.attach(node5, 2);
		/*
		node1
			content ->
				content ->
					content -> node4 (clone)
					child -> node5
				child -> node1 (clone)
			child ->
				content -> node3
				child -> node2 (clone)
		*/
		Test.assertEqual(
			"Assert '4' is node1's content's content's content's content",
			node1.content.content.content.content, "4"
		);

		Test.assertEqual(
			"Assert '5' is node1's content's content's child's content",
			node1.content.content.child.content, "5"
		);
	});


	// Test 'append' method
	const testAppend = (() => {
		console.log("::: Testing 'append' method :::");
		let node1 = Node.initialize("1");
		let node2 = Node.initialize("2");
		let node3 = Node.initialize("3");

		node1.append(node2);
		node2.append(node3);

		Test.assertEqual(
			"Assert node2's parent's content is '1'",
			node2.parent.content, "1"
		);

		Test.assertNotNull(
			"Assert node1 has child",
			node1.child
		);

		Test.assertEqual(
			"Assert node1's child's content is '2'",
			node1.child.content, "2"
		);

		Test.assertEqual(
			"Assert node3's content is 3",
			node3.content, "3"
		);

		Test.assertNull(
			"Assert node3 child is null",
			node3.child
		);
	});


	// Test 'find' method
	const testFind = (() => {
		console.log("::: Testing 'find' method :::");
		let node1 = Node.initialize("1");
		let node2 = Node.initialize("2");
		let node3 = Node.initialize("3");

		node1.append(node2);
		node2.attach(node3, 1);

		let foundNode = node1.find("3");
		let unfoundNode = node2.find("1");

		Test.assertEqual(
			"Assert foundNode content is 3",
			foundNode.content, "3"
		);

		Test.assertEqual(
			"Assert unfoundNode is undefined",
			unfoundNode, undefined
		);
	});


	// Test 'remove' method
	const testRemove = (() => {
		console.log("::: Testing 'remove' method :::");
		let node1 = Node.initialize("1");
		let node2 = Node.initialize("2");
		let node3 = Node.initialize("3");
		let node4 = Node.initialize("4");
		let node5 = Node.initialize("5");

		node1.append(node2);
		node2.attach(node3, 3);
		//node2.append(node4, 2);

		console.log(node1);
		console.log("---------------------------");
		node1.remove("2");
		node1.remove("3");
		//node1.remove("4");

		console.log(node1);
	});


	/*
	* Run tests.
	*/
	testRemove();
};

NodeTest();