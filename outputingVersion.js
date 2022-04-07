const utils = require('./utils');
void async function () {
    let DownloadURLObjectArray = await utils.getDownloadArray()
    let maximumVersion = DownloadURLObjectArray.map(e => e.version).sort((a, b) => b - a)[0]
    console.log(`::set-output name=maxVersion::${maximumVersion}`)
}()