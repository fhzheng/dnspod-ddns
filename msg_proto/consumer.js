var config = require('../config/config');
var Stomp = require('stomp-client');
var destination = config.activemq.queue;
var mq_client = new Stomp(config.activemq.ip, config.activemq.port);
var messageService = require('../msg_proto/messageService');
var async = require('async');
var logger = require('../lib/common').logger('consumer');
var mailer = require('../lib/mailer');

function connect() {
    return new Promise((resolve, reject) => {
        mq_client.connect(sessionId => {
            resolve(sessionId);
        }, err => {
            reject(err);
        })
    })
}
async.waterfall([
    function (callback) {
        messageService.getService('message/xyz.zpath.java.mqdemo.proto.Email').then(service => {
            callback(null, service);
        }).catch(error => {
            callback(error);
        })
    },
    function (service, callback) {
        connect().then(sessionId => {
            callback(null, service);
        }).catch(error => {
            callback(error);
        })
    }
], function (error, service) {
    if (error) {
        logger.error("MQ init error!", error);
    } else {
        logger.info('MQ connected!');
        mq_client.subscribe(config.activemq.queue, function (body, headers) {
            try {
                var message = service.extractMessage(body);
                logger.info(message);
                if (!message.title || !message.body) {
                    logger.error(new Error('message not supported'));
                } else {
                    mailer.sendEmail(message.title, message.body).then(info => {
                        logger.info(info);
                    }).catch(error => {
                        logger.error(error);
                        reject(error);
                    });
                }
            } catch (error) {
                logger.error(error);
            }
        });
        // mq_client
    }
})