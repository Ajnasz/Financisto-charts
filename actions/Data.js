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
function Data() {}
util.inherits(Data, Action);
Data.prototype.executeGet = function () {
    this.noClientCache();
    var data = this.session.getData('data');
    if (data) {
        this.serveJSON(JSON.stringify(JSON.parse(data).tables), 200);
    } else {
        this.setHeaders([
            {name: 'Content-Type', value: 'application/json'}
        ]);
        this.sendResponse({status: 204});
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
