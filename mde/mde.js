// draw using this instead of a canvas and call toSVG() afterward
function ExportAsSVG() {
	this.fillStyle = 'black';
	this.strokeStyle = 'black';
	this.lineWidth = 1;
	this.font = '12px Arial, sans-serif';
	this._points = [];
	this._svgData = '';
	this._transX = 0;
	this._transY = 0;

	this.beginPath = function() {
		this._points = [];
	};
	this.arc = function(x, y, radius, startAngle, endAngle, isReversed) {
		x += this._transX;
		y += this._transY;
		var style = 'stroke="' + this.strokeStyle + '" stroke-width="' + this.lineWidth + '" fill="none"';

		if(endAngle - startAngle == Math.PI * 2) {
			this._svgData += '\t<ellipse ' + style + ' cx="' + fixed(x, 3) + '" cy="' + fixed(y, 3) + '" rx="' + fixed(radius, 3) + '" ry="' + fixed(radius, 3) + '"/>\n';
		} else {
			if(isReversed) {
				var temp = startAngle;
				startAngle = endAngle;
				endAngle = temp;
			}

			if(endAngle < startAngle) {
				endAngle += Math.PI * 2;
			}

			var startX = x + radius * Math.cos(startAngle);
			var startY = y + radius * Math.sin(startAngle);
			var endX = x + radius * Math.cos(endAngle);
			var endY = y + radius * Math.sin(endAngle);
			var useGreaterThan180 = (Math.abs(endAngle - startAngle) > Math.PI);
			var goInPositiveDirection = 1;

			this._svgData += '\t<path ' + style + ' d="';
			this._svgData += 'M ' + fixed(startX, 3) + ',' + fixed(startY, 3) + ' '; // startPoint(startX, startY)
			this._svgData += 'A ' + fixed(radius, 3) + ',' + fixed(radius, 3) + ' '; // radii(radius, radius)
			this._svgData += '0 '; // value of 0 means perfect circle, others mean ellipse
			this._svgData += +useGreaterThan180 + ' ';
			this._svgData += +goInPositiveDirection + ' ';
			this._svgData += fixed(endX, 3) + ',' + fixed(endY, 3); // endPoint(endX, endY)
			this._svgData += '"/>\n';
		}
	};
	this.moveTo = this.lineTo = function(x, y) {
		x += this._transX;
		y += this._transY;
		this._points.push({ 'x': x, 'y': y });
	};
	this.stroke = function() {
		if(this._points.length == 0) return;
		this._svgData += '\t<polygon stroke="' + this.strokeStyle + '" stroke-width="' + this.lineWidth + '" points="';
		for(var i = 0; i < this._points.length; i++) {
			this._svgData += (i > 0 ? ' ' : '') + fixed(this._points[i].x, 3) + ',' + fixed(this._points[i].y, 3);
		}
		this._svgData += '"/>\n';
	};
	this.fill = function() {
		if(this._points.length == 0) return;
		this._svgData += '\t<polygon fill="' + this.fillStyle + '" stroke-width="' + this.lineWidth + '" points="';
		for(var i = 0; i < this._points.length; i++) {
			this._svgData += (i > 0 ? ' ' : '') + fixed(this._points[i].x, 3) + ',' + fixed(this._points[i].y, 3);
		}
		this._svgData += '"/>\n';
	};
	this.measureText = function(text) {
		var c = canvas.getContext('2d');
		c.font = '20px "Times New Romain", serif';
		return c.measureText(text);
	};
	this.fillText = function(text, x, y) {
		x += this._transX;
		y += this._transY;
		if(text.replace(' ', '').length > 0) {
			this._svgData += '\t<text x="' + fixed(x, 3) + '" y="' + fixed(y, 3) + '" font-family="Times New Roman" font-size="20">' + textToXML(text) + '</text>\n';
		}
	};
	this.translate = function(x, y) {
		this._transX = x + this.offsetX;
		this._transY = y + this.offsetY;
	};

	this.save = this.restore = this.clearRect = function(){};

	const bounds = fullBounds(this);
	this.offsetX = -bounds.x;
	this.offsetY = -bounds.y;

	this.toSVG = function() {
		return `<?xml version="1.0" standalone="no"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "https://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n\n<svg width="${bounds.w}" height="${bounds.h}" version="1.1" xmlns="http://www.w3.org/2000/svg">\n` + this._svgData + '</svg>\n';
	};
}

function StartLink(node, start) {
	this.node = node;
	this.deltaX = 0;
	this.deltaY = 0;
	this.text = '';

	if(start) {
		this.setAnchorPoint(start.x, start.y);
	}
}

StartLink.prototype.bounds = function(c) {
	const p = this.getEndPoints();
	let res = {};
	if (p.startX > p.endX) {
		res.x = p.endX;
		res.w = p.startX - p.endX;
	} else {
		res.x = p.startX;
		res.w = p.endX - p.startX;
	}
	if (p.startY > p.endY) {
		res.y = p.endY;
		res.h = p.startY - p.endY;
	} else {
		res.y = p.startY;
		res.h = p.endY - p.startY;
	}
	if (this.text !== '')	{
		const tB = textBounds(c, this.text,
			p.startX, p.startY, Math.atan2(p.startY - p.endY, p.startX - p.endX));
		// dibujarRectangulo(tB, c);
		res = joinBounds(res, tB);
	}
	return res;
};

