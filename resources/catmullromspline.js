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

	var rightclick = false;
	var leftclick = false;

	// Event listeners
	this.dCanvas.addEventListener('mousedown', function(event) {
        that.mousePress(event);
    });

	this.dCanvas.addEventListener('mousemove', function(event) {
		that.mouseMove(event);
	});

	this.dCanvas.addEventListener('mouseup', function(event) {
		that.mouseRelease(event);
	});

	this.dCanvas.addEventListener('mouseleave', function(event) {
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
	if (event.button == 0 || event.button == 2) {
		if(event.button == 2){
			this.rightclick = true;
		}
		
		this.activeNode = null;
		var pos = getMousePos(event);

		// Try to find a tangent below the mouse
		for (var i = 0; i < this.nodes.length; i++) {
			if (this.nodes[i].isInside(pos.x,pos.y)) {
				this.activeNode = this.nodes[i];
				
				// if(this.activeID == -1){
					this.activeID = i;
				// }
				console.log("acnode" + this.activeNode);
				this.activeTangent = this.tangents[i];
				break;
			}
		} 

	
		// No node selected: add a new node
		if (this.activeNode == null && !this.rightclick) {
			this.addNode(pos.x,pos.y);
			this.activeNode = this.nodes[this.nodes.length-1];
		}
		console.log(this.activeID + "rc "+ this.rightclick);
		if(this.activeID != -1 && this.rightclick && !this.nodes[this.activeID].isInside(pos.x,pos.y)){
				this.activeID = -1;
				this.activeNode = null;
		
		} 
			
		this.cvState = CVSTATE.SelectPoint;
		event.preventDefault();
	}
		// else if(event.button == 2){
		// 	if(this.activeID != -1){
		// 		this.activeID = -1;
		// 		this.activeNode = null;
		// 	}
		// }
}

CatmullRomSpline.prototype.mouseMove = function(event) {
	
	if (this.rightclick) {
		
		if (this.cvState == CVSTATE.SelectPoint || this.cvState == CVSTATE.MovePoint) {
			var pos = getMousePos(event);
			if (this.activeTangent) {
				temp_x = pos.x - this.activeNode.x + 1;
				temp_y = pos.y - this.activeNode.y + 1;
				temp_node = new Node(temp_x, temp_y);
				temp_norm = temp_node.norm();
				if (temp_norm == 0) {
					temp_norm += 0.001;
				}
				cosTheta = temp_node.normalize().dotProduct((new Node(temp_x, 0)).normalize());
				if (cosTheta != cosTheta) {
					cosTheta = 0.01;
				}
				temp_x = temp_x / temp_norm * (150 + 300*(1-cosTheta));
				temp_y = temp_y / temp_norm * (150 + 300*(1-cosTheta));
				//console.log(norm, temp_y);
				this.activeTangent.setPos(temp_x, temp_y);
			}
		} else {
			// No button pressed. Ignore movement.
		}
	}else if(event.button == 0){
		if (this.cvState == CVSTATE.SelectPoint || this.cvState == CVSTATE.MovePoint) {
			var pos = getMousePos(event);
			this.activeNode.x = pos.x;
			this.activeNode.y = pos.y;
		}
	}
}

CatmullRomSpline.prototype.mouseRelease = function(event)
{
	this.cvState = CVSTATE.Idle;
	this.activeNode = null;
	this.activeTangent = null;
	this.rightclick = false;
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
	p = new Node(153, 153);
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
	var n = this.nodes.length;
	if( n == 0){
		this.nodes.push(new Node(x, y));
		//console.log(x);
		//console.log(y);
	}else{
		for(var i = 0; i < n; i++){
			if(x < this.nodes[i].x){
				this.nodes.splice(i,0,new Node(x,y));
				//console.log(x);
				//console.log(this.nodes[i].x);
				break;
			}
			if(i == n - 1){
				this.nodes.push(new Node(x, y));
			}
			//console.log("i = " + i);
		}	
	}
	
	tangent = new Node(50, 0);
	if (this.nodes.length > 2) {
		i = this.nodes.length-1;
		this.tangents[i-1] = 
		new Node((this.nodes[i].x - this.nodes[i-2].x)/2, 
			     (this.nodes[i].y - this.nodes[i-2].y)/2);
	}
	this.tangents.push(tangent);
	//console.log(this.nodes.length);


    this.saveCurves(this, axis);
}

	
CatmullRomSpline.prototype.deleteNode = function(array, index) {
    if (index !== -1 && index < array.length) {
        array.splice(index, 1);
    }
    //console.log(array.length);
}

CatmullRomSpline.prototype.saveCurves = function(curve, axis) {
    if (axis == 1) {
        tx_nodes = curve.nodes;
        tx_tangents = curve.tangents;
    }
    if (axis == 2) {
        ty_nodes = curve.nodes;
        ty_tangents = curve.tangents;
    }
    if (axis == 3) {
        tz_nodes = curve.nodes;
        tz_tangents = curve.tangents;
    }

    if (axis == 4) {
        rx_nodes = curve.nodes;
        rx_tangents = curve.tangents;
    }
    if (axis == 5) {
        ry_nodes = curve.nodes;
        ry_tangents = curve.tangents;
    }
    if (axis == 6) {
        rz_nodes = curve.nodes;
        rz_tangents = curve.tangents;
    }

    if (axis == 7) {
        j7_nodes = curve.nodes;
        j7_tangent = curve.tangents;
    }
    if (axis == 8) {
        j8_nodes = curve.nodes;
        j8_tangent = curve.tangents;
    }
}