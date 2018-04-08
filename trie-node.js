class Node {
	constructor(isComplete) {
		this.isCompleteWord = isComplete || false;
	}

	_add(label, isComplete) {
		if (this[label]) return this[label];
		return (this[label] = new Node(isComplete));
	}

	_search(node, count = 0) {
		// Recursively counts all complete words that are children
		// of the node passed in.
		if (node.isCompleteWord) count++;
		for (let label in node) {
			if (label === 'isCompleteWord') continue;
			count += node._search(node[label]);
		}
		return count;
	}
}

/***
 * Compressed (Patricia) trie implementation.
 */
class RootNode extends Node {
	addWord(word) {
		word = word.trim();
		let node = this;

		// Return if the word exists.
		if (node[word]) return;

		let prefix = '',
			nodeKey = null;
		outer: for (let i = 0; i < word.length; i++) {
			/****
			 * Optimize the trie on insertion, making look-ups faster.
			 * Iterate over the word being added and compare each
			 * letter with any children indices for this node. If a child
			 * exists, traverse down the tree. If not, add the remaining
			 * characters in the word.
			 * For example:
			 * word = 'cat'
			 * i = 0: prefix = 'c';
			 * i = 1: prefix = 'ca';
			 * i = 2: prefix = 'cat';
			 * next /////////
			 * word = 'car'
			 * i = 0: prefix = 'c';
			 * i = 1: prefix = 'ca';
			 * i = 2: prefix = 'car';
			 * Would give a tree with the following structure.
			 *      *                      *
			 *      |                      |
			 *     ca      instead of      c    reducing the number of nodes visited.
			 *    /  \                     a
			 *   r    t                r       t
			 * Similar characters: 'ca'
			 *
			 * The new base will be the similar characters of each new word
			 * added to the trie.
			 */
			prefix += word[i];

			// If the current prefix exists as a child node of the
			// current node, traverse into the child node and
			// reset the prefix to an empty string.
			if (node[prefix]) {
				node = node[prefix];
				nodeKey = null;
				prefix = '';
				continue;
			} else if (i === word.length - 1) {
				// We've reached the end of the word and haven't found
				// a child node that matches any iteration of the string `word`.
				// No matches found, add the entire prefix as a child node.
				node._add(prefix, true);
				return;
			} else {
				// Optimize the inner for loop: find the key, if it exists,
				// that starts with the current prefix. Use that key from now on.
				if (!nodeKey) {
					for (let key in node) {
						if (key === 'isCompleteWord') continue;
						if (key.startsWith(prefix)) {
							nodeKey = key;
							continue outer;
						}
					}
				}

				// If we didn't find a key that starts with the current
				// prefix, then add the remaining letters from the word
				// being added as a child of the current node.
				if (!nodeKey) {
					node._add(word.slice(i), true);
					return;
				}

				// If we make it here, and the current nodeKey starts
				// with the prefix, then we do nothing and continue with
				// our similar character comparison.
				if (nodeKey.startsWith(prefix)) continue;

				// If the current prefix length is one, then the node
				// doesn't have a child with any remaining letters of
				// the current word being added.
				if (prefix.length === 1) {
					node._add(prefix, true);
					return;
				}

				// If we make it here, we've discovered all of the similar
				// characters between the word being added and the current
				// node. We can create a new node defined by the similar
				// characters which contain the previously existing nodes
				// and the current word being added.
				//
				// e.g:
				// cat in dictionary already, adding 'car'
				// prefix = car
				// nodeKey = cat
				// similar characters = base = ca
				let base = prefix.slice(0, -1);

				// base is not a complete word, but the similar characters.
				node._add(base, false);

				// Add the existing nodes from the current node to the new
				// node created from the similar characters.
				node[base][nodeKey.slice(base.length)] = node[nodeKey];

				// Add the rest of the current word. (We know it won't exist
				// because we wouldn't have made it this far if it did.)
				node[base]._add(word.slice(i), true);

				// Delete the old node we're no longer using.
				delete node[nodeKey];
				return;
			}
		}
	}

	startsWith(word) {
		word = word.trim();
		let node = this;

		// Return exact matches.
		if (node[word]) return this._search(node[word]);

		let prefix = '',
			nodeKey = null,
			count = 0;
		outer: for (let i = 0; i < word.length; i++) {
			// Similar to adding, we comparing each character of the word
			// being searched with the indices of the current node.
			prefix += word[i];

			// Traverse down the tree if the current prefix exists.
			if (node[prefix]) {
				// If we're at the end of the word and the prefix exists,
				// just count all the complete words in the all child nodes.
				if (i === word.length - 1) {
					count += this._search(node[prefix]);
				}

				// Traverse and reset the prefix.
				node = node[prefix];
				nodeKey = null;
				prefix = '';
				continue;
			} else if (i === word.length - 1) {
				// We've looked at all the characters of the word being searched,
				// but none match any of the indices of the current node, count
				// all the complete words in any child nodes that start with
				// the current prefix.
				for (let key in node) {
					if (key === 'isCompleteWord') continue;
					if (key.startsWith(prefix)) count += this._search(node[key]);
				}
			} else {
				// Inner loop optimization, again.
				if (!nodeKey) {
					for (let key in node) {
						if (key.startsWith(prefix)) {
							nodeKey = key;
							continue outer;
						}
					}
				}

				// No results found that start with `word`.
				if (!nodeKey) {
					return 0;
				}
			}
		}
		return count;
	}
}

module.exports = {
	RootNode
};
