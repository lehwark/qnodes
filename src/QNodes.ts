export type EventName = "click" | "dblclick" | "focus" | "blur" | "select" | "mouseup" | "mousedown" | "mouseover" | "mouseenter" | "mouseleave" | "keydown" | "keyup" | "submit" | "change" | "input" | "animationend" | "keypress" | "dragstart" | "dragover" | "dragend" | "drop";

function intersect(a: any[], b: any[]): any[] {
	const result = [];
	for (const x of a)
		if (b.includes(x))
			result.push(x);
	return result;
}

export class QNodes {
	public nodes: Element[];

	private static allhandler: { [evsrcid: string]: { [evname: string]: EventListenerOrEventListenerObject[] } } = {};  // needed for unbind
	private static allAnimIDs: string[] = [];

	constructor(nodes: NodeListOf<Element> | Element[]) {
		if (Array.isArray(nodes))
			this.nodes = nodes;
		else
			this.nodes = Array.prototype.slice.call(nodes);
	}

	private insertAdjacentHTML(pos: InsertPosition, html: string): QNodes {
		return this._map((domel) => {
			domel.insertAdjacentHTML(pos, html);
		});
	}

	/** if this QNodes-Object represents an IFrame, the result will be the body of that IFrame, otherwise it will be the empty QNodes-Set */
	public iframeBody(): QNodes {
		if (this.nodes.length > 0 && this.nodes[0]) {
			const wnd = (this.nodes[0] as HTMLFrameElement).contentWindow;
			if (wnd)
				return new QNodes([wnd.document.body])
		}
		return new QNodes([]);
	}


	public prev(selector?: string): QNodes {
		return this.prevnext(false, selector);
	}

	public next(selector?: string): QNodes {
		return this.prevnext(true, selector);
	}

	private prevnext(next: boolean, selector?: string): QNodes {
		const allsibs: Element[] = [];
		this._map((domel) => {
			const p = next ? domel.nextElementSibling : domel.previousElementSibling;
			if (p && !allsibs.includes(p))
				allsibs.push(p);
		});
		if (typeof selector !== "undefined") {
			const allnodes = Array.prototype.slice.call(document.querySelectorAll((selector)));
			return new QNodes(intersect(allsibs, allnodes));
		} else
			return new QNodes(allsibs);
	}

	public wrap($wrapper: QNodes): QNodes {
		return this._map((domel) => {
			let wrapper = document.createElement('div') as HTMLElement;
			const wparent = $wrapper.nodes[0].parentElement;
			if (wparent) {
				wrapper.innerHTML = wparent.innerHTML;
				wrapper = wrapper.firstElementChild as HTMLElement;
				if (domel.parentNode) {
					domel.parentNode.insertBefore(wrapper, domel);
					domel.parentNode.removeChild(domel);
				}
				wrapper.appendChild(domel);
			}
		});

	}

	public offset(): { left: number, top: number } | null {
		if (this.nodes && this.nodes.length > 0) {
			const rect = this.nodes[0].getBoundingClientRect();
			return {
				top: rect.top + document.body.scrollTop,
				left: rect.left + document.body.scrollLeft
			}
		}
		return null;
	}

	public position(): { left: number, top: number } | null {
		return (this.nodes && this.nodes.length > 0) ? { left: (this.nodes[0] as HTMLElement).offsetLeft, top: (this.nodes[0] as HTMLElement).offsetTop } : null;
	}

	public width(): number {
		return (this.nodes && this.nodes.length > 0) ? (this.nodes[0] as HTMLElement).offsetWidth : 0;
	}

	public height(): number {
		return (this.nodes && this.nodes.length > 0) ? (this.nodes[0] as HTMLElement).offsetHeight : 0;
	}


	/** TODO: still just an alias for css display none   */
	public fadeOut(duration?: number, f_callback?: () => void): QNodes {
		return this.hide(duration, f_callback);
	}

	/** TODO: still just an alias for css display block  */
	public fadeIn(duration?: number, f_callback?: () => void): QNodes {
		return this.show(duration, f_callback);
	}

	/** TODO: still just an alias for css display none   */
	public slideUp(duration?: number, f_callback?: () => void): QNodes {
		return this.hide(duration, f_callback);
	}

	/** TODO: still just an alias for css display block  */
	public slideDown(duration?: number, f_callback?: () => void): QNodes {
		return this.show(duration, f_callback);
	}

	/** TODO: still just an alias for css display none   */
	public hide(duration?: number, f_callback?: () => void): QNodes {
		const result = this.css("display", "none");
		if (typeof f_callback !== "undefined")
			f_callback();
		return result;
	}

