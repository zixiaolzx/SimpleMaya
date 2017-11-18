function setupTask(canvasId, taskFunction) {
    console.log("setuptask");
    var canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.log("Could not find canvas with id", canvasId);
        return;
    }
    
    try {
        var gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    } catch (e) {}
    if (!gl) {
        console.log("Could not initialise WebGL");
        return;
    }
    
    var renderWidth, renderHeight;
    function computeCanvasSize() {
        renderWidth = Math.min(canvas.parentNode.clientWidth - 20, 820);
        renderHeight = Math.floor(renderWidth*9.0/16.0);
        canvas.width = renderWidth - 100;
        canvas.height = renderHeight;
        gl.viewport(0, 0, renderWidth, renderHeight);
    }
    
    window.addEventListener('resize', computeCanvasSize);
    computeCanvasSize();
    
    var task = new taskFunction(gl);
    
    var mouseDown = false;
    var lastMouseX, lastMouseY;
    var mouseMoveListener = function(event) {
        task.dragCamera(event.screenX - lastMouseX, event.screenY - lastMouseY);
        lastMouseX = event.screenX;
        lastMouseY = event.screenY;
    };
    canvas.addEventListener('mousedown', function(event) {
        if (!mouseDown && event.button == 0) {
            mouseDown = true;
            lastMouseX = event.screenX;
            lastMouseY = event.screenY;
            document.addEventListener('mousemove', mouseMoveListener);
        }
        event.preventDefault();
    });
    document.addEventListener('mouseup', function(event) {
        if (mouseDown && event.button == 0) {
            mouseDown = false;
            document.removeEventListener('mousemove', mouseMoveListener);
        }
    });

    var uiContainer = div();
    var weightSelector = ["Save"];
    var sliderTarget = div();
    var jointName = "a";
    var jointId = 1;


    uiContainer.appendChild(div('slider-container', sliderTarget));    


    document.getElementById("axis_tx").addEventListener('click', function(event) {
        if (axis != 1) {
            axis = 1;
            task5Curve.nodes = tx_nodes;
            task5Curve.tangents = tx_tangents;
        }
        changeBtnColor(axis);
    });

    document.getElementById("axis_ty").addEventListener('click', function(event) {
        if (axis != 2) {
            axis = 2;
            task5Curve.nodes = ty_nodes;
            task5Curve.tangents = ty_tangents;
        }
        changeBtnColor(axis);
    });

    document.getElementById("axis_tz").addEventListener('click', function(event) {
        if (axis != 3) {
            axis = 3;
            task5Curve.nodes = tz_nodes;
            task5Curve.tangents = tz_tangents;
        }
        changeBtnColor(axis);
    });


    document.getElementById("axis_rx").addEventListener('click', function(event) {
        if (axis != 4) {
            axis = 4;
            task5Curve.nodes = rx_nodes;
            task5Curve.tangents = rx_tangents;
        }
        changeBtnColor(axis);
    });

    document.getElementById("axis_ry").addEventListener('click', function(event) {
        if (axis != 5) {
            axis = 5;
            task5Curve.nodes = ry_nodes;
            task5Curve.tangents = ry_tangents;
        }
        changeBtnColor(axis);
    });

    document.getElementById("axis_rz").addEventListener('click', function(event) {
        if (axis != 6) {
            axis = 6;
            task5Curve.nodes = rz_nodes;
            task5Curve.tangents = rz_tangents;
        }
        changeBtnColor(axis);
    });







    document.getElementById("load0").addEventListener('click', function(event) {
        task.selectModel(0);
        console.log("load cube");
    });

    document.getElementById("load1").addEventListener('click', function(event) {
        task.selectModel(1);
        console.log("load Torus");
    });

    document.getElementById("load2").addEventListener('click', function(event) {
        task.selectModel(2);
        console.log("load Sphere");
    });

    document.getElementById("load3").addEventListener('click', function(event) {
        task.selectModel(3);
        console.log("load Icosahedron");
    });

    document.getElementById("load4").addEventListener('click', function(event) {
        task.selectModel(4);
        console.log("load Octahedron");
    });


    document.getElementById("saveKey").addEventListener('click', function(event) {
        writeFile();
        // console.log("save key");
        // window.alert("You saved the keys!");
    });

    document.getElementById("keyFile").addEventListener('change', readFile, false);


    timer = new Slider(sliderTarget, 0, 720, play_time, true, function(jointId, jointName, time) {
        play_time = time;
        value = 0;
        value_tx = 0;
        value_ty = 0;
        value_tz = 0;
        value_rx = 0;
        value_ry = 0;
        value_rz = 0;
        if (task5Curve) {
            task5Curve.drawTask5(time)
            value = 153 - task5Curve.getValue(time);
            value_tx = 153 - task5Curve.getValueByAxis(time, tx_nodes, tx_tangents);
            value_ty = 153 - task5Curve.getValueByAxis(time, ty_nodes, ty_tangents);
            value_tz = 153 - task5Curve.getValueByAxis(time, tz_nodes, tz_tangents);
            value_rx = 153 - task5Curve.getValueByAxis(time, rx_nodes, rx_tangents);
            value_ry = 153 - task5Curve.getValueByAxis(time, ry_nodes, ry_tangents);
            value_rz = 153 - task5Curve.getValueByAxis(time, rz_nodes, rz_tangents);
        }

        if (task.name == "arms") {
            task.setJointAngle(jointId, value);
        }
        else {
            task.setTranslation(value_tx, value_ty, value_tz);
            task.setRotation(value_rx, value_ry, value_rz);
        }
        this.setLabel(time + ' frame');
        
    }, [jointId, jointName]);


    document.getElementById("play").addEventListener('click', function(event) {
        animation_play = !animation_play;

    if (animation_play) {
        i = play_time;
        interval = setInterval(function(){
            value = 0
            timer.setTimer(play_time);
            timer.setLabel(i + ' frame');
            i = (i + 1) % 720;
            play_time = i;
        }, 1);
    }

    else {
        clearInterval(interval);
    }

    });


    document.getElementById("setnode").addEventListener('click', function(event) {
        if (task5Curve) {
                var v = 153 - parseInt(document.getElementById("value").value);
               // task5Curve.drawTask5(1);
               if (v) {
                    task5Curve.addNode(play_time, v);
               }
            }

    });


    document.getElementById("deletenode").addEventListener('click', function(event) {
        console.log("delete here");
        if (task5Curve) {
            console.log(task5Curve.activeID);
               if(task5Curve.activeID != -1){
                 var i = task5Curve.activeID;
                 console.log("::");
                 task5Curve.deleteNode(task5Curve.nodes, i);
                 task5Curve.activeID = -1;
               }
            }

    });


    canvas.parentNode.appendChild(uiContainer);
    this.angle = 1;
    var flag = true;//increase
    var renderLoop = function() {
        task.render(gl, renderWidth, renderHeight);
        window.requestAnimationFrame(renderLoop);
    }
    window.requestAnimationFrame(renderLoop);

    return task;
}



