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
