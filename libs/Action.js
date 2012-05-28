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
Action.prototype.noClientCache = function () {
    this.setHeaders([{name: 'Cache-Control', value: 'no-cache'}]);
    this.setExpireHeader(0);
};
Action.prototype.setExpireHeaderHour = function (hours) {
    var expire = new Date();
    expire.setTime(expire.getTime() + (hours * 3600000));
    this.setExpireHeader(expire);
};
Action.prototype.setExpireHeader = function (expire) {
    if (!(expire instanceof Date)) {
        expire = new Date(expire);
    }
    this.setHeaders([{name: 'Expires', value: expire.toUTCString()}]);
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
Action.prototype.setHeaders = function (headers) {
    this.emit('setHeaders', headers);
};
Action.prototype.setContentHeaders = function (data, type) {
    var headers = [
        {name: 'Content-Type', value: type || 'text/html'},
        {name: 'Content-Length', value: Buffer.byteLength(data)}
    ];
    this.setHeaders(headers);
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
Action.prototype.serveHTML = function (data, status, noContent) {
    this.setContentHeaders(data, 'text/html');
    this.sendResponse({
        status: status || 200,
        data: data,
        noContent: noContent
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
Action.prototype.serveCSS = function (data, status) {
    this.setContentHeaders(data, 'text/css');
    this.sendResponse({
        status: status || 200,
        data: data
    });
};
Action.prototype.setConf = function setConf(conf) {
    this.jsDir = conf.jsDir;
    this.cssDir = conf.cssDir;
    this.templateDir = conf.templateDir;
};
Action.prototype.readJSFile = function readJSFile(file, cb) {
    return this.readFile(this.jsDir + '/' + file, cb);
};
Action.prototype.readCSSFile = function readCSSFile(file, cb) {
    return this.readFile(this.cssDir + '/' + file, cb);
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
