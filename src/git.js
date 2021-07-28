require('dotenv').config();
const instanceDir = process.env.INSTANCE_DIR;
const moment = require('moment');
const git = require('simple-git')(instanceDir);

if(!process.env.GIT_BRANCH){
  console.log('Define .env.GIT_BRANCH');
  process.exit();
}

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