	/** TODO: still just an alias for css display block  */
	public show(duration?: number, f_callback?: () => void): QNodes {
		const result = this.css("display", "block");
		if (typeof f_callback !== "undefined")
			f_callback();
		return result;
	}

	public fullScreen(): boolean;
	public fullScreen(b: boolean): QNodes;
	public fullScreen(b?: boolean): QNodes | boolean {
		const doc = document as any;
		if (typeof b === "undefined") {
			return (doc["fullscreenElement"] && doc["fullscreenElement"] !== null) ||
				(doc["webkitFullscreenElement"] && doc["webkitFullscreenElement"] !== null) ||
				(doc["mozFullScreenElement"] && doc["mozFullScreenElement"] !== null) ||
				(doc["msFullscreenElement"] && doc["msFullscreenElement"] !== null);
		} else if (!b) {
			const exitFullScreen = doc["exitFullscreen"] || doc["webkitExitFullscreen"] || doc["mozCancelFullScreen"] || doc["msExitFullscreen"];
			exitFullScreen.call(doc);
		} else {
			if (this.nodes && this.nodes.length > 0) {
				const requestFullScreen = this.nodes[0]["requestFullscreen"] || (this.nodes[0] as any)["msRequestFullscreen"] || (this.nodes[0] as any)["mozRequestFullScreen"] || (this.nodes[0] as any)["webkitRequestFullscreen"];
				if (requestFullScreen)
					requestFullScreen.call(this.nodes[0]);
			}
		}
		return this;
	}

	public empty(): QNodes {
		return this._map((domel) => {
			domel.innerHTML = "";
		});
	}

	public first(): QNodes {
		return new QNodes((this.nodes && this.nodes.length > 0) ? [this.nodes[0]] : []);
	}

	public last(): QNodes {
		return new QNodes((this.nodes && this.nodes.length > 0) ? [this.nodes[this.nodes.length - 1]] : []);
	}

	public detach(): void {
		this._map((domel) => {
			if (domel.parentNode)
				domel.parentNode.removeChild(domel);
		});
	}

	public parents(selector?: string): QNodes {
		const allparents: Element[] = [];
		this._map((domel) => {
			let parent = domel.parentElement;
			while (parent) {
				if (!allparents.includes(parent))
					allparents.push(parent);
				parent = parent.parentElement;
			}
		});
		if (selector && allparents.length > 0) {
			const allnodes = Array.prototype.slice.call((allparents[0].ownerDocument as Document).querySelectorAll((selector)));
			return new QNodes(intersect(allparents, allnodes));
		} else
			return new QNodes(allparents);
	}

	public static fromCSSCamelcase(a: string): string {
		return a = a.replace(/([A-Z])/g, function (str, letter) { return "-" + letter.toLowerCase(); });
	}

	public static toCSSCamelcase(a: string): string {
		return a = a.replace(/-([a-z])/g, function (str, letter) { return letter.toUpperCase(); });
	}

	public css(key: string, value: string | number): QNodes;
	public css(kv: { [key: string]: string | number }): QNodes;
	public css(a: string | { [key: string]: string | number }, b?: string | number): QNodes {
		if (typeof b !== "undefined")
			return this._map((domel) => {
				(domel as HTMLElement).style[QNodes.toCSSCamelcase(a as string) as any] = b + "";
			});
		else {
			for (const k in a as { [key: string]: string })
				this.css(k, (a as { [key: string]: string | number })[k] + "");
			return this;
		}
	}

	public isChecked(): boolean {
		return (true === (this.prop("checked") || this.prop("selected"))) as boolean;
	}

	public isVisible(): boolean {
		return (this.nodes && this.nodes.length > 0) ? ((this.nodes[0] as HTMLElement).offsetWidth > 0 || (this.nodes[0] as HTMLElement).offsetHeight > 0) : false;
	}


	public clone(): QNodes {
		return Q(`<div>${this.html()}</div>`);
	}

	public val(): string;
	public val(value: any): QNodes;
	public val(value?: any): string | QNodes | null {
		if (typeof value === "undefined")
			return (this.nodes && this.nodes.length > 0) ? ((this.nodes[0] as HTMLInputElement).value) : null;
		else
			return this._map((domel) => {
				(domel as HTMLInputElement).value = value;
			});
	}

	public focus(): QNodes {
		if (this.nodes && this.nodes.length > 0)
			(this.nodes[0] as HTMLElement).focus();
		return this;
	}

