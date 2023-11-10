const path = require('path')
const fs = require('fs')
let filelist = fs.readdirSync(path.join(__dirname, './package'))
let fileArray = []
filelist.forEach(e => {
    fileArray.push(path.join(__dirname, './package', e))
})
fileArray = fileArray.map(e=>JSON.parse(fs.readFileSync(e)))
fs.writeFileSync(path.join(__dirname, './filelist.json'),JSON.stringify(fileArray))
console.log("build filelist.json finish")