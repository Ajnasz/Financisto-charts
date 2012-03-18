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
            match = line.split(':');
            if (!row) {
                row = {};
            }
            // I don't know what are the allowed chars for a name
            row[match[0]] = match.slice(1).join(':');
        } else {
            // console.error('no table selected');
        }
    });
    return tables;
}

exports.backupParser = backupParser;
