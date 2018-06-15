import {Spherical, Matrix4, Vector3} from 'three';
import Log from '../core/log';

/**
 * @file vr control
 * use devicemotion by webvr.polyfill.js
 */

const rotateMatrix = new Matrix4().makeRotationAxis(new Vector3(0, 1, 0).normalize(), Math.PI);
export default class VRControl {
    oribit: any;
    camera: any;
    vrDisplay: any;
    vrDisplays: any;
    frameData: any;
    standingMatrix: any;
    // the Rift SDK returns the position in meters
	// this scale factor allows the user to define how meters are converted to scene units.
    scale = 1;
    // If true will use "standing space" coordinate system where y=0 is the
	// floor and x=0, z=0 is the center of the room.
    standing = true;
    // Distance from the users eyes to the floor in meters. Used when
	// standing=true but the VRDisplay doesn't provide stageParameters.
    userHeight = 1.6;
    // to orbit
    lastSpherical: Spherical;
    currentSpherical = new Spherical();

    constructor(camera, oribit) {
        this.oribit = oribit;
        this.camera = camera.clone();
        this.standingMatrix = new Matrix4();

        if ( 'VRFrameData' in window ) {
            this.frameData = new VRFrameData();
        }

        if (navigator.getVRDisplays) {
            navigator.getVRDisplays().then(displays => this.gotVRDisplays(displays))
                .catch(() => Log.output('Unable to get VR Displays'));
        }
    }

	gotVRDisplays(displays) {
		this.vrDisplays = displays;

		if (displays.length > 0) {
			this.vrDisplay = displays[0];
		} else {
			Log.output('VR input not available');
		}
	}

	getVRDisplay() {
		return this.vrDisplay;
	}

	setVRDisplay(value) {
		this.vrDisplay = value;
	}

	getVRDisplays() {
		Log.output('getVRDisplays() is being deprecated');
		return this.vrDisplays;
	}

	getStandingMatrix() {
		return this.standingMatrix;
	}

	update() {
        const vrDisplay = this.vrDisplay;
        const frameData = this.frameData;
        const standingMatrix = this.standingMatrix;
        const camera = this.camera;
        const lastSpherical = this.lastSpherical;
        const currentSpherical = this.currentSpherical;

		if (vrDisplay) {
			let pose;
			if (vrDisplay.getFrameData) {
				vrDisplay.getFrameData(frameData);
				pose = frameData.pose;
			} else if (vrDisplay.getPose) {
				pose = vrDisplay.getPose();
            }
            
			if (pose.orientation !== null) {
                camera.quaternion.fromArray(pose.orientation);
			}

			pose.position !== null ? camera.position.fromArray(pose.position) : camera.position.set(0, 0, 0);

			if (this.standing) {
				if (vrDisplay.stageParameters) {
					camera.updateMatrix();
					standingMatrix.fromArray(vrDisplay.stageParameters.sittingToStandingTransform);
					camera.applyMatrix(standingMatrix);
				} else {
					camera.position.setY(camera.position.y + this.userHeight);
				}
            }

            // calc spherical diff
            currentSpherical.setFromVector3(camera.getWorldDirection());

            if (lastSpherical && currentSpherical.phi < 3) {
                const theta = currentSpherical.theta - lastSpherical.theta;
                const phi = lastSpherical.phi - currentSpherical.phi;
                this.oribit.update(theta, phi);
            } 

            this.lastSpherical = currentSpherical.clone();
		}
	}

	dispose() {
		this.vrDisplay = null;
	}
};