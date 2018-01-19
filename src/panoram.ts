import {WebGLRenderer, Scene, CubeTextureLoader, PerspectiveCamera, Vector3, BackSide, MeshBasicMaterial, SphereGeometry, Mesh, CubeRefractionMapping, Math as TMath} from 'three';
import OrbitControl from './controls/orbitControl';
import DeviceControl from './controls/deviceControl';
import EventEmitter from './event';
import Log from './log';
import Loader from './loader';
import Util from './util';
import Tween from './animation/tween.animation';

/**
 * @file 全景渲染
 */

const defaultOpts = {
    fov: 55,
    fog: null
};

export default class Panoram {
    opts = null;
    root = null;
    webgl = null;
    scene = null;
    camera = null;
    skyBox = null;
    orbitControl = null;
    deviceControl = null;
    currentScene = null;
    event = new EventEmitter();
    loader = new CubeTextureLoader();
    group = [];
    pluginList = [];

    constructor(opts) {
        this.opts = Object.assign({}, defaultOpts, opts);
        this.initEnv();
        this.initControl();
        this.dispatch('render-init', this);
    }

    initEnv() {
        const opts = this.opts;
        const root = this.root = opts.el;
        const size = this.calcSize(opts, root);
        // 渲染器
        const webgl = this.webgl = new WebGLRenderer({alpha: true, antialias: true});
        webgl.autoClear = true;
        webgl.setPixelRatio(window.devicePixelRatio);
        webgl.setSize(size.width, size.height);
        // 容器 element
        root.className = 'panoram-root';
        root.appendChild(webgl.domElement);
        // 场景, 相机
        this.scene = new Scene();
        this.camera = new PerspectiveCamera(opts.fov, size.aspect, 0.1, 10000);
        // fog ?
    }

    /**
     * 初始化场景控制器和陀螺仪
     */
    initControl() {
        const opts = this.opts;
        const vector = new Vector3(0, 0, 1);
        const control = this.orbitControl = new OrbitControl(this.camera, this.webgl.domElement);
        // look at front
        control.target = vector;
        control.target0 = vector.clone();
        control.autoRotate = opts.autoRotate;
        // look at angle
        this.setLook(opts.lng, opts.lat);
        // mobile gyro
        if (Util.isMobile) {
            this.deviceControl = new DeviceControl(this.camera, control);
        }
    }

    /**
     * 渲染预览图纹理
     * @param {Object} texture 纹理贴图 
     */
    initMesh(texture) {
        const material = new MeshBasicMaterial({
            envMap: texture,
            side: BackSide,
            refractionRatio: 0,
            reflectivity: 1
        });
        const geometry = new SphereGeometry(2000, 32, 16);
        const skyBox = this.skyBox = new Mesh(geometry, material);

        this.scene.add(skyBox);
        this.dispatch('scene-init', this);
    }

    /**
     * 初始化资源配置
     * @param {Object} source 配置对象 
     */
    initSource(source) {
        const group = this.group = source.sceneGroup;
        const scene = group.find(item => item.id == source.defaultSceneId);

        return (this.currentScene = scene || group[0]);
    }

    calcSize(opts, elem) {
        const winWidth = window.innerWidth;
        const winHeight = window.innerHeight;
        let width = parseInt(opts.width) || elem.clientWidth || winWidth;
        let height = parseInt(opts.height) || elem.clientHeight || winHeight;

        /%$/.test(opts.width) && (width = width / 100 * winWidth);
        /%$/.test(opts.height) && (height = height / 100 * winHeight);

        return {width, height, aspect: width / height};
    }

    updateControl() {
        if (this.deviceControl && this.deviceControl.enabled) {
            this.deviceControl.update();
        } else {
            this.orbitControl.update();
        }
    }

