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

/*global YUI: true, google: true, Worker: true*/
/*jslint nomen: true, es5: true, browser: true*/
YUI.add('DataStorage', function (Y) {
    function DataStorage(form) {
        this.addAttrs({
            form: {
                value: form
            },
            json: {
                value: null
            },
            transactions: {
                value: null,
                getter: function (value, fullName) {
                    var path = fullName.split('.'),
                        output;

                    if (path.length > 1) {
                        output = value[path.slice(1).join('.')];
                    } else {
                        output = value;
                    }
                    return output;
                },
                setter: function (value, fullName) {
                    var path = fullName.split('.'),
                        currentValue = this.get(fullName[0]) || {},
                        tmpValue;

                    if (path.length > 1) {
                        currentValue[path.slice(1).join('.')] = value;
                    } else {
                        currentValue = value;
                    }
                    return currentValue;
                }
            }
        });
    }
    DataStorage.prototype = {
        clear: function () {
            var requestName = 'clear';
            this.fire('sendRequest', {
                requestName: requestName
            });
            Y.io('/data', {
                method: 'DELETE',
                on: {
                    success: function resetSuccessListener() {
                        this.set('json', null);
                        this.set('transactions', null);
                        this.fire('completeRequest', {
                            requestName: requestName,
                            resultType: 'success'
                        });
                        this.fire('goodData');
                    }.bind(this),
                    failure: function resetFailureListener(id, o) {
                        this.fire('badData', {response: o});
                        this.fire('completeRequest', {
                            requestName: requestName,
                            resultType: 'failure'
                        });
                    }.bind(this)
                }
            });
        },
        setData: function (cb) {
            var requestName = 'setData';
            this.fire('sendRequest', {
                requestName: requestName
            });
            Y.io('/data', {
                method: 'PUT',
                form: {
                    id: this.get('form'),
                    useDisabled: false
                },
                on: {
                    success: function (id, o) {
                        this.fire('dataSet');
                        this.fire('goodData');
                        this.fire('completeRequest', {
                            requestName: requestName,
                            resultType: 'success'
                        });
                    }.bind(this),
                    failure: function (id, o) {
                        this.fire('badData', {response: o});
                        this.fire('completeRequest', {
                            requestName: requestName,
                            resultType: 'failure'
                        });
                    }.bind(this)
                }
            });
        },
        getJSON: function (cb) {
            var requestName = 'getJSON';
            this.fire('sendRequest', {
                requestName: requestName
            });
            Y.io('/data', {
                data: {
                    d: Date.now()
                },
                'on': {
                    'success': function getAllSuccessListener(id, o, args) {
                        if (o.status === 200) {
                            var json = JSON.parse(o.response);
                            if (json.account) {
                                this.set('json', json);
                            }
                            this.fire('goodData');
                        } else {
                            this.fire('badData', {response: o});
                            // this.badData('Please upload a backup file');
                        }
                        this.fire('completeRequest', {
                            requestName: requestName,
                            resultType: 'success'
                        });
                    }.bind(this),
                    'failure': function (id, o) {
                        this.fire('badData', {response: o});
                        this.fire('completeRequest', {
                            requestName: requestName,
                            resultType: 'failure'
                        });
                    }.bind(this)
                }
            });
        },
        getTransactions: function (days) {
            var requestName = 'getTransactions';
            this.fire('sendRequest', {
                requestName: requestName
            });
            Y.io('transactions.json?days=' + days, {
                'on': {
                    'success': function (id, o) {
                        this.set('transactions.' + days, {
                            days: days,
                            data: JSON.parse(o.response)
                        });
                        this.fire('completeRequest', {
                            requestName: requestName,
                            resultType: 'success'
                        });
                    }.bind(this),
                    'failure': function (id, o) {
                        this.fire('badData', {response: o});
                        this.fire('completeRequest', {
                            requestName: requestName,
                            resultType: 'failure'
                        });
                    }.bind(this)
                }
            });
        }
    };
    Y.augment(DataStorage, Y.Attribute);
    Y.DataStorage = DataStorage;
}, '0.0.1', {
    requires: [
        'base',
        'io',
        'event',
        'attribute'
    ]
});

