const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const util = require('util')
const _ = require('lodash')
const child_process = require('child_process');

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
        let a
        console.log(`Exacting ${filePath}`)
        let param = ['extract','--input',filePath,'--output','./','--filter',"\.xml",'--filter',"\.txt"]
        if(fs.existsSync('mabi-pack2.exe') || fs.existsSync('./mabi-pack2')){
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
