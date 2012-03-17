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
        join: function (a, b, on) {
            var allData = this.get('json'),
                aData = allData[a],
                bData = allData[b],
                output = [];

            aData.forEach(function (aItem) {
                bData.forEach(function (bItem) {
                    if (aItem[on.aField] === bItem[on.bField]) {
                        var merged = Y.merge(aItem, bItem);
                        merged[a + on.aField + '_joined_'] = aItem[on.aField];
                        merged[b + on.bField + '_joined_'] = bItem[on.bField];
                        output.push(merged);
                    }
                });
            });
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
