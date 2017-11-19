// TODO: Task 2 - Subtask 1
//
// Given a point, compute the distance to the line
// in case of the point lying out the vertex extents,
// computes the distance to end points rather than the line itself.
function computeDistanceToLine(pt, vertex0, vertex1) {
	
	var vector = vertex1.subtract(vertex0);
	var vector0 = pt.subtract(vertex0);
	var vector1 = pt.subtract(vertex1);
	
	angle0 = vector0.angleTo(vector);
	angle1 = vector1.angleTo(vector.negative())
	
	if (angle0 > Math.PI/2) {
		d = vector0.length();
		return d;
	}
	
	if (angle1 > Math.PI/2) {
		d = vector1.length();
		return d;
	}
	
	else {
		c = vector0.cross(vector);
		d = c.length() / vector.length();
		return d;
	}
}

// SkinMesh is a class that provides the functionality of rendering a mesh.
// It is the target mesh that will be skinned with a skeleton.
var SkinMesh = function(gl) {
	// Original positions refer to the original mesh data.
	// This is the data that will be haved to transformed with the current state of the skeleton.
	this.mOriginalPositions = new Array();
	this.mIndices = new Array();
	
	// During joints in the skeleton are changed, the underlying attached
	// vertices in
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
	this.mMaxNumJointsPerVertex = 3;
	this.mAllWeights = new Array();
	
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
SkinMesh.prototype.createCylinderSkinX = function(rad) {
	// Create a cylinder from [-2 : 2]
	var startX = -2.0;
	var endX = 2.0;
	var numXSegments = 16;
	var numThetaBands = 16;
	var factor = (endX - startX) / numXSegments;

	var radius = 1.0;
	if (rad)
		radius = rad;

	// Fill in the position data
	for (var i = 0; i <= numXSegments; i++) {
		for (var j = 0; j < numThetaBands; j++) {
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
				this.mIndices.push(i0 * numThetaBands + j0);
				this.mIndices.push(i0 * numThetaBands + j1);
				this.mIndices.push(i1 * numThetaBands + j1);
				this.mIndices.push(i0 * numThetaBands + j0);
				this.mIndices.push(i1 * numThetaBands + j1);
				this.mIndices.push(i1 * numThetaBands + j0);
			}
		}
		startX = startX + factor;
	}

	// create the mesh
	this.mesh = new TriangleMesh(this.gl, this.mTransformedPositions,
			this.mIndices, this.shader);
}

