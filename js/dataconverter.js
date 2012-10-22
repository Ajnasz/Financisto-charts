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
    labelCount = {};
    json.forEach(function (transaction) {
        var date = new Date(),
            label = transaction.payee_title,
            dateStr;
        date.setTime(transaction.datetime);
        dateStr = [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('-');
        if (!dates[dateStr]) {
            dates[dateStr] = {};
        }
        if (dates[dateStr][label]) {
            if (!labelCount[label]) {
                labelCount[label] = 1;
            }
            labelCount[label] += 1;
            label = '__duplicated_key__' + labelCount[label] + '__' + label;
        }
        dates[dateStr][label] = 0;
        fields[label] = 0;
        dates[dateStr][label] += +transaction.transaction_amount / 100;
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
        var outputKey;
        if (key === 'account') {
            outputKey = 'accounts';
        } else if (key === 'project') {
            outputKey = 'projects';
        } else if (key === 'currency') {
            outputKey = 'currencies';
        } else {
            outputKey = key;
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

function getWeekNumber(ts) {
    var date = new Date(),
        dateonejan = new Date(),
        onejan;

    date.setTime(ts);
    dateonejan.setTime(ts);

    onejan = new Date(dateonejan.getFullYear(), 0, 1);
    return Math.ceil((((date - onejan) / 86400000) + onejan.getDay() + 1) / 7);
}
function getMonthNumber(ts) {
    var date = new Date();
    date.setTime(ts);
    return date.getFullYear() + '-' + (date.getMonth() + 1);
}
function getWeeklyTransactions(data) {
    var weeklyGroups;
    weeklyGroups = [];
    data.transactions.forEach(function (transaction) {
        var group, amount, weekNumber;

        weekNumber = getWeekNumber(transaction.datetime);

        if (!weeklyGroups[weekNumber]) {
            weeklyGroups[weekNumber] = [];
        }

        amount = parseInt(transaction.from_amount, 10) + parseInt(transaction.to_amount, 10);
        weeklyGroups[weekNumber].push(amount / 100);
    });
    return weeklyGroups.map(function (group, index) {
        return [index, group.reduce(function (prev, current) {
            return current + prev;
        }, 0)];
    });
}

function getMonthlyTransactions(data) {
    var monthlyGroups = {};

    data.transactions.forEach(function (transaction) {
        var group, amount, monthNumber;

        monthNumber = getMonthNumber(transaction.datetime);

        if (!monthlyGroups[monthNumber]) {
            monthlyGroups[monthNumber] = [];
        }

        amount = parseInt(transaction.from_amount, 10) + parseInt(transaction.to_amount, 10);
        monthlyGroups[monthNumber].push(amount / 100);
    });

    return Object.keys(monthlyGroups).map(function (group, index) {
        var items = monthlyGroups[group];
        return [group, items.reduce(function (prev, current) {
            return current + prev;
        }, 0)];
    });
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
        case 'weeklypays':
            output = getWeeklyTransactions(event.data.json);
            break;
        case 'monthlypays':
            output = getMonthlyTransactions(event.data.json);
            break;
        }
    }

    self.postMessage({
        type: event.data.type,
        data: output
    });
});
