require('dotenv').config();
const soap = require('soap');
const cheerio = require('cheerio'); // light jquery
const moment = require('moment');
const fs = require('fs-extra'); // filesystem extensions
const xtkSessionWsdl = require.resolve(process.env.WSDL_XTK_SESSION);
const xtkQueryDefWsdl = require.resolve(process.env.WSDL_XTK_QUERYDEF);
const xtkSpecfileWsdl = require.resolve(process.env.WSDL_XTK_SPECFILE);

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

// XML Parsing Definition
exports.htmlparserOptions = {
  xmlMode: true,
  lowerCaseTags: true,
};

// Logon
console.log('Logging in');
exports.logon = function(onSuccess){
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

/**
 * @param where string placed in <where>{where}</where>
 */
exports.getSpecFile = function(where, onSuccessHandler){
  var args = {
    sessiontoken : '',
    entity : {$xml :
      '<queryDef fullLoad="true" operation="get" schema="xtk:specFile">'+
        '<select>'+
          '<node expr="@namespace" hidden="true" />'+
          '<node expr="@name" hidden="false" />'+
          '<node expr="@label" />'+
          '<node expr="[definition/@id]" />'+
          '<node expr="[definition/@schema]" />'+
          '<node expr="[definition/@automaticDefinition]" />'+
          '<node expr="[definition/@lineCountMax]" />'+
          '<node anyType="true" expr="[definition/where]" noComputeString="true" />'+
          '<node anyType="true" expr="[definition/exclusions]" noComputeString="true" />'+
          '<node anyType="true" expr="[definition/orderBy]" noComputeString="true" />'+
        '</select>'+
        '<where>'+
          where+
        '</where>'+
      '</queryDef>'
    },
  }

  soap.createClient(xtkQueryDefWsdl, exports.mainArgs, function(err, xtkQueryDefClient){
    console.log('SOAP xtkQueryDefClient OK');
    xtkQueryDefClient.addHttpHeader('X-Security-Token', exports.securityToken);
    xtkQueryDefClient.addHttpHeader('cookie',  "__sessiontoken=" + exports.sessionToken);

    xtkQueryDefClient.ExecuteQuery(args, function(err, result, rawResponse, soapHeader, rawRequest) {
      console.log('SOAP ExecuteQuery OK');
      if(err){
        console.log('rawRequest', rawRequest);
        console.log('soapHeader', soapHeader);
        throw err;
      }

      onSuccessHandler(result, rawResponse, soapHeader, rawRequest);
    });
  });
}

exports.generateDoc = function(where, onSuccessHandler){
  exports.getSpecFile(where, function(result, rawResponse, soapHeader, rawRequest){

    const $ = cheerio.load(rawResponse, exports.htmlparserOptions);
    console.log('XML Definition OK');
    var definition = $('pdomOutput').html();

    soap.createClient(xtkSpecfileWsdl, exports.mainArgs, function(err, xtkSpecfileClient){
      console.log('SOAP xtkSpecfileClient OK');
      xtkSpecfileClient.addHttpHeader('X-Security-Token', exports.securityToken);
      xtkSpecfileClient.addHttpHeader('cookie',  "__sessiontoken=" + exports.sessionToken);

      var args = {
        sessiontoken: '',
        entity: {$xml: definition},
      };
      xtkSpecfileClient.GenerateDoc(args, function(err, result, rawResponse, soapHeader, rawRequest){
        console.log('SOAP GenerateDoc OK');
        // save request to archives
        const archiveRequest = 'archives/'+moment().format('YYYY/MM/DD/HHmmss-SSS')+'-request.xml';
        fs.outputFileSync(archiveRequest, rawResponse, function (err) {
          throw err;
        });
        if(err){
          console.log('rawRequest', rawRequest);
          throw err;
        }
        // save response to archives
        const archiveResponse = 'archives/'+moment().format('YYYY/MM/DD/HHmmss-SSS')+'-response.xml';
        fs.outputFileSync(archiveResponse, rawResponse, function (err) {
          throw err;
        });

        onSuccessHandler(result, rawResponse, soapHeader, rawRequest);
      });
    });
  });
}