var VertexSource = `
    uniform mat4 ModelViewProjection;
    
    attribute vec3 Position;
    
    void main() {
        gl_Position = ModelViewProjection*vec4(Position, 1.0);
    }
`;
var FragmentSource = `
    precision highp float;
    
    uniform vec4 Color;

    void main() {
        gl_FragColor = Color;
    }
`;


var TriangleMesh2 = function(gl, vertexPositions, indices, edgeIndices) {
    this.indexCount = indices.length;
    this.edgeIndexCount = edgeIndices.length;
    this.positionVbo = createVertexBuffer(gl, vertexPositions);
    this.indexIbo = createIndexBuffer(gl, indices);
    this.edgeIndexIbo = createIndexBuffer(gl, edgeIndices);
    this.shaderProgram = createShaderProgram(gl, VertexSource, FragmentSource);
}

TriangleMesh2.prototype.render = function(gl, model, view, projection, drawFaces, drawWireframe, wireColor) {
    drawFaces = defaultArg(drawFaces, true);
    drawWireframe = defaultArg(drawWireframe, true);
    wireColor = defaultArg(wireColor, new Vector(0, 0, 0));

    var modelViewProjection = projection.multiply(view).multiply(model);
    
    gl.useProgram(this.shaderProgram);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionVbo);
    var positionAttrib = gl.getAttribLocation(this.shaderProgram, "Position");
    gl.enableVertexAttribArray(positionAttrib);
    gl.vertexAttribPointer(positionAttrib, 3, gl.FLOAT, false, 0, 0);
    
    if (drawFaces) {
        gl.uniformMatrix4fv(gl.getUniformLocation(this.shaderProgram, "ModelViewProjection"), false, modelViewProjection.transpose().m); 
        gl.uniform4f(gl.getUniformLocation(this.shaderProgram, "Color"), 0.95, 0.95, 0.95, 1); 
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexIbo);
        gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
    }
    
    if (drawWireframe) {
        gl.lineWidth(2.0);
        
        modelViewProjection = Matrix.translate(0, 0, -1e-4).multiply(modelViewProjection);
        gl.uniformMatrix4fv(gl.getUniformLocation(this.shaderProgram, "ModelViewProjection"), false, modelViewProjection.transpose().m); 
        
        gl.uniform4f(gl.getUniformLocation(this.shaderProgram, "Color"), wireColor.x, wireColor.y, wireColor.z, 1); 
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.edgeIndexIbo);
        gl.drawElements(gl.LINES, this.edgeIndexCount, gl.UNSIGNED_SHORT, 0);
    }
}