StartLink.prototype.setAnchorPoint = function(x, y) {
	this.deltaX = x - this.node.x;
	this.deltaY = y - this.node.y;

	if(Math.abs(this.deltaX) < snapToPadding) {
		this.deltaX = 0;
	}

	if(Math.abs(this.deltaY) < snapToPadding) {
		this.deltaY = 0;
	}
};

StartLink.prototype.getEndPoints = function() {
	var startX = this.node.x + this.deltaX;
	var startY = this.node.y + this.deltaY;
	var end = this.node.closestPointOnCircle(startX, startY);
	return {
		'startX': startX,
		'startY': startY,
		'endX': end.x,
		'endY': end.y,
	};
};

StartLink.prototype.draw = function(c) {
	var stuff = this.getEndPoints();

	// draw the line
	c.beginPath();
	c.moveTo(stuff.startX, stuff.startY);
	c.lineTo(stuff.endX, stuff.endY);
	c.stroke();

	// draw the text at the end without the arrow
	var textAngle = Math.atan2(stuff.startY - stuff.endY, stuff.startX - stuff.endX);
	drawText(c, this.text, stuff.startX, stuff.startY, textAngle, seleccionado(this));

	// draw the head of the arrow
	drawArrow(c, stuff.endX, stuff.endY, Math.atan2(-this.deltaY, -this.deltaX));
};

StartLink.prototype.containsPoint = function(x, y) {
	var stuff = this.getEndPoints();
	var dx = stuff.endX - stuff.startX;
	var dy = stuff.endY - stuff.startY;
	var length = Math.sqrt(dx*dx + dy*dy);
	var percent = (dx * (x - stuff.startX) + dy * (y - stuff.startY)) / (length * length);
	var distance = (dx * (y - stuff.startY) - dy * (x - stuff.startX)) / length;
	return (percent > 0 && percent < 1 && Math.abs(distance) < hitTargetPadding);
};

function Link(a, b) {
	this.nodeA = a;
	this.nodeB = b;
	this.text = '';
	this.lineAngleAdjust = 0; // value to add to textAngle when link is straight line

	// make anchor point relative to the locations of nodeA and nodeB
	this.parallelPart = 0.5; // percentage from nodeA to nodeB
	this.perpendicularPart = 0; // pixels from line between nodeA and nodeB
}

Link.prototype.bounds = function(c) {
	const p = this.getEndPointsAndCircle();
	let res = {};
	if (p.hasCircle) {
		const P = Math.PI; const P2 = P/2;
		res = circleBounds(p.circleX, p.circleY, p.circleRadius);
		let aOut = p.startAngle;
		if (aOut < -P) { aOut = P + (aOut + P);  }
		let aIn = p.endAngle;
		if (aIn > P) { aIn = (aIn - P) - P;  }
		let limitX = res.x + res.w
		let minX = Math.min(p.startX, p.endX);
		let maxX = Math.max(p.startX, p.endX);
		if (
			(p.isReversed && (
				(aOut > 0 && aIn > 0 && p.startX < p.endX) ||
				(aOut < 0 && aIn < 0 && p.endX < p.startX) ||
				(aOut > 0 && aIn < 0 && minX > res.x)
			))
			||
			(!p.isReversed && (
				(aOut > 0 && aIn > 0 && p.startX > p.endX) ||
				(aOut < 0 && aIn < 0 && p.endX > p.startX) ||
				(aOut < 0 && aIn > 0 && minX > res.x)
			))
		) {
			res.x = minX;
			res.w = limitX - res.x;
		}
		if (
			(p.isReversed && (
				(aOut > 0 && aIn > 0 && p.startX < p.endX) ||
				(aOut < 0 && aIn < 0 && p.endX < p.startX) ||
				(aOut < 0 && aIn > 0 && maxX < res.x+res.w)
			))
			||
			(!p.isReversed && (
				(aOut > 0 && aIn > 0 && p.startX > p.endX) ||
				(aOut < 0 && aIn < 0 && p.endX > p.startX) ||
				(aOut > 0 && aIn < 0 && maxX < res.x+res.w)
			))
		) {
			limitX = maxX;
			res.w = limitX - res.x;
		}
		aOut = Math.abs(aOut);
		aIn = Math.abs(aIn);
		let limitY = res.y + res.h
		let minY = Math.min(p.startY, p.endY);
		let maxY = Math.max(p.startY, p.endY);
		if (
			(p.isReversed && (
				(aOut > P2 && aIn > P2 && p.startY < p.endY) ||
				(aOut < P2 && aIn < P2 && p.endY < p.startY) ||
				(aOut > P2 && aIn < P2 && minY > res.y)
			))
			||
			(!p.isReversed && (
				(aOut > P2 && aIn > P2 && p.startY > p.endY) ||
				(aOut < P2 && aIn < P2 && p.endY > p.startY) ||
				(aOut < P2 && aIn > P2 && minY > res.y)
			))
		) {
			res.y = minY;
			res.h = limitY - res.y;
		}
		if (
			(p.isReversed && (
				(aOut > P2 && aIn > P2 && p.startY < p.endY) ||
				(aOut < P2 && aIn < P2 && p.endY < p.startY) ||
				(aOut < P2 && aIn > P2 && maxY < res.y+res.h)
			))
			||
			(!p.isReversed && (
				(aOut > P2 && aIn > P2 && p.startY > p.endY) ||
				(aOut < P2 && aIn < P2 && p.endY > p.startY) ||
				(aOut > P2 && aIn < P2 && maxY < res.y+res.h)
			))
		) {
			limitY = maxY;
			res.h = limitY - res.y;
		}
	} else {
		if (p.startX > p.endX) {
			res.x = p.endX;
			res.w = p.startX - p.endX;
		} else {
			res.x = p.startX;
			res.w = p.endX - p.startX;
		}
		if (p.startY > p.endY) {
			res.y = p.endY;
			res.h = p.startY - p.endY;
		} else {
			res.y = p.startY;
			res.h = p.endY - p.startY;
		}
	}
	if (this.text !== '')	{
		if (p.hasCircle) {
			var startAngle = p.startAngle;
			var endAngle = p.endAngle;
			if(endAngle < startAngle) {
				endAngle += Math.PI * 2;
			}
			const a = (startAngle + endAngle) / 2 + p.isReversed * Math.PI;
			var tX = p.circleX + p.circleRadius * Math.cos(a);
			var tY = p.circleY + p.circleRadius * Math.sin(a);
			const tB = textBounds(c, this.text, tX, tY, a);
			// dibujarRectangulo(tB, c);
			res = joinBounds(res, tB);
		} else {
			res = joinBounds(res, textBounds(c, this.text,
				(p.startX + p.endX) / 2, (p.startY + p.endY) / 2,
				Math.atan2(p.endX - p.startX, p.startY - p.endY) + this.lineAngleAdjust));
		}
	}
	return res;
}