    /**
     * 设置相机角度, 相机方向 (0, 0, -1), z 轴正方向为中心点
     * 与 overlay 球面描述坐标保持一致
     * @param {number} lng 经度 [-180, 180] 
     * @param {number} lat 纬度 [-90, 90]
     */
    setLook(lng?, lat?) {
        const control = this.orbitControl;

        if (lng !== undefined && lat !== undefined) {
            const theta = lng * (Math.PI / 180);
            const phi = lat * (Math.PI / 180);

            this.camera.position.set(0, 0, 0);
            control.rotateUp(-phi);
            control.rotateLeft(-theta);
        }
    }

    /**
     * 设置视角
     * @param {number} fov 视角
     * @param {number} duration 时长
     */
    setFov(fov, duration) {
        const camera = this.getCamera();        
        new Tween(camera).to({fov: 55}).effect('quadEaseOut', duration || 1000)
            .start(['fov'], this).process(() => camera.updateProjectionMatrix());
    }

    subscribe(type, fn, context?) {
        this.event.on(type, fn, context);
    }

    unsubscribe(type, fn, context?) {
        this.event.off(type, fn, context);
    }

    dispatch(type, arg1?, arg2?) {
        this.event.emit(type, arg1, arg2);
    }

    /**
     * 安装插件并注入属性
     * @param {Object} Plugin 插件 class
     * @param {Object} data 插件数据
     */
    addPlugin(Plugin, data) {
        const plugin = new Plugin(this, data);
        this.pluginList.push(plugin);
    }

    render() {
        this.webgl.render(this.scene, this.camera);
    }

    /**
     * 渲染场景贴图
     * @param {Object} texture 场景原图纹理
     * @param {boolean} slient 安静模式
     */
    replaceTexture(texture, slient?) {
        texture.mapping = CubeRefractionMapping;
        texture.needsUpdate = true;

        const tempTex = this.skyBox.material.envMap;
        this.skyBox.material.envMap = texture;
        tempTex.dispose();
        // 触发场景切换事件
        !slient && this.dispatch('scene-attach', this.currentScene, this);
    }

    animate() {
        this.updateControl();
        this.dispatch('render-process', this.currentScene, this);
        this.render();

        requestAnimationFrame(this.animate.bind(this));
    }

    resize() {
        const camera = this.camera;
        const size = this.calcSize({}, this.root);

        camera.aspect = size.aspect;
        camera.updateProjectionMatrix();
        this.webgl.setSize(size.width, size.height);
    }

    getCamera() {
        return this.camera;
    }

    getCanvas() {
        return this.webgl.domElement;
    }

    getRoot() {
        return this.root;
    }

    getScene() {
        return this.scene;
    }

    getSize() {
        return {
            width: this.root.clientWidth,
            height: this.root.clientHeight
        };
    }
    
    /**
     * 获取 camera lookat 目标的 vector3 obj
     */
    getLookAtTarget() {
        return this.orbitControl.target;
    }

    addSceneObject(obj) {
        this.scene.add(obj);
    }

    removeSceneObject(obj) {
        this.scene.remove(obj);
    }

    addDomObject(obj) {
        this.root.appendChild(obj);
    }

    removeDomObject(obj) {
        this.root.removeChild(obj);
    }

    reset() {
        const camera = this.camera;
        camera.fov = this.opts.fov;
        camera.updateProjectionMatrix();
    }

    /**
     * enter next scene
     * @param {Object} data scene data or id
     */
    enterNext(data) {
        if (typeof data === 'string') {
            data = this.group && this.group.find(item => item.id == data);
        }

        if (!data) {
            return Log.errorLog('no scene data provided');
        }

        Loader.loadSceneTex(data.bxlPath)
            .then(textures => {
                if (textures) {
                    this.loader.load(textures, tex => {
                        this.currentScene = data;
                        this.replaceTexture(tex);
                    });
                } else {
                    Log.errorLog('load textures error');
                }
            }).catch(e => Log.errorLog(e));
    }

    dispose() {
        function cleanup(parent, target) {
            if (target.children.length) {
                target.children.forEach(item => cleanup(target, item));
            } else if (parent) {
                parent.remove(target);
            }
        }

        cleanup(null, this.scene);
        this.dispatch('render-dispose', this);
        this.event.removeAllListeners();
        this.webgl.dispose();
        this.root.innerHTML = '';
    }
}