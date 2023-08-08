/* --- MDE --- */

let canvas;

function drawUsing(c) {
  mde_drawUsing(c, function() {
		if(currentLink != null) {
			c.lineWidth = 1;
			c.fillStyle = c.strokeStyle = 'black';
			currentLink.draw(c);
		}
	});
}

function seleccionado(x) { return selectedObject == x; }

function prepararParaExportar(f) {
	let oldSelectedObject = selectedObject;
	selectedObject = null;
	f();
	selectedObject = oldSelectedObject;
}

let caretVisible = true;

function draw(save=true) {
	const c = canvas.getContext('2d');
	drawUsing(c);
	c.strokeStyle = '#ccc';
	dibujarRectangulo(fullBounds(c), c);
	if (save) { actualizacion(); }
}

/* --- --- --- */

function mdeSaveBackup(nuevo) {
	saveBackup('fsm', nuevo);
}

var caretTimer;

function resetCaret() {
	clearInterval(caretTimer);
	caretTimer = setInterval('caretVisible = !caretVisible; draw(false)', 500);
	caretVisible = true;
}

var cursorVisible = true;
var selectedObject = null; // either a Link or a Node
var currentLink = null; // a Link
var movingObject = false;
var originalClick;

function selectObject(x, y) {
	for(var i = 0; i < nodes.length; i++) {
		if(nodes[i].containsPoint(x, y)) {
			return nodes[i];
		}
	}
	for(var i = 0; i < links.length; i++) {
		if(links[i].containsPoint(x, y)) {
			return links[i];
		}
	}
	return null;
}

function snapNode(node) {
	for(var i = 0; i < nodes.length; i++) {
		if(nodes[i] == node) continue;

		if(Math.abs(node.x - nodes[i].x) < snapToPadding) {
			node.x = nodes[i].x;
		}

		if(Math.abs(node.y - nodes[i].y) < snapToPadding) {
			node.y = nodes[i].y;
		}
	}
}

window.onload = function() {
	canvas = document.getElementById('canvas');
	mdeRestoreBackup();
	redimensionar();
  mostrarTupla();

	canvas.onmousedown = function(e) {
		var mouse = crossBrowserRelativeMousePos(e);
		selectedObject = selectObject(mouse.x, mouse.y);
		movingObject = false;
		originalClick = mouse;

		if(selectedObject != null) {
			if(shift && selectedObject instanceof Node) {
				currentLink = new SelfLink(selectedObject, mouse);
			} else {
				movingObject = true;
				deltaMouseX = deltaMouseY = 0;
				if(selectedObject.setMouseStart) {
					selectedObject.setMouseStart(mouse.x, mouse.y);
				}
			}
			resetCaret();
		} else {
			clearInterval(caretTimer);
			if(shift) {
				currentLink = new TemporaryLink(mouse, mouse);
			}
		}

		draw();

		if(canvasHasFocus()) {
			// disable drag-and-drop only if the canvas is already focused
			return false;
		} else {
			// otherwise, let the browser switch the focus away from wherever it was
			resetCaret();
			return true;
		}
	};

	canvas.ondblclick = function(e) {
		var mouse = crossBrowserRelativeMousePos(e);
		selectedObject = selectObject(mouse.x, mouse.y);

		if(selectedObject == null) {
			selectedObject = new Node(mouse.x, mouse.y);
			nodes.push(selectedObject);
			resetCaret();
			draw();
		} else if(selectedObject instanceof Node) {
			selectedObject.isAcceptState = !selectedObject.isAcceptState;
			draw();
		}
	};

	canvas.onmousemove = function(e) {
		var mouse = crossBrowserRelativeMousePos(e);

		if(currentLink != null) {
			var targetNode = selectObject(mouse.x, mouse.y);
			if(!(targetNode instanceof Node)) {
				targetNode = null;
			}

			if(selectedObject == null) {
				if(targetNode != null) {
					currentLink = new StartLink(targetNode, originalClick);
				} else {
					currentLink = new TemporaryLink(originalClick, mouse);
				}
			} else {
				if(targetNode == selectedObject) {
					currentLink = new SelfLink(selectedObject, mouse);
				} else if(targetNode != null) {
					currentLink = new Link(selectedObject, targetNode);
				} else {
					currentLink = new TemporaryLink(selectedObject.closestPointOnCircle(mouse.x, mouse.y), mouse);
				}
			}
			draw(false);
		}

		if(movingObject) {
			selectedObject.setAnchorPoint(mouse.x, mouse.y);
			if(selectedObject instanceof Node) {
				snapNode(selectedObject);
			}
			draw(false);
		}
	};

	canvas.onmouseup = function(e) {
		movingObject = false;

		if(currentLink != null) {
			if(!(currentLink instanceof TemporaryLink)) {
				selectedObject = currentLink;
				links.push(currentLink);
				resetCaret();
			}
			currentLink = null;
			draw();
		} else {
			actualizacion();
		}
	};
}

