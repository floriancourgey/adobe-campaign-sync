require('dotenv').config();
const soap = require('soap');
const xtkSessionWsdl = require.resolve(process.env.WSDL_XTK_SESSION);

if(!process.env.ACC_USER || !process.env.ACC_PWD || !process.env.ACC_ENDPOINT){
  console.log('Define .env.ACC_USER .env.ACC_PWD .env.ACC_ENDPOINT');
  process.exit();
}

var securityToken, sessionToken;
var logonArgs = {
  sessiontoken : "",
  strLogin :  process.env.ACC_USER,
  strPassword : process.env.ACC_PWD,
  elemParameters : ""
}

exports.mainArgs = {
  endpoint: process.env.ACC_ENDPOINT,
};
// exports.securityToken = securityToken;
// exports.sessionToken = sessionToken;

// Logon
console.log('Logging in');
exports.Logon = function(onSuccess){
  soap.createClient(xtkSessionWsdl, exports.mainArgs, function(err, client) {
    client.Logon(logonArgs, function(err, result, rawResult) {
      if(err){
        console.log('soap client.Logon ERROR:', err);
        console.log('rawResult:', rawResult);
        process.exit();
        return;
      }
      // console.log(result);
      exports.securityToken = result.pstrSecurityToken.$value;
      exports.sessionToken = result.pstrSessionToken.$value;
      console.log('Logon OK with user:', result.pSessionInfo.sessionInfo.userInfo.attributes.loginCS);
      console.log('securityToken:', exports.securityToken);
      console.log('sessionToken:', exports.sessionToken);
      onSuccess();
    });
  });
}