var writeFile = function() {
     var data = {
        mesh: meshid,
        translate_x: tx_nodes,
        translate_x_tangent: tx_tangents,

        translate_y: ty_nodes,
        translate_y_tangent: ty_tangents,

        translate_z: tz_nodes,
        translate_z_tangent: tz_tangents, 

        rotate_x: rx_nodes,
        rotate_x_tangent: rx_tangents,

        rotate_y: ry_nodes,
        rotate_y_tangent: ry_tangents,

        rotate_z: rz_nodes,
        rotate_z_tangent: rz_tangents
        }

    var jsonData = JSON.stringify(data);
    var a = document.createElement("a");
    var file = new Blob([jsonData], {type: 'text/plain'});
    a.href = URL.createObjectURL(file);
    a.download = 'keys.txt';
    a.click();
}


var readFile = function(evt) {
    var files = evt.target.files;
    var x = document.getElementById("keyFile").value;


    var reader = new FileReader();
    reader.onload = function(e) {
        // e.target.result should contain the text
        // console.log(e.target.result);
        try {
            var loadedData = JSON.parse(e.target.result)
            meshid = loadedData.mesh;
            console.log(tx_nodes);
            tx_nodes = convertToNode(loadedData.translate_x);
            tx_tangents = convertToNode(loadedData.translate_x_tangent);
            ty_nodes = convertToNode(loadedData.translate_y);
            ty_tangents = convertToNode(loadedData.translate_y_tangent);
            tz_nodes = convertToNode(loadedData.translate_z);
            tz_tangents = convertToNode(loadedData.translate_z_tangent);

            rx_nodes = convertToNode(loadedData.rotate_x);
            rx_tangents = convertToNode(loadedData.rotate_x_tangent);
            ry_nodes = convertToNode(loadedData.rotate_y);
            ry_tangents = convertToNode(loadedData.rotate_y_tangent);
            rz_nodes = convertToNode(loadedData.rotate_z);
            rz_tangents = convertToNode(loadedData.rotate_z_tangent);
            
            axis = 1;
            task5Curve.nodes = tx_nodes;
            task5Curve.tangents = tx_tangents;
            changeBtnColor(axis);
        } catch (ex) {
            console.error(ex);
        }
    };
    reader.readAsText(files[0]);


}

var convertToNode = function(list) {
    nodes = new Array();
    for (var i = 0; i < list.length; i++) {
        nodes.push(new Node(list[i].x, list[i].y))
    }
    return nodes;
}


var changeBtnColor = function(id) {
    document.getElementById("axis_tx").className = 'btn btn-default'
    document.getElementById("axis_ty").className = 'btn btn-default'
    document.getElementById("axis_tz").className = 'btn btn-default'
    document.getElementById("axis_rx").className = 'btn btn-default'
    document.getElementById("axis_ry").className = 'btn btn-default'
    document.getElementById("axis_rz").className = 'btn btn-default'

    if (id == 1) 
        document.getElementById("axis_tx").className = 'btn btn-primary'
    if (id == 2)
        document.getElementById("axis_ty").className = 'btn btn-primary'
    if (id == 3)
        document.getElementById("axis_tz").className = 'btn btn-primary'
    if (id == 4)
        document.getElementById("axis_rx").className = 'btn btn-primary'
    if (id == 5)
        document.getElementById("axis_ry").className = 'btn btn-primary'
    if (id == 6)
        document.getElementById("axis_rz").className = 'btn btn-primary'
}