import PluggableUI from '../../interface/ui.interface';
import Util from '../../core/util';
import Tween from '../animations/tween.animation';

/**
 * @file 旋转指示器
 */

export default class Indicator extends PluggableUI {
    pano: any;
    theta: any;
    azimuthal = Math.PI;
    polar = Math.PI / 2;
    lock = false;
    
    constructor(pano) {
        super();

        this.pano = pano;
        this.subscribe(pano.frozen ? this.Topic.SCENE.READY : this.Topic.SCENE.LOAD, this.createDom.bind(this));
    }

    createDom() {
        const pano = this.pano;
        const element: any = this.element = Util.createElement('<div class="pano-indicator"></div>');

        this.setContainer(pano.getRoot());
        this.setTheta(this.theta = pano.getLook().lng); 

        this.subscribe(this.Topic.RENDER.PROCESS, this.update.bind(this));
        this.subscribe(this.Topic.VR.ENTER, this.hide.bind(this));
        this.subscribe(this.Topic.VR.EXIT, this.show.bind(this));
        element.addEventListener('click', this.reset.bind(this));
    }

    calcTheta(theta) {
        return theta > 0 ? 180 - theta : -(180 + theta);
    }

    /**
     * 设置指示器的方位角度
     */
    setTheta(theta) {
        this.theta = theta;
        
        const angel = this.calcTheta(theta);
        Util.styleElement(this.element, {webkitTransform: `rotate(${angel}deg)`});
    }

    /**
     * 更新指示器方位角度
     */
    update() {
        const pano = this.pano;
        const theta = pano.getLook().lng;

        if (!this.lock && theta != this.theta) {
           this.setTheta(theta);
        }
    }

    /**
     * 恢复到初始值
     */
    reset(event) {
        event.preventDefault();
        event.stopPropagation();

        this.lock = true;
        this.publish(this.Topic.UI.INDICATORSTART, {pano: this.pano});

        const pano = this.pano;
        const orbit = pano.getControl();
        const azimuthal = orbit.getAzimuthalAngle();
        const polar = orbit.getPolarAngle();
        const target = {azimuthal: (azimuthal > 0 ? this.azimuthal : -this.azimuthal)};
        
        pano.gyro && pano.gyro.makeEnable(false);
        new Tween({polar}).to({polar: this.polar}).effect('quadEaseOut', 400)
            .start(['polar']).process((newval, oldval) => {
                orbit.rotateUp(oldval - newval);
            });

        new Tween({azimuthal}).to(target).effect('quadEaseOut', 500)
            .start(['azimuthal']).process((newval, oldval) => {
                orbit.rotateLeft(oldval - newval);
                this.setTheta(newval * 180 / Math.PI);
            }).complete(() => this.end());
    }

    /**
     * 恢复 control
     */
    end() {
        this.pano.resetControl();
        this.lock = false;
        this.setTheta(this.theta = 180);
        this.publish(this.Topic.UI.INDICATOREND, {pano: this.pano});
    }

    dispose() {
        super.dispose();
    }
}