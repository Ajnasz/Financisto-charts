/*global YUI: true */
/*jslint browser: true */
// Create a new YUI instance and populate it with the required modules.
YUI({
    modules: {
        'FinancistoApp': {
            fullpath: '/FinancistoApp.js',
            requires: ['base', 'charts', 'io', 'node', 'event', 'tabview',
                'console', 'attribute']
        },
        'ajn:dao': {
            fullpath: '/ajndao.js'
        },
        'console': {
            fullpath: '/console.js'
        }
    }
}).use('node', 'FinancistoApp', function (Y) {
    window.Y = Y;
    Y.one('#Main').setStyle('display', 'block');
    if (typeof Object.keys !== 'function' || typeof Array.prototype.forEach !== 'function') {
        Y.all('#DataForm,#Charts').hide();
        Y.one('#Error').setContent('Your browser is not supported. ' +
            '<a href="http://affiliates.mozilla.org/link/banner/3935">Please upgrade</a>' +
            ' to use a better web.')
            .get('parentNode').setStyle('display', 'block');
    } else {
        var app = new Y.FinancistoApp();
    }
});
