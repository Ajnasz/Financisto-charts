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
        data = backupParser(data);
        this.parseJSON(JSON.stringify(data), cb);
    } catch (unzippedParseError) {
        cb(unzippedParseError);
    }
};
PostDataParser.prototype.parseZippedBackup = function (data, cb) {
    var gzip = require(dir + '/gzip.js').gzip,
        output = [],
        output_len = 0;

    gzip(data, function (code, data) {
        if (code === 0) {
            this.parseUnzippedBackup(data.toString('utf8'), cb);
        } else {
            cb(new Error('Gzip exited with code ' + code));
        }
    }.bind(this));
};
PostDataParser.prototype.parse = function () {
    var data = this.data,
        output;
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
PostDataParser.prototype.setData = function (data) {
    this.data = data;
};
exports.PostDataParser = PostDataParser;
