# QNodes

A tiny (3.22KB minified & gzipped) DOM manipulation library written in TypeScript inspired by JQuery.


## Installation
```shell
npm install qnodes --save
```

### Import
```typescript
import { Q, QNodes } from "qnodes";
```


## Usage


#### DOM Selection
QNodes uses [querySelectorAll()](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelectorAll) for selection. A list of possible selectors can be found [here](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors). 

##### Select all H1-Headlines
```typescript
let $elements = Q("h1"); 
```

##### Select all links that are direct children of DIVs with CSS class 'myclass'
```typescript
Q("div.myclass>a"); 
```

##### Next / previous sibling of element with ID 'myid' that has class 'myclass'
```typescript
Q("#myid").next(".myclass"); 
Q("#myid").prev(".myclass"); 
```

##### Last list element of first unordered list
```typescript
Q("ul").first().find(">li").last();
```

##### First ancestor of element with ID 'myid' that is a link with 'href' attribute
```typescript
Q("#myid").parents("a[href]").first();
```

#### DOM Manipulation

##### Change content of first headline
```typescript
Q("h1").first().html("Hello World");
```

##### Set content of all links to content of first H2 headline
```typescript
Q("a").html(Q("h2").first().html());
```

##### Set attribute 'myattr' to 'foo' for all elements with class 'myclass' and remove that class
```typescript
Q(".myclass").attr({ myattr: "foo" }).removeClass("myclass");
```

##### Remove all links that have 'href' set to '#'
```typescript
Q("a[href='#']").detach();
```

#### Animation
QNodes uses CSS animations internally
```typescript
Q("#mydiv").animate({ opacity: 0.5 }, 750, "linear", ($nodes) => {
	//callback;
});
```


