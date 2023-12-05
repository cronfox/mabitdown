const path = require('path')
const fs = require('fs')
let filelist = fs.readdirSync(path.join(__dirname, './entires'))
let fileArray = []
filelist.forEach(e => {
    fileArray.push(path.join(__dirname, './entires', e))
})
if (!fs.existsSync(path.join(__dirname, './packageListText'))) {
    fs.mkdirSync(path.join(__dirname, './packageListText'), { recursive: true })
}
fileArray = fileArray.map(e=>JSON.parse(fs.readFileSync(e)))
fileArray.forEach((e)=>{
    let textformat = []
    //create text format header
    // ##${filename}\t${md5Hash}\t${sha256Hash}
    textformat.push(`##${e.filename}\t${e.hash.md5}\t${e.hash.sha256}`)
    e.packedFiles.forEach(e=>{
        textformat.push(`${e.name}\t${e.offset}\t${e.originalSize}\t${e.key}`)
    })
    fs.writeFileSync(path.join(__dirname, './packageListText', e.filename + ".txt"),textformat.join("\n"))
})
fs.writeFileSync(path.join(__dirname, './filelist.json'),JSON.stringify(fileArray))
console.log("build filelist.json finish")