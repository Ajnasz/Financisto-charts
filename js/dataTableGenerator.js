/*global YUI: true, google: true*/
YUI.add('dataTableGenerator', function (Y) {
    var dataTableGenerator;
    function pad(number, padNum) {
        number = String(number);
        while (number.length < padNum) {
            number = '0' + number;
        }
        return number;
    }
    dataTableGenerator = {
        allChart: function (transactions, cb) {
            var dates = transactions.dates,
                dataTable,
                dateMap,
                output,
                keys = {};

            output = Object.keys(dates).map(function (item) {
                var ob = dates[item].data;
                ob.date = item;
                return ob;
            });

            output.forEach(function (item) {
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
                    output.forEach(function (item) {
                        var row = [item.date];
                        keys.forEach(function (key) {
                            if (typeof item[key] === 'number') {
                                row.push(item[key]);
                                lasts[key] = item[key];
                            } else {
                                row.push(lasts[key]);
                            }
                        });
                        dataTable.addRow(row);
                    });
                    cb(dataTable);
                }.bind(this)
            });
        },
        totalChart: function (transactions, cb) {
            var dates, foo;
            dates = transactions.dates;
            foo = Object.keys(dates).map(function (item) {
                return {
                    date: item,
                    total: dates[item].total
                };
            });
            google.load("visualization", "1", {
                packages: ["corechart"],
                callback: function () {
                    var dataTable = new google.visualization.DataTable();
                    dataTable.addColumn('string', 'Date');
                    dataTable.addColumn('number', 'Total');
                    // dataTable.addColumn({type: 'string', role: 'tooltip'});
                    foo.forEach(function (item) {
                        dataTable.addRow([item.date, item.total]);
                    });
                    cb(dataTable);
                }
            });
        },
        monthlyChart: function (transactions, cb) {
            function formatMonth(input) {
                input = input.split('-');
                var year = input[0],
                    month = input[1];
                return year + '-' + pad(month, 2);
            }
            google.load("visualization", "1", {
                packages: ["corechart"],
                callback: function () {
                    var dataTable = new google.visualization.DataTable();
                    dataTable.addColumn('string', 'Month');
                    dataTable.addColumn('number', 'Money spent');
                    // dataTable.addColumn({type: 'string', role: 'tooltip'});
                    transactions.forEach(function (item) {
                        dataTable.addRow([formatMonth(item[0]), item[1]]);
                    });
                    cb(dataTable);
                }
            });
        },
        weeklyChart: function (transactions, cb) {
            google.load("visualization", "1", {
                packages: ["corechart"],
                callback: function () {
                    var dataTable = new google.visualization.DataTable();
                    dataTable.addColumn('number', 'Week');
                    dataTable.addColumn('number', 'Money spent');
                    // dataTable.addColumn({type: 'string', role: 'tooltip'});
                    transactions.forEach(function (item) {
                        dataTable.addRow([item[0], item[1]]);
                    });
                    cb(dataTable);
                }
            });
        },
        lastDaysChart: function (transactions, cb) {
            var keys = {}, trn, dates;
            dates = transactions.dates;
            trn = Object.keys(dates).map(function (date) {
                var ob = dates[date];
                ob.date = date;
                return ob;
            });

            trn.forEach(function (item) {
                Object.keys(item.data).forEach(function (key) {
                    keys[key] = 1;
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
                            row.push(item.data[key] || 0);
                        });
                        dataTable.addRow(row);
                    });
                    cb(dataTable);
                }.bind(this)
            });
        }
    };
    Y.dataTableGenerator = dataTableGenerator;
}, '0.0.1', {
    requires: [
        'base'
    ]
});