	public prop(key: string): string | number | boolean;
	public prop(key: string, value: any): QNodes;
	public prop(key: string, value?: any): QNodes | string | number | boolean {
		if (typeof value === "undefined") {
			return (this.nodes && this.nodes.length > 0) ? (this.nodes[0] as any)[key] : null;
		} else
			return this._map((domel) => {
				(domel as any)[key] = value;
			});
	}

	public unbind(eventname: string): QNodes {
		return this._map((domel) => {
			const evsrcid = domel.getAttribute("data-x4-evsrcid");
			if (evsrcid) {
				if (QNodes.allhandler[evsrcid] && QNodes.allhandler[evsrcid][eventname]) {
					for (const h of QNodes.allhandler[evsrcid][eventname])
						domel.removeEventListener(eventname, h);
					QNodes.allhandler[evsrcid][eventname] = [];
				}
			}
		});
	}

	public trigger(eventname: EventName): QNodes {
		let eventClass = "";
		switch (eventname) {
			case "click":
			case "mousedown":
			case "mouseup":
				eventClass = "MouseEvents";
				break;
			case "focus":
			case "change":
			case "blur":
			case "select":
				eventClass = "HTMLEvents";
				break;
		}
		return this._map((domel) => {
			if (domel.ownerDocument) {
				const event = domel.ownerDocument.createEvent(eventClass);
				event.initEvent(eventname, true, true);
				(event as any)["synthetic"] = true;
				domel.dispatchEvent(event);
			}
		});
	}

	public on(eventname: EventName | EventName[], handler: (event: any, $node: QNodes) => boolean | Promise<boolean>): QNodes {
		if (typeof eventname === "string")
			this._map((domel) => {
				// const h = (e) => {
				// 	if (!handler.call(this, e, new QNodes([domel])))
				// 		e.preventDefault();
				// };

				const h = function (e: Event) {
					if (!handler.call(domel, e, new QNodes([domel])))
						e.preventDefault();
				};
				if (!domel.hasAttribute("data-x4-evsrcid"))
					domel.setAttribute("data-x4-evsrcid", "x4evsrc_" + generateName());
				const evsrcid = domel.getAttribute("data-x4-evsrcid") as string;
				if (!QNodes.allhandler[evsrcid])
					QNodes.allhandler[evsrcid] = {};
				if (!QNodes.allhandler[evsrcid][eventname])
					QNodes.allhandler[evsrcid][eventname] = [];
				QNodes.allhandler[evsrcid][eventname].push(h);
				domel.addEventListener(eventname, h);
			});
		else
			for (const ename of eventname)
				this.on(ename, handler);
		return this;
	}


	public serializeForm(): OpenStruct {
		const result: OpenStruct = {};
		this.find("input[type='string'][name],input[type='text'][name],input[type='email'][name],input[type='password'][name],input[type='number'][name],input[type='color'][name],input[type='radio'][name]:checked,input[type='checkbox'][name]:checked,textarea[name],select[name]").map((node) => {
			const key = node.attr("name").replace(/ /g, "_");
			let value = (node.nodes[0] as HTMLInputElement).value;
			if (value !== null)
				result[key] = value;
		});
		return result;
	}

	public find(selector: string): QNodes {

		selector = selector.trim();
		if (selector.indexOf(">") == 0) {
			const tmpid = generateName(10);
			this.attr("data-x4_tmpid", tmpid);
			selector = "[data-x4_tmpid=\"" + tmpid + "\"]" + selector;
		}


		// selector = preprocessSelector(selector);
		const nodes: Element[] = [];
		this._map((domel) => {
			for (const e of (Array.prototype.slice.call(domel.querySelectorAll(selector)) as Element[]))
				if (!nodes.includes(e))
					nodes.push(e);
		});
		return new QNodes(nodes);
	}

	public insertBefore(nodes: QNodes | string): QNodes {
		if (typeof nodes === "string") {
			return this.insertBefore(Q(nodes));
		} else {
			if (this.nodes && this.nodes.length == 1 && nodes && nodes.length() > 0) {
				const selfnodes = this.nodes;
				nodes._map((domel) => {
					if (domel.parentElement)
						domel.parentElement.insertBefore(selfnodes[0], domel);
				});
			}
		}
		return this;
	}

