require('dotenv').config();
const instanceDir = process.env.INSTANCE_DIR;
const moment = require('moment');
const git = require('simple-git')(instanceDir);
const logger = require('./Logger.js');

if(!process.env.GIT_BRANCH){
  logger.debug('Define .env.GIT_BRANCH');
  process.exit();
}

var now = moment().format('YYYYMMDD-HHmmss');

git
  .status(function(err, status){
    if(err){ throw err }
    // logger.debug('err', err);
    // logger.debug('status', status);
  })
  .add('./*')
  .commit(now+' update')
  .push('origin', 'master')
;
