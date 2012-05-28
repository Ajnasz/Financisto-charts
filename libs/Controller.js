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

var fs = require('fs');

function Controller(req, res) {
    this.req = req;
    this.res = res;
}
Controller.prototype.sendResponse = function (resp) {
    if (resp.status) {
        this.res.statusCode = resp.status;
        switch (resp.status) {
        case 204:
            resp.noContent = true;
            break;
        }
    }
    if (resp.headers) {
        resp.headers.forEach(function (header) {
            this.res.setHeader(header.name, header.value);
        }.bind(this));
    }
    if (resp.noContent) {
        this.res.end();
    } else if (resp.data) {
        this.res.end(resp.data);
    }
};
Controller.prototype.serverError = function () {
    this.sendResponse({
        status: 500,
        headers: [
            {name: 'Content-Type', value: 'text/html'}
        ],
        data: 'Internal server error'
    });
};
Controller.prototype.notFound = function () {
    this.sendResponse({
        status: 404,
        headers: [
            {name: 'Content-Type', value: 'text/html'}
        ],
        data: 'Not found'
    });
};
Controller.prototype.readFile = function (file, cb) {
    fs.readFile(__dirname + '/../' + file, function (err, data) {
        if (err) {
            this.notFound();
            console.log(err);
        } else {
            cb(data);
        }
    }.bind(this));
};
Controller.prototype.setContentHeaders = function (data, type) {
    var headers = [
        {name: 'Content-Type', value: type || 'text/html'},
        {name: 'Content-Length', value: Buffer.byteLength(data)}
    ];
    this.sendResponse({
        headers: headers
    });
};
Controller.prototype.serveJSON = function (data, status) {
    this.setContentHeaders(data, 'application/json');
    this.sendResponse({
        status: status || 200,
        data: typeof data === 'object' ? JSON.stringify(data) : data
    });
};
Controller.prototype.serveHTML = function (data, status, noContent) {
    this.setContentHeaders(data, 'text/html');
    this.sendResponse({
        status: status || 200,
        data: data,
        noContent: noContent
    });
};
Controller.prototype.serveFile = function (file, type, status) {
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

exports.Controller = Controller;
