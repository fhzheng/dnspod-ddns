var log4js = require('log4js');

log4js.configure(__dirname + '/../config/log4js.json');

exports.logger = function (name, options) {
    var app = name || 'app';
    if (!options) {
        return log4js.getLogger(app);
    } else {
        log4js.configure(options);
        return log4js.getLogger(app);
    }
}