SkinMesh.prototype.createArmSkin = function() {

	for (var i = 0; i < armPositions.length; i++) {
		this.mOriginalPositions.push(armPositions[i]);
		this.mTransformedPositions.push(armPositions[i]);
	}

	// Do zero offsetting for obj file using a '1'-indexing scheme
	for (var i = 0; i < armIndices.length; i++) {
		this.mIndices.push(armIndices[i] - 1);
	}

	// compute only edge segments
	this.newIndices = new Array();

	for (var i = 0; i < armIndices.length / 3; i++) {
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

	this.mesh = new TriangleMesh(this.gl, this.mTransformedPositions,
			this.newIndices, this.shader);
}

// Attaches a skeleton to the skin effectively 'binding' it.
// Once attached, the binding matrices for each joint are to be computed.
// And corresponding weights for each vertex have to be computed.
SkinMesh.prototype.setSkeleton = function(val, mode) {
	this.mSkeleton = val;

	if (this.mSkeleton)
		this.mSkeleton.computeBindingMatrices();

	// We have a skeleton now.
	// We can compute weights for each vertex
	this.mSkinMode = mode;
	if (mode == "linear") {
		this.computeLinearBlendedWeights();
	} 
	else {
		this.computeRigidWeights();
	}
}

// This function enables the stripping of weights from the weight array
// into a custom mesh that is shown to the user. This is very useful for debugging the weighting scheme.
// NOTE: Make sure to pass in a valid 'id' for the joint.
//       This function expects the joints to be 'zero' indexed.
//       This is already done by the UI code correctly.
//       A negative joint id disables displaying the weights
SkinMesh.prototype.showJointWeights = function(id) {
	this.mShowWeights = id >= 0;
	this.mWeightJoint = id;

	if (this.mShowWeights && this.mSkeleton) {
		// weights was toggled
		// create a new mesh with the correct weights
		this.mSelectedJointWeights = new Array();
		var numJoints = this.mSkeleton.getNumJoints();

		for (var i = 0; i < this.mOriginalPositions.length / 3; i++) {
			// get only weights for the joint selected
			// var temp = this.mWeights[i * numJoints + this.mWeightJoint];
			var temp = this.getVertexWeight(i, this.mWeightJoint);
			this.mSelectedJointWeights.push(temp);
		}

		this.mWeightMesh = new WeightShadedTriangleMesh(this.gl,
				this.mTransformedPositions, this.mSelectedJointWeights,
				this.mIndices, this.wShader)
	} 
	else {
		console.log("No skeleton bound to compute weights");
	}
}

// Helper function to retrieve weights with respect to a particular joint
// for a given vertex.
SkinMesh.prototype.getVertexWeight = function(idx, joint) {
	var numJoints = this.mSkeleton.getNumJoints();
	if (joint < numJoints) {
		return this.mAllWeights[idx * numJoints + joint];
	}
}

// Helper function to return the number of vertices in the current mesh
SkinMesh.prototype.getNumVertices = function() {
	return this.mOriginalPositions.length / 3;
}

// Helper method to get a vertex with 'id'
SkinMesh.prototype.getVertex = function(idx) {
	return new Vector(this.mOriginalPositions[idx * 3 + 0],
			          this.mOriginalPositions[idx * 3 + 1],
			          this.mOriginalPositions[idx * 3 + 2]);
}

// Helper method to set a transformed vertex into the correct location.
SkinMesh.prototype.setTransformedVertex = function(idx, vtx) {
	this.mTransformedPositions[idx * 3 + 0] = vtx.x;
	this.mTransformedPositions[idx * 3 + 1] = vtx.y;
	this.mTransformedPositions[idx * 3 + 2] = vtx.z;
}

// Returns the joint for which the vertex has a weight 1.
// Essentially returning the rigid joint.
SkinMesh.prototype.getRigidlyAttachedJoint = function(id) {
	var numJoints = this.mSkeleton.getNumJoints();
	numJointsPerVertex = Math.min(numJoints, this.mMaxNumJointsPerVertex);
	for (var b = 0; b < numJointsPerVertex; b++) {
		if (this.mWeights[id * numJointsPerVertex + b] == 1)
			return this.mJointIds[id * numJointsPerVertex + b];
	}
}

// NOTE: This function computes fixed weights only for the cylinder mesh
//       Don't use this function for other meshes. It assumes there are only two joints
// 		 as indicated in the assignment.
//
// NOTE: If you intend to use this function for any other mesh, you should change it appropriately.
SkinMesh.prototype.computeRigidWeights = function() {
	if (this.mSkeleton) {
		for (var i = 0; i < this.getNumVertices(); i++) {
			var pos = this.getVertex(i);

			if (pos.x < 0.0) {
				this.mAllWeights.push(1);
				this.mAllWeights.push(0);
				this.mWeights.push(1);
				this.mWeights.push(0);
			} else {
				this.mAllWeights.push(0);
				this.mAllWeights.push(1);
				this.mWeights.push(0);
				this.mWeights.push(1);
			}
			this.mJointIds.push(0);
			this.mJointIds.push(1);
		}
	} 
	else {
		console.log("No skeleton bound to skin");
	}
}	

// TODO: Task 1 - Subtask 2
// Implement rigid skinning
SkinMesh.prototype.rigidSkinning = function() {
	// If skeleton is present
	// for all vertices in the mesh	
		// get rigid joint for vertex
		// get the transform of the joint
		// get the binding transform of the joint
		// compute the final transformed vertex
		// update the correct transformed position.
		
	if(this.mSkeleton) {
		//console.log("TODO: Add your rigid skinning code here")
		for (var i = 0; i < this.getNumVertices(); i++) {
			vertex = this.getVertex(i);
			joint = this.mSkeleton.getJoint(this.getRigidlyAttachedJoint(i));
			worldTransform = joint.getWorldMatrix();
			// inverse of binding matrix is used to transform 
			// a point in world-space to a point in the local space 
			bindingTransform = Matrix.inverse(joint.getBindingMatrix());
			transform = Matrix.multiply(worldTransform, bindingTransform);
			vertex = transform.transformPoint(vertex);
			this.setTransformedVertex(i, vertex);
		}
	}
	else {
		console.log("No skeleton bound with skin");
	}
	
}

//TODO: Task 2 - Subtask 2
//
// Compute the weights for all vertices by considering a set of 'n' joints
// and compute blending weights for each vertex. 
SkinMesh.prototype.computeLinearBlendedWeights = function() {
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
			
	if(this.mSkeleton) {
//		console.log("Todo : Add your linear blended weights computation here.");
		for (var i = 0; i < this.getNumVertices(); i++) {
			weights = new Array();
			weights_norm = 0;
			pt = this.getVertex(i);
			var numJoints = this.mSkeleton.getNumJoints();

			// compute the weight for each joints
			for (var j = 0; j < numJoints; j++) {
				joint = this.mSkeleton.getJoint(j);
				var vertex0 = joint.getWSJointEndPts().v0;
				var vertex1 = joint.getWSJointEndPts().v1;
				d = computeDistanceToLine(pt, vertex0, vertex1);
				w = 1 / Math.pow(d, 4);
				weights[j] = [w, j];
				this.mAllWeights[i * numJoints + j] = w;
				weights_norm += w;
			}
			
			// mAllWeights is the weights for display only, save weights for all joints 
			for (var j = 0; j < numJoints; j++) {
				this.mAllWeights[i * numJoints + j] /= weights_norm;
			}
			
			// mWeights is the weights for binding the skin
			// it only save the first maxNumJointsPerVertex
			// in order to speed up the animation 
			weights.sort(function (a, b) { 
		    	return a[0] < b[0] ? -1 : 1; 
		    });
			weights.reverse();
			
			numJointsPerVertex = Math.min(numJoints, this.mMaxNumJointsPerVertex);

			var norm = 0;
			for (var j=0; j < numJointsPerVertex; j++) {
				norm += weights[j][0];
			}
			
			for (var j=0; j < numJointsPerVertex; j++) {
				w = weights[j][0] / norm;
				this.mWeights[i * numJointsPerVertex + j] = w;
				this.mJointIds[i * numJointsPerVertex + j] = weights[j][1];
			}
		}
	}
	else {
		console.log("No skeleton bound with skin");
	}
}

// TODO: Task 2 - Subtask 2
// Implement linear blended skinning
SkinMesh.prototype.linearBlendSkinning = function() {
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
		
	if(this.mSkeleton) {
//		console.log("TODO: add your linear blended skinning code here.");
		for (var i = 0; i < this.getNumVertices(); i++) {
			var vertex = this.getVertex(i);
			var tempVertex = new Vector(0, 0, 0);
			
			var numJoints = this.mSkeleton.getNumJoints();
			numJointsPerVertex = Math.min(numJoints, this.mMaxNumJointsPerVertex);
			for (var j = 0; j < numJointsPerVertex; j++) {
				var weight = this.mWeights[i * numJointsPerVertex + j];
				var jointId = this.mJointIds[i * numJointsPerVertex + j];
				
				var joint = this.mSkeleton.getJoint(jointId);
				var worldTransform = joint.getWorldMatrix();
				var bindingTransform = Matrix.inverse(joint.getBindingMatrix());
				var transform = Matrix.multiply(worldTransform, bindingTransform);
				
				var transformedVertex = transform.transformPoint(vertex);
				transformedVertex = transformedVertex.multiply(weight);
				
				tempVertex = tempVertex.add(transformedVertex);
			}
			this.setTransformedVertex(i, tempVertex);
		}
	}
	else {
		console.log("No skeleton bound with skin");
	}
}

// Update skin called whenever a change is detected in the joint.
// Typically caused by the UI angle change
// However in case of animations, you can use this function to do the same functionality.
SkinMesh.prototype.updateSkin = function() {
	if (this.mSkinMode == "rigid") {
		this.rigidSkinning();

	} else if (this.mSkinMode == "linear") {
		this.linearBlendSkinning();
	}

	if (!this.mShowWeights)
		this.mesh = new TriangleMesh(this.gl, this.mTransformedPositions,
				this.mIndices, this.shader);
	else
		this.mWeightMesh = new WeightShadedTriangleMesh(this.gl,
				this.mTransformedPositions, this.mSelectedJointWeights,
				this.mIndices, this.wShader)
}

// Renders a skin mesh with the selected options.
SkinMesh.prototype.render = function(gl, view, projection, drawWireFrame) {
	if (!this.mShowWeights) {
		if (this.mesh) {
			this.mesh.render(gl, new Matrix(), view, projection, drawWireFrame);
		}
	} else {
		if (this.mWeightMesh && this.mSkeleton) {
			this.mWeightMesh.render(gl, new Matrix(), view, projection);
		}
	}
}