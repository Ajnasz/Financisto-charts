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
        getTotalTransactions: function () {
            var json = this.get('json'),
                output = [],
                data = this.get('convertedData'),
                date = new Date(),
                dates = {},
                total = 0;
            json.transactions.forEach(function (transaction) {
                    var from_change,
                    to_change,
                    dateStr;
                date.setTime(transaction.datetime);
                dateStr = [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('-');
                from_change = transaction.from_amount / 100;
                if (transaction.to_account_id && data.accounts[transaction.to_account_id]) {
                    to_change = transaction.to_amount / 100;
                    total += to_change;
                }
                total += from_change;
                dates[dateStr] = total;
            });
            return Object.keys(dates).map(function (item) {
                return {
                    date: item,
                    total: dates[item]
                };
            });
        },
        generateTransactions: function () {
            var json = this.get('json'),
                output = [],
                amounts = {},
                data = this.get('convertedData'),
                dates = {},
                date = new Date();
            json.account.forEach(function (account) {
                amounts[data.accounts[account._id].title] = 0;
            });
            json.transactions.forEach(function (transaction) {
                var from_change,
                    title = data.accounts[transaction.from_account_id].title,
                    to_change,
                    dateStr,
                    ob;
                date.setTime(transaction.datetime);
                dateStr = [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('-');
                from_change = transaction.from_amount / 100;
                amounts[title] += from_change;
                if (transaction.to_account_id && data.accounts[transaction.to_account_id]) {
                    to_change = transaction.to_amount / 100;
                    amounts[title] += to_change;
                }

                if (!dates[dateStr]) {
                    dates[dateStr] = {};
                }
                Object.keys(data.accounts).forEach(function (account) {
                    var title = data.accounts[account].title;
                    if (!dates[dateStr][title]) {
                        dates[dateStr][title] = 0;
                    }
                    dates[dateStr][title] = amounts[title];
                    // ob[data.accounts[account].title] = amounts[data.accounts[account].title];
                });
            });
            return Object.keys(dates).map(function (item) {
                var ob = dates[item];
                ob.date = item;
                return ob;
            });
        },

        // on: {
        //    aField: '_id',
        //    bField: 'payee_id
        // }
        join: function (a, b, on, names) {
            var allData = this.get('json'),
                aData = allData[a],
                bData = allData[b],
                output = [];

            names = names || {
                aNames: {},
                bNames: {}
            };

            aData.forEach(function (aItem) {
                bData.forEach(function (bItem) {
                    if (aItem[on.aField] === bItem[on.bField]) {
                        var merged = {};
                        Object.keys(aData, function (key) {
                            if (names.aNames[key]) {
                                merged[names.aNames[key]] = aData[key];
                            } else {
                                merged[key] = aData[key];
                            }
                        });
                        Object.keys(bData, function (key) {
                            if (names.bNames[key]) {
                                merged[names.bNames[key]] = bData[key];
                            } else {
                                merged[key] = bData[key];
                            }
                        });
                        // var merged = Y.merge(aItem, bItem);
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
