const fs = require('fs');
const path = require('path')
var _ = require('lodash');

//file format: "objectname\ttranslatedtext"
//file name: ${translateobject}.${language}.txt

//json format: {"data":[translatedtext,translatedtext]}
//请copilot表演

//遍历local/xml目录下的txt文件并记录文件名
let filelist = fs.readdirSync(path.join(__dirname, './data/local/xml'))

let translated = {
    xml:{}
}
let translatedO = {
    xml:{}
}

filelist.forEach(e=>{
    let filepath = path.join(__dirname, './data/local/xml/' + e)
    let filecontent = fs.readFileSync(filepath, 'utf8')
    let filecontentArray = filecontent.split('\r\n')
    _.remove(filecontentArray, e => {
        return e.length == 0
    })
    _.remove(filecontentArray, e => {
        return e.startsWith("\x00")
    })
    let objectname = e.split(".")[0]
    let translatedArray = []
    //translated.xml[objectname] = []
    filecontentArray.forEach(e=>{
        let eArray = e.split('\t')
        translatedArray[parseInt(eArray[0])] = eArray[1];
    })
    if(!fs.existsSync(path.join(__dirname, './translate/xml/'))){
        fs.mkdirSync(path.join(__dirname, './translate/xml/'),{recursive:true})
    }
    console.log(`Converting ./data/local/xml/${e} to JSON ./translate/xml/${objectname}.json ...`)
    fs.writeFileSync(path.join(__dirname, './translate/xml', objectname + '.json'), JSON.stringify({data:translatedArray}))
    translated["xml"][objectname.toLowerCase()] = translatedArray
    translatedO["xml"][objectname] = translatedArray
})

console.log(`Writing Bundle+lowercase key JSON ./translate/translate.xml.all.lower.json ...`)
fs.writeFileSync(path.join(__dirname, './translate/translate.xml.all.lower.json'), JSON.stringify(translated))
console.log(`Writing Bundle JSON ./translate/translate.xml.all.json ...`)
fs.writeFileSync(path.join(__dirname, './translate/translate.xml.all.json'), JSON.stringify(translatedO))