var messageService = require("./messageService");
var async = require('async');
var logger = require('../lib/common').logger;
async.waterfall([
    // function (callback) {
    //     messageService.getService("message/xyz.zpath.java.mqdemo.proto.Email").then(service => {
    //         logger.info(service.name, 'service loaded');
    //         callback(null);
    //     }).catch(err => {
    //         callback(err);
    //     })
    // },
    function (callback) {
        messageService.getService("message/xyz.zpath.java.mqdemo.proto.Email").then(service => {
            logger.info(service.name, 'service loaded');
            var payload = {
                from: '123@abc.com',
                to: 'abc@123.com',
                title: "Node test email",
                body: 'Hi there!'
            };
            service.sendMsg(payload);
            callback(null);
        }).catch(err => {
            callback(err);
        })
    },
    // function (callback) {
    //     messageService.getService("test/xyz.zpath.java.mqdemo.proto.Test1").then(service => {
    //         logger.info(service.name, 'service loaded');
    //         callback(null);
    //     }).catch(err => {
    //         callback(err);
    //     })
    // }
], function (err, result) {
    if (err) {
        logger.info(err);
    } else {
        logger.info(messageService.listGroups());
    }
})