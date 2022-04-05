//--experimental-wasi-unstable-preview1
const child_process = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const util = require('util');
const _ = require('lodash');
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


void async function () {
    //get filename list from disk
    let filelist = fs.readdirSync(path.join(__dirname, './download/package'))
    let fileArray = []
    filelist.forEach(e => {
        fileArray.push(e)
    })
    //"只要把这鬼玩意的关键性能问题解决掉就好了" -hina
    let f
    if(fs.existsSync('mabi-pack2.exe') || fs.existsSync('./mabi-pack2')){
        f = await Promise.allLimit(fileArray, warpGetITPackFileList, 4)
    }else{
        //只是实在太慢了....
        f = await Promise.allLimit(fileArray, warpGetITPackFileList, 16)
    }
    //sort by filename
    f = _.sortBy(f, 'filename')
    // f.forEach(e => {
    //     console.log(e.filename)
    // })
    fs.writeFileSync('filelist.json', JSON.stringify(f, null, 2))
    if(!fs.existsSync('./package/')){
        fs.mkdirSync('./package/')
    }
    f.forEach(e => {
        fs.writeFileSync(path.join(__dirname, './package/' + e.filename + '.json'), JSON.stringify(e, null, 2))
    })
}()
async function warpGetITPackFileList(n,filename){
    const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));
    //限速器
    await snooze(Math.floor(Math.random()*75+75))
    return getITPackFileList('./download/package/' + filename)
}

function getITPackFileList(filePath){
    return new Promise((resolve,reject)=>{
        //依我看 关键的性能问题就出在这这里了 -hina
        let a
        if(filePath.endsWith('undefined')){
            reject()
        }
        if(fs.existsSync('mabi-pack2.exe') || fs.existsSync('./mabi-pack2')){
            //有原生二进制文件还是尽量用原生二进制吧 -hina
            if(process.platform == "win32"){
                a = child_process.spawn(
                    'mabi-pack2.exe',
                    ['list','--input',filePath]
                )
            }else{
                a = child_process.spawn(
                    './mabi-pack2',
                    ['list','--input',filePath]
                )
            }
        }else{
            a = child_process.spawn(
                'node',
                ['--experimental-wasi-unstable-preview1','mabiPackWASICaller.js','list','--input',filePath]
            )
        } 
        let returnData =[]
        a.stdout.on('data',(data)=>{returnData.push(data.toString())})
        //a.stderr.on('data',(data)=>{console.error(data)})
        a.on('close',(code)=>{
            resolve({
                filename:path.basename(filePath),
                packedFiles:returnData.join('')
            })
        })
    })
}
