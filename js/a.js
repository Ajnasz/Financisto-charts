/*global YUI: true */
/*jslint browser: true */
// Create a new YUI instance and populate it with the required modules.
YUI.applyConfig();
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
}).use('charts', 'io', 'node', 'event', 'console', 'ajn', function (Y) {
    function createListItem(acc) {
        var listItem = Y.Node.create('<li>'),
            btn = Y.Node.create('<button>');
        btn.set('type', 'button');
        btn.setData('accountid', acc.title);
        btn.addClass('visible');
        btn.insert(acc.title);
        listItem.insert(btn);
        return listItem;
    }
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
        ];
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
    function onAllResponse(id, o, args) {
        var json = JSON.parse(o.response),
            ajn = new Y.Ajn(json),
            trn = ajn.generateTransactions(),
            data = ajn.get('convertedData'),
            myChart,
            list;


        /*
        var i, tl;
        for (i = 0, tl = 100; i < tl; i  += 1) {
            var change = Math.floor(Math.random() * 10000);;
            amount += change;
            trn.push({date: '2012-03-29', amount: amount, change: change});
        }
        */

        myChart = createChart({
            render: "#mychart"
        }, trn);
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
        list.insert(createListItem({
            title: 'total'
        }));
        list.delegate('click', function (e) {
            var series = myChart.getSeries(e.target.getData('accountid'));
            series.set('visible', !series.get('visible'));
            if (series.get('visible')) {
                e.target.replaceClass('hidden', 'visible');
            } else {
                e.target.replaceClass('visible', 'hidden');
            }
            myChart.render();
        }, 'button');
        Y.one('#controls').insert(list);
    }
    function onTransactionsResponse(id, o, args) {
        var json = JSON.parse(o.response),
            myChart,
            trn = [];
        json.forEach(function (transaction) {
            var date = new Date(), dateStr;
            date.setTime(transaction.datetime);
            dateStr = [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('-');
            trn.push({
                date: dateStr,
                amount: transaction.from_amount / 100
            });
        });
        myChart = createChart({
            render: "#transactions",
            type: 'column',
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
                        '<li>Payee name: ' + json[itemIndex].title + '</li>' +
                        '<li>Amount: ' + trn[itemIndex].amount + '</li>' +
                        '<li>Date: ' + trn[itemIndex].date + '</li>' +
                        '</ul></div>';
                    
                }
            }
        }, trn);
    }
    Y.one('#error').hide();
    function badData() {
        Y.one('#charts').hide();
        Y.one('#dataForm').show();
        Y.one('#error').insert('Bad data').show();
    }
    function goodData() {
        Y.one('#charts').show();
        Y.one('#dataForm').hide();
        Y.one('#error').hide();
    }
    function serverError() {
        Y.one('#charts').hide();
        Y.one('#dataForm').show();
        Y.one('#error').insert('Server error').show();
    }
    function getTransactions() {
        Y.io('transactions.json?days=31', {
            'on': {
                'success': onTransactionsResponse,
                'failure': function () {
                    Y.console.log('fail');
                }

            }
        });
    }
    function getAll() {
        Y.io('/a.json', {
            'on': {
                'success': function (id, o, args) {
                    getTransactions();
                    goodData();
                    onAllResponse(id, o, args);
                },
                'failure': function (id, o, args) {
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
        Y.io('/setdata', {
            method: 'POST',
            form: {
                id: 'dataPoster',
                useDisabled: false
            },
            on: {
                success: function () {
                    goodData();
                    getAll();
                },
                failure: function () {
                    badData();
                }
            }
        });
    });
    getAll();
});
