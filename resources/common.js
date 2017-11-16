// Javascript file containing all common functionality required for the entire project.

// Some common shaders
var SolidVertexSource = `
    uniform mat4 ModelViewProjection;
    
    attribute vec3 Position;
    
    void main() {
        gl_Position = ModelViewProjection*vec4(Position, 1.0);
    }
`;
var SolidFragmentSource = `
    precision highp float;
    
    uniform vec4 Color;

    void main() {
        gl_FragColor = Color;
    }
`;
var WeightVertexSource = `
    uniform mat4 ModelViewProjection;
    
    attribute vec3 Position;
	attribute float Weight;
	
	varying float vWeight;
    
    void main() {
        gl_Position = ModelViewProjection*vec4(Position, 1.0);
		vWeight = Weight;
    }
`;
var WeightFragmentSource = `
    precision highp float;
    
    uniform float EdgeWeight;
    uniform vec4 Color;
	
	varying float vWeight;
    
    void main() {
		gl_FragColor = mix(mix(vec4(1.0, 0.0, 0.0, 1.0), vec4(1.0, 1.0, 1.0, 1.0), vWeight), Color, EdgeWeight*0.5);
    }
`;

function createVertexBuffer(gl, vertexData) {
    var vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STATIC_DRAW);
    return vbo;
}

function createIndexBuffer(gl, indexData) {
    var ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), gl.STATIC_DRAW);
    return ibo;
}

function createColorBuffer(gl, colorData) {
	var cbo = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cbo);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorData), gl.STATIC_DRAW);
	return cbo;
}

function createShaderObject(gl, shaderSource, shaderType) {
    var shaderObject = gl.createShader(shaderType);
    gl.shaderSource(shaderObject, shaderSource);
    gl.compileShader(shaderObject);
    
    if (!gl.getShaderParameter(shaderObject, gl.COMPILE_STATUS)) {
        var lines = shaderSource.split("\n");
        for (var i = 0; i < lines.length; ++i)
            lines[i] = ("   " + (i + 1)).slice(-4) + " | " + lines[i];
        shaderSource = lines.join("\n");
    
        throw new Error(
            (shaderType == gl.FRAGMENT_SHADER ? "Fragment" : "Vertex") + " shader compilation error for shader '" + name + "':\n\n    " +
            gl.getShaderInfoLog(shaderObject).split("\n").join("\n    ") +
            "\nThe shader source code was:\n\n" +
            shaderSource);
    }
    return shaderObject;
}

function createShaderProgram(gl, vertexSource, fragmentSource) {
    var   vertexShader = createShaderObject(gl,   vertexSource, gl.  VERTEX_SHADER);
    var fragmentShader = createShaderObject(gl, fragmentSource, gl.FRAGMENT_SHADER);
    var program = gl.createProgram();
    gl.attachShader(program,   vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    return program;
}

var TriangleMesh = function(gl, vertexPositions, indices, shaderProgram, drawFaces, drawEdges, faceColor, edgeColor) {
    this.drawFaces = defaultArg(drawFaces, true);    
    this.drawEdges = defaultArg(drawEdges, true);
    this.faceColor = defaultArg(faceColor, new Vector(1, 1, 1));
    this.edgeColor = defaultArg(edgeColor, new Vector(0.5, 0.5, 0.5));
    
    this.positionVbo = createVertexBuffer(gl, vertexPositions);
    if (this.drawFaces) {
        this.indexCount = indices.length;
        this.indexIbo = createIndexBuffer(gl, indices);
    }
    if (this.drawEdges) {
        var edgeIndices = [];
        for (var i = 0; i < indices.length; i += 3) {
            edgeIndices.push(indices[i + 0], indices[i + 1]);
            edgeIndices.push(indices[i + 1], indices[i + 2]);
            edgeIndices.push(indices[i + 2], indices[i + 0]);
        }
        this.edgeIndexCount = edgeIndices.length;
        this.edgeIndexIbo = createIndexBuffer(gl, edgeIndices);
    }
    this.shaderProgram = shaderProgram;
}

TriangleMesh.prototype.render = function(gl, model, view, projection) {
    var modelViewProjection = projection.multiply(view).multiply(model);
    
    gl.useProgram(this.shaderProgram);
    gl.uniformMatrix4fv(gl.getUniformLocation(this.shaderProgram, "ModelViewProjection"), false, modelViewProjection.transpose().m); 
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionVbo);
    
    var positionAttrib = gl.getAttribLocation(this.shaderProgram, "Position");
    gl.enableVertexAttribArray(positionAttrib);
    gl.vertexAttribPointer(positionAttrib, 3, gl.FLOAT, false, 0, 0);
    
    if (this.drawFaces) {
        gl.uniformMatrix4fv(gl.getUniformLocation(this.shaderProgram, "ModelViewProjection"), false, modelViewProjection.transpose().m); 
        gl.uniform1f(gl.getUniformLocation(this.shaderProgram, "EdgeWeight"), 0); 
        gl.uniform4f(gl.getUniformLocation(this.shaderProgram, "Color"), this.faceColor.x, this.faceColor.y, this.faceColor.z, 1); 
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexIbo);
        gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
    }
    
    if (this.drawEdges) {
        gl.lineWidth(2.0);
        
        modelViewProjection = Matrix.translate(0, 0, -1e-4).multiply(modelViewProjection);
        gl.uniformMatrix4fv(gl.getUniformLocation(this.shaderProgram, "ModelViewProjection"), false, modelViewProjection.transpose().m); 
        gl.uniform1f(gl.getUniformLocation(this.shaderProgram, "EdgeWeight"), 1); 
        gl.uniform4f(gl.getUniformLocation(this.shaderProgram, "Color"), this.edgeColor.x, this.edgeColor.y, this.edgeColor.z, 1); 
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.edgeIndexIbo);
        gl.drawElements(gl.LINES, this.edgeIndexCount, gl.UNSIGNED_SHORT, 0);
    }
}

