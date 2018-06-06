import PluggableUI from '../../interface/ui.interface';
import Util from '../../core/util';
import Topic from '../../core/topic';
import * as PubSub from 'pubsub-js';

/**
 * @file 版权遮罩层
 */

export default class Info extends PluggableUI {
    element: any;
    container: any;
    pano: any;
    
    constructor(pano) {
        super();

        this.pano = pano;
        this.createDom(pano.currentData);
        this.subscribe(Topic.SCENE.ATTACH, this.renderDom.bind(this));
    }

    setContainer() {
        this.pano.getRoot().appendChild(this.element);
    }

    createDom(data) {
        const info = data.info;        
        const element = this.element = Util.createElement('<div class="pano-info"></div>');

        if (info) {
            element.innerHTML = info.logo ? `<img src="${info.logo}" width="70">` : '';
            element.innerHTML += `<div class="pano-info-name">${info.author}</div>`;
        }

        this.setContainer();
    }

    renderDom(topic, payload) {
        const info = payload.scene.info;
        const element = this.element;

        if (info) {
            element.innerHTML = info.logo ? `<img src="${info.logo}" width="70">` : '';
            element.innerHTML += `<div class="pano-info-name">${info.author}</div>`;
            this.show();
        } else {
            this.hide();
        }
    }

    dispose() {
        super.dispose();
    }
}