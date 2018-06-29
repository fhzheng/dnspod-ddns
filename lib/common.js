var log4js = require('log4js');

log4js.configure({
    appenders: [{
        type: 'console',
        layout: {
            type: 'colored',
        }
    }]
});

exports.logger = function (options) {
    if (!options) {
        return log4js.getLogger();
    } else {
        log4js.configure(options);
        return log4js.getLogger();
    }
}