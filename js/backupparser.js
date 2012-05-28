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
