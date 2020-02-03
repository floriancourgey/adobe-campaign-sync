const FCO_ACC = require('./FCO_ACC.js'); // FCO lib
const soap = require('soap'); // soap requests
const cheerio = require('cheerio'); // light jquery
const fs = require('fs-extra'); // filesystem extensions
const _ = require('lodash'); // js extensions
const sanitize_filename = require("sanitize-filename"); // get clean filename
const xtkQueryDefWsdl = require.resolve(process.env.WSDL_XTK_QUERYDEF);
const xtkSpecfileWsdl = require.resolve(process.env.WSDL_XTK_SPECFILE);
const moment = require('moment');
const pd = require('pretty-data').pd;
const instanceDir = process.env.INSTANCE_DIR;

FCO_ACC.Logon(onLogonSuccess);

if(!process.env.PACKAGES){
  console.log('Define .env.PACKAGES');
  process.exit();
}

const folders = [];
// XML Parsing Definition
const htmlparserOptions = {
  xmlMode: true,
  lowerCaseTags: true,
};

// Get Package Definition
function onLogonSuccess(){
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
          process.env.PACKAGES+
        '</where>'+
      '</queryDef>'
    },
  }

  soap.createClient(xtkQueryDefWsdl, FCO_ACC.mainArgs, function(err, xtkQueryDefClient){
    console.log('SOAP xtkQueryDefClient OK');
    xtkQueryDefClient.addHttpHeader('X-Security-Token', FCO_ACC.securityToken);
    xtkQueryDefClient.addHttpHeader('cookie',  "__sessiontoken=" + FCO_ACC.sessionToken);

    xtkQueryDefClient.ExecuteQuery(args, function(err, result, rawResponse, soapHeader, rawRequest) {
      console.log('SOAP ExecuteQuery OK');
      if(err){
        console.log('rawRequest', rawRequest);
        throw err;
      }

      const $ = cheerio.load(rawResponse, htmlparserOptions);
      console.log('XML Definition OK');
      var definition = $('pdomOutput').html();

      // Get Package Result
      soap.createClient(xtkSpecfileWsdl, FCO_ACC.mainArgs, function(err, xtkSpecfileClient){
        console.log('SOAP xtkSpecfileClient OK');
        xtkSpecfileClient.addHttpHeader('X-Security-Token', FCO_ACC.securityToken);
        xtkSpecfileClient.addHttpHeader('cookie',  "__sessiontoken=" + FCO_ACC.sessionToken);

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
          // parse response
          const $ = cheerio.load(rawResponse, htmlparserOptions);
          $('entities').each(function(i, elem){
            const $this = $(this);
            var namespacedSchema = $this.attr('schema');
            var namespace = namespacedSchema.split(':')[0];
            var schema = namespacedSchema.split(':')[1];
            console.log('- Namespaced Schema: '+namespacedSchema);
            $this.find(schema).each(function(i, elem){
              const $this = $(this);
              var dir, filename;
/*
              if($this.children('folder').length){
                console.log('has folder');
                // get folder full path via sql or soap
              } else {
                console.log('NO folder');
                // get folder
                console.log('before');
                var camelCaseNamespacedSchema = namespace + schema[0].toUpperCase() + schema.substr(1);
                console.log('camelCaseNamespacedSchema:', camelCaseNamespacedSchema);
                getFolderFullNameByName(xtkQueryDefClient, camelCaseNamespacedSchema);
                console.log('after');
              }
              return;
*/
              // can be factorized but keep it this way ATM
              // @todo get folder path from instance for schemas with @folder-id field
              switch(namespacedSchema){
                case 'xtk:srcSchema':
                  dir = instanceDir+'/Administration/Configuration/Data schemas/'+$this.attr('namespace')+'/';
                  filename = $this.attr('name')+'.html';
                  break;
                case 'xtk:form':
                  dir = instanceDir+'/Administration/Configuration/Input forms/'+$this.attr('namespace')+'/';
                  filename = $this.attr('name')+'.html';
                  break;
                case 'xtk:navtree':
                  dir = instanceDir+'/Administration/Configuration/Navigation hierarchies/'+$this.attr('namespace')+'/';
                  filename = $this.attr('name')+'.html';
                  break;
                case 'xtk:javascript':
                  dir = instanceDir+'/Administration/Configuration/JavaScript codes/'+$this.attr('namespace')+'/';
                  filename = $this.attr('name')+'.js';
                  break;
                case 'xtk:jssp':
                  dir = instanceDir+'/Administration/Configuration/Dynamic JavaScript pages/'+$this.attr('namespace')+'/';
                  filename = $this.attr('name')+'.js';
                  break;
                case 'xtk:formRendering':
                  dir = instanceDir+'/Administration/Configuration/Form rendering/';
                  filename = $this.attr('internalName')+'.css';
                  break;
                case 'xtk:sql':
                  dir = instanceDir+'/Administration/Configuration/SQL scripts/'+$this.attr('namespace')+'/';
                  filename = $this.attr('name')+'.sql';
                  break;
                case 'xtk:xslt':
                  dir = instanceDir+'/Administration/Configuration/XSL style sheets/'+$this.attr('namespace')+'/';
                  filename = $this.attr('name')+'.html';
                  break;
                case 'nms:typologyRule':
                  dir = instanceDir+'/Administration/Configuration/Typology rules/';
                  filename = $this.attr('name')+'.html';
                  break;
                case 'nms:typology':
                  dir = instanceDir+'/Administration/Configuration/Typologies/';
                  filename = $this.attr('name')+'.html';
                  break;
                default:
                  console.log('Not yet implemented');
                  return;
              }
              var path = dir+sanitize_filename(filename);
              console.log('"'+$this.attr('name')+'" saved as "'+filename+'"');
              // save
              fs.outputFileSync(path, $.html($this), function (err) {
                throw err;
              });
            });
          });
        });
      });


      // for each workflow
      /*
      $('workflow').each(function(i, elem){
        const $this = $(this);
        console.log('- Workflow id:', $this.attr('id'));
        var acFolder = $this.children('folderFullName').text();
        if(!_(acFolder).startsWith('/') || !_(acFolder).endsWith('/')){
          console.log('- Unable to get AC folder for workflow '+$this.attr('label')+' ('+$this.attr('id')+')');
          console.log(acFolder.substring(0, 30));
          // console.log(this);
          // process.exit();
          return;
        }
        var filename = sanitize_filename($this.attr('label')+' ('+$this.attr('internalName')+') ('+$this.attr('id')+')');
        var path = instanceDir+acFolder+filename+process.env.WORKFLOW_EXTENSION;
        console.log('saved to path', path);
        // read again
        var content = cheerio.load(this, htmlparserOptions).xml();
        // remove eventCount="111" and taskCount="222"
        content = content.replace(/eventCount="\d+"/g, '');
        content = content.replace(/taskCount="\d+"/g, '');
        // pretty print
        content = pd.xml(content);
        // save
        fs.outputFileSync(path, content, function (err) {
          throw err;
        });
      });
      */
    });
  });
}

// can be factorized as
// getXbyField(xtkQueryDefClient, fieldName, fieldValue, select['@fullName', '@id'])
async function getFolderFullNameByName(xtkQueryDefClient, folderName){
  var args = {
    sessiontoken : '',
    entity : {$xml :
      '<queryDef operation="get" schema="xtk:folder">'+
        '<select><node expr="@fullName"/></select>'+
        '<where><condition expr="@name = \''+folderName+'\'"/></where>'+
      '</queryDef>'
    },
  }
  var fullName;
  console.log('getFolderFullNameByName:', folderName, '1');
  await xtkQueryDefClient.ExecuteQuery(args, function(err, result, rawResponse, soapHeader, rawRequest) {
    const $ = cheerio.load(rawResponse, htmlparserOptions);
    console.log('getFolderFullNameByName:', folderName, $('folder').attr('fullName'), '2');
  });
  console.log('getFolderFullNameByName:', folderName, '3');
}
