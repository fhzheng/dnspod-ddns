var log4js = require('log4js');

log4js.configure({
    appenders: [{
        type: 'console',
        layout: {
            type: 'colored',
        }
    }]
});

exports.logger = log4js.getLogger();