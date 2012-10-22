/*global YUI: true, Worker: true*/
/*jslint nomen: true, es5: true, browser: true*/
YUI.add('FinancistoWorker', function (Y) {
    function FinancistoWorker(workerFile, json) {
        this.addAttrs({
            workerFile: {
                value: workerFile
            },
            json: {
                value: json
            }
        });
    }
    FinancistoWorker.prototype = {
        work: function postMessage(type, data, cb) {
            var worker = new Worker(this.get('workerFile')),
                post = {
                    type: type
                };
            worker.addEventListener('message', function (e) {
                var response = e.data;
                
                this.set(response.type, response.data);
                cb();
            }.bind(this), false);
            post = Y.merge(post, data);
            worker.postMessage(post);
        },
        getConvertedData: function (cb) {
            var data = this.get('converteddata');
            if (!data) {
                this.work('converteddata', {
                    json: this.get('json')
                }, this.getConvertedData.bind(this, cb));
            } else {
                cb(data);
            }
        },
        getTransactions: function (cb) {
            var converteddata = this.get('converteddata'),
                transactions = this.get('transactions');
            if (transactions) {
                cb(transactions);
            } else {
                if (!converteddata) {
                    this.getConvertedData(this.getTransactions.bind(this, cb));
                    return;
                }
                this.work('transactions', {
                    json: this.get('json'),
                    convertedData: converteddata
                }, this.getTransactions.bind(this, cb));
            }
        },
        getMonthlyPays: function (cb) {
            var monthlyPays = this.get('monthlypays');
            if (monthlyPays) {
                cb(monthlyPays);
            } else {
                this.work('monthlypays', {
                    json: this.get('json')
                }, this.getMonthlyPays.bind(this, cb));
            }
        },
        getWeeklyPays: function (cb) {
            var weeklyPays = this.get('weeklypays');
            if (weeklyPays) {
                cb(weeklyPays);
            } else {
                this.work('weeklypays', {
                    json: this.get('json')
                }, this.getWeeklyPays.bind(this, cb));
            }
        },
        getDaysTransactions: function (cb) {
            var trn = this.get('daysTransactions');
            if (trn) {
                cb(trn);
            } else {
                this.work('alltransactions', {
                    json: this.get('json')
                });
            }
        },
        cleanup: function () {
            this.set('daysTransactions', null);
            this.set('weeklypays', null);
            this.set('monthlypays', null);
            this.set('transactions', null);
            this.set('converteddata', null);
        }
    };
    Y.augment(FinancistoWorker, Y.Attribute);
    Y.FinancistoWorker = FinancistoWorker;
}, '0.0.1', {
    requires: [
        'base',
        'event',
        'attribute'
    ]
});
