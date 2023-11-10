const request = require("superagent");
const fs = require('fs');
const path = require('path')
const crypto = require("crypto");
var _ = require('lodash');
const utils = require('./utils')
void async function () {
    //get FileList from mabinogi patch server
    let DownloadURLObjectArray = await utils.getDownloadArray()
    //filter *.it files
    let itFileArray = DownloadURLObjectArray.filter(e => e.path.endsWith('.it'))
    console.log(itFileArray)
    //sort array by path
    itFileArray = _.sortBy(itFileArray, ['path'])
    //console.log(itFileArray[1])
    //download *.it files
    await Promise.allLimit(itFileArray, DownloadFile, 16)
}()

async function DownloadFile(n,DownloadURLObject) {
    const { pipeline } = require('stream/promises');
    if(DownloadURLObject == undefined){
        return
    }
    if(fs.existsSync(path.join(__dirname,"./download",DownloadURLObject.path))){
        let hash = crypto.createHash('md5');
        hash.setEncoding('hex');
        await pipeline(fs.createReadStream(path.join(__dirname,"./download",DownloadURLObject.path)),hash)
        let fhash = hash.digest('hex')
        if(fhash == DownloadURLObject.hash){
            console.log(`FILE CACHE BYPASS: OHASH=${DownloadURLObject.hash},URL=${DownloadURLObject.url},FPATH=${DownloadURLObject.path}`)
            return 
        }else{

        }
    }
    function mkdirp(filepath) {
        var dirname = path.dirname(filepath);
        fs.mkdirSync(dirname, { recursive: true })
    }
    //console.log(path.dirname(path.join(__dirname,"./download",DownloadURLObject.path)))
    mkdirp(path.join(__dirname,"./download",DownloadURLObject.path))
    let fileStream = fs.createWriteStream(path.join(__dirname,"./download",DownloadURLObject.path))
    let iStream = request.get(DownloadURLObject.url).retry(5)
    await pipeline(iStream,fileStream);
    let hash = crypto.createHash('md5');
    hash.setEncoding('hex');
    await pipeline(fs.createReadStream(path.join(__dirname,"./download",DownloadURLObject.path)),hash)
    let fhash = hash.digest('hex')
    if(fhash.toLocaleUpperCase() == DownloadURLObject.hash.toLocaleUpperCase()){
        console.log(`DOWNLOAD FINISH: OHASH=${DownloadURLObject.hash},URL=${DownloadURLObject.url},FPATH=${DownloadURLObject.path}`)
    }else{
        console.log(DownloadURLObject)
        console.error(`HASH ERROR: OHASH=${DownloadURLObject.hash},FHASH=${fhash},URL=${DownloadURLObject.url},FPATH=${DownloadURLObject.path}`)
        throw "err"
    }
	return
}
Promise.allLimit = utils.AllLimit