Link.prototype.getAnchorPoint = function() {
	var dx = this.nodeB.x - this.nodeA.x;
	var dy = this.nodeB.y - this.nodeA.y;
	var scale = Math.sqrt(dx * dx + dy * dy);
	return {
		'x': this.nodeA.x + dx * this.parallelPart - dy * this.perpendicularPart / scale,
		'y': this.nodeA.y + dy * this.parallelPart + dx * this.perpendicularPart / scale
	};
};

Link.prototype.setAnchorPoint = function(x, y) {
	var dx = this.nodeB.x - this.nodeA.x;
	var dy = this.nodeB.y - this.nodeA.y;
	var scale = Math.sqrt(dx * dx + dy * dy);
	this.parallelPart = (dx * (x - this.nodeA.x) + dy * (y - this.nodeA.y)) / (scale * scale);
	this.perpendicularPart = (dx * (y - this.nodeA.y) - dy * (x - this.nodeA.x)) / scale;
	// snap to a straight line
	if(this.parallelPart > 0 && this.parallelPart < 1 && Math.abs(this.perpendicularPart) < snapToPadding) {
		this.lineAngleAdjust = (this.perpendicularPart < 0) * Math.PI;
		this.perpendicularPart = 0;
	}
};

Link.prototype.getEndPointsAndCircle = function() {
	if(this.perpendicularPart == 0) {
		var midX = (this.nodeA.x + this.nodeB.x) / 2;
		var midY = (this.nodeA.y + this.nodeB.y) / 2;
		var start = this.nodeA.closestPointOnCircle(midX, midY);
		var end = this.nodeB.closestPointOnCircle(midX, midY);
		return {
			'hasCircle': false,
			'startX': start.x,
			'startY': start.y,
			'endX': end.x,
			'endY': end.y,
		};
	}
	var anchor = this.getAnchorPoint();
	var circle = circleFromThreePoints(this.nodeA.x, this.nodeA.y, this.nodeB.x, this.nodeB.y, anchor.x, anchor.y);
	var isReversed = (this.perpendicularPart > 0);
	var reverseScale = isReversed ? 1 : -1;
	var startAngle = Math.atan2(this.nodeA.y - circle.y, this.nodeA.x - circle.x) - reverseScale * nodeRadius / circle.radius;
	var endAngle = Math.atan2(this.nodeB.y - circle.y, this.nodeB.x - circle.x) + reverseScale * nodeRadius / circle.radius;
	var startX = circle.x + circle.radius * Math.cos(startAngle);
	var startY = circle.y + circle.radius * Math.sin(startAngle);
	var endX = circle.x + circle.radius * Math.cos(endAngle);
	var endY = circle.y + circle.radius * Math.sin(endAngle);
	return {
		'hasCircle': true,
		'startX': startX,
		'startY': startY,
		'endX': endX,
		'endY': endY,
		'startAngle': startAngle,
		'endAngle': endAngle,
		'circleX': circle.x,
		'circleY': circle.y,
		'circleRadius': circle.radius,
		'reverseScale': reverseScale,
		'isReversed': isReversed,
	};
};

