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

function convertTransactions(json, convertedData) {
    var date = new Date(),
        data = convertedData,
        amounts = {},
        dates = {},
        total = 0;

    json.account.forEach(function (account) {
        amounts[data.accounts[account._id].title] = 0;
    });

    json.transactions.sort(function (a, b) {
        return a.datetime - b.datetime;
    });

    json.transactions.forEach(function (transaction) {
        var from_change,
            title = data.accounts[transaction.from_account_id].title,
            totitle = null,
            to_change = 0,
            change = 0,
            dateStr,
            ob;

        date.setTime(transaction.datetime);

        dateStr = [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('-');

        from_change = transaction.from_amount / 100;

        if (transaction.to_account_id && data.accounts[transaction.to_account_id]) {
            to_change = transaction.to_amount / 100;
            totitle = data.accounts[transaction.to_account_id].title;
            amounts[totitle] += to_change;
        }

        change = (from_change + to_change);
        amounts[title] += from_change;
        total += change;

        if (!dates[dateStr]) {
            dates[dateStr] = {
                change: 0,
                data: {}
            };
        }

        dates[dateStr].change = change;

        Object.keys(data.accounts).forEach(function (account) {
            var accountTitle = data.accounts[account].title;
            if (accountTitle === title || (totitle && totitle === accountTitle)) {
                if (!dates[dateStr].data[title]) {
                    dates[dateStr].data[title] = 0;
                }

                dates[dateStr].data[title] = amounts[title];
            }
        });

        dates[dateStr].total = total;
    });

    return {
        total: total,
        dates: dates
    };
}


function processTransactions(json) {
    var fields, dates;

    fields = {};
    dates = {};
    json.forEach(function (transaction) {
        var date = new Date(), dateStr;
        date.setTime(transaction.datetime);
        dateStr = [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('-');
        if (!dates[dateStr]) {
            dates[dateStr] = {};
        }
        if (!dates[dateStr][transaction.payee_title]) {
            dates[dateStr][transaction.payee_title] = 0;
            fields[transaction.payee_title] = 0;
        }
        dates[dateStr][transaction.payee_title] += +transaction.transaction_amount / 100;
    });

    return {
        dates: dates,
        fields: fields
    };
}

function processConvertedData(data) {
    var output = {};

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
var self = self || this;

self.addEventListener('message', function (event) {
    var output = {};
    if (event.data) {
        switch (event.data.type) {
        case 'transactions':
            output = convertTransactions(event.data.json, event.data.convertedData);
            break;
        case 'alltransactions':
            output = processTransactions(event.data.json);
            break;
        case 'converteddata':
            output = processConvertedData(event.data.json);
            break;
        }
    }
    self.postMessage(output);
});
