/*jslint node: true*/
var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    fs = require('fs');
function Action() {}
util.inherits(Action, EventEmitter);
Action.prototype.init = function (conf) {
    this.session = conf.session;
};
Action.prototype.callAction = function (action, request, requestData) {
    var actionMethodName = action.split('/').pop(),
        actionMethod = this['execute' + actionMethodName];
    if (typeof actionMethod === 'function') {
        actionMethod.call(this, request, requestData);
    } else {
        this.serverError();
        console.error('no such action defined', action);
    }
};
Action.prototype.sendResponse = function (resp) {
    this.emit('dataDone', resp);
};
Action.prototype.serverError = function () {
    this.sendResponse({
        status: 500,
        headers: [
            {name: 'Content-Type', value: 'text/html'}
        ],
        data: 'Internal server error'
    });
};
Action.prototype.notFound = function () {
    this.sendResponse({
        status: 404,
        headers: [
            {name: 'Content-Type', value: 'text/html'}
        ],
        data: 'Not found'
    });
};
Action.prototype.setContentHeaders = function (data, type) {
    var headers = [
        {name: 'Content-Type', value: type || 'text/html'},
        {name: 'Content-Length', value: Buffer.byteLength(data)}
    ];
    this.emit('setHeaders', headers);
};
Action.prototype.serveFile = function (file, type, status) {
    this.readFile(file, function (data) {
        var dataStr, headers;
        dataStr = data.toString('utf8');
        this.setContentHeaders(dataStr, type);
        this.sendResponse({
            status: status || 200,
            data: data.toString('utf8')
        });
    }.bind(this));
};
Action.prototype.serveHTML = function (data, status) {
    this.setContentHeaders(data, 'text/html');
    this.sendResponse({
        status: status || 200,
        data: data
    });
};
Action.prototype.serveJSON = function (data, status) {
    this.setContentHeaders(data, 'application/json');
    this.sendResponse({
        status: status || 200,
        data: typeof data === 'object' ? JSON.stringify(data) : data
    });
};
Action.prototype.serveJS = function (data, status) {
    this.setContentHeaders(data, 'text/javascript');
    this.sendResponse({
        status: status || 200,
        data: data
    });
};
Action.prototype.setConf = function setConf(conf) {
    this.jsDir = conf.jsdir;
    this.templateDir = conf.templateDir;
};
Action.prototype.readJSFile = function readJSFile(file, cb) {
    return this.readFile(this.jsDir + '/' + file, cb);
};
Action.prototype.readTemplateFile = function readTemplateFile(file, cb) {
    return this.readFile(this.templateDir + '/' + file, cb);
};
Action.prototype.readFile = function readFile(file, cb) {
    fs.readFile(file, function (err, data) {
        if (err) {
            this.notFound();
            console.log(err);
        } else {
            cb(data);
        }
    }.bind(this));
};

exports.Action = Action;
