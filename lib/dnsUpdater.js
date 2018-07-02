var Dnspod = require('dnspod-client'),
    util = require('util'),
    EventEmitter = require('events').EventEmitter,
    async = require('async'),
    messageService = require("../msg_proto/messageService"),
    logger = require('./common').logger();

/**
 * @interface
 * @param {Object} params
 * */
function DNSUpdater(options) {
    var self = this;

    self.params = {
        domain: options.domain,
        sub_domain: options.sub_domain,
        login_email: options.login_email,
        login_password: options.login_password,
        interface_name: options.interface_name,
        login_token: options.login_token,
        domain_id: '',
        record_id: '',
        record_value: '',
        record_line: '默认',
        record_type: 'A',
        ttl: 600
    };

    // prepare DnsPod Client
    self.client = new Dnspod(self.createRequstParams(['login_email', 'login_password', 'login_token']));
    self.client.on('error', function (err) {
        self.emit('error', err);
    });
}

util.inherits(DNSUpdater, EventEmitter);

/**
 * @param {Array} paramKeys
 * @param {Object} [extraParamObject]
 * */
DNSUpdater.prototype.createRequstParams = function (paramKeys, extraParamObject) {
    var requestParams = {},
        self = this;
    paramKeys.forEach(function (key) {
        if (self.params[key]) {
            requestParams[key] = self.params[key];
        }
    });

    if (extraParamObject) {
        Object.keys(extraParamObject).forEach(function (key) {
            requestParams[key] = extraParamObject[key];
        });
    }

    return requestParams;
};


DNSUpdater.prototype.fetchRecordValue = function () {
    var self = this;

    async.waterfall([
        function (callback) {
            self.client
                .recordList(self.createRequstParams(['domain_id', 'sub_domain'], {
                    length: 5
                }))
                .once('recordList', callback);
        },
        function (result, callback) {
            if (result.status.code === "1") {
                if (result.records.length > 0) {
                    self.params.record_id = result.records[0].id;
                    self.params.record_value = result.records[0].value;
                    self.params.ttl = result.records[0].ttl;
                    callback(null);
                } else {
                    callback(new Error('Can not found any matched host.'));
                }
            } else {
                callback(new Error(result.status.message));
            }
        }
    ], function (err) {
        if (err) {
            self.emit('fetchRecordValue', err);
        } else {
            self.emit('fetchRecordValue', null);
        }
    });

    return self;
};


DNSUpdater.prototype.fetchDomainId = function () {
    var self = this;

    self.client
        .domainInfo(self.createRequstParams(['domain']))
        .once('domainInfo', function (error, result) {
            if (error) {
                self.emit('fetchDomainId', error);
            } else if (result.status.code === "1") {
                self.params.domain_id = result.domain.id;
                self.emit('fetchDomainId', null);
            } else {
                self.emit('fetchDomainId', new Error(result.status.message));
            }
        });

    return self;
};


DNSUpdater.prototype.prepareDomainInfo = function () {
    var self = this;

    async.series([
        function (callback) {
            self.fetchDomainId().once('fetchDomainId', callback);
        },
        function (callback) {
            self.fetchRecordValue().once('fetchRecordValue', callback);
        }
    ], function (err) {
        if (err) {
            self.emit('prepareDomainInfo', err);
        } else {
            self.emit('prepareDomainInfo', null);
        }
    });

    return self;
};

function getLocalIp(interface_name, doneFn) {
    var interfaces = require('os').networkInterfaces(),
        interface_addresses = interfaces[interface_name],
        targetIp,
        errorMsg;
    if (interface_addresses) {
        interface_addresses.forEach(function (ip) {
            if (ip.family === 'IPv4' && ip.address !== '127.0.0.1') {
                targetIp = ip.address;
            }
        });
    } else {
        errorMsg = 'Can not get interface address. Please make sure your specified interface name is avaliable.';
    }

    setImmediate(function () {
        if (targetIp) {
            doneFn(null, targetIp);
        } else {
            doneFn(new Error(errorMsg || 'Can not get local ip.'));
        }
    });
}

function sendMessage(domain, ip, callback) {
    messageService.getService("message/xyz.zpath.java.mqdemo.proto.Email").then(service => {
        logger.debug(service.name, 'service loaded');
        var message = {
            from: 'rsbr@zpath.me',
            to: '1223139326@qq.com',
            title: "Your IP address has changed!",
            body: 'Current IP is ' + ip,
        };
        service.sendMessage(message);
        service.once('messageSended', function (info) {
            callback(null);
        });
        service.once('messageSendError', error => {
            callback(new Error(error || 'Send message error'));
        })
    }).catch(err => {
        callback(new Error(err || 'Send message error'));
    });
}

DNSUpdater.prototype.updateRecordValue = function () {
    var self = this;

    async.waterfall([
        function (callback) {
            if (self.params.interface_name) {
                getLocalIp(self.params.interface_name, callback);
            } else {
                self.client
                    .getHostIp()
                    .once('getHostIp', callback);
            }
        },
        function (result, callback) {
            var oldRecordValue = self.params.record_value,
                logInfo = util.format('Old ip address is %j, while new ip address is %j', oldRecordValue, result);

            self.emit('log', logInfo);

            if (result !== oldRecordValue) {
                //export to global
                self.params.record_value = result;
                self.params.value = result;
                callback(null, true);
            } else {
                callback(null, false);
            }
        },
        function (result, callback) {
            if (result) {
                self.client
                    .recordModify(self.createRequstParams([
                        'domain_id',
                        'record_id',
                        'sub_domain',
                        'record_line',
                        'record_type',
                        'value',
                        'ttl'
                    ]))
                    .once('recordModify', callback);
            }
        },
        function (result, callback) {
            if (result.status.code === "1") {
                callback(null);
            } else {
                callback(new Error(result.status.message));
            }
        },
        function (callback, error) {
            if (error) {
                callback(error);
            } else {
                sendMessage(self.params.domain, self.params.record_value, error => {
                    if (error) {
                        callback(error);
                    } else {
                        callback(null);
                    }
                });
            }
        }
    ], function (err) {
        if (err) {
            self.emit('updateRecordValue', err);
        } else {
            self.emit('updateRecordValue', null);
        }
    });

    return self;
};



module.exports = DNSUpdater;