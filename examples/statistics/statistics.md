<div id="test"></div>
<script src="../../dist/lib.js"></script>
<script>
    // start
    bxl.start({
        "title": "test bxl transfer",
        "cretPath": "../assets/cret.pem",
        "info": {
            "author": "交互统计",
        },
        "sceneGroup": [{
            "id": "scene9",
            "texPath": "../assets/scene9",
            "imgPath": "../assets/scene9/scene9.jpg",
            "thumbPath": "../assets/scene9/thumb9.jpg"
        }],
    }, '#test', {
        // 拖动起点
        'scene-drag': function (data, pano) {
            console.log(data);
        },
        // 缩放起点
        'scene-zoom': function (data, pano) {
            console.log(data);
        }
    });
</script>