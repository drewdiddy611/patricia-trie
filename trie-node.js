class Node {
	constructor(isComplete) {
		this.isCompleteWord = isComplete || false;
	}

	_add(label, isComplete) {
		if (this[label]) return this[label];
		return (this[label.trim()] = new Node(isComplete));
	}

	_search(node, count = 0) {
		if (node.isCompleteWord) count++;
		for (let label in node) {
			if (label === 'isCompleteWord') continue;
			count += node._search(node[label]);
		}
		return count;
	}
}

class RootNode extends Node {
	addWord(word) {
		word = word.trim();
		let node = this;
		if (node[word]) return;

		let prefix = '',
			nodeKey = null;
		outer: for (let i = 0; i <= word.length; i++) {
			prefix += word[i] ? word[i] : '';

			if (node[prefix]) {
				node = node[prefix];
				nodeKey = null;
				prefix = '';
				continue;
			} else if (i === word.length) {
				node._add(prefix, true);
				return;
			} else {
				if (!nodeKey) {
					for (let key in node) {
						if (key === 'isCompleteWord') continue;
						if (key.startsWith(prefix)) {
							nodeKey = key;
							continue outer;
						}
					}
				}

				if (!nodeKey) {
					node._add(word.slice(i), true);
					return;
				}

				if (nodeKey.startsWith(prefix)) continue;
				if (prefix.length === 1) {
					node._add(prefix, true);
					return;
				}

				let base = prefix.slice(0, -1);
				node._add(base, false);
				node[base][nodeKey.slice(base.length)] = node[nodeKey];
				node[base]._add(word.slice(i), true);

				delete node[nodeKey];
				return;
			}
		}
	}

	startsWith(word) {
		word = word.trim();
		let node = this;
		if (node[word]) return this._search(node[word]);

		let prefix = '',
			nodeKey = null,
			count = 0;
		outer: for (let i = 0; i < word.length; i++) {
			prefix += word[i] ? word[i] : '';

			if (node[prefix]) {
				if (i === word.length - 1) {
					count += this._search(node[prefix]);
				}
				node = node[prefix];
				nodeKey = null;
				prefix = '';
				continue;
			} else if (i === word.length - 1) {
				for (let key in node) {
					if (key === 'isCompleteWord') continue;
					if (key.startsWith(prefix)) count += this._search(node[key]);
				}
			} else {
				if (!nodeKey) {
					for (let key in node) {
						if (key.startsWith(prefix)) {
							nodeKey = key;
							continue outer;
						}
					}
				}

				if (!nodeKey) {
					return 0;
				}
			}
		}
		return count;
	}
}

module.exports = {
	Node,
	RootNode
};
