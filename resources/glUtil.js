function setupTask(canvasId, taskFunction) {
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

    timer = new Slider(sliderTarget, 0, 720, play_time, true, function(jointId, jointName, time) {
        play_time = time;
        value = 0
        if (task5Curve) {
            task5Curve.drawTask5(time)
            value = 153 - task5Curve.getValue(time);
        }
        this.setLabel(jointName + ': ' + time + ' frame');
        task.setJointAngle(jointId, value);
    }, [jointId, jointName]);


    document.getElementById("play").addEventListener('click', function(event) {
        animation_play = !animation_play;

    if (animation_play) {
        i = play_time;
        interval = setInterval(function(){
            value = 0
            task.setJointAngle(jointId, value);
            timer.setTimer(play_time);
            timer.setLabel(jointName + ': ' + i + ' frame');
            i = (i + 1) % 720;
            play_time = i;
        }, 1);
    }

    else {
        clearInterval(interval);
    }

    });


    document.getElementById("set").addEventListener('click', function(event) {

        if (task5Curve) {
                var v = parseInt(document.getElementById("value").value);
               // task5Curve.drawTask5(1);
                task5Curve.addNode(play_time, v);
            }

    });

    
    // var groupTarget = div();
    // uiContainer.appendChild(div('button-group-container', groupTarget));
    // new ButtonGroup(groupTarget, "Save", function(idx) {
    //     task.showJointWeights(idx - 1);
    // });
    // uiContainer.appendChild(div('button', groupTarget));
    // new Button(groupTarget, "Save", function(idx) {
    //     this.setLabel("Save");
    // });

    canvas.parentNode.appendChild(uiContainer);
    this.angle = 1;
    var flag = true;//increase
    var renderLoop = function() {
        task.render(gl, renderWidth, renderHeight);
        window.requestAnimationFrame(renderLoop);
    }
    window.requestAnimationFrame(renderLoop);

    console.log(animation_play);
    
    return task;
}
