require('dotenv').config();
const instanceDir = process.env.INSTANCE_DIR;
const moment = require('moment');
const git = require('simple-git')(instanceDir);

var now = moment().format('YYYYMMDD-HHmmss');

git
  .status(function(err, status){
    if(err){ throw err }
    // console.log('err', err);
    // console.log('status', status);
  })
  .add('./*')
  .commit(now+' update')
  .push('origin', 'master')
;
