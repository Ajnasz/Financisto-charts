/*jslint node: true*/
var util = require('util'),
    url = require('url'),
    Action = require('../libs/Action').Action;

function join(aData, bData, on, names) {
    var output = [];

    names = names || {
        aNames: {},
        bNames: {}
    };

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
}
function Transactions() {
}

util.inherits(Transactions, Action);
Transactions.prototype.executeGet = function (request, requestData) {
    var allData = JSON.parse(this.session.getData('data')).tables,
        days = null,
        date,
        output;

    if (requestData && requestData.query && requestData.query.days) {
        days =  requestData.query.days;
    }

    if (allData) {
        output = join(
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
        output = join(
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
        output = join(output, allData.currency, {
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

        this.serveJSON(JSON.stringify(output), 200);
    } else {
        this.notFound();
    }
};

exports.Transactions = Transactions;
