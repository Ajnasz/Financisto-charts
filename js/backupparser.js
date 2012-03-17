/*jslint node: true*/
function backupParser(data) {
    var tables = {},
        lines = data.split('\n'),
        currentTable,
        row = {};
    lines.forEach(function (line) {
        var match;
        if (/^\$ENTITY/.test(line)) { // begins a table
            match = line.match(/^\$ENTITY:([\-_.\w\d\s]+)$/);
            currentTable = match[1];
            if (!tables[currentTable]) {
                tables[currentTable] = []; // create the table
            }
            row = {};
        } else if (/^\${2}$/.test(line)) {
            tables[currentTable].push(row);
            row = null;
            currentTable = null;
        } else if (currentTable) {
            match = line.match(/^([\-a-zA-Z_]+):([\-_.\w\d\s]+)$/);
            if (!row) {
                row = {};
            }
            row[match[1]] = match[2];
        } else {
            console.error('no table selected');
        }
    });
    return tables;
}

exports.backupParser = backupParser;
