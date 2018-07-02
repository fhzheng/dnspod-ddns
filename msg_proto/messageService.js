var path = require('path'),
    fs = require('fs'),
    async = require('async'),
    protobuf = require('protobufjs'),
    logger = require('../lib/common').logger(),
    Stomp = require('stomp-client'),
    eventEmitter = require('events').EventEmitter,
    util = require('util'),
    config = require('../config/config');
var inited = false;
var msgs = {};
var mq_client = null;
var destination = config.activemq.queue;
class msg {
    constructor(filename, service) {
        this.file = filename;
        this.services = {};
        this.root = null;
    }
}
class MsgService {
    constructor(service) {
        this.service = service;
        this.name = service.name;
    }
    extractMessage(raw) {
        var buf = Buffer.from(raw, 'utf8');
        try {
            var message = this.service.decode(buf);
            return message;
        } catch (error) {
            throw error;
        }
    }
    sendMessage(payload, dest) {
        var _this = this;
        var validErr = _this.service.verify(payload);
        if (validErr) {
            setImmediate(() => {
                _this.emit('messageSendError', validErr);
            })
            return;
        }
        if (!dest) {
            dest = destination;
        }
        var message = this.service.create(payload);
        let buffer = this.service.encode(message).finish();
        mq_client.connect(sessionId => {
            mq_client.publish(dest, buffer);
            logger.info('payload sended');
            logger.debug(payload);
            mq_client.disconnect(() => {
                _this.emit('messageSended', 'message sended');
            });
        }, err => {
            _this.emit('messageSendError', err);
        })

    }
}

util.inherits(MsgService, eventEmitter);

function init() {
    mq_client = new Stomp(config.activemq.ip, config.activemq.port);
    return new Promise(function (resolve, reject) {
        if (inited) {
            resolve();
            return;
        }
        logger.info('Message service initing..........');
        async.waterfall([
            function (callback) {
                fs.exists(__dirname, function (exists) {
                    if (exists) {
                        callback(null);
                    } else {
                        callback("no dir " + __dirname);
                    }
                })
            },
            function (callback) {
                fs.readdir(__dirname, function (err, files) {
                    if (err) {
                        callback(err);
                    } else {
                        // console.log('files', files);
                        files.forEach(file => {
                            var filename = path.join(__dirname, file);
                            var stat = fs.lstatSync(filename);
                            if (!stat.isDirectory() && filename.endsWith('.proto')) {
                                var msg_name = file.substr(0, file.length - ".proto".length);
                                // console.log('file', file);
                                // console.log('msg_name', msg_name);
                                msgs[msg_name] = new msg(filename, null);
                            }
                        });
                        callback(null);
                    }
                })
            }
        ], function (err, result) {
            if (err) {
                reject(err);
            } else {
                inited = true;
                resolve();
            };
        })
    })
}

function getService(groupName) {
    return new Promise((resolve, reject) => {
        init().then(() => {
            groupName = groupName.split("/", 2);
            // console.log(groupName);
            if (groupName.length < 2) {
                reject('not valid path');
            }
            var group = groupName[0],
                name = groupName[1];
            var msgGroup = msgs[group];
            // console.log(msgGroup);
            if (!msgGroup) {
                reject('Service group ' + group + ' not exists!');
            } else {
                var service = msgGroup.services[name];
                if (service) {
                    resolve(service);
                } else {
                    var cachedRoot = msgGroup.root;
                    if (cachedRoot) {
                        try {
                            service = cachedRoot.lookupType(name);
                            msgGroup.services[name] = service = new MsgService(service);
                            logger.info('get service ' + name + ' from root', cachedRoot.files);
                            resolve(service);
                        } catch (error) {
                            reject(error);
                        }
                    } else {
                        protobuf.load(msgGroup.file, (err, root) => {
                            cachedRoot = msgGroup.root = root;
                            logger.debug('start to load file', msgGroup.file);
                            if (err) {
                                reject(err);
                            }
                            try {
                                service = cachedRoot.lookupType(name);
                                msgGroup.services[name] = service = new MsgService(service);
                                logger.debug('get service ' + name + ' from root', cachedRoot.files);
                                resolve(service);
                            } catch (error) {
                                reject(error);
                            }
                        });
                    }
                }
            }
        })
    })
}


exports.init = init;
exports.getService = getService;
exports.listGroups = function () {
    return Object.keys(msgs);
}
exports.inited = (function () {
    return inited;
})();