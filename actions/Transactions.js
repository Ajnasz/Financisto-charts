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
var util = require('util'),
    url = require('url'),
    queryString = require('querystring'),
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
                        merged[names.aNames[key]] = aItem[key] || 'Undef A';
                    });
                    Object.keys(names.bNames).forEach(function (key) {
                        merged[names.bNames[key]] = bItem[key] || 'Undef B';
                    });
                    output.push(merged);
                }
            });
        });
    }
    return output;
}
function leftJoin(aData, bData, on, names) {
    var output = [], aNames, bNames;

    names = names || {
        aNames: {},
        bNames: {}
    };

    aNames = Object.keys(names.aNames);
    bNames = Object.keys(names.bNames);

    if (aData && aData.length) {
        aData.forEach(function (aItem) {
            var merged = {};
            bNames.forEach(function (key) {
                merged[names.bNames[key]] = null;
            });
            bData.forEach(function (bItem) {
                if (aItem[on.aField] === bItem[on.bField]) {
                    aNames.forEach(function (key) {
                        merged[names.aNames[key]] = aItem[key];
                    });
                    bNames.forEach(function (key) {
                        merged[names.bNames[key]] = bItem[key];
                    });
                }
            });
            output.push(merged);
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
        query = url.parse(request.url, true).query,
        date,
        output;

    if (query && query.days) {
        days =  query.days;
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
                    'datetime': 'datetime',
                    'note': 'transaction_note'
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
                    'payee_title': 'payee_title',
                    'transaction_note': 'transaction_note'
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
                'account_title': 'account_title',
                'transaction_note': 'transaction_note'
            },
            bNames: {
                'name': 'currency_name',
                'symbol': 'currency_symbol',
                title: 'currency_title'
            }
        });
        if (days) {
            date = Date.now() - 60 * 60 * 24 * 1000 * days;
            output = output.filter(function (item) {
                return date <= item.datetime;
            });
        }

        this.serveJSON(JSON.stringify(output), 200);
    } else {
        this.notFound();
    }
};

exports.Transactions = Transactions;
