import {Texture, CubeTextureLoader, Raycaster, BackSide, MeshBasicMaterial, SphereGeometry, Mesh, CubeRefractionMapping, Vector3} from 'three';
import ResourceLoader from '../loaders/resource.loader';
import Tween from '../animations/tween.animation';
import Pano from '../pano';
import Log from '../../core/log';
import Util from '../../core/util';

/**
 * @file wormhole space through effection
 * 在全景天空盒中, 相机指向 (0, 0, 1), 即右手坐标系 z 轴正方向
 * 在盒内实际上看的是反向贴图
 * 穿梭后要将相机恢复
 */

const myLoader = new ResourceLoader();
export default class Wormhole {
    pano: Pano;
    onDetect: Function;
    data: any;
    vector: any;
    texture: any;
    box: any;
    backTexture: any;
    direction = true;
    raycaster = new Raycaster();

    constructor(pano: Pano, data) {
        this.data = data;
        this.pano = pano;
        this.onDetect = evt => this.detect(evt);

        pano.subscribe('scene-init', this.create, this);
    }

    create() {
        const data = this.data;
        const pano = this.pano;
        const cubeLoader = new CubeTextureLoader();
        const geometry = new SphereGeometry(100, 32, 16);
        const material = new MeshBasicMaterial({
            side: BackSide,
            refractionRatio: 0,
            reflectivity: 1
        });
        const box = this.box = new Mesh(geometry, material);
        const vector = this.vector = Util.calcSphereToWorld(data.lng, data.lat);

        myLoader.loadTexture(data.bxlPath || data.texPath).then((texture: Texture) => {
            texture.mapping = CubeRefractionMapping;
            material.envMap = this.texture = texture;
            box.position.set(vector.x, vector.y, vector.z);

            pano.addSceneObject(box);
            this.bindEvents();
        }).catch(e => Log.errorLog(e));
    }

    bindEvents() {
        const pano = this.pano;

        pano.getCanvas().addEventListener('click', this.onDetect);
        pano.subscribe('render-process', this.rotate, this);
    }

    detect(evt) {
        const pano = this.pano;
        const camera = pano.getCamera();
        const raycaster = this.raycaster;
        const element = pano.getCanvas();
        const pos = {
            x: (evt.clientX / element.clientWidth) * 2 - 1,
            y: -(evt.clientY / element.clientHeight) * 2 + 1
        };

        raycaster.setFromCamera(pos, camera);
        const intersects = raycaster.intersectObjects([this.box]);

        if (intersects.length) {
            const vector = pano.getLookAtTarget();
            const target = this.vector.clone();
            // camera lookAt.z > camera position.z
            target.z += this.direction ? 100 : -100;
 
            // camera lookAt
            new Tween(vector).to(target).effect('quintEaseIn', 1000)
                .start(['x', 'y', 'z'], pano)
                .complete(() => {
                    // camera position
                    new Tween(camera.position).to(this.vector).effect('quadEaseOut', 1000)
                        .start(['x', 'y', 'z'], pano)
                        .complete(() => {
                            this.finish();
                            this.addBackDoor();
                        });
                });
        }
    }

    rotate() {
        this.box.rotation.x += 0.01;
        this.box.rotation.y += 0.01;
        this.box.rotation.z += 0.01;
    }

    finish() {
        const pano = this.pano;

        pano.unsubscribe('scene-init', this.create, this);
        pano.unsubscribe('render-process', this.rotate, this);

        this.backTexture = pano.skyBox.getMap();
        pano.skyBox.setMap(this.texture);
        pano.removeSceneObject(this.box);

        pano.getCamera().position.set(0, 0, 0);
        pano.getLookAtTarget().set(0, 0, this.direction ? 1 : -1);

        pano.removeSceneObject(this.box);
        pano.getCanvas().removeEventListener('click', this.onDetect);
    }

    addBackDoor() {
        const geometry = new SphereGeometry(100, 32, 16);
        const material = new MeshBasicMaterial({
            side: BackSide,
            refractionRatio: 0,
            reflectivity: 1
        });
        material.envMap = this.texture = this.backTexture;
        const box = this.box = new Mesh(geometry, material);
        const vector = this.vector = Util.calcSphereToWorld(this.direction ? 180 : this.data.lng, 0);
        box.position.set(vector.x, vector.y, vector.z);

        this.direction = !this.direction;
        this.pano.addSceneObject(box);
        this.bindEvents();
    }
}