import {Vector3, Euler, Quaternion, Math as TMath} from 'three';

/**
 * @file gyro control
 */

export default class GyroControl {
    orbit: any;
    oribtCamera: any;
    onDeviceOrientationChange: any;
    onScreenOrientationChange: any;
    camera: any;
    enabled = false;
    deviceOrien: any = {};
    screenOrien = 0;
    alphaOffset = 0;
    zee = new Vector3(0, 0, 1);
    euler = new Euler();
    q0 = new Quaternion();
    // - PI/2 around the x-axis
    q1 = new Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
    lastBeta;
    lastGamma;

    constructor(camera, orbit) {
        camera.rotation.reorder('YXZ');

        this.orbit = orbit;
        this.oribtCamera = camera;
        this.camera = camera.clone();
        this.onDeviceOrientationChange = event => this.deviceOrien = event;
        this.onScreenOrientationChange = event => this.screenOrien = Number(window.orientation) || 0;
    }

    /** 
     * 计算角度更新到 orbit camera
     */
    calcQuaternion(alpha, beta, gamma, orient) {
        // 'ZXY' for the device, but 'YXZ' for us
        this.euler.set(beta, alpha, -gamma, 'YXZ');

        const camera = this.camera;
        const quaternion = camera.quaternion;
        const orbit = this.orbit;
        
        // orient the device
        quaternion.setFromEuler(this.euler);
        // 设备初始为平放状态，这里将手机竖起来符合用户习惯
        quaternion.multiply(this.q1);
        // 竖屏 or 横屏
        quaternion.multiply(this.q0.setFromAxisAngle(this.zee, -orient));

        const currentAngle = this.quat2Angle(quaternion);
        if (this.lastBeta) {
            orbit.rotateLeft(this.lastGamma - currentAngle.z);
            orbit.rotateUp(this.lastBeta - currentAngle.y);
            orbit.update();
        }

        this.lastBeta = currentAngle.y;
        this.lastGamma = currentAngle.z;
    }

    connect() {
        window.addEventListener('orientationchange', this.onScreenOrientationChange, false);
        window.addEventListener('deviceorientation', this.onDeviceOrientationChange, false);
        // run once on load
        this.onScreenOrientationChange();
        this.enabled = true;
    }

    disconnect() {
        window.removeEventListener('orientationchange', this.onScreenOrientationChange, false);
        window.removeEventListener('deviceorientation', this.onDeviceOrientationChange, false);

        this.enabled = false;
        this.deviceOrien = {};
        this.screenOrien = 0;
    }

    update() {
        // give back to orbit
        if (!this.enabled) {
            return this.orbit.update();
        }

        // z axis 0 ~ 360
        const alpha = this.deviceOrien.alpha ? TMath.degToRad(this.deviceOrien.alpha) : 0;
        // x axis -180 ~ 180
        const beta = this.deviceOrien.beta ? TMath.degToRad(this.deviceOrien.beta) : 0;
        // y axis -90 ~ 90
        const gamma = this.deviceOrien.gamma ? TMath.degToRad(this.deviceOrien.gamma) : 0;
        // landscape or vertical
        const orient = this.screenOrien ? TMath.degToRad(this.screenOrien) : 0;

        if (alpha === 0 && beta === 0 && gamma === 0) {
            return this.orbit.update();
        }

        // 不是每次都会更新, lead to state will not be STATE.NONE
        this.calcQuaternion(alpha, beta, gamma, orient);
    }

    /**
     * 四元数转化成角度
     * @param {Quaternion} quaternion
     */
    quat2Angle(quaternion) {
        const x = quaternion.x;
        const y = quaternion.y;
        const z = quaternion.z;
        const w = quaternion.w;
        let pitch;
        let roll;
        let yaw;

        const factor = x * y + z * w;
        // singularity at north pole
        if (factor > 0.499) {
            yaw = Math.atan2(x, w) * 2;
            pitch = Math.PI / 2;
            roll = 0;

            return new Vector3(pitch, roll, yaw);
        }

        // singularity at south pole
        if (factor < -0.499) {
            yaw = -2 * Math.atan2(x, w);
            pitch = -Math.PI / 2;
            roll = 0;

            return new Vector3(pitch, roll, yaw);
        }

        const sqx = x * x;
        const sqy = y * y;
        const sqz = z * z;

        yaw = Math.atan2((2 * y * w) - (2 * x * z), 1 - (2 * sqy) - (2 * sqz));
        pitch = Math.asin(2 * factor);
        roll = Math.atan2((2 * x * w) - (2 * y * z), 1 - (2 * sqx) - (2 * sqz));

        return new Vector3(pitch, roll, yaw);
    }

    /**
     * 初始 z 轴旋转角度
     * @param {number} angle 
     */
    updateAlphaOffset(angle) {
        this.alphaOffset = angle;
        this.update();
    }

    /**
     * 重置 gyro 和 orbit 控制器
     */
    reset() {
        this.orbit.reset();
        this.camera.copy(this.oribtCamera);
        this.lastBeta = null;
        this.lastGamma = null;
        this.enabled = true;
    }
}