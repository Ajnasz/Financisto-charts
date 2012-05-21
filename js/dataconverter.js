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
            var title = data.accounts[account].title;
            if (!dates[dateStr].data[title]) {
                dates[dateStr].data[title] = 0;
            }

            dates[dateStr].data[title] = amounts[title];
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
        case 'bar':
            break;
        }
    }
    self.postMessage(output);
});
