/*jslint node: true */
var cookie = require('ajncookie');
var sessionLifeTime = 60000 * 30; // 60 min

var sessions = {};

function generateSession() {
    var sessionId = new Date().getTime() + Math.floor(Math.random() * 100000);
    sessions[sessionId] = {
        date: Date.now(),
        data: {}
    };
    console.log('create session');
    return sessionId;
}

function getSession(sessionId) {
    return sessions[sessionId];
}

function updateSession(sessionId) {
    if (sessions[sessionId]) {
        sessions[sessionId].date = Date.now();
    } else {
        console.log('can not update session', sessionId);
        sessionId = generateSession();
    }
    return sessionId;
}

function createSession(req, res, sessionCookieName) {
    var sessionId = cookie.getCookie(req, sessionCookieName);
    if (!sessionId) {
        console.log('session cookie not foound');

        sessionId = generateSession();
    } else {
        console.log('session cookie foound', sessionId);
        sessionId = updateSession(sessionId);
    }
    cookie.setCookie(res, sessionCookieName, sessionId);
    return sessionId;
}

function invalidateSession(sessionId) {
    console.log('invalidate sessoin', sessionId);

    if (sessions[sessionId]) {
        sessions[sessionId] = null;
        delete sessions[sessionId];
        return true;
    }
    return false;
}

function setData(sessionId, name, value) {
    if (sessions[sessionId]) {
        sessions[sessionId].data[name] = value;
    }
}

function getData(sessionId, name) {
    if (sessions[sessionId]) {
        return sessions[sessionId].data[name];
    }
}


function Session(req, res, conf) {
    conf = conf || {};
    this.maxSize = conf.maxSize || 262144;
    this.sessionName = conf.sessionName || 'nodesess';
    this.sessionId = createSession(req, res, this.sessionName);
}
Session.prototype.checkDataSize = function (value) {
    var sess = getSession(this.sessionId),
        size = 0;
    Object.keys(sess.data).forEach(function (name) {
        size += Buffer.byteLength(sess.data[name]);
    });
    return (size + Buffer.byteLength(value)) <= this.maxSize;
};
Session.prototype.setData = function (name, value) {
    this.sessionId = updateSession(this.sessionId);
    if (this.checkDataSize(value)) {
        setData(this.sessionId, name, value);
    } else {
        throw new RangeError('Can\'t set data, limit exceeded. ');
    }
};
Session.prototype.getData = function (name) {
    this.sessionId = updateSession(this.sessionId);
    return getData(this.sessionId, name);
};
Session.prototype.invalidate = function () {
    invalidateSession(this.sessionId);
};

setInterval(function () {
    var minLastAccess = Date.now() - sessionLifeTime;
    Object.keys(sessions).forEach(function (sessionId) {
        if (sessions[sessionId].date < minLastAccess) {
            invalidateSession(sessionId);
        }
    });
}, 59000);

exports.Session = Session;
