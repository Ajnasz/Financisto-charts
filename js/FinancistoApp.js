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
YUI.add('node++', function NodePP(Y) {
    function showBlock() {
        this.setStyle('display', 'block');
    }

    Y.Node.addMethod('showBlock', showBlock);

    Y.NodeList.importMethod(Y.Node.prototype, 'showBlock');
}, {requires: ['node']});

YUI.add('FinancistoApp', function FinancistoYUIApp(Y) {
    // HELPERS
    function convertedDataSetter(cb) {
        var json = this.get('json'),
            worker = new Worker('/dataconverter.js');

        worker.addEventListener('message', function workerListenerConvertedDataSetter(e) {
            this.set('convertedData', e.data);
            cb(e.data);
        }.bind(this));

        worker.postMessage({
            type: 'converteddata',
            json: json
        });
    }
    function createListItem(acc) {
        var listItem = Y.Node.create('<li>'),
            btn = Y.Node.create('<button>');
        btn.set('type', 'button');
        btn.setData('accountid', acc.title);
        btn.addClass('visible');
        btn.insert('<span>&nbsp;</span>');
        btn.insert(acc.title);
        listItem.insert(btn);
        return listItem;
    }
    function load(elem) {
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
    }
    function createTooltip(list) {
        var div = Y.Node.create('<div class="transactionTooltip">'),
            ul = Y.Node.create('<ul>'),
            li;
        list.forEach(function (item) {
            ul.append('<li>' + item + '</li>');
        });
        div.append(ul);
        return div;
    }
    function generateTransactionLabel(transactions, json) {
        var convertedRegEx, d;
        // __duplicated_key__ string insterted into the beginning of keys which
        // are defined twice or more for a payee
        convertedRegEx = /^__duplicated_key__\d+__/;
        d = new Date();
        d.setHours(0);
        d.setMinutes(0);
        d.setSeconds(0);
        d.setMilliseconds(0);
        function findTransaction(date, amount, payee) {
            var dateArr = date.split('-'), f;
            d.setFullYear(+dateArr[0]);
            d.setMonth(+dateArr[1] - 1);
            d.setDate(+dateArr[2]);
            f = json.filter(function (item) {
                var itemDate = new Date(+item.datetime);
                itemDate.setHours(0);
                itemDate.setMinutes(0);
                itemDate.setSeconds(0);
                itemDate.setMilliseconds(0);
                return d.getTime() === itemDate.getTime();
            });
            if (f.length > 1) {
                f = f.filter(function (item) {
                    return +item.transaction_amount / 100 === +amount;
                });
            }
            if (f.length > 1) {
                if (convertedRegEx.test(payee)) {
                    payee = payee.replace(convertedRegEx, '');
                }
                f.filter(function (item) {
                    return item.payee_title === payee;
                });
            }
            return f[0];
        }
        return function transactionLabelGenerator(categoryItem, valueItem,
                                                  itemIndex, series,
                                                  seriesIndex) {
            var transaction, list;
            transaction = findTransaction(categoryItem.value,
                                              valueItem.value,
                                              valueItem.displayName);
            list = [
                'Payee name: ' + transaction.payee_title + ' [' + transaction.account_title + ']',
                'Amount: ' + valueItem.value + ' ' + transaction.currency_symbol,
                'Date: ' + categoryItem.value
            ];
            if (transaction.transaction_note) {
                list.push('Note: ' + transaction.transaction_note);
            }
            return createTooltip(list);
        };
    }
    function processAllTransactions(cb) {
        convertedDataSetter.call(this, function convertedDataSetterCallback() {
            var json = this.get('json'),
                data = this.get('convertedData'),
                worker;

            worker = new Worker('/dataconverter.js');
            worker.addEventListener('message', function workerListenerAllTransactions(e) {
                this.set('processedAllTransactions', e.data);
                cb(e.data);
            }.bind(this));
            worker.postMessage({
                type: 'transactions',
                json: json,
                convertedData: data
            });
        }.bind(this));
        return;
    }
    function processTransactions(jsonStr, cb) {
        var json, worker;

        json = JSON.parse(jsonStr);
        worker = new Worker('/dataconverter.js');
        worker.addEventListener('message', function workerListenerTransactions(e) {
            this.set('processedTransactions', e.data);
            cb(e.data);
        }.bind(this));
        worker.postMessage({
            type: 'alltransactions',
            json: json
        });
        return;
    }
    function onFailure(id, o, args) {
        var msg = null, response;
        try {
            response = JSON.parse(o.response);
            msg = response.message;
            this.badData(msg);
        } catch (er) {
            this.serverError();
        }
        this.noLoad('#DataPoster');
    }

    function hideError() {
        Y.one('#Error').get('parentNode').hide();
    }

    function showError() {
        Y.one('#Error').get('parentNode').showBlock();
    }

    var getNextColor = (function () {
        var colors = [
            '#4572A7',
            '#AA4643',
            '#89A54E',
            '#80699B',
            '#3D96AE',
            '#DB843D',
            '#92A8CD',
            '#A47D7C',
            '#B5CA92'
        ], colorIndex = 0;

        return function getNextColor() {
            colorIndex += 1;
            if (colorIndex >= colors.length - 1) {
                colorIndex = 0;
            }
            return colors[colorIndex];
        };
    }());

    function FinancistoApp() {
        this.addAttrs({
            json: {
                value: null,
                lazyAdd: true
            },
            convertedData: {
                value: null,
                lazyAdd: true,
                // setter: convertedDataSetter
            },
            processedAllTransactions: {
                value: null,
                lazyAdd: true,
            //    setter: processAllTransactions
            },
            processedTransactions: {
                lazyAdd: true,
                // setter: processTransactions
            }
        });

        Y.one('#DataPoster').on('submit', function dataPosterSubmitListener(e) {
            e.preventDefault();
            load('#DataPoster');
            Y.io('/data', {
                method: 'PUT',
                form: {
                    id: 'DataPoster',
                    useDisabled: false
                },
                on: {
                    success: function dataPosterSuccessListener() {
                        this.noLoad('#DataPoster');
                        this.goodData();
                        this.getAll();
                    }.bind(this),
                    failure: onFailure.bind(this)
                }
            });
        }.bind(this));
        hideError();
        this.tabView = new Y.TabView({
            srcNode: '#Tabs'
        });
        this.tabView.render();
        this.getAll();
        Y.all('.reset').on('click', function resetListener(e) {
            e.preventDefault();
            Y.io('/data', {
                method: 'DELETE',
                on: {
                    success: function resetSuccessListener() {
                        this.hideCharts();
                    }.bind(this),
                    failure: function resetFailureListener(response) {
                        this.badData();
                    }.bind(this)
                }
            });
        }.bind(this));
        this.chartTabView = new Y.TabView({
            srcNode: '#ChartTabs'
        });
        // select the currently selected tab on tabview render
        this.chartTabView.after('render', this.onTabSelect.bind(this));
        // select the currently selected tab on selection change
        this.chartTabView.after('selectionChange', this.onTabSelect.bind(this));
        // TODO remove, debug
        window.YYYY = this;
    }
    FinancistoApp.prototype = {
        onTabSelect: function (tabId) {
            // render chart only if the tabview is rendered
            if (this.chartTabView.get('rendered')) {
                switch (this.chartTabView.get('selection').get('panelNode').get('id')) {
                case 'TotalTransactions':
                    this.renderTotalTransactions();
                    break;
                case 'AllTransactions':
                    this.renderAllTransactions();
                    break;
                case 'LastDaysTransactions':
                    this.renderLastDaysTransactions();
                    break;
                }
            }
            if (!this.get('daySelectSubscribed')) {
                this.set('daySelectSubscribed', true);
                var timeout;
                Y.one('#DaySelect').on('valuechange', function () {
                    if (timeout) {
                        clearTimeout(timeout);
                    }
                    timeout = setTimeout(function () {
                        // this.transactionsChart.destroy();
                        this.set('lastDaysTransactionsRendered', false);
                        this.renderLastDaysTransactions();
                    }.bind(this), 500);
                }.bind(this));
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
        getTotalTransactions: function getTotalTransactions(cb) {
            var processedAllTransactions, dates, output;

            processedAllTransactions = this.get('processedAllTransactions');
            dates = processedAllTransactions.dates;
            Y.foo = dates;

            output = Object.keys(dates).map(function (item) {
                return {
                    date: item,
                    total: dates[item].total
                };
            });

            cb(output);
        },
        generateTransactions: function generateTransactions(cb) {
            var processedAllTransactions, dates, output;

            processedAllTransactions = this.get('processedAllTransactions');
            dates = processedAllTransactions.dates;

            output = Object.keys(dates).map(function (item) {
                var ob = dates[item].data;
                ob.date = item;
                return ob;
            });
            cb(output, dates);
        },
        createChart: function createChart(conf, data) {
            var defaultConf, chartConf, chart, seriesStyles, colorIndex;
            defaultConf = {
                dataProvider: data,
                categoryKey: 'date',
                type: 'combo',
                tooltip: {
                    styles: {
                        borderRadius: '5px',
                        backgroundColor: '#333',
                        borderColor: '#000',
                        color: '#fff',
                        fontFamily: 'sans-serif',
                        fontSize: '13px',
                        padding: '2px 5px'
                    },
                    markerLabelFunction: function (categoryItem, valueItem,
                                                   itemIndex, series,
                                                   seriesIndex) {
                        return createTooltip([
                            valueItem.displayName + ': ' + valueItem.value,
                            categoryItem.displayName + ': ' + categoryItem.value
                        ]);
                    }
                },
                verticalGridlines: {
                    styles: {
                        line: {
                            color: '#aaa',
                            width: 1

                        }
                    }
                },
                horizontalGridlines: {
                    styles: {
                        line: {
                            color: '#aaa',
                            width: 1
                        }
                    }
                }
            };
            chartConf = Y.merge(defaultConf, conf);
            seriesStyles = {};
            chartConf.dataProvider.forEach(function (item) {
                Object.keys(item).forEach(function (key) {
                    if (key !== chartConf.categoryKey) {
                        var color = getNextColor();
                        seriesStyles[key] = {
                            line: {
                                color: color
                            },
                            marker: {
                                fill: {
                                    color: color
                                },
                                border: {
                                    color: color
                                }
                            }
                        };
                    }
                });
            });

            chartConf = Y.merge(chartConf, {styles: {series: seriesStyles}});
            chart = new Y.Chart(chartConf);
            chart.getAxisByKey('date').set('styles', {
                label: {
                    rotation: -45
                },
                line: {
                    width: 2
                }
            });
            return chart;
        },
        addChartControls: function addChartControls() {
            convertedDataSetter.call(this, function () {
                var data = this.get('convertedData'),
                    list;

                list = Y.Node.create('<ul>');

                Object.keys(data.accounts).forEach(function (account) {
                    list.insert(createListItem(data.accounts[account]));
                });

                list.delegate('click', function listClickListener(e) {
                    var series = this.allDataChart.getSeries(e.target.getData('accountid'));
                    series.set('visible', !series.get('visible'));
                    if (series.get('visible')) {
                        e.target.replaceClass('hidden', 'visible');
                    } else {
                        e.target.replaceClass('visible', 'hidden');
                    }
                    this.allDataChart.render();
                }.bind(this), 'button');

                list.all('button').each(function (item) {
                    var series = this.allDataChart.getSeries(item.getData('accountid')),
                        styles;
                    if (series) {
                        styles = series.get('styles');
                        if (styles) {
                            item.one('span').setStyle('backgroundColor', styles.marker.fill.color);
                        }
                    }
                }.bind(this));

                Y.one('#Controls').insert(list);
            }.bind(this));
        },
        createTotalChart: function createTotalChart(totalTransactions) {
            /*
            setTimeout(function () {
                var min, max;
                min = totalTransactions[0].total;
                max = totalTransactions[0].total;
                totalTransactions.forEach(function (transaction) {
                    min = transaction.total < min ? transaction.total : min;
                    max = transaction.total > max ? transaction.total : max;
                });
                this.totalChart = this.createChart({
                    render: '#Totalchart'
                }, totalTransactions);

                this.totalChart.get('axes').values.set('minimum', min - Math.round(min / 10));
                this.totalChart.get('axes').values.set('maximum', max + Math.round(min / 10));
            }.bind(this), 100);
            */
            this.createTotalChartG(totalTransactions);
        },
        createTotalChartG: function (transactions) {
            google.load("visualization", "1", {
                packages: ["corechart"],
                callback: function () {
                    var dataTable = new google.visualization.DataTable();
                    dataTable.addColumn('string', 'Date');
                    dataTable.addColumn('number', 'Total');
                    // dataTable.addColumn({type: 'string', role: 'tooltip'});
                    transactions.forEach(function (item) {
                        dataTable.addRow([item.date, item.total]);
                    });
                    if (!this.totalChart) {
                        this.totalChart = new google.visualization.ChartWrapper({
                            chartType: 'LineChart',
                            containerId: 'TotalchartG'
                        });
                    }
                    this.totalChart.setDataTable(dataTable);
                    this.totalChart.draw();
                }.bind(this)
            });
        },
        createAllDataChart: function createAllDataChart(trn, data) {
            /*
            setTimeout(function () {
                this.allDataChart = this.createChart({
                    render: "#Mychart"
                }, trn);
                this.addChartControls();
            }.bind(this), 100);
            */
            this.createAllDataChartG(trn, data);
        },
        createAllDataChartG: function createAllDataChart(trn, data) {
            var keys = {},
                output = [];

            trn.forEach(function (item) {
                Object.keys(item).forEach(function (key) {
                    if (key !== 'date') {
                        keys[key] = 1;
                    }
                });
            });
            keys = Object.keys(keys);
            google.load("visualization", "1", {
                packages: ["corechart"],
                callback: function () {
                    var dataTable = new google.visualization.DataTable(output),
                        lasts;

                    lasts = {};
                    dataTable.addColumn('string', 'date');
                    keys.forEach(function (key) {
                        lasts[key] = 0;
                        dataTable.addColumn('number', key);
                    });
                    trn.forEach(function (item) {
                        var row = [item.date];
                        keys.forEach(function (key) {
                            if (item[key]) {
                                row.push(item[key]);
                                lasts[key] = item[key];
                            } else {
                                row.push(lasts[key]);
                            }
                        });
                        dataTable.addRow(row);
                    });
                    if (!this.allDataChart) {
                        this.allDataChart = new google.visualization.ChartWrapper({
                            chartType: 'LineChart',
                            containerId: 'MychartG'
                        });
                    }
                    this.allDataChart.setDataTable(dataTable);
                    this.allDataChart.draw();
                }.bind(this)
            });
        },
        createTransactionsChart: function createTransactionsChart(trn, json) {
            /*
            console.log('transactions', trn);
            setTimeout(function () {
                this.transactionsChart = this.createChart({
                    render: "#Transactions",
                    type: 'column',
                    stacked: true,
                    tooltip: {
                        styles: {
                            borderRadius: '5px',
                            backgroundColor: '#333',
                            borderColor: '#000'
                        },
                        markerLabelFunction: generateTransactionLabel(trn, json)
                    }
                }, trn);
            }.bind(this), 100)
            */
            this.createTransactionsChartG(trn, json);
        },
        createTransactionsChartG: function createTransactionsChart(trn, json) {
            var keys = {};
            trn.forEach(function (item) {
                Object.keys(item).forEach(function (key) {
                    if (key !== 'date') {
                        keys[key] = 1;
                    }
                });
            });
            keys = Object.keys(keys);
            google.load("visualization", "1", {
                packages: ["corechart"],
                callback: function () {
                    var dataTable = new google.visualization.DataTable(),
                        rex = /^__duplicated_key__\d+__/;
                    dataTable.addColumn('string', 'date');
                    keys.forEach(function (key) {
                        if (rex.test(key)) {
                            key = key.replace(rex, '');
                        }
                        dataTable.addColumn('number', key);
                    });
                    trn.forEach(function (item) {
                        var row = [item.date];
                        keys.forEach(function (key) {
                            row.push(item[key]);
                        });
                        dataTable.addRow(row);
                    });
                    if (!this.transactionsChart) {
                        this.transactionsChart  = new google.visualization.ChartWrapper({
                            chartType: 'BarChart',
                            containerId: 'TransactionsG'
                        });
                    }
                    this.transactionsChart.setDataTable(dataTable);
                    this.transactionsChart.setOptions({
                        isStacked: true,
                        height: trn.length * 25
                    });
                    this.transactionsChart.draw();
                }.bind(this)
            });
        },
        renderAllTransactions: function (attribute) {
            if (!this.get('allTransactionsRendered')) {
                this.set('allTransactionsRendered', true);
                this.generateTransactions(this.createAllDataChart.bind(this));
            }
        },
        renderLastDaysTransactions: function () {
            if (!this.get('lastDaysTransactionsRendered')) {
                this.set('lastDaysTransactionsRendered', true);
                this.getTransactions();
            }
        },
        renderTotalTransactions: function () {
            if (!this.get('totalChartRendered')) {
                this.set('totalChartRendered', true);
                this.getTotalTransactions(this.createTotalChart.bind(this));
            }
        },
        onAllResponse: function onAllResponse() {
            // this.generateTransactions(this.createAllDataChart.bind(this));
            // this.getTotalTransactions(this.createTotalChart.bind(this));
            if (!this.chartTabView.get('rendered')) {
                this.chartTabView.render();
            }
        },
        onTransactionsResponse: function onTransactionsResponse(id, o, args) {
            this.noLoad('#DataPoster');
            processTransactions.call(this, o.response, function (data) {
                var transactions, trn, fields, dates;

                trn = [];
                transactions = this.get('processedTransactions');
                fields = transactions.fields;
                dates = transactions.dates;

                Object.keys(dates).forEach(function (date) {
                    var ob = dates[date];
                    ob.date = date;
                    trn.push(ob);
                });
                this.createTransactionsChart(trn, JSON.parse(o.response));
            }.bind(this));
        },
        showCharts: function showCharts() {
            Y.one('#Charts').showBlock();
            Y.one('#DataForm').hide();
            if (this.chartTabView.get('rendered')) {
                this.chartTabView.item(0).set('selected', 1);
            } else {
                this.chartTabView.on('rendered', function () {
                    this.chartTabView.item(0).set('selected', 1);
                }.bind(this));
            }
        },
        hideCharts: function hideCharts() {
            Y.one('#Charts').hide();
            Y.one('#DataForm').showBlock();
            Y.one('#Controls').empty();
            if (this.allDataChart) {
                this.allDataChart.clearChart();
                this.set('allTransactionsRendered', false);
            }
            if (this.transactionsChart) {
                this.transactionsChart.clearChart();
                this.set('lastDaysTransactionsRendered', false);
            }
            if (this.totalChart) {
                this.totalChart.clearChart();
                this.set('totalChartRendered', false);
            }
        },
        badData: function badData(msg) {
            this.hideCharts();
            msg = msg || 'Bad data';
            Y.one('#Error').setContent(msg);
            showError();
        },
        goodData: function goodData() {
            this.showCharts();
            hideError();
        },
        serverError: function serverError() {
            this.hideCharts();
            Y.one('#Error').setContent('Server error');
            showError();
        },
        getTransactions: function getTransactions() {
            var value = parseInt(Y.one('#DaySelect').get('value'), 10);
            if (value && value > 0) {
                load('#DataPoster');
                Y.io('transactions.json?days=' + Y.one('#DaySelect').get('value'), {
                    'on': {
                        'success': this.onTransactionsResponse.bind(this),
                        'failure': function getTransactionsFailureListener() {
                            this.noLoad('#DataPoster');
                        }.bind(this)

                    }
                });
            }
        },
        showTabs: function () {
        },
        getAll: function getAll() {
            load('#DataPoster');
            Y.io('/data', {
                data: {
                    d: Date.now()
                },
                'on': {
                    'success': function getAllSuccessListener(id, o, args) {
                        this.noLoad('#DataPoster');
                        if (o.status === 200) {
                            var json = JSON.parse(o.response);
                            if (json.account) {
                                this.set('json', json);
                                processAllTransactions.call(this,
                                    function allTransactionsCallback(transactions) {
                                        this.goodData();
                                        this.onAllResponse(json);
                                    }.bind(this));
                            } else {
                                this.badData();
                            }
                        } else if (o.status === 204) {
                            this.badData('Please upload a backup file');
                        }
                    }.bind(this),
                    'failure': onFailure.bind(this)
                }
            });
        }
    };

    Y.augment(FinancistoApp, Y.Attribute);
    Y.FinancistoApp = FinancistoApp;
}, '0.0.2', {
    requires: [
        'base',
        // 'charts',
        'io',
        'node++',
        'event',
        'tabview',
        'console',
        'attribute'
    ]
});

