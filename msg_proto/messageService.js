var path = require('path'),
    fs = require('fs'),
    async = require('async'),
    protobuf = require('protobufjs'),
    logger = require('../lib/common').logger;
var inited = false;
var msgs = {};
class msg {
    constructor(filename, service) {
        this.file = filename;
        this.services = {};
        this.root = null;
    }
}

function init() {
    return new Promise(function (resolve, reject) {
        if (inited) {
            resolve();
            return;
        }
        logger.info('initing..........');
        async.waterfall([
            function (callback) {
                fs.exists("./", function (exists) {
                    if (exists) {
                        callback(null);
                    } else {
                        callback("no dir ./")
                    }
                })
            },
            function (callback) {
                fs.readdir("./", function (err, files) {
                    if (err) {
                        callback(err);
                    } else {
                        files.forEach(file => {
                            var filename = path.join("./", file);
                            var stat = fs.lstatSync(filename);
                            if (!stat.isDirectory() && filename.endsWith('.proto')) {
                                var msg_name = filename.substr(0, filename.length - ".proto".length);
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
            if (groupName.length < 2) {
                reject('not valid path');
            }
            var group = groupName[0],
                name = groupName[1];
            var msgGroup = msgs[group];
            if (!msgGroup) {
                reject('Service group ' + group + 'not exists!');
            } else {
                var service = msgGroup.services[name];
                if (service) {
                    resolve(service);
                } else {
                    var cachedRoot = msgGroup.root;
                    if (cachedRoot) {
                        try {
                            service = cachedRoot.lookupType(name);
                            msgGroup.services[name] = service;
                            logger.info('get service ' + name + ' from root', cachedRoot.files);
                            resolve(service);
                        } catch (error) {
                            reject(error);
                        }
                    } else {
                        protobuf.load(msgGroup.file, (err, root) => {
                            cachedRoot = msgGroup.root = root;
                            logger.info('start to load file', msgGroup.file);
                            if (err) {
                                reject(err);
                            }
                            try {
                                service = cachedRoot.lookupType(name);
                                msgGroup.services[name] = service;
                                logger.info('get service ' + name + ' from root', cachedRoot.files);
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