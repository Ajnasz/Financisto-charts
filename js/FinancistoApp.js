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

/*global YUI: true, google: true, Worker: true*/
/*jslint nomen: true, es5: true, browser: true*/
YUI.add('FinancistoApp', function FinancistoYUIApp(Y) {
    var BAD_DATA_ERROR = 'error',
        BAD_DATA_WARNING = 'warning';


    function hideError() {
        Y.one('#Message').get('parentNode').hide();
    }

    function showError() {
        Y.one('#Message').get('parentNode').showBlock();
    }

    function FinancistoApp() {
        this.addAttrs({
            json: {
                value: null,
                setter: function (val) {
                    this.get('processor').set('json', val);
                    return val;
                },
                lazyAdd: true
            },
            transactions: {
                value: null,
                setter: function (val) {
                    this.get('processor').set('transactions', val);
                    return val;
                }
            },
            convertedData: {
                value: null,
                lazyAdd: true,
                // setter: convertedDataSetter
            },
            processor: {
                value: new Y.TransactionProcessor()
            },
            chartCreator: {
                value: new Y.ChartCreator()
            },
            dataStorage: {
                value: new Y.DataStorage('DataPoster')
            }
        });
        this.setupDataStorage();
        Y.one('#DataPoster').on('submit', function dataPosterSubmitListener(e) {
            e.preventDefault();
            this.get('dataStorage').setData();
        }.bind(this));
        this.createTabView();
        this.setupDataReset();

        this.subscribeToEvents();
        hideError();

        this.getAll();

        window.YYYY = this;
    }

    FinancistoApp.prototype = {
        setupDataReset: function () {
            Y.all('.reset').on('click', function resetListener(e) {
                e.preventDefault();
                this.get('dataStorage').clear();
            }.bind(this));
        },

        createTabView: function () {
            this.tabView = new Y.TabView({
                srcNode: '#Tabs'
            });
            this.tabView.render();
            this.chartTabView = new Y.TabView({
                srcNode: '#ChartTabs'
            });
            // select the currently selected tab on tabview render
            this.chartTabView.after('render', this.onTabSelect.bind(this));
            // select the currently selected tab on selection change
            this.chartTabView.after('selectionChange', this.onTabSelect.bind(this));
            // TODO remove, debug
        },

        setupDataStorage: function () {
            var dataStorage = this.get('dataStorage');

            dataStorage.after('jsonChange', function (changeEvent) {
                var json = changeEvent.newVal;
                if (!json) {
                    this.hideCharts();
                    this.cleanup();
                }
                this.set('json', json);
            }.bind(this));

            dataStorage.after('transactionsChange', function () {
                this.set('transactions', dataStorage.get('transactions'));
            }.bind(this));

            dataStorage.on('goodData', function (event, status) {
                this.goodData();
            }.bind(this));

            dataStorage.on('sendRequest', function (event) {
                if (['setData', 'getJSON'].indexOf(event.requestName) > -1) {
                    this.load('#DataPoster');
                }
            }.bind(this));
            dataStorage.on('completeRequest', function (event) {
                if (['setData', 'getJSON'].indexOf(event.requestName) > -1) {
                    this.noLoad('#DataPoster');
                }
            }.bind(this));

            dataStorage.on('badData', function (event) {
                var response = event.response,
                    status = response.status;

                if (status === 204) {
                    this.badData('Please upload a backup file', BAD_DATA_WARNING);
                } else {
                    this.onFailure(response);
                }
            }.bind(this));

            dataStorage.on('dataSet', this.getAll.bind(this));

        },

        subscribeToEvents: function () {
            // show charts if json has bee set
            this.after('jsonChange', function (changeEvent) {
                if (changeEvent.newVal) {
                    this.showCharts();
                }
            }.bind(this));

        },

        onTabSelect: function onTabSelect(tabId) {

            var selection;
            // render chart only if the tabview is rendered
            if (this.chartTabView.get('rendered')) {
                selection = this.chartTabView.get('selection');
                if (!selection) {
                    return;
                }

                switch (selection.get('panelNode').get('id')) {
                case 'TotalTransactions':
                    this.renderTotalTransactions();
                    break;
                case 'AllTransactions':
                    this.renderAllTransactions();
                    break;
                case 'WeeklyTransactions':
                    this.renderWeeklyTransactions();
                    break;
                case 'MonthlyTransactions':
                    this.renderMonthlyTransactions();
                    break;
                }
            }
        },

        load: function load(elem) {
            elem = Y.one(elem);

            var loader = elem.one('.loader');

            if (!loader) {
                loader = Y.Node.create('<div>');
                loader.addClass('loader');
                loader.hide();
                elem.insert(loader);
            }
            loader.setStyles({
                width: elem.getStyle('width'),
                height: elem.getStyle('height')
            });

            elem.setStyle('position', 'relative');

            loader.showBlock();
        },

        noLoad: function noLoad(elem) {
            elem = Y.one(elem);

            var loader = elem.one('.loader');

            if (loader) {
                loader.hide();
            }
        },

        onFailure: function onFailure(o) {
            var msg = null,
                response;
            try {
                response = JSON.parse(o.response);
                msg = response.message;
                this.badData(msg);
            } catch (er) {
                this.serverError();
            }
        },

        showCharts: function showCharts(e) {
            Y.one('#Charts').showBlock();
            Y.one('#DataForm').hide();
            Y.one('#Reset').showBlock();
            if (this.chartTabView.get('rendered')) {
                if (this.chartTabView.item(0).get('selected')) {
                    this.chartTabView.item(0).set('selected', 0);
                }
                this.chartTabView.item(0).set('selected', 1);
            } else {
                this.chartTabView.on('rendered', function () {
                    this.chartTabView.item(0).set('selected', 1);
                }.bind(this));
                this.chartTabView.render();
            }
        },

        hideCharts: function hideCharts() {
            Y.one('#Charts').hide();
            Y.one('#DataForm').showBlock();
            Y.one('#Controls').empty();
            Y.one('#Reset').hide();
        },

        badData: function badData(msg, type) {
            this.hideCharts();
            type = type || BAD_DATA_ERROR;
            msg = msg || 'Bad data';
            Y.one('#Message')
                .setContent(msg)
                .removeClass(BAD_DATA_ERROR)
                .removeClass(BAD_DATA_WARNING)
                .addClass(type);
            showError();
        },

        goodData: function goodData() {
            hideError();
        },

        serverError: function serverError() {
            this.hideCharts();
            Y.one('#Message').setContent('Server error');
            showError();
        },

        getTransactions: function getTransactions(cb) {
            var value = parseInt(Y.one('#DaySelect').get('value'), 10);
            if (value && value > 0) {
                Y.io('transactions.json?days=' + Y.one('#DaySelect').get('value'), {
                    'on': {
                        'success': function (id, o) {
                            this.set('transactions', JSON.parse(o.response));
                            // cb();
                        }.bind(this),
                        'failure': function getTransactionsFailureListener() {
                            this.noLoad('#DataPoster');
                        }.bind(this)

                    }
                });
            }
        },

        getAll: function getAll() {
            this.get('dataStorage').getJSON();
        },

        renderTotalTransactions: function renderTotalTransactions() {
            var transactions = this.get('processor').get('processedTotalTransactions');
            if (!transactions) {
                this.get('processor').totalTransactions(this.renderTotalTransactions.bind(this));
                return;
            }
            this.get('chartCreator').totalChart(transactions);
        },

        renderMonthlyTransactions: function renderMonthlyTransactions() {
            var transactions = this.get('processor').get('processedMonthlyTransactions');
            if (!transactions) {
                this.get('processor')
                    .monthlyTransactions(this.renderMonthlyTransactions.bind(this));
                return;
            }
            this.get('chartCreator').monthlyChart(transactions);
        },

        renderWeeklyTransactions: function renderWeeklyTransactions() {
            var transactions = this.get('processor').get('processedWeeklyTransactions');
            if (!transactions) {
                this.get('processor').weeklyTransactions(this.renderWeeklyTransactions.bind(this));
                return;
            }
            this.get('chartCreator').weeklyChart(transactions);
        },

        renderAllTransactions: function renderAllTransactions() {
            var transactions = this.get('processor').get('processedTotalTransactions');
            if (!transactions) {
                this.get('processor').totalTransactions(this.renderAllTransactions.bind(this));
                return;
            }
            this.get('chartCreator').allChart(transactions);
        },

        cleanup: function cleanup() {
            this.get('processor').cleanup();
            this.get('chartCreator').cleanup();
        }
    };

    Y.augment(FinancistoApp, Y.Attribute);
    Y.FinancistoApp = FinancistoApp;
}, '0.0.2', {
    requires: [
        'base',
        // 'charts',
        'node++',
        'event',
        'tabview',
        'console',
        'attribute',
        'DataStorage',
        'ChartCreator',
        'TransactionProcessor'
    ]
});
