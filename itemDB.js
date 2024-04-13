const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const itemdbList = fs.readdirSync("data/db").filter(e => e.toLowerCase().includes("itemdb")).map(e => path.join("data/db", e))
const translate = require("./translate/translate.xml.all.lower.json")
const l10nTagRegex = /_LT\[(.*)\]/g

async function extractItemDB() {
    const itemdb = new Map();
    for (const iterator of itemdbList) {
        const parser = new xml2js.Parser();
        let xml = await fs.promises.readFile(iterator, "utf-16le")
        let result = (await parser.parseStringPromise(xml)).Items.Mabi_Item.map(e=>e.$)
        result.forEach(e=>{
            for (const key in e) {
                if (Object.hasOwnProperty.call(e, key)) {
                    const element = e[key];
                    if(l10nTagRegex.test(element)){
                        e[key] = getLocalizedString(element)
                    }
                }
            }
            itemdb.set(parseInt(e.ID),e)
        })
        console.log(iterator,itemdb.size)
    }
    if(!fs.existsSync("db")){
        fs.mkdirSync("db")
    }
    fs.writeFileSync("db/itemdb.json",JSON.stringify(Array.from(itemdb.values()),null,2))
}
/**
 * "_LT[xml.itemdb_mainequip.2638]" -> translate.xml.itemdb_mainequip[2638]
 * @param {} _LT 
 */ 
function getLocalizedString(_LT){
    let result = []
    let _LTArray = _LT.split(".")
    let objectname = _LTArray[1]
    let id = parseInt(_LTArray[2].slice(0,-1))
    result = translate["xml"][objectname][id]
    return result
}

extractItemDB()