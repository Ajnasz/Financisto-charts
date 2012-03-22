/*global YUI: true*/
/*jslint nomen: true*/
YUI.add('ajn:dao', function (Y) {
    function AjnDao(json) {
        this.addAttrs({
            json: {
                value: json
            }
        });
    }
    AjnDao.prototype = {
        join: function (aData, bData, on, names) {
            var allData = this.get('json'),
                output = [];
            names = Y.merge({
                aNames: {},
                bNames: {}
            }, names);
            if (aData && aData.length) {
                aData.forEach(function (aItem) {
                    bData.forEach(function (bItem) {
                        if (aItem[on.aField] === bItem[on.bField]) {
                            // var merged = Y.merge(aItem, bItem);
                            var merged = {};
                            Object.keys(names.aNames).forEach(function (key) {
                                merged[names.aNames[key]] = aItem[key];
                            });
                            Object.keys(names.bNames).forEach(function (key) {
                                merged[names.bNames[key]] = bItem[key];
                            });
                            output.push(merged);
                        }
                    });
                });
            }
            return output;
        },
        getAll: function () {
            return this.get('json');
        }
    };
    Y.augment(AjnDao, Y.Attribute);
    Y.AjnDao = AjnDao;
}, '0.0.1', {
    requires: ['base']
});
