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
        contentType = 'text/html';
        break;
    case 'js':
        contentType = 'text/javascript';
        break;
    case 'css':
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
