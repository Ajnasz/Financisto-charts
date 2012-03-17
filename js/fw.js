/*global YUI: true*/
/*jslint nomen: true*/
YUI.add('ajn', function (Y) {
    // HELPERS
    function convertedDataSetter() {
        var data = this.get('json'),
            output = {};

        [
            'account',
            'transactions',
            'currency',
            'locations',
            'project',
            'transactions',
            'payee'
        ].forEach(function (key) {
            var outputKey = key;
            if (key === 'account') {
                outputKey = 'accounts';
            } else if (key === 'project') {
                outputKey = 'projects';
            } else if (key === 'currency') {
                outputKey = 'currencies';
            }
            output[outputKey] = {};
            if (data[key]) {
                data[key].forEach(function (item) {
                    output[outputKey][item._id] = item;
                });
            }
        });
        return output;
    }

    function Ajn(json) {
        this.dao = new Y.AjnDao(json);
        this.addAttrs({
            json: {
                getter: function () {
                    return this.dao.get('json');
                }
            },
            convertedData: {
                value: null,
                setter: convertedDataSetter
            }
        });
    }
    Ajn.prototype = {
        generateTransactions: function () {
            var json = this.get('json'),
                output = [],
                amounts = {},
                data = this.get('convertedData'),
                total = 0;
            json.account.forEach(function (account) {
                amounts[data.accounts[account._id].title] = 0;
            });
            json.transactions.forEach(function (transaction) {
                var date = new Date(),
                    amountId,
                    dateStr,
                    ob,
                    change;
                date.setTime(transaction.datetime);
                dateStr = [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('-');
                change = transaction.from_amount / 100;
                amounts[data.accounts[transaction.from_account_id].title] += change;
                total += change;

                ob = {
                    date: dateStr,
                    total: total
                };

                Object.keys(data.accounts).forEach(function (account) {
                    ob[data.accounts[account].title] = amounts[data.accounts[account].title];
                });
                output.push(ob);
            });
            return output;
        },

        // on: {
        //    aField: '_id',
        //    bField: 'payee_id
        // }
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
        filterData: function (data, conditions) {
            var output = {};
            Object.keys(data).forEach(function (key) {
                var condition = conditions[key];
                if (typeof condition === 'function') {
                    output[key] = data[key].filter(condition);
                } else {
                    output[key] = data[key];
                }
            });
            return output;
        }
    };
    Y.augment(Ajn, Y.Attribute);
    Y.Ajn = Ajn;
}, '0.0.1', {
    requires: ['base', 'console', 'ajn:dao']
});
