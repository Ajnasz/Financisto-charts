/*jslint node: true*/
var util = require('util'),
    url = require('url'),
    Action = require('../libs/Action').Action;
function Data() {}
util.inherits(Data, Action);
Data.prototype.executeGet = function () {
    this.noClientCache();
    var data = this.session.getData('data');
    if (data) {
        this.serveJSON(JSON.stringify(JSON.parse(data).tables), 200);
    } else {
        this.notFound();
    }
};
Data.prototype.executeSet = function (req, requestData) {
    var status = null,
        output = {success: false},
        PostDataParser = require(this.jsDir + '/parseData.js').PostDataParser,
        postDataParser = new PostDataParser(),
        data;

    postDataParser.setData(requestData);
    postDataParser.on('error', function (er) {
        this.serveJSON(JSON.stringify({
            success: false,
            message: er.message
        }), 400);
    }.bind(this));
    postDataParser.on('data', function (data) {
        this.session.setData('data', data);
        this.serveJSON(JSON.stringify({
            success: true
        }));
    }.bind(this));
    postDataParser.parse();
};
Data.prototype.executeDel = function () {
    this.session.setData('data', null);
    this.serveJSON(JSON.stringify({success: true}));
};

exports.Data = Data;

