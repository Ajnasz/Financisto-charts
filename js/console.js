/*global YUI: true*/
/*jslint browser: true, node: true*/
YUI.add('console', function (Y) {
    Y.namespace('console');
    var glob = typeof window === 'undefined' ? global : window,
        cl;
    function notSupported() {
        throw new TypeError('no native console support found');
    }
    if (typeof glob.console === 'undefined') {
        Y.console.log = notSupported;
        Y.console.error = notSupported;
        Y.console.info = notSupported;
        Y.console.time = notSupported;
        Y.console.timeEnd = notSupported;
    } else {
        cl = glob.console;
        Y.console.log = cl.log;
        Y.console.error = cl.error;
        Y.console.info = cl.info;
        Y.console.time = cl.time;
        Y.console.timeEnd = cl.timeEnd;
    }
}, '0.0.1');

