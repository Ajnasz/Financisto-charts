/*jslint node: true*/
var util = require('util'),
    url = require('url'),
    Action = require('../libs/Action').Action;
function Static() {}
util.inherits(Static, Action);
Static.prototype.executeIndex = function (request) {
    this.readTemplateFile('index.html', function (data) {
        var dataStr = data.toString('utf8');
        this.serveHTML(dataStr);
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
    }

    this.readJSFile(fileName, function (data) {
        var dataStr = data.toString('utf8');
        this.serveJS(dataStr);
    }.bind(this));
};

exports.Static = Static;
