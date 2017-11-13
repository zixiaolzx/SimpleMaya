// Joint class represents a binding point with an underlying mesh.
// It represents an underlying transformation(both position and rotation)
// Joints are to be used in a hierarchical representation to represent multiple joints
// that work in tandem with each other.
var Joint = function(parent, position, jointAxis, length, name, gl) {
	
	this.mParent = parent;
    this.mPosition = position;
    this.mJointAxis = jointAxis;
    this.mJointAngle = 0;
	this.mName = name;
	this.mLength = length;
	
	// Compute the binding matrix
	// Initially the binding transform has no meaning
	// until the skeleton containing the joint is bound to a skin.
	this.mBindingMatrix = null;
	
	// create a 'mesh' object that is a proxy for the joint.
	// not to be confused with the skin mesh. 
	this.gl = gl;
    var shader = createShaderProgram(gl, SolidVertexSource, SolidFragmentSource);
	this.mesh = new TriangleMesh(this.gl, CubePositions, CubeIndices, shader, true, true, new Vector(0.4, 0.7, 0.4), new Vector(0.5, 1, 0.5));
}

// Helper functions.
Joint.prototype.setJointAngle = function(angle) {
    this.mJointAngle = angle;
}

Joint.prototype.setName = function(val) {
	this.mName = val;
}

// NOTE: if the binding matrix was not computed, this returns null.
Joint.prototype.getBindingMatrix = function() {
	return this.mBindingMatrix;
}

Joint.prototype.getName = function() {
	return this.mName;
}

// TODO: Task 1 - Subtask 1
//
// Returns the local transform of the current joint
// containing both a 'position' component and 'rotation' component.
Joint.prototype.getLocalMatrix = function() {
	var pos = this.mPosition;
	var jAxis = this.mJointAxis;
	var jAngle = this.mJointAngle;
	var rot = Matrix.rotate(jAngle, jAxis[0], jAxis[1], jAxis[2]);
	var trans = Matrix.translate(pos[0], pos[1], pos[2]);
	var local = Matrix.multiply(trans, rot);
	return local;

}

// TODO: Task 1 - Subtask 1
//
// Returns the world transform of the current joint.
// Recursively moves up the hierarchy to give the final transform.
Joint.prototype.getWorldMatrix = function() {
	var world = this.getLocalMatrix();

	if(this.mParent != null){
		var pworld = this.mParent.getWorldMatrix();
		world = Matrix.multiply(pworld, world);
	}

    return world;
}

// TODO: Task 1 - Subtask 1
//
// Computes the binding transform matrix of the current joint.
// This matrix moves a point from the world space to local joint space.
Joint.prototype.computeBindingMatrix = function() {
	var pos = this.mPosition;
	var binding = Matrix.translate(pos[0], pos[1], pos[2]);

	if(this.mParent != null){
		var pbinding = this.mParent.getBindingMatrix();
		binding = Matrix.multiply(pbinding, binding);
	}
	
	this.mBindingMatrix = binding;
}

// Get the world space position of the joint.
Joint.prototype.getWSPosition = function() {
	var temp = this.getWorldMatrix().transformPoint(new Vector(0, 0, 0));
	return [temp.x, temp.y, temp.z];
}

// Returns the end points of the joint in word space
// can be used to compute the distance to the line segment
// The returned values are 'v0' and 'v1'
Joint.prototype.getWSJointEndPts = function() {
	var v0 = this.getWorldMatrix().transformPoint(new Vector(0, 0, 0));
	var v1 = this.getWorldMatrix().transformPoint(new Vector(this.mLength, 0, 0));
	return {v0 : v0, v1 : v1};
}

// Computes the model matrix used to draw the joint.
Joint.prototype.computeModelMatrix = function() {
    var pose = this.getWorldMatrix();
	var tMatrix = Matrix.translate(this.mLength/2, 0, 0);
	var sMatrix = Matrix.scale(this.mLength, 0.2, 0.2);
	// Do a scaling about the origin of the cube for the correct size
	// And the do as shift along the axis.
	var fMatrix = tMatrix.multiply(sMatrix);
    return pose.multiply(fMatrix);
}

// Renders the joint as a discrete cube at the joint location in world space.
Joint.prototype.render = function(gl, view, projection)
{
	this.mModelMatrix = this.computeModelMatrix();
	this.mesh.render(gl, this.mModelMatrix, view, projection);
}