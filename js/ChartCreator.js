/*global YUI: true, google: true*/
YUI.add('ChartCreator', function (Y) {
    function ChartCreator() {
        this.addAttrs({
            weeklyChart: {
                value: null,
                lazyAdd: true
            },
            monthlyChart: {
                value: null,
                lazyAdd: true
            },
            totalChart: {
                value: null,
                lazyAdd: true
            },
            allChart: {
                value: null,
                lazyAdd: true
            }
        });
    }
    ChartCreator.prototype = {
        monthlyChart: function (transactions) {
            // transactions = transactions.slice(-25);
            Y.dataTableGenerator.monthlyChart(transactions, function (dataTable) {
                var container = Y.one('#MonthlyTransactionsG'),
                    size = 30,
                    tl = dataTable.getNumberOfRows(),
                    monthRange = dataTable.getColumnRange(0),
                    valueRange = dataTable.getColumnRange(1),
                    options = {
                        height: tl * size + 100,
                        bar: {
                            groupWidth: 20
                        },
                        chartArea: {
                            top: 40,
                            height: tl * size + 50
                        },
                        vAxis: {
                            viewWindow: {
                                min: monthRange.min - 1,
                                max: monthRange.max + 1
                            }
                        }

                    };

                if (!this.get('monthlyChart')) {
                    this.set('monthlyChart',
                             new google.visualization.BarChart(container.getDOMNode()));
                }
                this.get('monthlyChart').draw(dataTable, options);
            }.bind(this));
        },
        weeklyChart: function (transactions) {
            // transactions = transactions.slice(-25);
            Y.dataTableGenerator.weeklyChart(transactions, function (dataTable) {
                var container = Y.one('#WeeklyTransactionsG'),
                    size = 30,
                    tl = dataTable.getNumberOfRows(),
                    weekRange = dataTable.getColumnRange(0),
                    valueRange = dataTable.getColumnRange(1),
                    options = {
                        height: tl * size + 100,
                        bar: {
                            groupWidth: 20
                        },
                        chartArea: {
                            top: 40,
                            height: tl * size + 50
                        },
                        vAxis: {
                            viewWindow: {
                                min: weekRange.min - 1,
                                max: weekRange.max + 1
                            }
                        }

                    };

                if (!this.get('weeklyChart')) {
                    this.set('weeklyChart',
                             new google.visualization.BarChart(container.getDOMNode()));
                }
                this.get('weeklyChart').draw(dataTable, options);
            }.bind(this));
        },

        totalChart: function (transactions) {
            Y.dataTableGenerator.totalChart(transactions, function (dataTable) {
                var totalChart = this.get('totalChart');
                if (!totalChart) {
                    totalChart = new google.visualization
                        .LineChart(Y.one('#TotalchartG').getDOMNode());
                    this.get('totalChart', totalChart);
                }
                totalChart.draw(dataTable);
            }.bind(this));
        },

        allChart: function (transactions) {
            Y.dataTableGenerator.allChart(transactions, function (dataTable) {
                var allChart = this.get('allChart');
                if (!allChart) {
                    allChart = new google.visualization.LineChart(Y.one('#MychartG').getDOMNode());
                    this.set('allChart', allChart);
                }
                allChart.draw(dataTable);
            }.bind(this));
        },
        cleanup: function () {
            var charts = [
                this.get('allChart'),
                this.get('totalChart'),
                this.get('weeklyChart'),
                this.get('monthlyChart')
            ];

            charts.forEach(function (chart) {
                if (chart) {
                    chart.clearChart();
                }
            });
        }
    };
    Y.augment(ChartCreator, Y.Attribute);
    Y.ChartCreator = ChartCreator;
}, '0.0.1', {
    requires: [
        'base',
        'event',
        'attribute',
        'dataTableGenerator'
    ]
});
