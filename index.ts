import './styles/panoram.style.less';
import './styles/multiple.style.less';
import './styles/overlays.style.less';
import './styles/ui.style.less';
import Runtime from './src/runtime';

/**
 * @file lib index.ts
 */

export default {
    start(source, el, events?) {
        Runtime.start(source, el, events);
    },

    getPanoram(ref: string) {
        return Runtime.getInstance(ref);
    },

    dispose(ref: string) {
        return Runtime.releaseInstance(ref);
    }
};