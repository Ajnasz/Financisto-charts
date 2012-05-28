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

/*jslint node: true*/
var util = require('util'),
    url = require('url'),
    Action = require('../libs/Action').Action;
function Static() {}
util.inherits(Static, Action);
Static.prototype.serveStatic = function (request, data, type, status) {
    var noContent = false,
        contentType = 'text/html';
    if (request.method === 'HEAD') {
        noContent = true;
    }
    switch (type) {
    case 'html':
        this.setExpireHeaderHour(1);
        contentType = 'text/html';
        break;
    case 'js':
        this.setExpireHeaderHour(1);
        contentType = 'text/javascript';
        break;
    case 'css':
        this.setExpireHeaderHour(1);
        contentType = 'text/css';
        break;
    case 'json':
        contentType = 'application/json';
        break;
    }
    this.setContentHeaders(data, contentType);
    this.sendResponse({
        status: status,
        data: data,
        noContent: noContent
    });
};
Static.prototype.executeIndex = function (request) {
    this.readTemplateFile('index.html', function (data) {
        var dataStr = data.toString('utf8');
        this.serveStatic(request, dataStr, 'html');
    }.bind(this));
};

Static.prototype.executeJS = function (request) {
    var requestUrl = url.parse(request.url, true),
        pathName = requestUrl.pathname,
        fileName;

    if (pathName === '/a.js') {
        fileName = 'a.js';
    } else if (pathName === '/console.js') {
        fileName = 'console.js';
    } else if (pathName === '/fw.js') {
        fileName = 'fw.js';
    } else if (pathName === '/ajndao.js') {
        fileName = 'ajndao.js';
    } else if (pathName === '/FinancistoApp.js') {
        fileName = 'FinancistoApp.js';
    } else if (pathName === '/dataconverter.js') {
        fileName = 'dataconverter.js';
    }

    this.readJSFile(fileName, function (data) {
        var dataStr = data.toString('utf8');
        this.serveStatic(request, dataStr, 'js');
    }.bind(this));
};

Static.prototype.executeCSS = function (request) {
    var requestUrl = url.parse(request.url, true),
        pathName = requestUrl.pathname,
        fileName;

    if (pathName === '/styles.css') {
        fileName = 'styles.css';
    }

    this.readCSSFile(fileName, function (data) {
        var dataStr = data.toString('utf8');
        this.serveStatic(request, dataStr, 'css');
    }.bind(this));
};

exports.Static = Static;
