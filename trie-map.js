const IGNORE = {
	key: true,
	isCompleteWord: true,
	data: true
};
const NUM_IGNORES = 3;

class TrieNode {
	constructor(key, data = null, isComplete = false) {
		this.isCompleteWord = isComplete;
		this.key = key;
		this.data = data;
	}

	_add(key, data = null, isComplete = false) {
		if (this[key]) {
			this[key].data = data;
			return this[key];
		}
		return (this[key] = new TrieNode(key, data, isComplete));
	}

	_countChildren(count = 0) {
		// Recursively counts all complete words that are children
		// of the node passed in.
		if (this.isCompleteWord) count++;

		for (let key in this) {
			if (IGNORE[key]) continue;
			count += this[key]._countChildren();
		}
		return count;
	}

	_hasChildren() {
		if (Object.keys(this).length === NUM_IGNORES) return false;
		return true;
	}

	_updateKeys(newKey) {
		if (newKey) this.key = newKey;
		for (let key in this) {
			if (IGNORE[key]) continue;
			this[key]._updateKeys(key);
		}
	}
}

/***
 * Compressed (Patricia) trie-map implementation.
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
 * added to the trie. Patricia tries also optimize the tail ends
 * for each word that that has no children attached to any letter.
 * by combining each tail node into a single "partial" node which
 * contains multiple letters.
 * For example:
 * words = 'cell', 'celly', 'cellular'
 * Would give a tree with the following structure.
 *        *                              y
 *	      |                            /
 *      cell    instead of * - c-e-l-l
 *     /   \                          \
 *    y   ular                          u-l-a-r
 *
 * Notice the smaller amount of nodes which need to be traversed
 * before the word lookup can be confirmed.
 */
class TrieMapRoot extends TrieNode {
	set(word, data = null) {
		word = word.trim();

		// Check root for whole word.
		if (this[word]) {
			this[word].data = data;
			return 0;
		}

		let node = this,
			prefix = '',
			nodeKey = null;
		outer: for (let i = 0; i < word.length; i++) {
			prefix += word[i];

			// If the current prefix exists as a child node of the
			// current node, traverse into the child node and
			// reset the prefix to an empty string.
			if (node[prefix]) {
				node = node[prefix];
				if (i === word.length - 1) {
					node.data = data;
					node._updateKeys();
					return -1;
				}

				nodeKey = null;
				prefix = '';
				continue;
			} else if (i === word.length - 1) {
				// If we have a nodeKey it means we've found similar characters,
				// but we've reached the end of the word being added.
				// e.g. 'cell' already in dictionary, word = 'ce'.
				// We need to create new root node at the index 'ce'
				// of the current node.
				if (nodeKey) {
					const base = word;

					// base is a complete word.
					const nodeBase = node._add(base, data, true);

					// Add the existing nodes from the current node to the new
					// node created from the similar characters.
					nodeBase[nodeKey.slice(base.length)] = node[nodeKey];

					// Delete the old node we're no longer using.
					delete node[nodeKey];
					return 1;
				}

				// We've reached the end of the word and haven't found
				// a child node that matches any iteration of the string `word`.
				// Add the entire prefix as a child node.
				node._add(prefix, data, true);
				return 1;
			} else {
				// Optimize the inner for loop: find the key, if it exists,
				// that starts with the current prefix. Use that key from now on.
				if (!nodeKey) {
					nodeKey = this._findNodeKey(node, prefix);
					if (nodeKey) continue outer;
				}

				// If we didn't find a key that starts with the current
				// prefix, then add the remaining letters from the word
				// being added as a child of the current node.
				if (!nodeKey) {
					node._add(word.slice(i), data, true);
					return 1;
				}

				// If we make it here, and the current nodeKey starts
				// with the prefix, then we do nothing and continue with
				// our similar character comparison.
				if (nodeKey.startsWith(prefix)) continue outer;

				// If the current prefix length is one, then the node
				// doesn't have a child with any remaining letters of
				// the current word being added.
				if (prefix.length === 1) {
					node._add(prefix, data, true);
					return 1;
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
				const base = prefix.slice(0, -1);

				// base is not a complete word, but the similar characters.
				node._add(base, null, false);

				// Add the existing nodes from the current node to the new
				// node created from the similar characters.
				node[base][nodeKey.slice(base.length)] = node[nodeKey];

				// Add the rest of the current word. (We know it won't exist
				// because we wouldn't have made it this far if it did.)
				node[base]._add(word.slice(i), data, true);
				node[base]._updateKeys();

				// Delete the old node we're no longer using.
				delete node[nodeKey];
				return 1;
			}
		}
		return 0;
	}

	// Returns true if the trie contains the word.
	has(word) {
		word = word.trim();

		// Are we available in the root node?
		if (this[word]) return true;

		const node = this._traverse(word);
		if (!node) return false;

		return node.isCompleteWord;
	}

	// Gets the value stored using the associated key.
	get(word) {
		word = word.trim();

		// Are we available in the root node?
		if (this[word]) return this[word].data;

		const node = this._traverse(word);
		if (!node) return;

		if (node.isCompleteWord) return node.data;
		return;
	}

	// Remove the word from the trie, if it exists.
	delete(word) {
		word = word.trim();

		// Remove from the root if it exists.
		if (this[word]) {
			delete this[word];
			return true;
		}

		const node = this._traverse(word);
		if (!node) return false;

		if (node._hasChildren()) {
			node.isCompleteWord = false;
			node.data = null;
			return true;
		}

		delete prev[prevKey];
		return true;
	}

	// Return the number of words in the trie that start with `word`.
	countByStartsWith(word, returnCount = false) {
		word = word.trim();

		// Return exact matches.
		if (this[word]) return this._countChildren();

		let node = this,
			prefix = '',
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
				if (i === word.length - 1) count += node._countChildren();

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
					if (IGNORE[key]) continue;
					if (key.startsWith(prefix)) count += node[key]._countChildren();
				}
			} else {
				// Inner loop optimization, again.
				if (!nodeKey) {
					nodeKey = this._findNodeKey(node, prefix);
					if (nodeKey) continue outer;
				}

				// No results found that start with `word`.
				if (!nodeKey) return 0;
			}
		}
		return count;
	}

	_traverse(word) {
		word = word.trim();

		// Are we available in the root node?
		if (this[word]) return this;

		// Compare each character
		let node = this,
			prefix = '',
			match = '';
		for (let i = 0; i <= word.length; i++) {
			prefix += word[i] ? word[i] : '';

			// Traverse down the tree
			if (node[prefix]) {
				match += prefix;
				node = node[prefix];
				prefix = '';
			}
		}

		if (match === word && node.isCompleteWord) return node;
		return;
	}

	_findNodeKey(node, prefix) {
		for (let key in node) {
			if (IGNORE[key]) continue;
			if (key.startsWith(prefix)) return key;
		}
	}
}

module.exports = {
	TrieMapRoot
};
