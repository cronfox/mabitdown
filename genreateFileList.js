//--experimental-wasi-unstable-preview1
const child_process = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const _ = require('lodash');
const utils = require('./utils');
Promise.allLimit = utils.AllLimit

void async function () {
    //get filename list from disk
    let filelist = fs.readdirSync(path.join(__dirname, './download/package'))
    let fileArray = []
    filelist.forEach(e => {
        fileArray.push(e)
    })
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
        let a
        if(filePath.endsWith('undefined')){
            reject()
        }
        console.log(`Listing ${filePath}`)
        if(fs.existsSync('mabi-pack2.exe') || fs.existsSync('./mabi-pack2')){
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
