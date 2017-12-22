/**
 * @file 全景3D标签控制器
 */

var result;
var locationSpherical = new THREE.Spherical();
var locationVector = new THREE.Vector3();

export default class LabelControl {
    constructor(camera, canvasDom, scene) {
        this.camera = camera;
        this.camvasDom = canvasDom;
        this.scene = scene;
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();
    }

    initLocation(location) {
        if (location.h !== undefined && location.v !== undefined) {
            locationSpherical.theta = location.h / 180 * Math.PI;
            locationSpherical.phi = location.v / 180 * Math.PI;
            locationSpherical.radius = 1000;

            locationVector.setFromSpherical(locationSpherical);
            location.x = camera.position.x - locationVector.x;
            location.y = camera.position.y - locationVector.y;
            location.z = camera.position.z - locationVector.z;
        }
    }

    /*labelObj clicked*/
    onLabelobjClick(labelObj, e) {
        if (labelObj.onclick) {
            labelObj.onclick(labelObj, e);
        } else if (labelObj.actionType && labelObj.actionType !== '') {
            switch (labelObj.actionType) {
                case 'scene':
                    WebVR.enterScenebyId(labelObj.sceneId);
                    break;
                case 'link':
                    window.open(labelObj.linkUrl, '_blank');
                    break;
                case 'custom':
                    if (WebVR.controlObj && typeof WebVR.controlObj.labelObjClick === 'function') {
                        WebVR.controlObj.labelObjClick(labelObj);
                    }
                    break;
            }
        }
    }
    /*text*/
    createTextLabel(labelObj) {
        initLocation(labelObj.location);
        var div = document.createElement('div');
        div.id = labelObj.id;
        div.innerHTML = labelObj.labelContent;
        div.style.position = 'absolute';
        if (labelObj.textClass) {
            div.className = labelObj.textClass;
        } else {
            div.style.padding = '0px 4px';
            div.style.backgroundColor = 'rgba(0,0,0,0.3)';
            div.style.whiteSpace = 'nowrap';
            div.style.color = '#fff';
            div.style.borderRadius = '2px';
            div.style.fontSize = '14px';
            div.style.height = '20px';
            div.style.lineHeight = '20px';
        }
        div.onclick = function (e) {
            onLabelobjClick(labelObj, e);
        };
        WebVR.container.appendChild(div);
        labelObj.textDom = div;
    }

    updateTextLabel(labelObj) {
        var halfWidth = WebVR.container.clientWidth / 2;
        var halfHeight = WebVR.container.clientHeight / 2;
        var vector;
        var left = 0;
        var top = 0;
        var position = new THREE.Vector3(labelObj.location.x, labelObj.location.y, labelObj.location.z);
        vector = position.project(camera);
        if (vector.z > 1) {
            top = -1000;
        } else {
            left = Math.round(vector.x * halfWidth + halfWidth);
            top = Math.round(-vector.y * halfHeight + halfHeight);
        }
        labelObj.textDom.style.left = left + 'px';
        labelObj.textDom.style.top = top + 'px';
    }

    hideTextLabel(labelObj) {
        labelObj.textDom.style.display = 'none';
    }

    showTextLabel(labelObj) {
        labelObj.textDom.style.display = 'block';
    }
    /*img */
    createImgLabel(labelObj) {
        var coverTexture = WebVR.textureLoader.load(labelObj.imgUrl);
        var material = new THREE.MeshBasicMaterial({
            map: coverTexture,
            side: THREE.FrontSide,
            transparent: true
        });
        var scale = 1; // window.devicePixelRatio ? window.devicePixelRatio : 1;
        var plane = new THREE.PlaneGeometry(labelObj.imgWidth * scale, labelObj.imgHeight * scale);
        var imgPlaneMesh = new THREE.Mesh(plane, material);
        initLocation(labelObj.location);
        imgPlaneMesh.position.set(labelObj.location.x, labelObj.location.y, labelObj.location.z);
        imgPlaneMesh.name = labelObj.id;
        imgPlaneMesh.labelObj = labelObj;
        if (!labelObj.rotation) {
            imgPlaneMesh.lookAt(camera.position);
        } else {
            imgPlaneMesh.rotation.set(labelObj.rotation.x, labelObj.rotation.y, labelObj.rotation.z);
        }
        labelObj.imgPlaneMesh = imgPlaneMesh;
        if (!labelObj.sceneObj.LabelGroup) {
            labelObj.sceneObj.LabelGroup = new THREE.Group();
            labelObj.sceneObj.LabelGroup.name = labelObj.sceneObj.id;
            scene.add(labelObj.sceneObj.LabelGroup);
        }
        labelObj.sceneObj.LabelGroup.add(imgPlaneMesh);
    }

