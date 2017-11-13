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

	// closure
	var that = this;

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

CatmullRomSpline.prototype.mousePress = function(event)
{
	if (event.button == 0) {
		this.activeNode = null;
		var pos = getMousePos(event);

		// Try to find a node below the mouse
		for (var i = 0; i < this.nodes.length; i++) {
			if (this.nodes[i].isInside(pos.x,pos.y)) {
				this.activeNode = this.nodes[i];
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
		this.activeNode.setPos(pos.x,pos.y);
	} else {
		// No button pressed. Ignore movement.
	}
}

CatmullRomSpline.prototype.mouseRelease = function(event)
{
	this.cvState = CVSTATE.Idle; this.activeNode = null;
}

CatmullRomSpline.prototype.computeCanvasSize = function()
{
	var renderWidth = Math.min(this.dCanvas.parentNode.clientWidth - 20, 820);
    var renderHeight = Math.floor(renderWidth*3.0/16.0);
    this.dCanvas.width = renderWidth - 100;
    this.dCanvas.height = renderHeight;
}

CatmullRomSpline.prototype.drawControlPolygon = function()
{
	for (var i = 0; i < this.nodes.length-1; i++)
		drawLine(this.ctx, this.nodes[i].x, this.nodes[i].y,
					  this.nodes[i+1].x, this.nodes[i+1].y);
}

CatmullRomSpline.prototype.drawControlPoints = function()
{
	for (var i = 0; i < this.nodes.length; i++)
		this.nodes[i].draw(this.ctx);
}

CatmullRomSpline.prototype.drawTangents = function()
{
	// TODO: Task 4
	// Note: Tangents are available only for 2,..,n-1 nodes. The tangent is not defined for 1st and nth node.
    // Compute tangents from (i+1) and (i-1) node
    // Normalize tangent and compute a line of length 'x' pixels from the current control point.
    // Draw the tangent using drawLine() function

    for(var i = 1; i < this.nodes.length - 1; i++){
    	var pre = this.nodes[i-1];
    	var next = this.nodes[i+1];
    	var len = Math.sqrt(Math.pow(next.x - pre.x,2) + Math.pow(next.y - pre.y,2));
    	var tangx = (next.x - pre.x)/len * 40;
    	var tangy = (next.y - pre.y)/len * 40;

    	drawLine(this.ctx, this.nodes[i].x, this.nodes[i].y, this.nodes[i].x + tangx, this.nodes[i].y + tangy);

    }
}

CatmullRomSpline.prototype.draw = function()
{
	// TODO: Task 5
	//NOTE: You can either implement the equal parameter split strategy or recursive bezier draw for drawing the spline segments
    //NOTE: If you're a grad student, you will have to employ the tension parameter to draw the curve (see assignment description for more details)
    //Hint: Once you've computed the segments of the curve, draw them using the drawLine() function
    
    var ns = this.nodes;
    
    for(var i = 1; i < ns.length-2;i++){
    	var p0 = ns[i-1];
    	var p1 = ns[i];
    	var p2 = ns[i+1];
    	var p3 = ns[i+2];

    	var s = this.tension;
    	var s0 = p1;
    	var s1 = new Node((-s)*p0.x + s*p2.x, 
    					  (-s)*p0.y + s*p2.y);
    	var s2 = new Node((2*s)*p0.x + (s-3)*p1.x + (3-2*s)*p2.x + (-s)*p3.x,
    					  (2*s)*p0.y + (s-3)*p1.y + (3-2*s)*p2.y + (-s)*p3.y);
    	var s3 = new Node((-s)*p0.x + (2-s)*p1.x + (s-2)*p2.x + s*p3.x,
    	 				  (-s)*p0.y + (2-s)*p1.y + (s-2)*p2.y + s*p3.y);
    
    	var curp = new Node(this.nodes[i].x, this.nodes[i].y);
    	var n = this.numSegments;
    	for(var j = 1; j <= n; j++){
    		var seg = j / n;
    		var nextp = new Node(s0.x + seg*s1.x + Math.pow(seg,2)*s2.x + Math.pow(seg,3)*s3.x ,
    			                 s0.y + seg*s1.y + Math.pow(seg,2)*s2.y + Math.pow(seg,3)*s3.y);

    		drawLine(this.ctx, curp.x, curp.y, nextp.x, nextp.y);
    		curp.x = nextp.x;
    		curp.y = nextp.y;
    	}
    }
    
}

// NOTE: Task 4 code.
CatmullRomSpline.prototype.drawTask4 = function()
{
	// clear the rect
	this.ctx.clearRect(0, 0, this.dCanvas.width, this.dCanvas.height);

    if (this.showControlPolygon) {
		// Connect nodes with a line
        setColors(this.ctx,'rgb(10,70,160)');
        for (var i = 1; i < this.nodes.length; i++) {
            drawLine(this.ctx, this.nodes[i-1].x, this.nodes[i-1].y, this.nodes[i].x, this.nodes[i].y);
        }
		// Draw nodes
		setColors(this.ctx,'rgb(10,70,160)','white');
		for (var i = 0; i < this.nodes.length; i++) {
			this.nodes[i].draw(this.ctx);
		}
    }

	// We need atleast 4 points to start rendering the curve.
    if(this.nodes.length < 4) return;

	// draw all tangents
	if(this.showTangents)
		this.drawTangents();
}

// NOTE: Task 4 code.
CatmullRomSpline.prototype.drawTask5 = function()
{
	// clear the rect
	this.ctx.clearRect(0, 0, this.dCanvas.width, this.dCanvas.height);

    if (this.showControlPolygon) {
		// Connect nodes with a line
        setColors(this.ctx,'rgb(10,70,160)');
        for (var i = 1; i < this.nodes.length; i++) {
            drawLine(this.ctx, this.nodes[i-1].x, this.nodes[i-1].y, this.nodes[i].x, this.nodes[i].y);
        }
		// Draw nodes
		setColors(this.ctx,'rgb(10,70,160)','white');
		for (var i = 0; i < this.nodes.length; i++) {
			this.nodes[i].draw(this.ctx);
		}
    }

	// We need atleast 4 points to start rendering the curve.
    if(this.nodes.length < 4) return;

	// Draw the curve
	this.draw();

	if(this.showTangents)
		this.drawTangents();
}


// Add a contro point to the Bezier curve
CatmullRomSpline.prototype.addNode = function(x,y)
{
	this.nodes.push(new Node(x,y));
}
