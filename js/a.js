/*global YUI: true */
/*jslint browser: true */
// Create a new YUI instance and populate it with the required modules.
YUI({
    modules: {
        'ajn': {
            fullpath: '/fw.js',
            requires: ['base', 'console', 'ajn:dao']
        },
        'ajn:dao': {
            fullpath: '/ajndao.js'
        },
        'console': {
            fullpath: '/console.js'
        }
    }
}).use('charts', 'io', 'node', 'event', 'tabview', 'console', 'ajn', function (Y) {
    var tabView,
        colors,
        allDataChart,
        totalChart,
        transactionsChart;
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
    colors = [
        '#4572A7',
        '#AA4643',
        '#89A54E',
        '#80699B',
        '#3D96AE',
        '#DB843D',
        '#92A8CD',
        '#A47D7C',
        '#B5CA92'
    ];
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
        loader.show();
    }
    function noLoad(elem) {
        elem = Y.one(elem);
        var loader = elem.one('.loader');
        if (loader) {
            loader.hide();
        }
    }
    function createChart(conf, data) {
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
                if (colors.length - 1 < colorIndex) {
                    colorIndex = 0;
                }
                var color = colors[colorIndex];
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
    }
    function onAllResponse(json) {
        var ajn = new Y.Ajn(json),
            trn = ajn.generateTransactions(),
            data = ajn.get('convertedData'),
            list;


        /*
        var i, tl;
        for (i = 0, tl = 100; i < tl; i  += 1) {
            var change = Math.floor(Math.random() * 10000);;
            amount += change;
            trn.push({date: '2012-03-29', amount: amount, change: change});
        }
        */

        allDataChart = createChart({
            render: "#mychart"
        }, trn);
        var totalTransactions = ajn.getTotalTransactions();
        totalChart = createChart({
            render: '#totalchart'
        }, totalTransactions);
        var min = totalTransactions[0].total,
            max = totalTransactions[0].total;
        totalTransactions.forEach(function (transaction) {
            min = transaction.total < min ? transaction.total : min;
            max = transaction.total > max ? transaction.total : max;
        });
        console.log(min, max);
        
        totalChart.get('axes').values.set('minimum', min - Math.round(min / 10));
        totalChart.get('axes').values.set('maximum', max + Math.round(min / 10));
        
        /*
        setInterval(function () {
            var change = Math.floor(Math.random() * 10000);;
            amount += change;
            trn.push({date: '2012-03-29', amount: amount, change: change});
            myChart.set('dataProvider', trn);
        }, 2000);
        */

        list = Y.Node.create('<ul>');
        Object.keys(data.accounts).forEach(function (account) {
            list.insert(createListItem(data.accounts[account]));
        });
        list.delegate('click', function (e) {
            var series = allDataChart.getSeries(e.target.getData('accountid'));
            series.set('visible', !series.get('visible'));
            if (series.get('visible')) {
                e.target.replaceClass('hidden', 'visible');
            } else {
                e.target.replaceClass('visible', 'hidden');
            }
            allDataChart.render();
        }, 'button');
        Y.one('#controls').insert(list);
        Y.all('#controls button').each(function (item) {
            var series = allDataChart.getSeries(item.getData('accountid')),
                styles;
            if (series) {
                styles = series.get('styles');
                if (styles) {
                    item.one('span').setStyle('backgroundColor', styles.marker.fill.color);
                }
            }
        });
    }
    function onTransactionsResponse(id, o, args) {
        noLoad('#dataPoster');
        var json = JSON.parse(o.response),
            trn = [],
            fields = {},
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
        Object.keys(dates).forEach(function (date) {
            var ob = dates[date];
            ob.date = date;
            trn.push(Y.merge(fields, ob));
        });
        transactionsChart = createChart({
            render: "#transactions",
            type: 'column',
            stacked: true,
            tooltip: {
                styles: {
                    borderRadius: '5px',
                    backgroundColor: '#333',
                    borderColor: '#000'
                },
                markerLabelFunction: function (
                    categoryItem,
                    valueItem,
                    itemIndex,
                    series,
                    seriesIndex
                ) {
                    return '<div class="transactionTooltip">' +
                        '<ul>' +
                        '<li>Payee name: ' + valueItem.displayName + '</li>' +
                        '<li>Amount: ' + valueItem.value + '</li>' +
                        '<li>Date: ' + trn[itemIndex].date + '</li>' +
                        '</ul></div>';
                }
            }
        }, trn);
        showCharts();
    }
    function showCharts() {
        Y.one('#charts').show();
        Y.one('#dataForm').hide();
    }
    function hideCharts() {
        Y.one('#charts').hide();
        Y.one('#dataForm').show();
        Y.one('#controls').empty();
        if (allDataChart) {
            allDataChart.destroy();
        }
        if (transactionsChart) {
            transactionsChart.destroy();
        }
        if (totalChart) {
            totalChart.destroy();
        }
    }

    function badData() {
        hideCharts();
        Y.one('#error').setContent('Bad data').show();
    }
    function goodData() {
        
        showCharts();
        Y.one('#error').hide();
    }
    function serverError() {
        hideCharts();
        Y.one('#error').setContent('Server error').show();
    }
    function getTransactions() {
        load('#dataPoster');
        Y.io('transactions.json?days=31', {
            'on': {
                'success': onTransactionsResponse,
                'failure': function () {
                    noLoad('#dataPoster');
                    Y.console.log('fail');
                }

            }
        });
    }
    function getAll() {
        load('#dataPoster');
        Y.io('/data', {
            'method': 'GET',
            'on': {
                'success': function (id, o, args) {
                    noLoad('#dataPoster');
                    var json = JSON.parse(o.response);
                    if (json.account) {
                        getTransactions();
                        goodData();
                        onAllResponse(json);
                    } else {
                        badData();
                    }
                },
                'failure': function (id, o, args) {
                    noLoad('#dataPoster');
                    if (o.status === 404) {
                        badData();
                    } else {
                        serverError();
                    }
                }
            }
        });
    }
    Y.one('#dataPoster').on('submit', function (e) {
        e.preventDefault();
        load('#dataPoster');
        Y.io('/data', {
            method: 'PUT',
            form: {
                id: 'dataPoster',
                useDisabled: false
            },
            on: {
                success: function () {
                    noLoad('#dataPoster');
                    goodData();
                    getAll();
                },
                failure: function () {
                    noLoad('#dataPoster');
                    badData();
                }
            }
        });
    });
    Y.one('#error').hide();
    tabView = new Y.TabView({
        srcNode: '#Tabs'
    });
    tabView.render();
    getAll();
    Y.all('.reset').on('click', function (e) {
        e.preventDefault();
        Y.io('/data', {
            method: 'DELETE',
            on: {
                success: function () {
                    hideCharts();
                },
                failure: function () {
                    badData();
                }
            }
        });
    });
    window.Y = Y;
});