Link.prototype.draw = function(c) {
	var stuff = this.getEndPointsAndCircle();
	// draw arc
	c.beginPath();
	if(stuff.hasCircle) {
		c.arc(stuff.circleX, stuff.circleY, stuff.circleRadius, stuff.startAngle, stuff.endAngle, stuff.isReversed);
	} else {
		c.moveTo(stuff.startX, stuff.startY);
		c.lineTo(stuff.endX, stuff.endY);
	}
	c.stroke();
	// draw the head of the arrow
	if(stuff.hasCircle) {
		drawArrow(c, stuff.endX, stuff.endY, stuff.endAngle - stuff.reverseScale * (Math.PI / 2));
	} else {
		drawArrow(c, stuff.endX, stuff.endY, Math.atan2(stuff.endY - stuff.startY, stuff.endX - stuff.startX));
	}
	// draw the text
	if(stuff.hasCircle) {
		var startAngle = stuff.startAngle;
		var endAngle = stuff.endAngle;
		if(endAngle < startAngle) {
			endAngle += Math.PI * 2;
		}
		var textAngle = (startAngle + endAngle) / 2 + stuff.isReversed * Math.PI;
		var textX = stuff.circleX + stuff.circleRadius * Math.cos(textAngle);
		var textY = stuff.circleY + stuff.circleRadius * Math.sin(textAngle);
		drawText(c, this.text, textX, textY, textAngle, seleccionado(this));
	} else {
		var textX = (stuff.startX + stuff.endX) / 2;
		var textY = (stuff.startY + stuff.endY) / 2;
		var textAngle = Math.atan2(stuff.endX - stuff.startX, stuff.startY - stuff.endY);
		drawText(c, this.text, textX, textY, textAngle + this.lineAngleAdjust, seleccionado(this));
	}
};

Link.prototype.containsPoint = function(x, y) {
	var stuff = this.getEndPointsAndCircle();
	if(stuff.hasCircle) {
		var dx = x - stuff.circleX;
		var dy = y - stuff.circleY;
		var distance = Math.sqrt(dx*dx + dy*dy) - stuff.circleRadius;
		if(Math.abs(distance) < hitTargetPadding) {
			var angle = Math.atan2(dy, dx);
			var startAngle = stuff.startAngle;
			var endAngle = stuff.endAngle;
			if(stuff.isReversed) {
				var temp = startAngle;
				startAngle = endAngle;
				endAngle = temp;
			}
			if(endAngle < startAngle) {
				endAngle += Math.PI * 2;
			}
			if(angle < startAngle) {
				angle += Math.PI * 2;
			} else if(angle > endAngle) {
				angle -= Math.PI * 2;
			}
			return (angle > startAngle && angle < endAngle);
		}
	} else {
		var dx = stuff.endX - stuff.startX;
		var dy = stuff.endY - stuff.startY;
		var length = Math.sqrt(dx*dx + dy*dy);
		var percent = (dx * (x - stuff.startX) + dy * (y - stuff.startY)) / (length * length);
		var distance = (dx * (y - stuff.startY) - dy * (x - stuff.startX)) / length;
		return (percent > 0 && percent < 1 && Math.abs(distance) < hitTargetPadding);
	}
	return false;
};

function Node(x, y) {
	this.x = x;
	this.y = y;
	this.mouseOffsetX = 0;
	this.mouseOffsetY = 0;
	this.isAcceptState = false;
	this.text = '';
}

Node.prototype.bounds = function(c) {
	let d = 2*nodeRadius;
	let x = this.x;
	let w = c.measureText(this.text).width;
	if (w > d) {
		x -= Math.ceil(w/2);
	} else {
		x -= nodeRadius;
		w = d;
	}
	return {x, y:this.y-nodeRadius, w, h:d};
};

Node.prototype.setMouseStart = function(x, y) {
	this.mouseOffsetX = this.x - x;
	this.mouseOffsetY = this.y - y;
};

Node.prototype.setAnchorPoint = function(x, y) {
	this.x = x + this.mouseOffsetX;
	this.y = y + this.mouseOffsetY;
};

Node.prototype.draw = function(c) {
	// draw the circle
	c.beginPath();
	c.arc(this.x, this.y, nodeRadius, 0, 2 * Math.PI, false);
	c.stroke();

	// draw the text
	drawText(c, this.text, this.x, this.y, null, seleccionado(this));

	// draw a double circle for an accept state
	if(this.isAcceptState) {
		c.beginPath();
		c.arc(this.x, this.y, nodeRadius - 6, 0, 2 * Math.PI, false);
		c.stroke();
	}
};

Node.prototype.closestPointOnCircle = function(x, y) {
	var dx = x - this.x;
	var dy = y - this.y;
	var scale = Math.sqrt(dx * dx + dy * dy);
	return {
		'x': this.x + dx * nodeRadius / scale,
		'y': this.y + dy * nodeRadius / scale,
	};
};

Node.prototype.containsPoint = function(x, y) {
	return (x - this.x)*(x - this.x) + (y - this.y)*(y - this.y) < nodeRadius*nodeRadius;
};

function SelfLink(node, mouse) {
	this.node = node;
	this.anchorAngle = 0;
	this.mouseOffsetAngle = 0;
	this.text = '';

	if(mouse) {
		this.setAnchorPoint(mouse.x, mouse.y);
	}
}