	public insertAfter(nodes: QNodes | string): QNodes {
		if (typeof nodes === "string") {
			return this.insertBefore(Q(nodes));
		} else {
			if (this.nodes && this.nodes.length == 1 && nodes && nodes.length() > 0) {
				const selfnodes = this.nodes;
				nodes._map((domel) => {
					if (domel.parentElement)
						domel.parentElement.insertBefore(selfnodes[0], domel.nextSibling);
				});
			}
		}
		return this;
	}


	public prepend(nodes: QNodes | string): QNodes {
		if (typeof nodes === "string") {
			return this.prepend(Q(nodes));
		} else {
			if (this.nodes && this.nodes.length == 1 && nodes && nodes.length() > 0) {
				const selfnodes = this.nodes;
				nodes._map((domel) => {
					selfnodes[0].insertBefore(domel, selfnodes[0].firstChild);
				});
			} else
				console.error("QNodes.prepend only works with exactly one node this.nodes.length=" + this.nodes.length + ", nodes.length=" + nodes.length());
		}
		return this;
	}

	public append(childnodes: QNodes | string): QNodes {
		if (typeof childnodes === "string") {
			return this.append(Q(childnodes));
		} else {
			if (childnodes && childnodes.length() > 0) {
				if (this.nodes.length == 1) {
					const selfnodes = this.nodes;
					childnodes._map((domel) => {
						selfnodes[0].appendChild(domel);
					});
				} else {
					this._map((selfnode) => {
						childnodes._map((childnode) => {
							selfnode.appendChild(childnode.cloneNode(true));
						});
					});
				}
			}
		}
		return this;
	}

	public append_OLD(nodes: QNodes | string): QNodes {
		if (typeof nodes === "string") {
			return this.append(Q(nodes));
		} else {
			if (this.nodes && this.nodes.length == 1 && nodes && nodes.length() > 0) {
				const selfnodes = this.nodes;
				nodes._map((domel) => {
					selfnodes[0].appendChild(domel);
				});
			} else
				console.error("QNodes.append only works with exactly one node this.nodes.length=" + this.nodes.length + ", nodes.length=" + nodes.length());
		}
		return this;
	}


	public length(): number {
		return this.nodes ? this.nodes.length : 0;
	}

	public parent(): QNodes {
		if (!this.nodes || this.nodes.length == 0 || !this.nodes[0].parentNode)
			return new QNodes([]);
		if (this.nodes[0].parentElement)
			return new QNodes([this.nodes[0].parentElement]);
		return new QNodes([]);
	}

	public _map(f: (node: Element) => void): QNodes {
		if (!this.nodes || this.nodes.length == 0)
			return this;
		this.nodes.map(f);
		return this;
	}

	public scrollTop(): number;
	public scrollTop(y: number): QNodes;
	public scrollTop(y?: number): QNodes | number {
		if (typeof y === "undefined")
			return (this.nodes && this.nodes.length > 0) ? this.nodes[0].scrollTop : 0;
		else
			return this._map((domel) => {
				domel.scrollTop = y;
			});
	}

	public toggleClass(classname: string): QNodes {
		return this.map(($node) => {
			if ($node.hasClass(classname))
				$node.removeClass(classname);
			else
				$node.addClass(classname);
		});
	}

	public addClass(classname: string): QNodes {
		return this._map((domel) => {
			if (domel.classList)
				domel.classList.add(classname);
			else
				domel.className += ' ' + classname;
		});
	}

