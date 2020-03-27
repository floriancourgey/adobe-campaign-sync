const FCO_ACC = require('./FCO_ACC.js'); // FCO lib
const cheerio = require('cheerio'); // light jquery
const fs = require('fs-extra'); // filesystem extensions
// const _ = require('lodash'); // js extensions
const sanitize_filename = require("sanitize-filename"); // get clean filename
const pd = require('pretty-data').pd;
const instanceDir = process.env.INSTANCE_DIR;

if(!process.env.PACKAGES){
  console.log('Define .env.PACKAGES');
  process.exit();
}

const folders = [];

function parseFinalPackage(result, rawResponse, soapHeader, rawRequest){

  const $ = cheerio.load(rawResponse, FCO_ACC.htmlparserOptions);

  // package structure:
  // <package>
  //   <entities schema="xtk:form">
  //     <form></form>
  //     <form></form>
  //   </entities>
  // </package>

  // for each entity (form, workflow...)
  $('entities').each(function(i, elem){
    const $this = $(this);
    // get the entity name, i.e. "xtk:form"
    var namespacedSchema = $this.attr('schema');
    var namespace = namespacedSchema.split(':')[0];
    var schema = namespacedSchema.split(':')[1];
    console.log('- Namespaced Schema: '+namespacedSchema);
    // for each entity
    $this.children(schema).each(function(i, elem){
      const $this = $(this);
      var dir, filename;
      // if it has a folder
      if($this.children('folder').length){
        /*
        var folderName = $this.children('folder').first().attr('name');
        if(folderName !== undefined && folders[folderName] === undefined){
          console.log('has new folder:', folderName);
          // get folder full path
          var folderFullPath = getFolderFullNameByName(FCO_ACC.xtkQueryDefClient, folderName);
          folders[folderName]= {
            'name': folderName,
            'fullName': folderFullPath
          };
          console.log('folderFullPath', folderFullPath);
        }
        */
      } else {
        /*
        console.log('NO folder');
        // get folder
        console.log('before');
        var camelCaseNamespacedSchema = namespace + schema[0].toUpperCase() + schema.substr(1);
        console.log('camelCaseNamespacedSchema:', camelCaseNamespacedSchema);
        getFolderFullNameByName(xtkQueryDefClient, camelCaseNamespacedSchema);
        console.log('after');
        */
      }

      // html to be written to file
      var html = $.html($this);

      // can be factorized but keep it this way ATM
      // @todo get folder path from instance for schemas with @folder-id field
      switch(namespacedSchema){
        // XTK
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
        case 'xtk:workflow':
          dir = instanceDir+'/Administration/Production/';
          filename = $this.attr('internalName')+'.html';
          /// edit XML
          html = html.replace(/eventCount="\d+"/g, ''); // remove eventCount="111"
          html = html.replace(/taskCount="\d+"/g, ''); //and taskCount="222"
          // pretty print
          html = pd.xml(html);
          /// end edit XML
          break;
        // NMS
        case 'nms:typology':
          dir = instanceDir+'/Administration/Campaign Management/Typology management/Typologies/';
          filename = $this.attr('name')+'.html';
          break;
        case 'nms:typologyRule':
          dir = instanceDir+'/Administration/Campaign Management/Typology management/Typology rules/';
          filename = $this.attr('name')+'.html';
          break;
        case 'nms:trackingUrl':
          dir = instanceDir+'/Resources/Online/Web tracking tags/';
          filename = $this.attr('tagId')+'.html';
          break;
        case 'nms:webApp':
          dir = instanceDir+'/Resources/Online/Web applications/';
          filename = $this.attr('internalName')+'.html';
          break;
        case 'nms:deliveryMapping':
          dir = instanceDir+'/Administration/Campaign Management/Target mappings/';
          filename = $this.attr('name')+'.html';
          break;
        case 'nms:includeView':
          dir = instanceDir+'/Resources/Campaign Management/Personalization blocks/';
          filename = $this.attr('name')+'.html';
          break;
        // Default
        default:
          console.log('Not yet implemented but adding it to .tmp');
          dir = instanceDir+'/.tmp/';
          filename = namespace+'_'+schema+'_'+$this.attr('name')+'_'+$this.attr('internalName')+'.xml';
          break;
      }
      var path = dir+sanitize_filename(filename);
      console.log('(name '+$this.attr('name')+') (internalName '+$this.attr('internalName')+') saved as "'+filename+'"');
      // save
      fs.outputFileSync(path, html, function (err) {
        throw err;
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
    // pretty print
    content = pd.xml(content);
    // save
    fs.outputFileSync(path, content, function (err) {
      throw err;
    });
  });
  */
}

// can be factorized as
// getXbyField(xtkQueryDefClient, fieldName, fieldValue, select['@fullName', '@id'])
function getFolderFullNameByName(xtkQueryDefClient, folderName){
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
  xtkQueryDefClient.ExecuteQuery(args, function(err, result, rawResponse, soapHeader, rawRequest) {
    console.log('getFolderFullNameByName:', folderName, '3');
    const $ = cheerio.load(rawResponse, FCO_ACC.htmlparserOptions);
    console.log('getFolderFullNameByName:', folderName, $('folder').attr('fullName'), '4');
    // var regex = /<folder fullName="(.+)"\/><\/pdomOutput>/;
    // return regex.match(rawResponse)[1];
  });
  console.log('getFolderFullNameByName:', folderName, '2');
}

FCO_ACC.logon(function(){
  FCO_ACC.generateDoc(process.env.PACKAGES, parseFinalPackage);
});
