var log4js = require('log4js');

log4js.configure({
    appenders: {
        everything: {
            type: 'file',
            filename: __dirname + '/../logs/ddns.log',
            maxLogSize: 10485760,
            backups: 5,
            compress: true
        }
    },
    categories: {
        default: {
            appenders: ['everything'],
            level: 'debug'
        }
    }
});

exports.logger = function (options) {
    if (!options) {
        return log4js.getLogger();
    } else {
        log4js.configure(options);
        return log4js.getLogger();
    }
}