var shift = false;

document.onkeydown = function(e) {
	var key = crossBrowserKey(e);

	if(key == 16) {
		shift = true;
	} else if(!canvasHasFocus()) {
		// don't read keystrokes when other things have focus
		return true;
	} else if(key == 8) { // backspace key
		if(selectedObject != null && 'text' in selectedObject) {
			selectedObject.text = selectedObject.text.substr(0, selectedObject.text.length - 1);
			resetCaret();
			draw();
		}

		// backspace is a shortcut for the back button, but do NOT want to change pages
		return false;
	} else if(key == 46) { // delete key
		if(selectedObject != null) {
			for(var i = 0; i < nodes.length; i++) {
				if(nodes[i] == selectedObject) {
					nodes.splice(i--, 1);
				}
			}
			for(var i = 0; i < links.length; i++) {
				if(links[i] == selectedObject || links[i].node == selectedObject || links[i].nodeA == selectedObject || links[i].nodeB == selectedObject) {
					links.splice(i--, 1);
				}
			}
			selectedObject = null;
			draw();
		}
	}
};

document.onkeyup = function(e) {
	var key = crossBrowserKey(e);

	if(key == 16) {
		shift = false;
	}
};

document.onkeypress = function(e) {
	// don't read keystrokes when other things have focus
	var key = crossBrowserKey(e);
	if (!canvasHasFocus()) {
		// don't read keystrokes when other things have focus
		return true;
	} else if (key >= 0x20 && key <= 0x7E && !e.metaKey && !e.altKey && !e.ctrlKey && selectedObject != null && 'text' in selectedObject) {
		selectedObject.text += String.fromCharCode(key);
		resetCaret();
		draw();

		// don't let keys do their actions (like space scrolls down the page)
		return false;
	} else if (key == 8) {
		// backspace is a shortcut for the back button, but do NOT want to change pages
		return false;
	} else if (e.ctrlKey && key == 26) {
		undo(e.shiftKey);
		return false;
	}
};

const E = {
	actual: nuevoEstado(),
	undoStack: [],
	redoStack: []
};

function undo(re) {
	const from = (re ? E.redoStack : E.undoStack);
	const to = (re ? E.undoStack : E.redoStack);
	if (from.length > 0) {
		nuevo = from[from.length-1];
		from.splice(from.length-1);
		to.push(E.actual);
		E.actual = nuevo;
		restaurar(nuevo);
		draw(false);
		algoCambio(nuevo);
	}
}

function actualizacion() {
	const ultimo = E.actual;
	const nuevo = nuevoEstado();
	if (distintos(ultimo, nuevo)) {
		E.undoStack.push(ultimo);
		E.redoStack = [];
		E.actual = nuevo;
		algoCambio(nuevo);
	}
}

function algoCambio(nuevo) {
	mdeSaveBackup(nuevo);
	mostrarTupla();
}

function distintos(o1, o2) {
	if (typeof o1 != typeof o2) { return true; }
	if (typeof o1 == 'object') {
		let ks1 = Object.keys(o1);
		let ks2 = Object.keys(o2);
		return ks1.length != ks2.length ||
			ks1.some((k)=> !(k in o2)) ||
			ks2.some((k)=> !(k in o1)) ||
			ks1.some((k)=> distintos(o1[k], o2[k]))
	}
	return o1 != o2;
}

function redimensionar() {
	canvas.width = window.innerWidth - 20;
	canvas.height = window.innerHeight - 70;
	draw(false);
}

function btnEjecutar() {
	if (construir(alert)) {
		window.location.replace("./run.html");
	}
}

window.addEventListener('resize', redimensionar, false);