    hideImgLabel(labelObj) {
        labelObj.imgPlaneMesh.visible = false;
        labelObj.imgPlaneMesh.material.map.dispose();
    }

    showImgLabel(labelObj) {
        labelObj.imgPlaneMesh.visible = true;
    }
    /*animation */
    createAnimationLabel(labelObj) {
        initLocation(labelObj.location);
        var labelPos = new THREE.Vector3(labelObj.location.x, labelObj.location.y, labelObj.location.z);
        var imagePlayer = WebVR.ImagePlayerControl.createImagePlayer(labelPos,
            camera.position,
            labelObj.imgWidth,
            labelObj.imgHeight,
            labelObj.imgDir,
            labelObj.coverImgUrl,
            labelObj.imgCount,
            labelObj.autoPlay === '1',
            labelObj.loop === '1');
        imagePlayer.name = labelObj.id;
        var imagePlayerMesh = imagePlayer.getMesh();
        imagePlayerMesh.name = labelObj.id;
        imagePlayerMesh.labelObj = labelObj;
        if (labelObj.rotation) {
            imagePlayerMesh.rotation.set(labelObj.rotation.x, labelObj.rotation.y, labelObj.rotation.z);
        }
        labelObj.animationObj = imagePlayer;
        if (!labelObj.sceneObj.LabelGroup) {
            labelObj.sceneObj.LabelGroup = new THREE.Group();
            labelObj.sceneObj.LabelGroup.name = labelObj.sceneObj.id;
            scene.add(labelObj.sceneObj.LabelGroup);
        }
        labelObj.sceneObj.LabelGroup.add(imagePlayerMesh);
    }

    updateAnimationLabel(lanelObj) {
        lanelObj.animationObj.update();
    }

    hideAnimationLabel(lanelObj) {
        lanelObj.animationObj.pause();
        lanelObj.animationObj.getMesh().visible = false;
    }

    showAnimationLabel(lanelObj) {
        lanelObj.animationObj.play();
        lanelObj.animationObj.getMesh().visible = true;
    }
    /*event*/
    onTouchstart(event) {
        mouse.x = (event.changedTouches[0].clientX / renderer.domElement.clientWidth) * 2 - 1;
        mouse.y = -(event.changedTouches[0].clientY / renderer.domElement.clientHeight) * 2 + 1;
    }

    onMousedown(event) {
        switch (event.button) {
            case 0:
                mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
                mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;
                break;
        }
    }

    onTouchmove(event) {}

    onMousemove(event) {}

    onTouchend(event) {
        var startX = mouse.x;
        var startY = mouse.y;
        var dis = 0;
        mouse.x = (event.changedTouches[0].clientX / renderer.domElement.clientWidth) * 2 - 1;
        mouse.y = -(event.changedTouches[0].clientY / renderer.domElement.clientHeight) * 2 + 1;
        var dx = mouse.x - startX;
        var dy = mouse.y - startY;
        dis = Math.sqrt(dx * dx + dy * dy);
        if (dis < 0.1) {
            /* 触发点击场景的事件*/
            WebVR.container.dispatchEvent(WebVR.Event.CanvasClickEvent);
            clickCanvas(mouse);
        }
    }

