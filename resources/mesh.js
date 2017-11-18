var Mesh = function(vertices, faces, joinVerts) {
    this.vertices = vertices;
    this.faces = faces;
    
    if (joinVerts)
        this.joinVertices();
}

Mesh.prototype.joinVertices = function() {
    var vertexMap = {};
    var vertexIndices = [];
    var vertices = [];
    
    function stringCoord(a) {
        if (Math.abs(a) < 1e-3)
            a = 0;
        return a.toFixed(3);
    }
    
    for (var i = 0; i < this.vertices.length; ++i) {
        var key =
            stringCoord(this.vertices[i].x) + ":" +
            stringCoord(this.vertices[i].y) + ":" +
            stringCoord(this.vertices[i].z);
        
        if (key in vertexMap) {
            vertexIndices.push(vertexMap[key]);
        } else {
            vertexMap[key] = vertices.length;
            vertexIndices.push(vertices.length);
            vertices.push(this.vertices[i]);
        }
    }
    
    this.vertices = vertices;
    for (var i = 0; i < this.faces.length; ++i) {
        for (var j = 0; j < this.faces[i].length; ++j)
            this.faces[i][j] = vertexIndices[this.faces[i][j]];
        
        for (var j = 0, k = this.faces[i].length - 1; j < this.faces[i].length;) {
            if (this.faces[i][k] == this.faces[i][j])
                this.faces[i].splice(j, 1);
            else {
                k = j;
                j++;
            }
        }
    }
}

Mesh.prototype.toTriangleMesh = function(gl) {
    var positions = [];
    for (var i = 0; i < this.vertices.length; ++i) {
        positions.push(this.vertices[i].x);
        positions.push(this.vertices[i].y);
        positions.push(this.vertices[i].z);
    }
    
    var edgeIndices = [];
    var indices = [];
    for (var i = 0; i < this.faces.length; ++i) {
        for (var j = 0; j < this.faces[i].length - 2; ++j) {
            indices.push(this.faces[i][0]);
            indices.push(this.faces[i][j + 1]);
            indices.push(this.faces[i][j + 2]);
        }
        for (var j = 0, k = this.faces[i].length - 1; j < this.faces[i].length; k = j, ++j)
            edgeIndices.push(this.faces[i][k], this.faces[i][j]);
    }
    return new TriangleMesh2(gl, positions, indices, edgeIndices);
}


function yourMesh() {
    // TODO: Insert your own creative mesh here
    var vertices = [
        // new Vector( 0,  1,  0),
        // new Vector(-1, -1,  0),
        // new Vector( 0, -1, -1),
        // new Vector( 1, -1,  0),
        // new Vector( 0, -1,  1),
        
        // new Vector( 0, -1,  0),
        // new Vector(-1,  1,  0),
        // new Vector( 0,  1, -1),
        // new Vector( 1,  1,  0),
        // new Vector( 0,  1,  1)
    ];

    var faces = [
        // [0, 1, 2],
        // [0, 2, 3],
        // [0, 3, 4],
        // [0, 4, 1],
        // [1, 2, 3, 4],
        
        // [5, 6, 7],
        // [5, 7, 8],
        // [5, 8, 9],
        // [5, 9, 6],
        // [6, 7, 8, 9]
    ];

    return new Mesh(vertices, faces);
}



var Task3 = function(gl) {
    this.name = "mesh";
    this.translate = [0, 0, 0]
    this.rotation = [0, 0, 0]
    this.pitch = 0;
    this.yaw = 0;
    this.subdivisionLevel = 0;
    this.selectedModel = 5;
    this.gl = gl;

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    this.baseMeshes = [];
    for (var i = 0; i < 6; ++i)
        this.baseMeshes.push(this.baseMesh(i).toTriangleMesh(gl));

    this.computeMesh();
}

Task3.prototype.baseMesh = function(modelIndex) {
    switch(modelIndex) {
    case 0: return createCubeMesh(); break;
    case 1: return createTorus(8, 4, 0.5); break;
    case 2: return createSphere(4, 3); break;
    case 3: return createIcosahedron(); break;
    case 4: return createOctahedron(); break;
    case 5: return yourMesh(); break;
    }
    return null;
}

Task3.prototype.setSubdivisionLevel = function(subdivisionLevel) {
    this.subdivisionLevel = subdivisionLevel;
    this.computeMesh();
}

Task3.prototype.selectModel = function(idx) {
    this.selectedModel = idx;
    this.computeMesh();
}

Task3.prototype.computeMesh = function() {
    var mesh = this.baseMesh(this.selectedModel);
    this.mesh = mesh.toTriangleMesh(this.gl);
}

Task3.prototype.render = function(gl, w, h) {
    gl.viewport(0, 0, w, h);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);



    var projection = Matrix.perspective(50, w/h, 0.5, 100);
    var view =
        Matrix.translate(-2.5, 0, -20).multiply(
        Matrix.rotate(this.pitch, 1, 0, 0)).multiply(
        Matrix.rotate(this.yaw+5, 0, 1, 0));


    translate_transform = Matrix.translate(this.translate[0], this.translate[1], this.translate[2]);
    rotationX_transform = Matrix.rotate(this.rotation[0], 1, 0, 0);
    rotationY_transform = Matrix.rotate(this.rotation[1], 0, 1, 0);
    rotationZ_transform = Matrix.rotate(this.rotation[2], 0, 0, 1);
    rotation_transform = rotationX_transform.multiply(rotationY_transform).multiply(rotationZ_transform);
    transform = translate_transform.multiply(rotation_transform);
    transformed_view = view.multiply(transform);


    var model = new Matrix();

    if (this.subdivisionLevel > 0)
        this.baseMeshes[this.selectedModel].render(gl, model, transformed_view, projection, false, true, new Vector(0.7, 0.7, 0.7));


    this.mesh.render(gl, model, transformed_view, projection);
}


Task3.prototype.dragCamera = function(dx, dy) {
    this.pitch = Math.min(Math.max(this.pitch + dy*0.5, -90), 90);
    this.yaw = this.yaw + dx*0.5;
}


Task3.prototype.setJointAngle = function(id, value) {
    if (value) {
        t = -5 + value / 130 * 10;
        if (axis == 1) {
            this.translate = [t, 0, 0];
        }
        else if (axis == 2) {
            this.translate = [0, t, 0];
        }
        else if (axis == 3) {
            this.translate = [0, 0, t];
        }
    }
}

Task3.prototype.setTranslation = function(x, y, z) {
    if (x != 0) x = -5 + x / 130 * 10;
    if (y != 0) y = -5 + y / 130 * 10;
    if (z != 0) z = -5 + z / 130 * 10;
    this.translate = [x, y, z];
}

Task3.prototype.setRotation = function(x, y, z) {
    if (x != 0) x = x;
    if (y != 0) y = y;
    if (z != 0) z = z;
    this.rotation = [x, y, z];
}

 