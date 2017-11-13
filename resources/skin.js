// TODO: Task 2 - Subtask 1
//
// Given a point, compute the distance to the line
// in case of the point lying out the vertex extents,
// computes the distance to end points rather than the line itself.
function computeDistanceToLine(pt, vertex0, vertex1)
{
	var v = vertex1.subtract(vertex0);
	var p0 = pt.subtract(vertex0);
	var p1 = pt.subtract(vertex1);
	var vlen = v.length();
	var d0 = p0.dot(v)/vlen;
	var d1 = p1.dot(v.negative())/vlen;

	if(d0 < 0){
		//pt is close to p0
		var d = p0.length();
	}else if(d1 < 0){
		//pt close to p1
		var d = p1.length();
	}else{
		var d = Math.sqrt(p0.length()*p0.length() - d0*d0);
	}
	return d;
}

// SkinMesh is a class that provides the functionality of rendering a mesh.
// It is the target mesh that will be skinned with a skeleton.
var SkinMesh = function(gl)
{
	// Original positions refer to the original mesh data.
	// This is the data that will be haved to transformed with the current state of the skeleton.
	this.mOriginalPositions = new Array();
	this.mIndices = new Array();
	
	// During joints in the skeleton are changed, the underlying attached vertices in
	// skin mesh are transformed. These are the vertices that should contain the 
	// transformed vertices and supplied to be drawn.
	this.mTransformedPositions = new Array();
		
	// The number of joints influencing each vertex is given by
	//
	// numJointsPerVertex = mJointIds.length / mPositions.length
	//
	// Each vertex can have multiple joints influencing it. The more the
	// joints, the more heavier the computation becomes. Typically a value of
	// '3 or 4' is more than sufficient.
	
	// store weights in contiguous format per vertex
	// store bone ids in contiguous format per vertex
	this.mWeights = new Array();
	this.mJointIds = new Array();
		
	// The skin does not have a skeleton initially bound to it.
	// Once the skin has a skeleton bound to it, the corresponding
	// binding matrices for each joint have to be computed.
	this.mSkeleton = null;
	
	this.gl = gl;
	
	// boolean flag to toggle weight display 
	this.mShowWeights = false;
	
	// The current selected joint for showing weights.
	// this is set by selecting the appropriate joint button in the UI.
	this.mWeightJoint = null;
	
	// An array that is used to store the weights of the selected joint for all the vertices.
	this.mSelectedJointWeights = null;
	
	// The actual mesh of the skin that is drawn with the transformed vertices.
	this.mMesh = null;
	
	// The weight mesh that is used to show the weights of each vertex for a particular chosen joint.
	this.mWeightMesh = null;
	
	// Stores the current skinning mode
	this.mSkinMode = null;
	
	// Create global shader programs used by different meshes for optimization purposes.
	this.shader = createShaderProgram(gl, SolidVertexSource, SolidFragmentSource);
	this.wShader = createShaderProgram(gl, WeightVertexSource, WeightFragmentSource);
}

// Creates a cylinder mesh along the x-axis
SkinMesh.prototype.createCylinderSkinX = function(rad)
{
	// Create a cylinder from [-2 : 2]
	var startX = -2.0;
	var endX = 2.0;
	var numXSegments = 16;
	var numThetaBands = 16;
	var factor = (endX - startX) / numXSegments;
	
	var radius = 1.0;
	if(rad)
		radius = rad;
	
	// Fill in the position data
	for(var i = 0; i <= numXSegments; i++)
	{
		for(var j = 0; j < numThetaBands; j++)
		{
			var theta = 2 * Math.PI * j / numThetaBands;
			
			var y = radius * Math.sin(theta);
			var z = radius * Math.cos(theta);
			
			this.mOriginalPositions.push(startX);
			this.mOriginalPositions.push(y);
			this.mOriginalPositions.push(z);
			
			this.mTransformedPositions.push(startX);
            this.mTransformedPositions.push(y);
            this.mTransformedPositions.push(z);
			
			// for every band
			if (i < numXSegments) {
                var i0 = i, i1 = i + 1;
                var j0 = j, j1 = (j + 1) % numThetaBands;
                this.mIndices.push(i0*numThetaBands + j0);
                this.mIndices.push(i0*numThetaBands + j1);
                this.mIndices.push(i1*numThetaBands + j1);
                this.mIndices.push(i0*numThetaBands + j0);
                this.mIndices.push(i1*numThetaBands + j1);
                this.mIndices.push(i1*numThetaBands + j0);
            }
		}
		startX = startX + factor;
	}
	
	// create the mesh
	this.mesh = new TriangleMesh(this.gl, this.mTransformedPositions, this.mIndices, this.shader);
}

