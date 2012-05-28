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

/*jslint node: true */
var http = require('http'),
    fs = require('fs'),
    util = require('util'),
    url = require('url'),
    queryString = require('querystring'),
    YUI = require('yui').YUI,
    Session = require('ajn-session').Session,
    Controller = require('./libs/Controller').Controller,
    Router = require('./libs/Router').Router,
    ip = '127.0.0.1',
    port = 16444;



var yuiConf = {
    modules: {
        'FinancistoApp': {
            fullpath: __dirname + '/js/FinancistoApp.js',
            requires: ['base', 'charts', 'io', 'node', 'event', 'tabview',
                'console', 'DataProvider', 'attribute']
        },
        'DataProvider': {
            fullpath: __dirname + '/js/DataProvider.js'
        },
        'console': {
            fullpath: __dirname + '/js/console.js'
        }
    }
};

function showMemoryUsage() {
    var stat, rssInKB, heapTotalInKB, heapUsedInKB;

    stat = process.memoryUsage();
    rssInKB = stat.rss / 1024;
    heapTotalInKB = stat.heapTotal / 1024;
    heapUsedInKB = stat.heapUsed / 1024;

    console.log('memory usage: rss: %d KB, heap total: %d KB, heap used: %d KB',
                rssInKB, heapTotalInKB, heapUsedInKB);
}

function getController(action) {
    var actionArr = action.split('/'),
        actionName = actionArr.slice(0, -1),
        dir = __dirname,
        Controller,
        controller;
    try {
        Controller = require(dir + '/actions/' + actionName)[actionArr.slice(-2, -1)];
        controller = new Controller();
    } catch (err) {
        console.log('cant get controller', err, action);
    }
    return controller;
}

var router = new Router();
router.get('/', 'Static/Index');
router.head('/', 'Static/Index');
router.get('/a.js', 'Static/JS');
router.head('/a.js', 'Static/JS');
router.get('/console.js', 'Static/JS');
router.head('/console.js', 'Static/JS');
router.get('/FinancistoApp.js', 'Static/JS');
router.head('/FinancistoApp.js', 'Static/JS');
router.get('/styles.css', 'Static/CSS');
router.head('/styles.css', 'Static/CSS');
router.get('/ajndao.js', 'Static/JS');
router.head('/ajndao.js', 'Static/JS');
router.get('/dataconverter.js', 'Static/JS');
router.head('/dataconverter.js', 'Static/JS');
router.get('/data', 'Data/Get');
router.put('/data', 'Data/Set');
router.del('/data', 'Data/Del');
router.get('/a.json', 'Data/Get');
router.get('/transactions.json', 'Transactions/Get');
function processRequest(req, res) {
    var server = new Controller(req, res),
        requestUrl = url.parse(req.url, true),
        requestData = '',
        session,
        d;

    console.log('%s\t%s\t%s\t%s\t%s', (new Date()).toISOString(), req.method, req.url,
                req.headers['user-agent'], req.headers.referer || '');
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
        var route = router.getRoute(requestUrl.pathname, req.method),
            controller;

        if (route) {
            controller = getController(route);
        }

        if (controller) {
            controller.setConf({
                jsDir: __dirname + '/js',
                cssDir: __dirname + '/css',
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
                server.sendResponse(data);
            });
            controller.init({
                session: session
            });
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

setInterval(showMemoryUsage, 600000);


http.createServer(processRequest).listen(port, ip);
console.log('Server running at http://%s:%d', ip, port);
showMemoryUsage();
