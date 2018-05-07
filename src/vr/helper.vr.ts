import Util from '../core/util';

/**
 * @file webvr manager
 */

export default abstract class Helper {
    static webgl: any;

    static createButton(webgl, display) {
        this.webgl = webgl;

        if ('getVRDisplays' in navigator) {
            const button = Util.createElement('<buttom style="display:none;"></button>');

            this.stylizeElement(button);
            document.body.appendChild(button);            

            window.addEventListener('vrdisplayconnect', (event: any) => this.showEnter(event.display, button), false);
            window.addEventListener('vrdisplaydisconnect', () => this.showNotFound(button), false);

            window.addEventListener('vrdisplaypresentchange', (event: any) => {
                const display = event.display || event.detail.display;
                button.textContent = display.isPresenting ? 'EXIT VR' : 'ENTER VR';
            }, false);

            window.addEventListener('vrdisplayactivate', (event: any) => {
                event.display.requestPresent([{ source: webgl.domElement }]);
            }, false);

            display ? this.showEnter(display, button) : this.showNotFound(button);
        } else {
            const message = Util.createElement('<a href="https://webvr.info" style="left:calc(50% - 90px);width:180px;text-decoration:none;">WEBVR NOT SUPPORTED</a>');
            
            this.stylizeElement(message);
            document.body.appendChild(message);
        }
    }

    static showEnter(display, button) {
        const webgl = this.webgl;

        button.style.display = '';

        button.style.cursor = 'pointer';
        button.style.left = 'calc(50% - 50px)';
        button.style.width = '100px';

        button.textContent = 'ENTER VR';

        button.onmouseenter = function () {button.style.opacity = '1.0';};
        button.onmouseleave = function () {button.style.opacity = '0.5';};
        button.onclick = function () {
            if (display.isPresenting) {
                display.exitPresent();
                button.innerHTML = 'ENTER VR';
            } else {
                display.requestPresent([{source: webgl.domElement}]);
                button.innerHTML = 'EXIT VR';
            }
        };
        // webgl.vr.setDevice(display);
    }

    static showNotFound(button) {
        button.style.display = '';

        button.style.cursor = 'auto';
        button.style.left = 'calc(50% - 75px)';
        button.style.width = '150px';

        button.textContent = 'VR NOT FOUND';

        button.onmouseenter = null;
        button.onmouseleave = null;

        button.onclick = null;

        this.webgl.vr.setDevice(null);
    }

    static stylizeElement(element) {
        Util.styleElement(element, {
            position: 'absolute',
            bottom: '20px',
            padding: '12px 6px',
            border: '1px solid #fff',
            borderRadius: '4px',
            background: 'transparent',
            color: '#fff',
            font: 'normal 13px sans-serif',
            textAlign: 'center',
            opacity: '0.5',
            outline: 'none',
            zIndex: '999'
        });
    }
}