SelfLink.prototype.bounds = function(c) {
	let p = this.getEndPointsAndCircle();
	let d = p.circleRadius*2;
	let x = p.circleX - p.circleRadius;
	let y = p.circleY - p.circleRadius;
	let w = d;
	let h = d;
	let res = {x,y,w,h};
	if (this.text !== '')	{
		const tB = textBounds(c, this.text,
			p.circleX + p.circleRadius * Math.cos(this.anchorAngle),
			p.circleY + p.circleRadius * Math.sin(this.anchorAngle),
			this.anchorAngle);
		// dibujarRectangulo(tB, c);
		res = joinBounds(res, tB);
	}
	return res;
}

SelfLink.prototype.setMouseStart = function(x, y) {
	this.mouseOffsetAngle = this.anchorAngle - Math.atan2(y - this.node.y, x - this.node.x);
};

SelfLink.prototype.setAnchorPoint = function(x, y) {
	this.anchorAngle = Math.atan2(y - this.node.y, x - this.node.x) + this.mouseOffsetAngle;
	// snap to 90 degrees
	var snap = Math.round(this.anchorAngle / (Math.PI / 2)) * (Math.PI / 2);
	if(Math.abs(this.anchorAngle - snap) < 0.1) this.anchorAngle = snap;
	// keep in the range -pi to pi so our containsPoint() function always works
	if(this.anchorAngle < -Math.PI) this.anchorAngle += 2 * Math.PI;
	if(this.anchorAngle > Math.PI) this.anchorAngle -= 2 * Math.PI;
};

SelfLink.prototype.getEndPointsAndCircle = function() {
	var circleX = this.node.x + 1.5 * nodeRadius * Math.cos(this.anchorAngle);
	var circleY = this.node.y + 1.5 * nodeRadius * Math.sin(this.anchorAngle);
	var circleRadius = 0.75 * nodeRadius;
	var startAngle = this.anchorAngle - Math.PI * 0.8;
	var endAngle = this.anchorAngle + Math.PI * 0.8;
	var startX = circleX + circleRadius * Math.cos(startAngle);
	var startY = circleY + circleRadius * Math.sin(startAngle);
	var endX = circleX + circleRadius * Math.cos(endAngle);
	var endY = circleY + circleRadius * Math.sin(endAngle);
	return {
		'hasCircle': true,
		'startX': startX,
		'startY': startY,
		'endX': endX,
		'endY': endY,
		'startAngle': startAngle,
		'endAngle': endAngle,
		'circleX': circleX,
		'circleY': circleY,
		'circleRadius': circleRadius
	};
};

SelfLink.prototype.draw = function(c) {
	var stuff = this.getEndPointsAndCircle();
	// draw arc
	c.beginPath();
	c.arc(stuff.circleX, stuff.circleY, stuff.circleRadius, stuff.startAngle, stuff.endAngle, false);
	c.stroke();
	// draw the text on the loop farthest from the node
	var textX = stuff.circleX + stuff.circleRadius * Math.cos(this.anchorAngle);
	var textY = stuff.circleY + stuff.circleRadius * Math.sin(this.anchorAngle);
	drawText(c, this.text, textX, textY, this.anchorAngle, seleccionado(this));
	// draw the head of the arrow
	drawArrow(c, stuff.endX, stuff.endY, stuff.endAngle + Math.PI * 0.4);
};

SelfLink.prototype.containsPoint = function(x, y) {
	var stuff = this.getEndPointsAndCircle();
	var dx = x - stuff.circleX;
	var dy = y - stuff.circleY;
	var distance = Math.sqrt(dx*dx + dy*dy) - stuff.circleRadius;
	return (Math.abs(distance) < hitTargetPadding);
};

function TemporaryLink(from, to) {
	this.from = from;
	this.to = to;
}

TemporaryLink.prototype.draw = function(c) {
	// draw the line
	c.beginPath();
	c.moveTo(this.to.x, this.to.y);
	c.lineTo(this.from.x, this.from.y);
	c.stroke();

	// draw the head of the arrow
	drawArrow(c, this.to.x, this.to.y, Math.atan2(this.to.y - this.from.y, this.to.x - this.from.x));
};

function mdeRestoreBackup(optKey, optFun) {
	const todo = [{k:'fsm',f:restaurar}];
	if (optKey && optFun) {
		todo.push({k:optKey, f:optFun});
	}

	restoreBackup(todo);
}

function det(a, b, c, d, e, f, g, h, i) {
	return a*e*i + b*f*g + c*d*h - a*f*h - b*d*i - c*e*g;
}

function circleFromThreePoints(x1, y1, x2, y2, x3, y3) {
	var a = det(x1, y1, 1, x2, y2, 1, x3, y3, 1);
	var bx = -det(x1*x1 + y1*y1, y1, 1, x2*x2 + y2*y2, y2, 1, x3*x3 + y3*y3, y3, 1);
	var by = det(x1*x1 + y1*y1, x1, 1, x2*x2 + y2*y2, x2, 1, x3*x3 + y3*y3, x3, 1);
	var c = -det(x1*x1 + y1*y1, x1, y1, x2*x2 + y2*y2, x2, y2, x3*x3 + y3*y3, x3, y3);
	return {
		'x': -bx / (2*a),
		'y': -by / (2*a),
		'radius': Math.sqrt(bx*bx + by*by - 4*a*c) / (2*Math.abs(a))
	};
}

function fixed(number, digits) {
	return number.toFixed(digits).replace(/0+$/, '').replace(/\.$/, '');
}