SkinMesh.prototype.createArmSkin = function()
{
	
	for(var i = 0; i < armPositions.length; i++)
	{
		this.mOriginalPositions.push(armPositions[i]);
		this.mTransformedPositions.push(armPositions[i]);
	}
	
	// Do zero offsetting for obj file using a '1'-indexing scheme
	for(var i = 0; i < armIndices.length; i++)
	{	
		this.mIndices.push(armIndices[i] - 1);
	}
	
	// compute only edge segments
	this.newIndices = new Array();
	
	for(var i = 0; i < armIndices.length / 3; i++)
	{
		var i0 = this.mIndices[i * 3 + 0];
		var i1 = this.mIndices[i * 3 + 1];
		var i2 = this.mIndices[i * 3 + 2];
		
		this.newIndices.push(i0);
		this.newIndices.push(i1);
		this.newIndices.push(i1);
		this.newIndices.push(i2);
		this.newIndices.push(i2);
		this.newIndices.push(i0);
	}
	
	this.mesh = new TriangleMesh(this.gl, this.mTransformedPositions, this.newIndices, this.shader);
}

// Attaches a skeleton to the skin effectively 'binding' it.
// Once attached, the binding matrices for each joint are to be computed.
// And corresponding weights for each vertex have to be computed.
SkinMesh.prototype.setSkeleton = function(val, mode)
{
	this.mSkeleton = val;
	
	if(this.mSkeleton)
		this.mSkeleton.computeBindingMatrices();
	
	// We have a skeleton now.
	// We can compute weights for each vertex
	this.mSkinMode = mode;
	if(mode == "linear")
	{
		this.computeLinearBlendedWeights();
	}
	else
	{
		this.computeRigidWeights();
	}
}

// This function enables the stripping of weights from the weight array
// into a custom mesh that is shown to the user. This is very useful for debugging the weighting scheme.
// NOTE: Make sure to pass in a valid 'id' for the joint.
//       This function expects the joints to be 'zero' indexed.
//       This is already done by the UI code correctly.
//       A negative joint id disables displaying the weights
SkinMesh.prototype.showJointWeights = function(id)
{
	this.mShowWeights = id >= 0;
	this.mWeightJoint = id;
	
	if(this.mShowWeights && this.mSkeleton)
	{
		// weights was toggled
		// create a new mesh with the correct weights
		this.mSelectedJointWeights = new Array();
		var numJoints = this.mSkeleton.getNumJoints();
		
		for(var i = 0; i < this.mOriginalPositions.length/3; i++)
		{
			// get only weights for the joint selected
			//var temp = this.mWeights[i * numJoints + this.mWeightJoint];
			var temp = this.getVertexWeight(i, this.mWeightJoint);
			this.mSelectedJointWeights.push(temp);
		}
		
		this.mWeightMesh = new WeightShadedTriangleMesh(this.gl, this.mTransformedPositions, this.mSelectedJointWeights, this.mIndices, this.wShader)
	}
	else
	{
		console.log("No skeleton bound to compute weights");
	}
}

// Helper function to retrieve weights with respect to a particular joint
// for a given vertex.
SkinMesh.prototype.getVertexWeight = function(idx, joint)
{
	var numJoints = this.mSkeleton.getNumJoints();
	if(joint < numJoints)
	{
		return this.mWeights[idx * numJoints + joint];
	}
}

// Helper function to return the number of vertices in the current mesh
SkinMesh.prototype.getNumVertices = function()
{
	return this.mOriginalPositions.length / 3;
}

// Helper method to get a vertex with 'id'
SkinMesh.prototype.getVertex = function(idx)
{
	return new Vector(this.mOriginalPositions[idx * 3 + 0], this.mOriginalPositions[idx * 3 + 1], this.mOriginalPositions[idx * 3 + 2]);
}

// Helper method to set a transformed vertex into the correct location.
SkinMesh.prototype.setTransformedVertex = function(idx, vtx)
{
	this.mTransformedPositions[idx * 3 + 0] = vtx.x;
	this.mTransformedPositions[idx * 3 + 1] = vtx.y;
	this.mTransformedPositions[idx * 3 + 2] = vtx.z;
}

// Returns the joint for which the vertex has a weight 1.
// Essentially returning the rigid joint.
SkinMesh.prototype.getRigidlyAttachedJoint = function(id)
{
	var numJoints = this.mSkeleton.getNumJoints();
	for(var b = 0; b < numJoints; b++)
	{
		if(this.mWeights[id * numJoints + b] == 1) return b;
	}
}

// NOTE: This function computes fixed weights only for the cylinder mesh
//       Don't use this function for other meshes. It assumes there are only two joints
// 		 as indicated in the assignment.
//
// NOTE: If you intend to use this function for any other mesh, you should change it appropriately.
SkinMesh.prototype.computeRigidWeights = function()
{
	if(this.mSkeleton)
	{
		for(var i = 0; i < this.getNumVertices(); i++)
		{
			var pos = this.getVertex(i);
			
			if(pos.x < 0.0)
			{
				this.mWeights.push(1);
				this.mWeights.push(0);
			}
			else
			{
				this.mWeights.push(0);
				this.mWeights.push(1);
			}
			this.mJointIds.push(0);
			this.mJointIds.push(1);
		}
	}
	else
	{
		console.log("No skeleton bound to skin");
	}
}	

