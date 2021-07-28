var log4js = require("log4js");

if(!process.env.LOGGER_LEVEL){
    logger.debug('Define .env.LOGGER_LEVEL');
    process.exit();
}

var logger = log4js.getLogger();
logger.level = process.env.LOGGER_LEVEL;

module.exports = logger;
