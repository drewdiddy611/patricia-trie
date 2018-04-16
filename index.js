const fs = require('fs');
const { TrieMapRoot } = require('./trie-map');
function readLine() {
	return input_stdin_array[input_currentline++];
}

let input_currentline = 0;
const input_stdin_array = fs
	.readFileSync('./commands.back.txt', { encoding: 'utf-8' })
	.split('\n');

const length = parseInt(readLine());
const root = new TrieMapRoot();
finds = [];

for (let i = 0; i < length; i++) {
	var op_temp = readLine().split(' ');
	var op = op_temp[0];
	var contact = op_temp[1];

	if (op === 'find') {
		if (i > 400) {
			const amt = root.countByStartsWith(contact);
			if (amt)
				finds.push(JSON.stringify({ find: contact.trim(), amt }, null, 4));
		}
	} else root.set(contact);
}

root.set('starving', new TrieMapRoot());
root.set('starved', [1, 2, 3, 4, 5, 6]);
root.set('stibaltrar', { test: true });
console.log(root);
root.set('starves', 'HAHAH');
console.log(root);
root.delete('starved');
console.log(root);
