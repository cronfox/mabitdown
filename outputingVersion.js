const utils = require('./utils');
const fs = require('fs');
void async function () {
    let DownloadURLObjectArray = await utils.getDownloadArray()
    let maximumVersion = DownloadURLObjectArray.map(e => e.version).sort((a, b) => b - a)[0]
    //console.log(`::set-output name=maxVersion::${maximumVersion}`)
    //- name: Set output
    //run: echo "{name}={value}" >> $GITHUB_OUTPUT
    fs.writeFileSync(process.env.GITHUB_OUTPUT,`maxVersion=${maximumVersion}`)
}()