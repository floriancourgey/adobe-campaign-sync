# Installation

## Prerequisites
- Install NodeJS v12 LTS (https://nodejs.org/en/):
```console
$ node -v # v12.13.1
$ npm -v # v6.12.1
```
- Create a git repo to track your instance changes (on github/gitlab/bitbucket..) and init it with an empty file like a README.md
- Create a package on your instance, based on `xtk:srcSchema` with the namespaces you want to track:
![](doc/screenshot-package.jpg)

## Step 1. Install the downloader
Connect to a VM or use from local machine
```console
$ pwd # /home/user
$ git clone https://github.com/floriancourgey/adobe-campaign-editor adobe-campaign-editor-instance1 # 1 folder for 1 instance
$ cd adobe-campaign-editor-instance1/node
# if behind a corporate firewall, set HTTP proxy
$ npm config set proxy http://x.x.x.x:port
$ npm config set https-proxy http://x.x.x.x:port
# install dependencies
$ npm install
```

## Step 2. Connect to the instance repo and Download
```console
# note: clone with a GIT url, not an HTPPS, otherwise SSH autologin with the SSH public key won't work
$ git clone git@github.com/user/instance1.git instance
# copy env file, and edit it
$ cp .env.dist .env
$ vim .env
$ node download.js # download data schemas
$ cd instance && git status && cd .. # check
$ node git.js # git commit & push
```

That's it! Set up a CRON every 15 min:

```bash
$ crontab -e
*/15 * * * * cd /home/user/adobe-campaign-editor-instance1/node && node download.js && node git.js
```
