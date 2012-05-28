/*
Copyright (c) 2011 Lajos Koszti http://ajnasz.hu

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

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
