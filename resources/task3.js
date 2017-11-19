// TODO: Task 3 - Skinning a custom mesh.
//
// In this task you will be skinning a given 'arm' mesh with multiple bones.
// We have already provided the initial locations of the two bones for your convenience
// You will have to add multiple bones to do a convincing job.
var Task4 = function(gl)
{	this.name = "arms"
	this.pitch = 0;
    this.yaw = 0;
	
	// Create a skin mesh
	this.skin = new SkinMesh(gl);
	this.skin.createArmSkin();
	
	// create an empty skeleton for now.
	this.skeleton = new Skeleton();
	
	// TODO: Task-3
	// Create more additional joints as required.
	// and push into the skeleton as required
	this.mJoint1 = new Joint ( 	      null, [  4, 0, 0], [0, 0, 1],  -5, "Upper Arm", gl);
	this.mJoint2 = new Joint (this.mJoint1, [ -6, 0, 0], [0, -1, 0], -5.5, "Forearm", gl);
	this.mJoint3 = new Joint (this.mJoint2, [ -6, 0, 0], [0, 0, 1], -1.8, "Hand", gl);

	this.mJoint4  = new Joint (this.mJoint3, [ -0.6, -0.5, -0.8], [0, 1, 0.8], -0.3, "thumb", gl);
	this.mJoint9  = new Joint (this.mJoint4, [ -0.6, -0.2, -0.3], [0, 1, 0], -0.3, "thumb2", gl);
	this.mJoint14 = new Joint (this.mJoint9, [ -0.4, -0.1, -0.2], [0, 0.8, -0.5], -0.2, "thumb3", gl);
	
	this.mJoint5  = new Joint (this.mJoint3, [ -1.8, -0.4, -0.65], [0, 0, 1], -0.5, "index", gl);
	this.mJoint10 = new Joint (this.mJoint5, [ -0.6, -0.2, -0.1], [0, 0, 1], -0.4, "index2", gl);
	this.mJoint15 = new Joint (this.mJoint10,[ -0.6,  0.0, -0.1], [0, 0, 1], -0.2, "index3", gl);
	
	this.mJoint6  = new Joint (this.mJoint3, [ -2.0, -0.3,  0.0 ], [0, 0, 1], -0.5, "middle", gl);
	this.mJoint11 = new Joint (this.mJoint6, [ -0.6, -0.1, -0.08], [0, 0, 1], -0.4, "middle2", gl);
	this.mJoint16 = new Joint (this.mJoint11,[ -0.6, -0.1, -0.08], [0, 0, 1], -0.3, "middle3", gl);
	
	this.mJoint7  = new Joint (this.mJoint3, [ -1.8, -0.3, 0.6], [0, 0, 1], -0.5, "ring", gl);
	this.mJoint12 = new Joint (this.mJoint7, [ -0.6, -0.1, 0.02], [0, 0, 1], -0.4, "ring2", gl);
	this.mJoint17 = new Joint (this.mJoint12,[ -0.6, -0.1, 0.02], [0, 0, 1], -0.2, "ring3", gl);
	
	this.mJoint8  = new Joint (this.mJoint3, [ -1.6, -0.4, 0.95], [0, 0, 1], -0.3, "pinky", gl);
	this.mJoint13 = new Joint (this.mJoint8, [ -0.4, -0.2, 0.1], [0, 0, 1], -0.3, "pinky2", gl);
	this.mJoint18 = new Joint (this.mJoint13,[ -0.4, -0.2, 0.1], [0, 0, 1], -0.2, "pinky3", gl);
	
	this.skeleton.addJoint(this.mJoint1);
	this.skeleton.addJoint(this.mJoint2);
	this.skeleton.addJoint(this.mJoint3);
	this.skeleton.addJoint(this.mJoint4);
	this.skeleton.addJoint(this.mJoint9);
	this.skeleton.addJoint(this.mJoint14);
	this.skeleton.addJoint(this.mJoint5);
	this.skeleton.addJoint(this.mJoint10);
	this.skeleton.addJoint(this.mJoint15);
	this.skeleton.addJoint(this.mJoint6);
	this.skeleton.addJoint(this.mJoint11);
	this.skeleton.addJoint(this.mJoint16);
	this.skeleton.addJoint(this.mJoint7);
	this.skeleton.addJoint(this.mJoint12);
	this.skeleton.addJoint(this.mJoint17);
	this.skeleton.addJoint(this.mJoint8);
	this.skeleton.addJoint(this.mJoint13);
	this.skeleton.addJoint(this.mJoint18);

	this.skeleton.addJoint(this.mJoint1);
	this.skeleton.addJoint(this.mJoint2);
	this.skeleton.addJoint(this.mJoint3);
	this.skeleton.addJoint(this.mJoint4);
	this.skeleton.addJoint(this.mJoint5);
	this.skeleton.addJoint(this.mJoint6);
	this.skeleton.addJoint(this.mJoint7);
	this.skeleton.addJoint(this.mJoint8);
	this.skeleton.addJoint(this.mJoint9);
	this.skeleton.addJoint(this.mJoint10);
	this.skeleton.addJoint(this.mJoint11);


	// set the skeleton
	this.mShowWeights = false;
	
	// NOTE: Call this only when you are sure that your bones are in the correct location and would rotate in the correct way.
	//       Calling the setSkeleton method 'binds' the skeleton to the underlying mesh.
	//
	//       Commented out so that you can play around before binding.
	//       Uncomment when you want to actually bind it.
	this.skin.setSkeleton(this.skeleton, "linear");
	
	gl.enable(gl.DEPTH_TEST);
}

Task4.prototype.render = function(gl, w, h) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    var projection = Matrix.perspective(60, w/h, 0.1, 100);
    var view =
        Matrix.translate(0, 0, -10).multiply(
        Matrix.rotate(this.pitch, 1, 0, 0)).multiply(
        Matrix.rotate(this.yaw, 0, 1, 0)).multiply(
        Matrix.translate(8, 0, 0)).multiply(
        Matrix.rotate(30, 1, 0, 0));
    
	if(this.skin)
		this.skin.render(gl, view, projection, false);
	
	if(this.skeleton)
	{
		gl.clear(gl.DEPTH_BUFFER_BIT);
		this.skeleton.render(gl, view, projection);
	}
}

Task4.prototype.setJointAngle = function(id, value)
{
	if(this.skeleton && id < this.skeleton.getNumJoints())
	{
		this.skeleton.getJoint(id).setJointAngle(value);
		this.skin.updateSkin();
	}
}

Task4.prototype.dragCamera = function(dx, dy) {
    this.pitch = Math.min(Math.max(this.pitch + dy*0.5, -90), 90);
    this.yaw = this.yaw + dx*0.5;
}

Task4.prototype.showJointWeights = function(idx)
{
	this.skin.showJointWeights(idx);
    this.skin.updateSkin();
}