// TODO: Task 1 - Subtask 2
// Implement rigid skinning
SkinMesh.prototype.rigidSkinning = function()
{
	// If skeleton is present
	// for all vertices in the mesh	
		// get rigid joint for vertex
		// get the transform of the joint
		// get the binding transform of the joint
		// compute the final transformed vertex
		// update the correct transformed position.
		
	if(this.mSkeleton)
	{
		for(var i = 0; i < this.getNumVertices(); i++){
			var rigidJoint = this.mSkeleton.getJoint(this.getRigidlyAttachedJoint(i));
			var trans = rigidJoint.getWorldMatrix();
			var binding = rigidJoint.getBindingMatrix().inverse();
			var finalTrans = Matrix.multiply(trans, binding);
			var v = finalTrans.transformPoint(this.getVertex(i));
			this.setTransformedVertex(i,v);
		}
		//console.log("TODO: Add your rigid skinning code here")
	}
	else
	{
		console.log("No skeleton bound with skin");
	}
	
}

// TODO: Task 2 - Subtask 2
//
// Compute the weights for all vertices by considering a set of 'n' joints
// and compute blending weights for each vertex. 
SkinMesh.prototype.computeLinearBlendedWeights = function()
{
	// If skeleton is present
	// for all vertices in the mesh
		// initialize weights array
		// for all joints in the skeleton
			// get world space positions of the joint
			// compute distance between world space vertex location and joint
			// compute the 1/distance^4 and push into weight array
		
		// for all joints in the skeleton
			// normalize current joint's weight
			// push into the weights array and joint array for the current vertex
			
	if(this.mSkeleton)
	{
		this.mWeights = [];
		this.mJointIds = [];
		var numJoints = this.mSkeleton.getNumJoints();
		for(var i = 0; i < this.getNumVertices(); i++){
			var weights = [];
			var totalW = 0;
			for(var j = 0; j < numJoints; j++){

				this.mJointIds.push(j + i * numJoints);

				var joint = this.mSkeleton.getJoint(j);
				var endPts = joint.getWSJointEndPts();
				var v = this.getVertex(i);
				var d = computeDistanceToLine(v,endPts.v0,endPts.v1);
				var weight = Math.pow(d,-4);
				weights.push(weight);
				totalW += weight;
			}

			for(var j = 0; j < weights.length;j++){
				var nw = weights[j]/totalW;
				this.mWeights.push(nw);
			}
		}
	}
	else
	{
		console.log("No skeleton bound with skin");
	}
}

// TODO: Task 2 - Subtask 2
// Implement linear blended skinning
SkinMesh.prototype.linearBlendSkinning = function()
{
	// If skeleton is present
	// for all vertices in the mesh
		// create temporary updated vertex
		// for all joints in the skeleton
			// get weight of joint
			// get tranform of joint
			// get binding transform of joint
			// compute transformed vertex and weight it
			// update the temporary vertex
		// push updated vertex into transformed vertex array
		
	if(this.mSkeleton)
	{
		for(var i = 0; i < this.getNumVertices(); i++){
			var tempVertex = new Vector();
			for(var j = 0; j < this.mSkeleton.getNumJoints(); j++){
				var joint = this.mSkeleton.getJoint(j);
				var weightJ = this.getVertexWeight(i,j);

				var trans = joint.getWorldMatrix();
				var binding = joint.getBindingMatrix().inverse();
				var finalTrans = Matrix.multiply(trans, binding);

				var v = finalTrans.transformPoint(this.getVertex(i)).multiply(weightJ);

				var tempVertex = tempVertex.add(v);
			}
			this.setTransformedVertex(i,tempVertex);
		}
	}
	else
	{
		console.log("No skeleton bound with skin");
	}
}

// Update skin called whenever a change is detected in the joint.
// Typically caused by the UI angle change
// However in case of animations, you can use this function to do the same functionality.
SkinMesh.prototype.updateSkin = function()
{
	if(this.mSkinMode == "rigid")
	{
		this.rigidSkinning();
		
	}
	else if(this.mSkinMode == "linear")
	{
		this.linearBlendSkinning();
	}
	
	if(!this.mShowWeights)
		this.mesh = new TriangleMesh(this.gl, this.mTransformedPositions, this.mIndices, this.shader);
	else
		this.mWeightMesh = new WeightShadedTriangleMesh(this.gl, this.mTransformedPositions, this.mSelectedJointWeights, this.mIndices, this.wShader)
}

// Renders a skin mesh with the selected options.
SkinMesh.prototype.render = function(gl, view, projection, drawWireFrame)
{
	if(!this.mShowWeights)
	{
		if(this.mesh)
		{
			this.mesh.render(gl, new Matrix(), view, projection, drawWireFrame);
		}
	}
	else
	{
		if(this.mWeightMesh && this.mSkeleton)
		{
			this.mWeightMesh.render(gl, new Matrix(), view, projection);
		}
	}
}