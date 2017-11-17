var CatmullRomSpline = function(canvasId)
{
	// Set up all the data related to drawing the curve
	this.cId = canvasId;
	this.dCanvas = document.getElementById(this.cId);
	this.ctx = this.dCanvas.getContext('2d');
	this.dCanvas.addEventListener('resize', this.computeCanvasSize());
	this.computeCanvasSize();

	// Setup all the data related to the actual curve.
	this.nodes = new Array();
	// this.nodes.push(new Node(0, 153))
	this.tangents = new Array();
	this.tangents.push(new Node(0, 0))
	this.showControlPolygon = true;
	this.showTangents = true;

	// Assumes a equal parametric split strategy
	// In case of using Bezier De Casteljau code, add appropriate variables.
	this.numSegments = 16;

	// Global tension parameter
	this.tension = 0.5;

	// Setup event listeners
	this.cvState = CVSTATE.Idle;
	this.activeNode = null;
	this.activeTangent = null;
	this.timeline = 0;

	// closure
	var that = this;

	//setup active node
	this.activeID = -1;

	// Event listeners
	this.dCanvas.addEventListener('mousedown', function(event) {
        that.mousePress(event);
    });

	document.addEventListener('mousemove', function(event) {
		that.mouseMove(event);
	});

	document.addEventListener('mouseup', function(event) {
		that.mouseRelease(event);
	});

	document.addEventListener('mouseleave', function(event) {
		that.mouseRelease(event);
	});
}

CatmullRomSpline.prototype.setShowControlPolygon = function(bShow)
{
	this.showControlPolygon = bShow;
}

CatmullRomSpline.prototype.setShowTangents = function(bShow)
{
	this.showTangents = bShow;
}

CatmullRomSpline.prototype.setTension = function(val)
{
	this.tension = val;
}

CatmullRomSpline.prototype.setNumSegments = function(val)
{
	this.numSegments = val;
}

CatmullRomSpline.prototype.mousePress = function(event) {
	if (event.button == 0) {
		this.activeNode = null;
		var pos = getMousePos(event);

		// Try to find a tangent below the mouse
		for (var i = 0; i < this.nodes.length; i++) {
			if (this.nodes[i].isInside(pos.x,pos.y)) {
				this.activeNode = this.nodes[i];
				this.activeID = i;
				//this.ctx.clearRect(0, 0, this.dCanvas.width, this.dCanvas.height);
				this.activeTangent = this.tangents[i];
				break;
			}
		} 
	}

	// No node selected: add a new node
	if (this.activeNode == null) {
		this.addNode(pos.x,pos.y);
		this.activeNode = this.nodes[this.nodes.length-1];
	}

	this.cvState = CVSTATE.SelectPoint;
	event.preventDefault();
}

CatmullRomSpline.prototype.mouseMove = function(event) {
	if (this.cvState == CVSTATE.SelectPoint || this.cvState == CVSTATE.MovePoint) {
		var pos = getMousePos(event);
		if (this.activeTangent) {
			temp_x = pos.x - this.activeNode.x;
			temp_y = pos.y - this.activeNode.y;
			// temp_x = Math.min(Math.max(pos.x - this.activeNode.x, -50), 200);
			// temp_y = Math.min(Math.max(pos.y - this.activeNode.y, -50), 200);
			this.activeTangent.setPos(temp_x, temp_y);
			this.activeTangent = this.activeTangent;
		}
	} else {
		// No button pressed. Ignore movement.
	}
}

CatmullRomSpline.prototype.mouseRelease = function(event)
{
	this.cvState = CVSTATE.Idle;
	this.activeNode = null;
	this.activeTangent = null;
}

CatmullRomSpline.prototype.computeCanvasSize = function()
{
	var renderWidth = Math.min(this.dCanvas.parentNode.clientWidth - 20, 820);
    var renderHeight = Math.floor(renderWidth*3.0/16.0);
    this.dCanvas.width = renderWidth - 100;
    this.dCanvas.height = renderHeight;
}

// CatmullRomSpline.prototype.drawControlPolygon = function()
// {
// 	for (var i = 0; i < this.nodes.length-1; i++)
// 		drawLine(this.ctx, this.nodes[i].x, this.nodes[i].y,
// 					  this.nodes[i+1].x, this.nodes[i+1].y);
// }

// CatmullRomSpline.prototype.drawControlPoints = function()
// {
// 	for (var i = 0; i < this.nodes.length; i++)
// 		this.nodes[i].draw(this.ctx);
// }

CatmullRomSpline.prototype.drawTangents = function()
{
	// TODO: Task 4
	// Note: Tangents are available only for 2,..,n-1 nodes. The tangent is not defined for 1st and nth node.
    // Compute tangents from (i+1) and (i-1) node
    // Normalize tangent and compute a line of length 'x' pixels from the current control point.
    // Draw the tangent using drawLine() function
	for (var i = 0; i < this.nodes.length; i++) {
		tangent = this.tangents[i].normalize();
        setColors(this.ctx,'rgb(250,0,0)');
		drawLine(this.ctx, 
			 	 this.nodes[i].x - tangent.x*30, 
				 this.nodes[i].y - tangent.y*30, 
				 this.nodes[i].x + tangent.x*30, 
				 this.nodes[i].y + tangent.y*30);
	}
}

