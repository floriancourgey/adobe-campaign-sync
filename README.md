# Adobe Campaign Sync to Git by Florian Courgey
Synchronize any object (Schema, Form, JSSP...) from Adobe Campaign to your own Git repo (Github, Bitbucket...).

![](/doc/Presentation.jpg)

## Installation

## Prerequisites
- Install NodeJS v12 LTS (https://nodejs.org/en/):
```console
$ node -v # v12.13.1
$ npm -v # v6.12.1
```
- Create a git repo to track your instance changes (on github/gitlab/bitbucket..) and init it with an empty file like a README.md
- Create a package on your instance, based on the objects you want to track in git:
![](doc/Package.jpg)

## Step 1. Install adobe-campaign-sync
Connect to a VM or use from local machine
```console
$ pwd # /home/user
$ git clone https://github.com/floriancourgey/adobe-campaign-sync adobe-campaign-sync-instance1 # 1 folder for 1 instance
$ cd adobe-campaign-sync-instance1
# if behind a corporate firewall, set HTTP proxy
$ npm config set proxy http://x.x.x.x:port
$ npm config set https-proxy http://x.x.x.x:port
# install dependencies
$ npm install
```

## Step 2. Launch adobe-campaign-sync to download the instance and upload to git
```console
# note: clone with a GIT url, not an HTPPS, otherwise SSH autologin with the SSH public key won't work
$ git clone git@github.com/user/instance1.git instance
# copy env file, and edit it
$ cp .env.dist .env
$ vim .env
$ node src/download.js # download data schemas
$ cd instance && git status && cd .. # check
$ node src/git.js # git commit & push
```

That's it! Set up a CRON every 15 min:

```bash
$ crontab -e
*/15 * * * * cd /home/user/adobe-campaign-sync-instance1 && node src/download.js && node src/git.js
```

## Objects directories:
- [x] `xtk:srcSchema`, /Administration/Configuration/Data schemas/{namespace}/
- [x] `xtk:form`, /Administration/Configuration/Input forms/{namespace}/
- [x] `xtk:navtree`, /Administration/Configuration/Navigation hierarchies/{namespace}/
- [x] `xtk:javascript`, /Administration/Configuration/JavaScript codes/{namespace}/
- [x] `xtk:jssp`, /Administration/Configuration/Dynamic JavaScript pages/{namespace}/
- [x] `xtk:formRendering`, /Administration/Configuration/Form rendering/
- [x] `xtk:sql`, /Administration/Configuration/SQL scripts/{namespace}/
- [x] `xtk:xslt`, /Administration/Configuration/XSL style sheets/{namespace}/
- [x] `xtk:workflow`, /Administration/Production/
- [x] `nms:typology`, /Administration/Campaign Management/Typology management/Typologies/
- [x] `nms:typologyRule`, /Administration/Campaign Management/Typology management/Typology rules/
- [x] `nms:trackingUrl`, /Resources/Online/Web tracking tags/
- [x] `nms:webApp`, /Resources/Online/Web applications/
- [x] `nms:deliveryMapping`, /Administration/Campaign Management/Target mappings/
- [x] `nms:includeView`, /Resources/Campaign Management/Personalization blocks/