    onMouseup(event) {
        switch (event.button) {
            case 0:
                var startX = mouse.x;
                var startY = mouse.y;
                var dis = 0;
                mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
                mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;
                var dx = mouse.x - startX;
                var dy = mouse.y - startY;
                dis = Math.sqrt(dx * dx + dy * dy);
                if (dis < 0.1) {
                    /* 触发点击场景的事件*/
                    WebVR.container.dispatchEvent(WebVR.Event.CanvasClickEvent);
                    clickCanvas(mouse);
                }
                break;
        }
    }

    clickCanvas(mousePos) {
        var currentScene = WebVR.getCurrentScene();
        if (currentScene && currentScene.LabelGroup) {
            Raycaster.setFromCamera(mousePos, camera);
            var intersects = Raycaster.intersectObjects(currentScene.LabelGroup.children, false);
            if (intersects.length !== 0) {
                onLabelobjClick(intersects[0].object.labelObj);
            }
        }
    }

    bindEvent() {
        var canvasDom = renderer.domElement;
        if (isMobile) {
            canvasDom.addEventListener('touchend', onTouchend, false);
            canvasDom.addEventListener('touchmove', onTouchmove, false);
            canvasDom.addEventListener('touchstart', onTouchstart, false);
        } else {
            canvasDom.addEventListener('mouseup', onMouseup, false);
            canvasDom.addEventListener('mousemove', onMousemove, false);
            canvasDom.addEventListener('mousedown', onMousedown, false);
        }
    }

    updateSceneLabel(scene) {
        if (scene.scene3DLabelGroup && scene.scene3DLabelGroup.length > 0) {
            for (var i = 0; i < scene.scene3DLabelGroup.length; ++i) {
                var labelObj = scene.scene3DLabelGroup[i];
                if (!labelObj.sceneObj) {
                    labelObj.sceneObj = scene;
                }
                switch (labelObj.labelType) {
                    case 'text':
                        if (!labelObj.textDom) {
                            createTextLabel(labelObj);
                        }
                        updateTextLabel(labelObj);
                        break;
                    case 'img':
                        if (!labelObj.imgPlaneMesh) {
                            createImgLabel(labelObj);
                        }
                        /*updateImgLabel(labelObj);*/
                        break;
                    case 'animation':
                        if (!labelObj.animationObj) {
                            createAnimationLabel(labelObj);
                        }
                        updateAnimationLabel(labelObj);
                        break;
                }
            }
        }
    }

    hideSceneLabel(scene) {
        if (scene.scene3DLabelGroup && scene.scene3DLabelGroup.length > 0) {
            for (var i = 0; i < scene.scene3DLabelGroup.length; ++i) {
                var labelObj = scene.scene3DLabelGroup[i];
                switch (labelObj.labelType) {
                    case 'text':
                        if (labelObj.textDom) {
                            hideTextLabel(labelObj);
                        }
                        break;
                    case 'img':
                        if (labelObj.imgPlaneMesh) {
                            hideImgLabel(labelObj);
                        }
                        break;
                    case 'animation':
                        if (labelObj.animationObj) {
                            hideAnimationLabel(labelObj);
                        }
                        break;
                }
            }
        }
    }

    showSceneLabel(scene) {
        if (scene.scene3DLabelGroup && scene.scene3DLabelGroup.length > 0) {
            for (var i = 0; i < scene.scene3DLabelGroup.length; ++i) {
                var labelObj = scene.scene3DLabelGroup[i];
                switch (labelObj.labelType) {
                    case 'text':
                        if (labelObj.textDom) {
                            showTextLabel(labelObj);
                        }
                        break;
                    case 'img':
                        if (labelObj.imgPlaneMesh) {
                            showImgLabel(labelObj);
                        }
                        break;
                    case 'animation':
                        if (labelObj.animationObj) {
                            showAnimationLabel(labelObj);
                        }
                        break;
                }
            }
        }
    }
}