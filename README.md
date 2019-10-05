# QNodes
Typescript DOM manipulation inspired by JQuery

## Installation
```bash
npm install qnodes --save
```

## Usage
Just use QNodes as if it were JQuery but with Q instead of $, like this:
```typescript
Q(".someclass").html("<p>Hello World</p>");

Q("a").on("click", (ev, $node) => {
	console.log("clicked the link");
	$node.detach();
	console.log("… and detached it");
	return false;
});

const $el:QNodes = Q("H1").first();
if($el.hasClass("headline")){
	console.log("found the thing");
}
```