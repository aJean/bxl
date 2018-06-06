/**
 * @file subscribe topics
 */

export default {
    SCENE: {
        // very beginning
        CREATE: 'scene-create',
        // preview texture load
        INIT: 'scene-init',
        // resource texture load
        LOAD: 'scene-load',
        // animation end
        READY: 'scene-ready',
        // before scene change 
        ATTACHSTART: 'scene-attachstart',
        // scene changed
        ATTACH: 'scene-attach',
        // reset scene group
        RESET: 'scene-reset'
    },
    // webgl render
    RENDER: {
        PROCESS: 'render-process',
        DISPOSE: 'render-dispose',
        EXCEPTION: 'render-exception',
        UNSUPPORT: 'render-unsupport'
    },
    // web vr
    VR: {
        ENTER: 'vr-enter',
        EXIT: 'vr-exit'
    },
    // ui interface
    UI: {
        PANOCLICK: 'pano-click',
        OVERLAYCLICK: 'overlay-click',
        MULTIPLEACTIVE: 'multiple-active',
        DRAG: 'pano-drag',
        ZOOM: 'pano-zoom'
    },
    // star through
    THRU: {
        SHOW: 'thru-show',
        CHANGE: 'thru-change'
    },
    // animation
    ANIMATION: {
        END: 'animation-end'
    }
};