/*jslint node: true*/
function backupParser(data) {
    var conf = {},
        tables = {},
        lines = data.split('\n'),
        currentTable,
        row = {};

    lines.forEach(function (line) {
        var match;
        if (/^\$ENTITY/.test(line)) { // begins a table
            match = line.match(/^\$ENTITY:([\-_.\w\d\s]+)$/);
            currentTable = match[1].trim();
            if (!tables[currentTable]) {
                tables[currentTable] = []; // create the table
            }
            row = {};
        } else if (/^\${2}\s*$/.test(line)) {
            tables[currentTable].push(row);
            row = null;
            currentTable = null;
        } else if (currentTable) {
            match = line.split(':');

            if (!row) {
                row = {};
            }
            // I don't know what are the allowed chars for a name
            row[match[0].trim()] = match.slice(1).join(':').trim();

        } else {
            match = line.split(':');
            if (line[0] && line[0].trim() && !/\s*#/.test(line[0])) { // commented line
                conf[match[0].trim()] = match.slice(1).join(':').trim();
            }
            // console.error('no table selected');
        }
    });

    if (!conf.PACKAGE) {
        throw new TypeError('Invalid file format');
    } else {
        conf.tables = tables;
        return conf;
    }
}

exports.backupParser = backupParser;