// WeightMesh - used to show the weights of the mesh
var WeightShadedTriangleMesh = function(gl, vertexPositions, weights, indices, shaderProgram, drawFaces, drawEdges, faceColor, edgeColor) {
    this.triangleMesh = new TriangleMesh(gl, vertexPositions, indices, shaderProgram, drawFaces, drawEdges, faceColor, edgeColor);
    this.weightsVbo = createVertexBuffer(gl, weights);
    this.shaderProgram = shaderProgram;
}

WeightShadedTriangleMesh.prototype.render = function(gl, model, view, projection) {
    gl.useProgram(this.shaderProgram);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.weightsVbo);
    var weightAttrib = gl.getAttribLocation(this.shaderProgram, "Weight");
    gl.enableVertexAttribArray(weightAttrib);
    gl.vertexAttribPointer(weightAttrib, 1, gl.FLOAT, false, 0, 0);
    
    this.triangleMesh.render(gl, model, view, projection);
}

// The first task where we implement rigid skinning
var Task1 = function(gl)
{
	this.pitch = 0;
    this.yaw = 0;
	
	// Create a skin mesh
	this.skin = new SkinMesh(gl);
	this.skin.createCylinderSkinX(0.5);
	
	// Create a skeleton
	this.skeleton = new Skeleton();
	
	// create two bones and push them into skeleton
	this.mJoint1 = new Joint ( 	      null, [-2, 0, 0], [0, 1, 0], 1.8, "Upper Arm", gl);
	this.mJoint2 = new Joint (this.mJoint1, [ 2, 0, 0], [0, 0, 1], 1.8, "Forearm", gl);
	
	this.skeleton.addJoint(this.mJoint1);
	this.skeleton.addJoint(this.mJoint2);
		
	// set the skeleton
	this.mShowWeights = false;
	this.skin.setSkeleton(this.skeleton, "rigid");
	
	gl.enable(gl.DEPTH_TEST);
}

Task1.prototype.render = function(gl, w, h) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    var projection = Matrix.perspective(60, w/h, 0.1, 100);
    var view =
        Matrix.translate(0, 0, -5).multiply(
        Matrix.rotate(this.pitch, 1, 0, 0)).multiply(
        Matrix.rotate(this.yaw, 0, 1, 0));
    
	if(this.skin)
		this.skin.render(gl, view, projection, true);
	
	if(this.skeleton)
	{
		gl.clear(gl.DEPTH_BUFFER_BIT);
		this.skeleton.render(gl, view, projection);
	}
}

Task1.prototype.setJointAngle = function(id, value)
{
	if(this.skeleton && id < this.skeleton.getNumJoints())
	{
		this.skeleton.getJoint(id).setJointAngle(value);
		this.skin.updateSkin();
	}
}

Task1.prototype.dragCamera = function(dx, dy) {
    this.pitch = Math.min(Math.max(this.pitch + dy*0.5, -90), 90);
    this.yaw = this.yaw + dx*0.5;
}

Task1.prototype.showJointWeights = function(idx)
{
	this.skin.showJointWeights(idx);
    this.skin.updateSkin();
}

// This class is concerned with the task-2 of the assignment.
var Task2 = function(gl)
{
	this.pitch = 0;
    this.yaw = 0;
	
	// Create a skin mesh
	this.skin = new SkinMesh(gl);
	this.skin.createCylinderSkinX(0.5);
	
	// Create a skeleton
	this.skeleton = new Skeleton();
	
	// create two bones and push them into skeleton
	this.mJoint1 = new Joint ( 	      null, [-2, 0, 0], [0, 1, 0], 1.8, "Upper Arm", gl);
	this.mJoint2 = new Joint (this.mJoint1, [ 2, 0, 0], [0, 0, 1], 1.8, "Forearm", gl);
    this.mJoint3 = new Joint (this.mJoint2, [ 4, 0, 0], [0, 0, 1], 1.8, "Torus", gl);

	
	this.skeleton.addJoint(this.mJoint1);
	this.skeleton.addJoint(this.mJoint2);
		
	// set the skeleton
	this.mShowWeights = false;
	this.skin.setSkeleton(this.skeleton, "linear");
	
	gl.enable(gl.DEPTH_TEST);
}

Task2.prototype.render = function(gl, w, h) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    var projection = Matrix.perspective(60, w/h, 0.1, 100);
    var view =
        Matrix.translate(0, 0, -5).multiply(
        Matrix.rotate(this.pitch, 1, 0, 0)).multiply(
        Matrix.rotate(this.yaw, 0, 1, 0));
    
	if(this.skin)
		this.skin.render(gl, view, projection, true);
	
	if(this.skeleton)
	{
		gl.clear(gl.DEPTH_BUFFER_BIT);
		this.skeleton.render(gl, view, projection);
	}
}

Task2.prototype.setJointAngle = function(id, value)
{
	if(this.skeleton && id < this.skeleton.getNumJoints())
	{
		this.skeleton.getJoint(id).setJointAngle(value);
		this.skin.updateSkin();
	}
}

Task2.prototype.dragCamera = function(dx, dy) {
    this.pitch = Math.min(Math.max(this.pitch + dy*0.5, -90), 90);
    this.yaw = this.yaw + dx*0.5;
}

Task2.prototype.showJointWeights = function(idx)
{
	this.skin.showJointWeights(idx);
    this.skin.updateSkin();
}
