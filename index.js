const fs = require('fs');
const { RootNode } = require('./trie-node');
// const root = new RootNode();
//
// root.addWord('s');
// root.addWord('ss');
// root.addWord('sss');
// root.addWord('ssss');
// root.addWord('sssss');
//
// console.log(JSON.stringify(root, null, 4));
// console.log(root.startsWith('s'));
// console.log(root.startsWith('ss'));
// console.log(root.startsWith('sss'));
// console.log(root.startsWith('ssss'));
// console.log(root.startsWith('sssss'));
// console.log(root.startsWith('ssssss'));

let input_currentline = 0;
const input_stdin_array = fs
	.readFileSync('./commands.back.txt', { encoding: 'utf-8' })
	.split('\n');

const length = parseInt(readLine());
const root = new RootNode(),
	finds = [];

for (let i = 0; i < length; i++) {
	var op_temp = readLine().split(' ');
	var op = op_temp[0];
	var contact = op_temp[1];

	if (op === 'find') {
		if (i > 400) {
			const amt = root.startsWith(contact);
			if (amt)
				finds.push(JSON.stringify({ find: contact.trim(), amt }, null, 4));
		}
	} else root.addWord(contact);
}
// console.log(JSON.stringify(root, null, 4));
//console.log(finds.join('\n'));

root.addWord('stibaltrar');
console.log(root.has('stibaltrar'));
root.remove('stibaltrar');
console.log(root.has('stibaltrar'));

function readLine() {
	return input_stdin_array[input_currentline++];
}
