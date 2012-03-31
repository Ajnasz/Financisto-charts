/*jslint node: true*/
var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    dir = __dirname;

function tryThese() {
    var i = 0, al = arguments.length;
    while (i < al) {
        try {
            arguments[i]();
            break;
        } catch (er) {
            i += 1;
        }
    }
}
function PostDataParser() {}
util.inherits(PostDataParser, EventEmitter);
PostDataParser.prototype.downloadFile = function (url) {
    url = require('url').parse(url);
    var req = require('http').request({
        host: url.host,
        port: url.port,
        path: url.path,
        method: 'GET'
    }, function (res) {
        var data = [],
            data_len = 0;
        if (res.statusCode === 200) {
            // res.setEncoding('binary');
            res.on('data', function (chunk) {
                data.push(chunk);
                data_len += chunk.length;
            });
            res.on('end', function () {
                var fs = require('fs'),
                    buf = new Buffer(data_len);
                for (a = 0, p = 0; p < data_len; p += data[a++].length) {
                    data[a].copy(buf, p, 0);
                }
                this.parseData(buf);
            }.bind(this));
        } else {
            this.emit('error', new Error("Can't download the file!"));
        }
    }.bind(this));
    req.on('error', function (er) {
        this.emit('error', er);
    }.bind(this));
    req.end();
};
PostDataParser.prototype.parseJSON = function (data, cb) {
    var output;
    try {
        data = JSON.parse(data);
        data = JSON.stringify(data);
        output = data;
    } catch (jsonParseError) {
        output = jsonParseError;
    }
    cb(output);
};
PostDataParser.prototype.parseUnzippedBackup = function (data, cb) {
    try {
        var backupParser = require(dir + '/backupparser').backupParser;
        if (Buffer.isBuffer(data)) {
            data = data.toString('utf8');
        }
        data = backupParser(data);
        this.parseJSON(JSON.stringify(data), cb);
    } catch (unzippedParseError) {
        cb(unzippedParseError);
    }
};
PostDataParser.prototype.parseZippedBackup = function (data, cb) {
    var gunzip = require('zlib').gunzip,
        output = [],
        output_len = 0;

    gunzip(data, function (err, data) {
        if (err) {
            throw err;
        }
        this.parseUnzippedBackup(data.toString('utf8'), cb);
    }.bind(this));
};

PostDataParser.prototype.parseData = function (data) {
    var output;
    tryThese(
        function () {
            this.parseJSON(data, function (result) {
                if (result instanceof Error) {
                    throw result;
                } else {
                    this.emit('data', result);
                    this.emit('end', result);
                }
            }.bind(this));
        }.bind(this),
        function () {
            this.parseUnzippedBackup(data, function (result) {
                if (result instanceof Error) {
                    throw result;
                } else {
                    this.emit('data', result);
                    this.emit('end', result);
                }
            }.bind(this));
        }.bind(this),
        function () {
            this.parseZippedBackup(data, function (result) {
                if (result instanceof Error) {
                    this.emit('error', result);
                } else {
                    this.emit('data', result);
                    this.emit('end', result);
                }
            }.bind(this));
        }.bind(this)
    );
};
PostDataParser.prototype.parse = function () {
    if (this.query.data.trim()) {
        this.parseData(this.query.data);
    } else if (this.query.url.trim()) {
        this.downloadFile(this.query.url.trim());
    } else {
        this.emit('error', new TypeError("Can't get data"));
    }
};
PostDataParser.prototype.setData = function (query) {
    this.query = query;
};
exports.PostDataParser = PostDataParser;
