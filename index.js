/*jslint node: true */
var http = require('http'),
    fs = require('fs'),
    util = require('util'),
    url = require('url'),
    queryString = require('querystring'),
    YUI = require('yui3').YUI,
    Session = require('ajn-session').Session,
    Controller = require('./js/controller').Controller,
    Router = require('./libs/Router').Router;



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
            allData,
            ajn;

        ajn = new Y.Ajn(data);
        allData = ajn.dao.get('json');
        output = ajn.dao.join(
            allData.transactions,
            allData.payee,
            {
                aField: 'payee_id',
                bField: '_id'
            },
            {
                aNames: {
                    '_id': 'transaction_id',
                    'from_amount': 'transaction_amount',
                    'from_account_id': 'transaction_account_id',
                    'datetime': 'datetime'
                },
                bNames: {
                    '_id': 'payee_id',
                    'title': 'payee_title'
                }
            }
        );
        output = ajn.dao.join(
            output,
            allData.account,
            {
                aField: 'transaction_account_id',
                bField: '_id'
            },
            {
                aNames: {
                    'transaction_id': 'transaction_id',
                    'transaction_amount': 'transaction_amount',
                    'datetime': 'datetime',
                    'payee_title': 'payee_title'
                },
                bNames: {
                    title: 'account_title',
                    'currency_id': 'currency_id'
                }
            }
        );
        output = ajn.dao.join(output, allData.currency, {
            aField: 'currency_id',
            bField: '_id'
        }, {
            aNames: {
                'transaction_id': 'transaction_id',
                'transaction_amount': 'transaction_amount',
                'datetime': 'datetime',
                'payee_title': 'payee_title',
                'account_title': 'account_title'
            },
            bNames: {
                'name': 'currency_name',
                'symbol': 'currency_symbol',
                title: 'currency_title'
            }
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

function getController(action) {
    var actionArr = action.split('/'),
        Controller,
        controller;
    try {
        Controller = require('actions/' + actionArr.slice(0, -1))[actionArr.slice(-2, -1)];
        controller = new Controller();
    } catch (err) {
        console.log('cant get controller', err, action);
    }
    return controller;
}

var router = new Router();
router.addRoute('/', 'GET', 'Static/Index');
router.addRoute('/a.js', 'GET', 'Static/JS');
router.addRoute('/console.js', 'GET', 'Static/JS');
router.addRoute('/fw.js', 'GET', 'Static/JS');
router.addRoute('/ajndao.js', 'GET', 'Static/JS');
router.addRoute('/data', 'GET', 'Data/Get');
router.addRoute('/data', 'PUT', 'Data/Set');
router.addRoute('/data', 'DELETE', 'Data/Del');
router.addRoute('/a.json', 'GET', 'Data/Get');
router.addRoute('/transactions.json', 'GET', 'Transactions/Get');
function processRequest(req, res) {
    var server = new Controller(req, res),
        requestUrl = url.parse(req.url, true),
        requestData = '',
        session,
        d;

    console.log('process request');
    session = new Session(req, res);

    req.setEncoding('utf8');

    req.on('data', function (chunk) {
        requestData += chunk;
    });
    req.on('error', function (err) {
        server.serverError();
        console.log(err);
    });
    req.on('end', function () {
        console.log('on request end');
        var route = router.getRoute(requestUrl.pathname, req.method),
            controller;

        if (route) {
            controller = getController(route);
        }

        if (controller) {
            controller.setConf({
                jsdir: __dirname + '/js',
                templateDir: __dirname + '/templates'
            });
            controller.on('error', function (code) {
                if (code === 404) {
                    server.notFound();
                } else {
                    server.serverError();
                }
            });
            controller.on('setHeaders', function (headers) {
                server.sendResponse({
                    headers: headers
                });
            });
            controller.on('dataDone', function (data) {
                console.log('send response');
                server.sendResponse(data);
            });
            controller.init({
                session: session
            });
            console.log('request data');
            controller.callAction(route, req, queryString.parse(requestData));
        } else {
            console.log('router not found');
            server.notFound();
        }
        requestData = '';
    });
    req.on('close', function () {
        server = null;
    });

}

setInterval(function () {
    console.log('memory usage: ', process.memoryUsage());
}, 600000);

http.createServer(processRequest).listen(15799, '127.0.0.1');
console.log('Server running at http://127.0.0.1:15799/');