function textToXML(text) {
	text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	var result = '';
	for(var i = 0; i < text.length; i++) {
		var c = text.charCodeAt(i);
		if(c >= 0x20 && c <= 0x7E) {
			result += text[i];
		} else {
			result += '&#' + c + ';';
		}
	}
	return result;
}

function drawArrow(c, x, y, angle) {
	var dx = Math.cos(angle);
	var dy = Math.sin(angle);
	c.beginPath();
	c.moveTo(x, y);
	c.lineTo(x - 8 * dx + 5 * dy, y - 8 * dy - 5 * dx);
	c.lineTo(x - 8 * dx - 5 * dy, y - 8 * dy + 5 * dx);
	c.fill();
}

function canvasHasFocus() {
	return (document.activeElement || document.body) == document.body;
}

function coordenadasParaTexto(x, y, w, a) {
	// center the text
	x -= w / 2;
	// position the text intelligently if given an angle
	if(a != null) {
		var cos = Math.cos(a);
		var sin = Math.sin(a);
		var cornerPointX = (w / 2 + 5) * (cos > 0 ? 1 : -1);
		var cornerPointY = (10 + 5) * (sin > 0 ? 1 : -1);
		var slide = sin * Math.pow(Math.abs(sin), 40) * cornerPointX - cos * Math.pow(Math.abs(cos), 10) * cornerPointY;
		x += cornerPointX - sin * slide;
		y += cornerPointY + cos * slide;
	}
	return {x,y};
}

function drawText(c, originalText, x, y, angleOrNull, isSelected) {
	text = convertLatexShortcuts(originalText);
	c.font = '20px "Times New Roman", serif';
	var width = c.measureText(text).width;

	const cxy = coordenadasParaTexto(x, y, width, angleOrNull);
	x = cxy.x;
	y = cxy.y;

	// draw text and caret (round the coordinates so the caret falls on a pixel)
	if('advancedFillText' in c) {
		c.advancedFillText(text, originalText, x + width / 2, y, angleOrNull);
	} else {
		x = Math.round(x);
		y = Math.round(y);
		c.fillText(text, x, y + 6);
		if(isSelected && caretVisible && canvasHasFocus() && document.hasFocus()) {
			x += width;
			c.beginPath();
			c.moveTo(x, y - 10);
			c.lineTo(x, y + 10);
			c.stroke();
		}
	}
}

let snapToPadding = 6; // pixels
let hitTargetPadding = 6; // pixels
let nodeRadius = 30;
let margen = 10;
let nodes = [];
let links = [];

function mde_drawUsing(c, f) {
	c.clearRect(0, 0, canvas.width, canvas.height);
	c.save();
	c.translate(0.5, 0.5);

	for(var i = 0; i < nodes.length; i++) {
		c.lineWidth = 1;
		c.fillStyle = c.strokeStyle = seleccionado(nodes[i]) ? 'blue' : 'black';
		nodes[i].draw(c);
	}
	for(var i = 0; i < links.length; i++) {
		c.lineWidth = 1;
		c.fillStyle = c.strokeStyle = seleccionado(links[i]) ? 'blue' : 'black';
		links[i].draw(c);
	}
	if(f) {
		f();
	}

	c.restore();
}

function joinBounds(r1,r2) {
	let x = Math.min(r1.x,r2.x);
	let y = Math.min(r1.y,r2.y);
	let limitX = Math.max(r1.x+r1.w,r2.x+r2.w);
	let limitY = Math.max(r1.y+r1.h,r2.y+r2.h);
	return {x,y,w:limitX-x,h:limitY-y};
}

function textBounds(c, t, x, y, a) {
	c.font = '20px "Times New Roman", serif';
	const m = c.measureText(convertLatexShortcuts(t));
	let w = m.width;
	let h = 12 + m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
	const cxy = coordenadasParaTexto(x, y, w, a);
	return {x:cxy.x,y:cxy.y - m.actualBoundingBoxAscent,w,h};
}

function circleBounds(x, y, r) {
	return {x:x-r, y:y-r, w:2*r, h:2*r};
}

function fullBounds(c) {
	const elementos = nodes.concat(links);
	if (elementos.length == 0) {
		return {x:0,y:0,w:canvas.width,h:canvas.height};
	}
	let rect = elementos.map((x)=>x.bounds(c)).reduce(joinBounds);
	rect.x -= margen;
	rect.y -= margen;
	rect.w += 2*margen;
	rect.h += 2*margen;
	return rect;
}

function btnAyuda() {
	let divPrincipal = document.getElementById('main');
	let divAyuda = document.getElementById('help');
	if (divAyuda.hidden) {
		divAyuda.hidden = false;
		divPrincipal.hidden = true;
	} else {
		divAyuda.hidden = true;
		divPrincipal.hidden = false;
	}
}

function btnNuevo() {
	nodes = [];
	links = [];
	draw();
}

function btnAbrir() {
	abrirArchivo(function(json) {
		const mde = json.mde;
		restaurar(mde);
		draw();
	}, console.log);
}

function nodosSinNombre() {
	return nodes.filter(function(n) {
		return n.text === '';
	});
}

