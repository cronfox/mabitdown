const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const util = require('util')
const _ = require('lodash')
const child_process = require('child_process');

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
        f = await Promise.allLimit(fileArray, warpExactITPack, 4)
    }else{
        //只是实在太慢了....
        f = await Promise.allLimit(fileArray, warpExactITPack, 16)
    }
    //sort by filename
}()
async function warpExactITPack(n,filename){
    return exactITPack('./download/package/' + filename)
}

function exactITPack(filePath){
    return new Promise((resolve,reject)=>{
        //依我看 关键的性能问题就出在这这里了 -hina
        let a
        let param = ['extract','--input',filePath,'--output','./','--filter',"\.xml",'--filter',"\.txt"]
        if(fs.existsSync('mabi-pack2.exe') || fs.existsSync('./mabi-pack2')){
            //有原生二进制文件还是尽量用原生二进制吧 -hina
            if(process.platform == "win32"){
                a = child_process.spawn(
                    'mabi-pack2.exe',
                    param
                )
            }else{
                a = child_process.spawn(
                    './mabi-pack2',
                    param
                )
            }
        }else{
            a = child_process.spawn(
                'node',
                ['--experimental-wasi-unstable-preview1','mabiPackWASICaller.js',...param]
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