CatmullRomSpline.prototype.draw = function()
{
	// TODO: Task 5
	//NOTE: You can either implement the equal parameter split strategy or recursive bezier draw for drawing the spline segments
    //NOTE: If you're a grad student, you will have to employ the tension parameter to draw the curve (see assignment description for more details)
    //Hint: Once you've computed the segments of the curve, draw them using the drawLine() function
    
    for (var i = 1; i < this.nodes.length; i++) {
		// ch15.5.5 p363: the cardinal matrix to compute a0, a1, a2, a3
		var s = this.tension; 
		
		p0 = this.nodes[i-1];
		p1 = this.nodes[i];
		v0 = this.tangents[i-1];
		v1 = this.tangents[i];

		a = new Node(2*p0.x - 2*p1.x + v0.x + v1.x, 2*p0.y - 2*p1.y + v0.y + v1.y);
		b = new Node(-3*p0.x + 3*p1.x - 2*v0.x - v1.x, -3*p0.y + 3*p1.y - 2*v0.y - v1.y);
		c = v0
		d = p0

		// f(u) = a0 + a1u + a2u^2 + a3u^3
		p = p0;
		for (var seg = 0; seg <= this.numSegments; seg++) {
			u = seg / this.numSegments;
			f_u = new Node(d.x + c.x*u + b.x*u*u + a.x*u*u*u, 
					       d.y + c.y*u + b.y*u*u + a.y*u*u*u);
	        setColors(this.ctx,'rgb(0,0,0)');
			drawLine(this.ctx, 
					 p.x, 
					 p.y, 
					 f_u.x, 
					 f_u.y);
			p = f_u;
		}
	}
}



CatmullRomSpline.prototype.getValue = function(time)
{
    for (var i = 1; i < this.nodes.length; i++) {

    	if (time >= this.nodes[i-1].x && time < this.nodes[i].x) {
    		p0 = this.nodes[i-1];
			p1 = this.nodes[i];
			v0 = this.tangents[i-1];
			v1 = this.tangents[i];

			a = new Node(2*p0.x - 2*p1.x + v0.x + v1.x, 2*p0.y - 2*p1.y + v0.y + v1.y);
			b = new Node(-3*p0.x + 3*p1.x - 2*v0.x - v1.x, -3*p0.y + 3*p1.y - 2*v0.y - v1.y);
			c = v0
			d = p0
			u = (time - this.nodes[i-1].x) / (this.nodes[i].x - this.nodes[i-1].x);
			f_u = new Node(d.x + c.x*u + b.x*u*u + a.x*u*u*u, 
					       d.y + c.y*u + b.y*u*u + a.y*u*u*u);
			p = f_u;
		}
	}
	return p.y;
}



CatmullRomSpline.prototype.getValueByAxis = function(time, axis_nodes, axis_tangents) {
    for (var i = 1; i < axis_nodes.length; i++) {

    	if (time >= axis_nodes[i-1].x && time < axis_nodes[i].x) {
    		p0 = axis_nodes[i-1];
			p1 = axis_nodes[i];
			v0 = axis_tangents[i-1];
			v1 = axis_tangents[i];

			a = new Node(2*p0.x - 2*p1.x + v0.x + v1.x, 2*p0.y - 2*p1.y + v0.y + v1.y);
			b = new Node(-3*p0.x + 3*p1.x - 2*v0.x - v1.x, -3*p0.y + 3*p1.y - 2*v0.y - v1.y);
			c = v0
			d = p0
			u = (time - axis_nodes[i-1].x) / (axis_nodes[i].x - axis_nodes[i-1].x);
			f_u = new Node(d.x + c.x*u + b.x*u*u + a.x*u*u*u, 
					       d.y + c.y*u + b.y*u*u + a.y*u*u*u);
			p = f_u;
		}
	}

	return p.y;
}






// NOTE: Task 4 code.
CatmullRomSpline.prototype.drawTask5 = function(time)
{
	// clear the rect
	this.ctx.clearRect(0, 0, this.dCanvas.width, this.dCanvas.height);

	// draw timeline
	if (time) {
		this.timeline = time
	}
    setColors(this.ctx,'rgb(250,0,0)');
	drawLine(this.ctx, this.timeline, 0, this.timeline, 153);

    if (this.showControlPolygon) {
		// Connect nodes with a line
        // setColors(this.ctx,'rgb(10,70,160)');
        // for (var i = 1; i < this.nodes.length; i++) {
        //     drawLine(this.ctx, this.nodes[i-1].x, this.nodes[i-1].y, this.nodes[i].x, this.nodes[i].y);
        // }
		// Draw nodes
		setColors(this.ctx,'rgb(10,70,160)','white');
		for (var i = 0; i < this.nodes.length; i++) {
			//console.log(this.activeID);
			if(i == this.activeID){
				setColors(this.ctx,'rgb(10,70,160)','red');
				this.nodes[this.activeID].draw(this.ctx);
			}
			else{
				setColors(this.ctx,'rgb(10,70,160)','white');
				this.nodes[i].draw(this.ctx);
				//console.log("not")
			}
		}
    }

	// We need atleast 2 points to start rendering the curve.
    if(this.nodes.length < 1) return;

	// Draw the curve
	this.draw();

	if(this.showTangents)
		this.drawTangents();

}


// Add a contro point to the Bezier curve
CatmullRomSpline.prototype.addNode = function(x,y)
{
	this.nodes.push(new Node(x, y));
	tangent = new Node(50, 0);
	if (this.nodes.length > 2) {
		i = this.nodes.length-1;
		this.tangents[i-1] = 
		new Node((this.nodes[i].x - this.nodes[i-2].x)/2, 
			     (this.nodes[i].y - this.nodes[i-2].y)/2);
	}
	this.tangents.push(tangent);
}

	
CatmullRomSpline.prototype.deleteNode = function(array, index) {
    if (index !== -1 && index < array.length) {
        array.splice(index, 1);
    }
}
