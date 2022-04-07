const request = require("superagent");
async function getDownloadArray(){
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
    return DownloadURLObjectArray
}
function getDownloadURLObjectArrayMaxVersion(DownloadURLObjectArray) {
    var al = DownloadURLObjectArray.length;
    maximum = DownloadURLObjectArray[al - 1].version;
    while (al--) {
        if (DownloadURLObjectArray[al].version > maximum) {
            maximum = DownloadURLObjectArray[al].version
        }
    }
    return maximum;
};
AllLimit = function (arr, wrap, limit, callback) {
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

module.exports = {
    getDownloadArray,AllLimit,getDownloadURLObjectArrayMaxVersion
}