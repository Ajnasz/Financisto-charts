/*global YUI: true*/
/*jslint nomen: true*/
YUI.add('node++', function (Y) {
    function showBlock() {
        this.setStyle('display', 'block');
    }

    Y.Node.addMethod('showBlock', showBlock);

    Y.NodeList.importMethod(Y.Node.prototype, 'showBlock');
}, {requires: ['node']});

YUI.add('FinancistoApp', function (Y) {
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
    function generateTransactionLabel(categoryItem, valueItem, itemIndex, series, seriesIndex) {
        return '<div class="transactionTooltip">' +
            '<ul>' +
            '<li>Payee name: ' + valueItem.displayName + '</li>' +
            '<li>Amount: ' + valueItem.value + '</li>' +
            '<li>Date: ' + categoryItem.value + '</li>' +
            '</ul></div>';
    }
    function processAllTransactions() {
        var date = new Date(),
            json = this.get('json'),
            data = this.get('convertedData'),
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
                to_change = 0,
                change = 0,
                dateStr,
                ob;
            date.setTime(transaction.datetime);
            dateStr = [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('-');
            from_change = transaction.from_amount / 100;
            if (transaction.to_account_id && data.accounts[transaction.to_account_id]) {
                to_change = transaction.to_amount / 100;
            }
            change = (from_change + to_change);
            amounts[title] += change;
            total += change;
            if (!dates[dateStr]) {
                dates[dateStr] = {
                    change: 0,
                    data: {}
                };
            }
            dates[dateStr].change = (from_change + to_change);
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

    function processTransactions(jsonStr) {
        var json, fields, dates;

        json = JSON.parse(jsonStr);

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

    function FinancistoApp() {
        this.addAttrs({
            json: {
                value: null,
                lazyAdd: true
            },
            convertedData: {
                value: null,
                lazyAdd: true,
                setter: convertedDataSetter
            },
            processedAllTransactions: {
                value: null,
                lazyAdd: true,
                setter: processAllTransactions
            },
            processedTransactions: {
                lazyAdd: true,
                setter: processTransactions
            }
        });

        Y.one('#DataPoster').on('submit', function (e) {
            e.preventDefault();
            load('#DataPoster');
            Y.io('/data', {
                method: 'PUT',
                form: {
                    id: 'DataPoster',
                    useDisabled: false
                },
                on: {
                    success: function () {
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
        Y.all('.reset').on('click', function (e) {
            e.preventDefault();
            Y.io('/data', {
                method: 'DELETE',
                on: {
                    success: function () {
                        this.hideCharts();
                    }.bind(this),
                    failure: function (response) {
                        this.badData();
                    }.bind(this)
                }
            });
        }.bind(this));
    }
    FinancistoApp.prototype = {
        colors: [
            '#4572A7',
            '#AA4643',
            '#89A54E',
            '#80699B',
            '#3D96AE',
            '#DB843D',
            '#92A8CD',
            '#A47D7C',
            '#B5CA92'
        ],
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
        getTotalTransactions: function () {
            var processedAllTransactions, dates;

            processedAllTransactions = this.get('processedAllTransactions');
            dates = processedAllTransactions.dates;

            return Object.keys(dates).map(function (item) {
                return {
                    date: item,
                    total: dates[item].total
                };
            });
        },
        generateTransactions: function () {
            var processedAllTransactions, dates;

            processedAllTransactions = this.get('processedAllTransactions');
            dates = processedAllTransactions.dates;

            return Object.keys(dates).map(function (item) {
                var ob = dates[item].data;
                ob.date = item;
                return ob;
            });
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
            colorIndex = 0;
            Object.keys(chartConf.dataProvider[0]).forEach(function (key) {
                if (key !== chartConf.categoryKey) {
                    colorIndex += 1;
                    if (this.colors.length - 1 < colorIndex) {
                        colorIndex = 0;
                    }
                    var color = this.colors[colorIndex];
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
            }.bind(this));

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
        addChartControls: function () {
            var list,
                data = this.get('convertedData');

            list = Y.Node.create('<ul>');

            Object.keys(data.accounts).forEach(function (account) {
                list.insert(createListItem(data.accounts[account]));
            });

            list.delegate('click', function (e) {
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
        },
        onAllResponse: function onAllResponse(json) {
            var trn = this.generateTransactions(),
                totalTransactions,
                min,
                max;

            this.allDataChart = this.createChart({
                render: "#Mychart"
            }, trn);
            totalTransactions = this.getTotalTransactions();
            this.totalChart = this.createChart({
                render: '#Totalchart'
            }, totalTransactions);
            min = totalTransactions[0].total;
            max = totalTransactions[0].total;
            totalTransactions.forEach(function (transaction) {
                min = transaction.total < min ? transaction.total : min;
                max = transaction.total > max ? transaction.total : max;
            });
            this.totalChart.get('axes').values.set('minimum', min - Math.round(min / 10));
            this.totalChart.get('axes').values.set('maximum', max + Math.round(min / 10));
            this.addChartControls();
        },
        onTransactionsResponse: function onTransactionsResponse(id, o, args) {
            this.noLoad('#DataPoster');
            this.set('processedTransactions', o.response);
            var transactions, trn, fields, dates;

            trn = [];
            transactions = this.get('processedTransactions');
            fields = transactions.fields;
            dates = transactions.dates;

            Object.keys(dates).forEach(function (date) {
                var ob = dates[date];
                ob.date = date;
                trn.push(Y.merge(fields, ob));
            });
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
                    markerLabelFunction: generateTransactionLabel
                }
            }, trn);
            this.showCharts();
        },
        showCharts: function showCharts() {
            Y.one('#Charts').showBlock();
            Y.one('#DataForm').hide();
        },
        hideCharts: function hideCharts() {
            Y.one('#Charts').hide();
            Y.one('#DataForm').showBlock();
            Y.one('#Controls').empty();
            if (this.allDataChart) {
                this.allDataChart.destroy();
            }
            if (this.transactionsChart) {
                this.transactionsChart.destroy();
            }
            if (this.totalChart) {
                this.totalChart.destroy();
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
            load('#DataPoster');
            Y.io('transactions.json?days=31', {
                'on': {
                    'success': this.onTransactionsResponse.bind(this),
                    'failure': function () {
                        this.noLoad('#DataPoster');
                    }.bind(this)

                }
            });
        },
        getAll: function getAll() {
            load('#DataPoster');
            Y.io('/data', {
                data: {
                    d: Date.now()
                },
                'on': {
                    'success': function (id, o, args) {

                        this.noLoad('#DataPoster');
                        if (o.status === 200) {
                            var json = JSON.parse(o.response);
                            if (json.account) {
                                this.set('json', json);
                                this.set('processedAllTransactions');
                                this.getTransactions();
                                this.goodData();
                                this.onAllResponse(json);
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

    window.Y = Y;

    Y.augment(FinancistoApp, Y.Attribute);
    Y.FinancistoApp = FinancistoApp;
}, '0.0.1', {
    requires: ['base', 'charts', 'io', 'node++', 'event', 'tabview', 'console']
});