function nombresRepetidos() {
	const vistos = [];
	const repetidos = [];
	for (let n of nodes) {
		if (vistos.includes(n.text) && !(repetidos.includes(n.text))) {
			repetidos.push(n.text);
		}
		vistos.push(n.text);
	}
	return repetidos;
}

function nodosFinales() {
	return nodes.filter(function(n) {
		return n.isAcceptState;
	});
}

function flechasIniciales() {
	return links.filter(function(f) {
		return f instanceof StartLink;
	});
}

function flechasSinNombre() {
	return links.filter(function(f) {
		return !(f instanceof StartLink) && f.text === '';
	});
}

function transiciones() {
	return links.filter(function(f) {
		return !(f instanceof StartLink);
	});
}
function nuevoEstado() {
	var backup = {
		'nodes': [],
		'links': [],
	};
	for(var i = 0; i < nodes.length; i++) {
		var node = nodes[i];
		var backupNode = {
			'x': node.x,
			'y': node.y,
			'text': node.text,
			'isAcceptState': node.isAcceptState,
		};
		backup.nodes.push(backupNode);
	}
	for(var i = 0; i < links.length; i++) {
		var link = links[i];
		var backupLink = null;
		if(link instanceof SelfLink) {
			backupLink = {
				'type': 'SelfLink',
				'node': nodes.indexOf(link.node),
				'text': link.text,
				'anchorAngle': link.anchorAngle,
			};
		} else if(link instanceof StartLink) {
			backupLink = {
				'type': 'StartLink',
				'node': nodes.indexOf(link.node),
				'text': link.text,
				'deltaX': link.deltaX,
				'deltaY': link.deltaY,
			};
		} else if(link instanceof Link) {
			backupLink = {
				'type': 'Link',
				'nodeA': nodes.indexOf(link.nodeA),
				'nodeB': nodes.indexOf(link.nodeB),
				'text': link.text,
				'lineAngleAdjust': link.lineAngleAdjust,
				'parallelPart': link.parallelPart,
				'perpendicularPart': link.perpendicularPart,
			};
		}
		if(backupLink != null) {
			backup.links.push(backupLink);
		}
	}
	return backup;
}

function mostrarTupla() {
	const data = construir(setTupla);
	if (data) {
		let clase = {[AR]:"AF",[AP]:"AP"}[dataGuardada.clase];
		if (!dataGuardada.det) {
			clase += "N";
		}
		clase += "D";
		let tupla = `Q : { ${
			data.Q.join(', ')
		} }, \\Sigma : { ${
			data.A.join(', ')
		} }, \\delta : <a href="javascript:delta()">\\delta</a>, q_0 : ${
			data.q0
		}, F : { ${
			data.F.join(', ')
		} }`;
		setTupla(`${clase} &lt ${tupla} &gt`);
	}
}

function btnGuardar() {
	descargarArchivo('data:text/plain;charset=utf-8,' +
		encodeURIComponent(JSON.stringify({mde:nuevoEstado()})), 'mde.mde');
}

let dataGuardada = {};
function construir(fallar=(x)=>{}) {
	let err;
	err = nodosSinNombre();
	if (err.length > 0) {
		fallar("Hay nodos sin etiqueta");
		return;
	}
	err = nombresRepetidos();
	if (err.length > 0) {
		fallar("Las siguientes etiquetas de nodos están repetidas:\n" +
			err.join('\n')
		);
		return;
	}
	let fI = flechasIniciales();
	if (fI.length == 0) {
		fallar("Falta la flecha inicial");
		return;
	} else if (fI.length > 1) {
		fallar("Sólo puede haber una flecha inicial");
		return;
	}
	err = flechasSinNombre();
	if (err.length > 0) {
		fallar("Las siguientes transiciones no tienen etiqueta:\n" +
		  err.map(function(f) {
				if (f instanceof Link) {
					return f.nodeA.text + " --> " + f.nodeB.text;
				} else if (f instanceof SelfLink) {
					return f.node.text + " --> " + f.node.text;
				} else {
					return '?';
				}
			}).join('\n')
		);
		return;
	}
	const d = transiciones();
	const clase = claseAutomata(d, fallar);
	if (clase === null) { return; }
	const data = {
		Q:nodes.map((x)=>x.text),
		A:[],
		d:{},
		q0:fI[0].node.text,
		F:nodosFinales().map((x)=>x.text)
	};
	let det = true;
	for (let t of d) {
		let s = simboloTransicion(t.text, clase);
		if (s == '\\lambda') {
			det = false;
		} else if (!data.A.includes(s)) {
			data.A.push(s);
		}
		let n1 = nodoSrc(t).text;
		let n2 = nodoDst(t).text;
		if (n1 in data.d) {
			if (s in data.d[n1]) {
				if (!data.d[n1][s].includes(n2)) {
					data.d[n1][s].push(n2);
					det = false;
				}
			} else {
				data.d[n1][s] = [n2];
			}
		} else {
			data.d[n1] = {[s]:[n2]};
		}
	}
	dataGuardada = {clase, data, det};
	return data;
}

function delta() {
	let d = "\delta:"
	let deltaGuardada = dataGuardada.data.d;
	let f = dataGuardada.det
	? (x) => x[0]
	: (x) => `{ ${x.join(', ')} }`;
	for (let q in deltaGuardada) {
		for (let s in deltaGuardada[q]) {
			d += `\n ${q}   x   ${s}   :   ${f(deltaGuardada[q][s])}`;
		}
	}
	alert(convertLatexShortcuts(d));
}

