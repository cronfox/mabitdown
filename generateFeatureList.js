const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');


function traverseDirectory(dir, extension, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const fileStat = fs.statSync(filePath);

        if (fileStat.isDirectory()) {
            fileList = traverseDirectory(filePath, extension, fileList);
        } else if (path.extname(file) === extension) {
            fileList.push(filePath);
        }
    });

    return fileList;
}

async function extractFeatures() {
    const xmlFiles = traverseDirectory('data', '.xml');
    const features = new Set();
    //console.log(xmlFiles.filter(file => file.toLowerCase().includes("itemdb")))
    for (let i = 0; i < xmlFiles.length; i++) {
        const file = xmlFiles[i];
        let xml = await fs.promises.readFile(file, "utf-16le")
        const parser = new xml2js.Parser({
            strict: false,
        });

        //xml.startsWith("w") ? xml.slice(1) : xml;
        let result = await parser.parseStringPromise(xml).catch(e => console.log(e, file, i))
        let resultArr = Array.from(traverseObject(result))

        //console.log(   )
        resultArr.forEach(e => {
            for (const key in e) {
                if (Object.hasOwnProperty.call(e, key)) {
                    const element = e[key];
                    if (key.toLowerCase().includes("feature")) {
                        return element.startsWith("!") ? features.add(element.slice(1)) : features.add(element);
                    }
                }
            }
        })
        console.log(i,file,features.size)
    }
    console.log(features)
    return features;
}

function traverseObject(obj, features = new Set()) {
    for (const key in obj) {
        if (key === "$") {
            features.add(obj[key]);
        } else if (typeof obj[key] === "object") {
            traverseObject(obj[key], features);
        }
    }
    return features;
}



extractFeatures()