	public removeClass(classname: string): QNodes {
		return this._map((domel) => {
			if (domel.classList)
				domel.classList.remove(classname);
			else
				domel.className = domel.className.replace(new RegExp('(^|\\b)' + classname.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
		});
	}

	//** TODO: use for-loop with break */
	public hasClass(classname: string): boolean {
		let result = false;
		this._map((domel) => {
			if (domel.classList)
				if (domel.classList.contains(classname))
					result = true;
				else
					if (new RegExp('(^| )' + classname + '( |$)', 'gi').test(domel.className))
						result = true;
		});
		return result;
	}

	public filter(f: (node: QNodes) => boolean): QNodes {
		const result: Element[] = [];
		this.nodes.map((domel) => {
			if (f(new QNodes([domel])))
				result.push(domel);
		});
		return new QNodes(result);
	}

	public map(f: (node: QNodes) => void): QNodes {
		this.nodes.map((node) => {
			f(new QNodes([node]));
		});
		return this;
	}

	public html(): string;
	public html(h: string): QNodes;
	public html(h?: string): QNodes | string | null {
		if (typeof h === "undefined")
			return this.nodes.length > 0 ? this.nodes[0].innerHTML : null;


		return this._map((node: Element) => {
			// const tmpdomel = document.createElement("div");
			// tmpdomel.innerHTML = h;
			// node.innerHTML=="";
			// for(const child of Array.prototype.slice.call(tmpdomel.children))
			// 	node.appendChild(child);
			node.innerHTML = h;
		});
	}

	public text(): string;
	public text(h: string): QNodes;
	public text(h?: string): QNodes | string | null {
		if (typeof h === "undefined")
			return this.nodes.length > 0 ? this.nodes[0].textContent : null;
		return this._map((node: Element) => {
			node.textContent = h;
		});
	}


	public removeAttr(key: string): QNodes {
		return this._map((node: Element) => {
			node.removeAttribute(key);
		});
	}

	public attr(key: string): string;
	public attr(kv: { [key: string]: string | number | boolean }): QNodes;
	public attr(key: string, value: string | number | boolean): QNodes;
	public attr(a: string | { [key: string]: string | number | boolean }, b?: string | number | boolean): QNodes | string | null {
		if (typeof b === "undefined") {
			if (typeof a === "string") { //getter
				return this.nodes.length > 0 ? this.nodes[0].getAttribute(a) : null;
			} else { // kv-pairs
				return this._map((node: Element) => {
					for (const k in a)
						node.setAttribute(k, (a[k] as string));
				});
			}
		}  // single kv-pair
		return this._map((node: Element) => {
			node.setAttribute(a as string, b as string);
		});
	}



	private static removeUnusedAnimStyleNodes(): void {
		const removed: string[] = [];
		for (const animid of QNodes.allAnimIDs)
			if (Q("[data-x4-animid=" + animid + "]").length() == 0) {
				// console.log("removing anim " + animid);
				Q("#" + animid).detach();
				removed.push(animid);
			}
		QNodes.allAnimIDs = QNodes.allAnimIDs.filter(function (el) {
			return !removed.includes(el);
		});
	}

	public stop(): QNodes {
		this.map(($node) => {
			const tgtcss = $node.attr("data-x4-animtgtcsskv");
			if (tgtcss)
				$node.css(JSON.parse(tgtcss));
			$node.removeAttr("data-x4-animid").removeAttr("data-x4-animtgtcsskv");
			// console.log("STOP anim " + tgtcss);
		});
		QNodes.removeUnusedAnimStyleNodes();
		return this;
	}

	/** still just an alias for css(…)  */
	public animate(kv: { [key: string]: string | number }, duration: number, easing?: string, f_callback?: ($node: QNodes) => void): QNodes {
		this.stop();
		const animid = "x4_anim_" + generateName();
		QNodes.allAnimIDs.push(animid);
		this.attr("data-x4-animtgtcsskv", JSON.stringify(kv));

		// TODO: set easing

		const animcss = `
				<style id="${animid}">
					[data-x4-animid="${animid}"]{
						animation-duration: ${duration}ms;
						animation-name: ${animid};
	 					animation-fill-mode: forwards;
					}
					@keyframes ${animid} {
						100% {
						  ${Object.entries(kv).map<string>(([k, v]) => QNodes.fromCSSCamelcase(k) + ": " + v + ";").join("\n")} 
						}
					  }
				</style>;
			`;
		Q("head").append(animcss);

		// console.log("start anim " + animid + " => " + JSON.stringify(kv));
		this.unbind("animationend").on("animationend", (ev, $node) => {
			$node.stop();
			if (f_callback)
				f_callback($node);
			return true;
		}).attr("data-x4-animid", animid);

		return this;
	}

}

export function Q(query: string | Element): QNodes {
	if (!query)
		return new QNodes([]);
	if (query instanceof Element) {
		return new QNodes([query]);
	}
	// alert(query);
	if (typeof query == "string")
		query = query.trim();
	else if (query["nodes"])
		return query;
	// console.error(query);
	if (query && query.length > 0 && query.substring(0, 1) == "<") {
		const domel = document.createElement("div");
		domel.innerHTML = query;
		return new QNodes(Array.prototype.slice.call(domel.children));//domel.querySelectorAll(":scope>*"));
	} else if (query && query.length == 0)
		return new QNodes([]);
	else
		return new QNodes(document.querySelectorAll((query)));
}



export interface OpenStruct { [key: string]: any };


function generateName(string_length: number = 16): string {
	var chars = "ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
	var randomstring = '';
	for (var i = 0; i < string_length; i++) {
		var rnum = Math.floor(Math.random() * chars.length);
		randomstring += chars.substring(rnum, rnum + 1);
	}
	return randomstring;
};
