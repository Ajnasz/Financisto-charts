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
        }
    },
    getRoute: function (path, method) {
        method = method.toUpperCase();
        var output;
        if (this.routes[path]) {
            output = this.routes[path][method];
        }
        return output;
    }
};
exports.Router = Router;
