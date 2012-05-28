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
function Router() {
    this.routes = {};
}
Router.prototype = {
    addRoute: function (path, method, action) {
        if (!path) {
            throw new TypeError('Path is required');
        }
        if (!method) {
            throw new TypeError('Method is required');
        }
        if (!action) {
            throw new TypeError('Action is required');
        }
        method = method.toUpperCase();
        if (!this.routes[path]) {
            this.routes[path] = {};
        }
        if (!this.routes[path][method]) {
            this.routes[path][method] = action;
        } else {
            var error = new TypeError('Route already defined.');
            error.routePath = path;
            error.routeMethod = method;
            throw error;
        }
    },
    getRoute: function (path, method) {
        method = method.toUpperCase();
        var output;
        if (this.routes[path]) {
            output = this.routes[path][method];
        }
        return output;
    },
    put: function (path, action) {
        this.addRoute(path, 'PUT', action);
    },
    post: function (path, action) {
        this.addRoute(path, 'POST', action);
    },
    get: function (path, action) {
        this.addRoute(path, 'GET', action);
    },
    del: function (path, action) {
        this.addRoute(path, 'DELETE', action);
    },
    head: function (path, action) {
        this.addRoute(path, 'HEAD', action);
    },
    trace: function (path, action) {
        this.addRoute(path, 'TRACE', action);
    },
    connect: function (path, action) {
        this.addRoute(path, 'CONNECT', action);
    },
    options: function (path, action) {
        this.addRoute(path, 'OPTIONS', action);
    }
};
exports.Router = Router;