const AR = 0;
const AP = 1;
function claseAutomata(d, fallar) {
	return AR;
}

function simboloTransicion(t, c) {
	return (c == AR
		? t
		: t.split(',')[0]
	).trim();
}

function nodoSrc(t) {
	return (t instanceof Link
	? t.nodeA
	: t.node);
}

function nodoDst(t) {
	return (t instanceof Link
	? t.nodeB
	: t.node);
}

function setTupla(tupla) {
	document.getElementById("tupla").innerHTML = convertLatexShortcuts(tupla);
}

function restaurar(backup) {
	nodes = [];
	links = [];
	for(var i = 0; i < backup.nodes.length; i++) {
		var backupNode = backup.nodes[i];
		var node = new Node(backupNode.x, backupNode.y);
		node.isAcceptState = backupNode.isAcceptState;
		node.text = backupNode.text;
		nodes.push(node);
	}
	for(var i = 0; i < backup.links.length; i++) {
		var backupLink = backup.links[i];
		var link = null;
		if(backupLink.type == 'SelfLink') {
			link = new SelfLink(nodes[backupLink.node]);
			link.anchorAngle = backupLink.anchorAngle;
			link.text = backupLink.text;
		} else if(backupLink.type == 'StartLink') {
			link = new StartLink(nodes[backupLink.node]);
			link.deltaX = backupLink.deltaX;
			link.deltaY = backupLink.deltaY;
			link.text = backupLink.text;
		} else if(backupLink.type == 'Link') {
			link = new Link(nodes[backupLink.nodeA], nodes[backupLink.nodeB]);
			link.parallelPart = backupLink.parallelPart;
			link.perpendicularPart = backupLink.perpendicularPart;
			link.text = backupLink.text;
			link.lineAngleAdjust = backupLink.lineAngleAdjust;
		}
		if(link != null) {
			links.push(link);
		}
	}
}

function dibujarRectangulo(r,c) {
	if (c === undefined) { c = canvas.getContext('2d'); }
	dibujarLinea(r.x,r.y,r.x+r.w,r.y,c);
	dibujarLinea(r.x+r.w,r.y,r.x+r.w,r.y+r.h,c);
	dibujarLinea(r.x+r.w,r.y+r.h,r.x,r.y+r.h,c);
	dibujarLinea(r.x,r.y+r.h,r.x,r.y,c);
}

function dibujarLinea(x0,y0,x1,y1,c) {
	c.beginPath();
	c.moveTo(x0, y0);
	c.lineTo(x1, y1);
	c.stroke();
}

function btnExportar() {
	let exporter = new ExportAsSVG();
	prepararParaExportar(function() {
		drawUsing(exporter);
	});
	let svgData = exporter.toSVG();
	descargarArchivo('data:image/svg+xml;base64,' + btoa(svgData), 'mde.svg');
}

function crossBrowserRelativeMousePos(e) {
	var element = crossBrowserElementPos(e);
	var mouse = crossBrowserMousePos(e);
	return {
		'x': mouse.x - element.x,
		'y': mouse.y - element.y
	};
}

function crossBrowserElementPos(e) {
	e = e || window.event;
	var obj = e.target || e.srcElement;
	var x = 0, y = 0;
	while(obj.offsetParent) {
		x += obj.offsetLeft;
		y += obj.offsetTop;
		obj = obj.offsetParent;
	}
	return { 'x': x, 'y': y };
}

function crossBrowserKey(e) {
	e = e || window.event;
	return e.which || e.keyCode;
}

function crossBrowserMousePos(e) {
	e = e || window.event;
	return {
		'x': e.pageX || e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft,
		'y': e.pageY || e.clientY + document.body.scrollTop + document.documentElement.scrollTop,
	};
}

/*
 * base64.js - Base64 encoding and decoding functions
 *
 * See: https://developer.mozilla.org/en-US/docs/Web/API/btoa
 *      https://developer.mozilla.org/en-US/docs/Web/API/atob
 *
 * Copyright (c) 2007, David Lindquist <david.lindquist@gmail.com>
 * Released under the MIT license
 */

if (typeof btoa == 'undefined') {
	function btoa(str) {
			var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
			var encoded = [];
			var c = 0;
			while (c < str.length) {
					var b0 = str.charCodeAt(c++);
					var b1 = str.charCodeAt(c++);
					var b2 = str.charCodeAt(c++);
					var buf = (b0 << 16) + ((b1 || 0) << 8) + (b2 || 0);
					var i0 = (buf & (63 << 18)) >> 18;
					var i1 = (buf & (63 << 12)) >> 12;
					var i2 = isNaN(b1) ? 64 : (buf & (63 << 6)) >> 6;
					var i3 = isNaN(b2) ? 64 : (buf & 63);
					encoded[encoded.length] = chars.charAt(i0);
					encoded[encoded.length] = chars.charAt(i1);
					encoded[encoded.length] = chars.charAt(i2);
					encoded[encoded.length] = chars.charAt(i3);
			}
			return encoded.join('');
	}
}