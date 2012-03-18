/*jslint node: true */
var http = require('http'),
    fs = require('fs'),
    util = require('util'),
    url = require('url'),
    queryString = require('querystring'),
    YUI = require('yui3').YUI,
    Session = require('ajn-session').Session,
    Controller = require('./js/controller').Controller;



var yuiConf = {
    modules: {
        'ajn': {
            fullpath: __dirname + '/js/fw.js',
            requires: ['attribute', 'console', 'ajn:dao']
        },
        'ajn:dao': {
            fullpath: __dirname + '/js/ajndao.js'
        },
        'console': {
            fullpath: __dirname + '/js/console.js'
        }
    }
};

function getTransactions(data, requestUrl, cb) {
    YUI(yuiConf).use('ajn', function (Y) {
        var output = '',
            days = requestUrl.query.days || null,
            date,
            ajn;

        ajn = new Y.Ajn(data);
        output = ajn.dao.join('transactions', 'payee', {
            aField: 'payee_id',
            bField: '_id'
        });
        if (days) {
            date = new Date();
            date.setDate(date.getDate() - days);
            output = output.filter(function (item) {
                return date.getTime() <= item.datetime;
            });
        }
        cb(output);
    });
}

function processRequest(req, res) {
    var controller = new Controller(req, res),
        requestUrl = url.parse(req.url, true),
        requestData = '',
        session,
        d;
    session = new Session(req, res);

    req.setEncoding('utf8');

    req.on('data', function (chunk) {
        requestData += chunk;
    });
    req.on('error', function (err) {
        controller.serverError();
        console.log(err);
    });
    req.on('end', function () {
        switch (requestUrl.pathname) {
        case '/':
            controller.serveFile('./templates/index.html');
            break;
        case '/a.js':
            controller.serveFile('./js/a.js', 'text/javascript');
            break;
        case '/console.js':
            controller.serveFile('./js/console.js', 'text/javascript');
            break;
        case '/fw.js':
            controller.serveFile('./js/fw.js', 'text/javascript');
            break;
        case '/ajndao.js':
            controller.serveFile('./js/ajndao.js', 'text/javascript');
            break;
        case '/setdata':
            requestData = queryString.parse(requestData).data;
            var status = null,
                output = {success: false},
                PostDataParser = require(__dirname + '/js/parseData.js').PostDataParser,
                postDataParser = new PostDataParser(),
                backupParser,
                data;
            postDataParser.setData(requestData);
            postDataParser.on('error', function (er) {
                console.log('on error', er.message);
                controller.serveJSON(JSON.stringify({
                    success: false,
                    message: er.message
                }), 400);
            });
            postDataParser.on('data', function (data) {
                session.setData('data', data);
                controller.serveJSON(JSON.stringify({
                    success: true
                }));
            });
            postDataParser.parse();
            break;
        case '/a.json':
            d = session.getData('data');
            if (d) {
                controller.serveJSON(d);
            } else {
                controller.notFound(d);
            }
            break;
        case '/transactions.json':
            d = session.getData('data');
            if (d) {
                // data = session.getData(sessionId, 'data')
                getTransactions(JSON.parse(d), requestUrl, function (data) {
                    controller.serveJSON(JSON.stringify(data));
                });
            } else {
                controller.notFound(d);
            }
            break;
        }
        requestData = '';
    });
    req.on('close', function () {
        controller = null;
    });

}

setInterval(function () {
    console.log('memory usage: ', process.memoryUsage());
}, 600000);

http.createServer(processRequest).listen(15799, '127.0.0.1');
console.log('Server running at http://127.0.0.1:15799/');
