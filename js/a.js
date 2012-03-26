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
}).use('FinancistoApp', function (Y) {
    var app = new Y.FinancistoApp();
});
