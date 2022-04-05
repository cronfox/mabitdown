const request = require("superagent");
const fs = require('fs');
const path = require('path')
const crypto = require("crypto");
var _ = require('lodash');
void async function () {
    //get FileList from mabinogi patch server
    let filelist = await request.get('http://cdnpatch.luoqi.com.cn/version.txt')
    let fileArray = []
    filelist.text.trim().split('\r\n').forEach(e => {
        fileArray.push(e.trim().split('\t'))
    })
    let DownloadURLObjectArray = []
    fileArray.forEach(e => {
        DownloadURLObjectArray.push({
            url: `http://cdnpatch.luoqi.com.cn/${e[3]}/${e[0]}`,
            path: e[0],
            size: e[1],
            hash: e[2],
            version: e[3]
        })
    })
    //filter *.it files
    let itFileArray = DownloadURLObjectArray.filter(e => e.path.endsWith('.it'))
    console.log(itFileArray)
    //sort array by path
    itFileArray = _.sortBy(itFileArray, ['path'])
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
        if(fhash.toLocaleUpperCase() == DownloadURLObject.hash.toLocaleUpperCase()){
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
Promise.allLimit = function (arr, wrap, limit, callback) {
	return new Promise((resolve, reject) => {
		var total = arr.length;
		var result = [];
		var rejected = false;
		var dones = 0;
		function run(n) {
			setTimeout(() => {
				wrap(n, arr.shift()).then(res => (typeof callback === 'function' ? callback(n, res) : Promise.resolve(res))).then((res) => {
					dones += 1;
					result.push(res);
					if (!rejected) {
						if (arr.length) {
							run(total - arr.length);
						} else if (dones === total) {
							resolve(result);
						}
					}
					
				}).catch((err) => {
					rejected = true;
					reject(err);
				});
			}, 0);
		}
		arr.slice(0, limit).forEach((v, n) => {
			run(n);
		});
	});
};
