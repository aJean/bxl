import Tween from '../pano/animations/tween.animation';
import PubSubAble from './pubsub.interface';

/**
 * @file 内置物体材质抽象类
 */

export default abstract class Plastic extends PubSubAble {
    pano: any;
    opts: any;
    plastic: any;

    /**
     * 重新这个方法可以改变行为
     */
    getPlastic() {
        return this.plastic;
    }

    setPosition(x, y, z) {
        this.getPlastic().position.set(x, y, z);
    }

    /**
     * 外部动画会用到
     */
    getPosition() {
        return this.getPlastic().position;
    }

    addTo(obj) {
        if (obj instanceof Plastic) {
            obj = obj.plastic;
        }

        obj.add(this.getPlastic());
    }

    addBy(pano) {
        pano.addSceneObject(this.getPlastic());
    }

    removeBy(pano) {
        pano.removeSceneObject(this.getPlastic());
        this.dispose();
    }

    /**
     * 设置透明度
     */
    setOpacity(num, useanim?) {
        const material = this.plastic.material;
       
        useanim ? new Tween(material, this.pano.ref).to({opacity: num}).effect('backOut', 500)
            .start(['opacity'])
            : (material.opacity = num);
    }

    lookAt(position) {
        this.getPlastic().lookAt(position);
    }

    show() {
        this.getPlastic().visible = true;
    }

    hide() {
        this.getPlastic().visible = false;
    }

    isMount() {
        const target = this.getPlastic();
        return target.parent && target.visible;
    }

    /**
     * 子类必须调用 super.dispose()
     */
    dispose() {
        const plastic = this.plastic;
        const geometry = plastic.geometry;
        const material = plastic.material;

        delete plastic.data;

        if (geometry) {
            geometry.dispose();
        }

        if (material) {
            material.map && material.map.dispose();
            material.envMap && material.envMap.dispose();
            material.dispose();
        }

        if (plastic.parent) {
            plastic.parent.remove(plastic);
        }

        super.dispose();
    }
}
