/*jslint node:true*/
function gZip(data, cb, cfg, unzip) {
    cfg = cfg || {};
    var spawn = require('child_process').spawn,
        output = [],
        isBuffer = Buffer.isBuffer(data),
        enc = 'utf8',
        output_len = 0,
        rate = cfg.rate || 8,
        gzip = unzip ? spawn('gzip', ['-d', '-']) : spawn('gzip', ['-' + (rate), '-c', '-']);


    gzip.stdout.on('data', function (data) {
        output.push(data);
        output_len += data.length;
    });
    gzip.on('exit', function (code) {
        var buf = new Buffer(output_len),
            a,
            p;
        for (a = 0, p = 0; p < output_len; p += output[a++].length) {
            output[a].copy(buf, p, 0);
        }
        console.log('code: ', code, 'buf: ', buf);
        
        cb(code, buf);
    });

    if (isBuffer) {
        gzip.stdin.encoding = 'binary';
        gzip.stdin.end(data.length ? data : '');
    } else {
        gzip.stdin.end(data ? data.toString() : '', enc);
    }
}
exports.gunzip = function (data, cb, cfg) {
    gZip(data, cb, cfg, true);
};
exports.gzip = function (data, cb, cfg) {
    gZip(data, cb, cfg, false);
};
