YUI.add('TransactionProcessor', function (Y) {
    function getTransactions(cb) {
        var value = parseInt(Y.one('#DaySelect').get('value'), 10);
        if (value && value > 0) {
            Y.io('transactions.json?days=' + Y.one('#DaySelect').get('value'), {
                'on': {
                    'success': function (id, o) {
                        this.set('transactions', JSON.parse(o.response));
                        cb();
                    }.bind(this),
                    'failure': function getTransactionsFailureListener() {
                        this.noLoad('#DataPoster');
                    }.bind(this)

                }
            });
        }
    }
    function TransactionProcessor() {
        this.addAttrs({
            worker: {
                value: new Y.FinancistoWorker('/js/dataconverter.js')
            },
            transactions: {
                value: null,
                setter: function (val) {
                    this.get('worker').set('transactions', val);
                    return val;
                },
                lazyAdd: true
            },
            json: {
                value: null,
                setter: function (val) {
                    this.get('worker').set('json', val);
                    return val;
                },
                lazyAdd: true
            }
        });
    }
    TransactionProcessor.prototype = {
        totalTransactions: function (cb) {
            this.get('worker').getTransactions(function (transactions) {
                this.set('processedTotalTransactions', transactions);
                cb();
            }.bind(this));
        },
        monthlyTransactions: function (cb) {
            this.get('worker').getMonthlyPays(function (transactions) {
                this.set('processedMonthlyTransactions', transactions);
                cb();
            }.bind(this));
        },
        weeklyTransactions: function (cb) {
            this.get('worker').getWeeklyPays(function (transactions) {
                this.set('processedWeeklyTransactions', transactions);
                cb();
            }.bind(this));
        },
        allTransactions: function (cb) {
            this.get('worker').getTransactions(function (transactions) {
                this.set('processedAllTransactions', transactions);
                cb();
            }.bind(this));
        },
        lastDaysTransactions: function (cb) {
            this.get('worker').getTransactions(function (transactions) {
                this.set('processedLastDaysTransactions', transactions);
                // cb();
            }.bind(this));
        },
        cleanup: function () {
            this.get('worker').cleanup();
            this.set('processedTotalTransactions', null);
            this.set('processedMonthlyTransactions', null);
            this.set('processedWeeklyTransactions', null);
            this.set('processedAllTransactions', null);
            this.set('processedLastDaysTransactions', null);
        }
    };
    Y.augment(TransactionProcessor, Y.Attribute);
    Y.TransactionProcessor = TransactionProcessor;
}, '0.0.2', {
    requires: [
        'base',
        'event',
        'attribute',
        'io',
        'FinancistoWorker'
    ]
});
