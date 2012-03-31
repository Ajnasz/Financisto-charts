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
