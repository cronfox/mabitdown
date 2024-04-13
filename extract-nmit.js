const { RawFileEntry } = require("../node-mabi-it/built/exact")
const { FileEntry, FileHeader } = require("../node-mabi-it").common
const encryption = require("../node-mabi-it/built/encryption")
//const {FileEntry} = require("../node-mabi-it").common
const path = require('path')
const fs = require('fs')
const {
    Worker, isMainThread, parentPort, workerData,
} = require('worker_threads');

const threadCount = Math.max(require('os').cpus().length, 16);
/**
 * 
 * @param {RawFileEntry} entires 
 * @param {RegExp[]} filenameFilters 
 */
function extractFileFromRFE(entires, filenameFilters) {
    /**
     * @type {RawFileEntry[]}
     */
    entires.forEach(async e => {
        let filepath = path.join(__dirname, e.originalEntry.name)
        var dirname = path.dirname(filepath);
        fs.mkdirSync(dirname, { recursive: true })
        fs.writeFileSync(filepath, Buffer.from(e.content))
    })
}
function extractFileFromFE(entires, filenameFilters) {
    /**
     * @type {FileEntry[]}
     */
    let result = []
    result = entires.filter(e => {
        let filename = e.originalEntry.name
        let flag = false
        filenameFilters.forEach(f => {
            if (f.test(filename)) {
                flag = true
            }
        })
        return flag
    })
    result.forEach(e => {
        mkdirp(path.join(__dirname, e.originalEntry.name))
        function mkdirp(filepath) {
            var dirname = path.dirname(filepath);
            fs.mkdir(dirname, { recursive: true }, (err) => {
                fs.writeFile(path.join(__dirname, e.originalEntry.name), Buffer.from(e.content), (err) => { })
            })
        }

    })
}

if (isMainThread) {
    function extract() {
        //filePath = process.argv[2]
        let filelist = fs.readdirSync(path.join(__dirname, './download/package'))
        let fileArray = []
        filelist.forEach(e => {
            fileArray.push(path.join(__dirname, './download/package', e))
        })
        //fileArray.forEach(filePath => {
        //    let fileBuffer = new Uint8Array(fs.readFileSync(filePath))
        //    //console.log(path.basename(filePath))
        //    let result = exactFilesFromBuffer(path.basename(filePath), fileBuffer)
        //    console.log(path.basename(filePath), result.length, "files")
        //})
        const workers = []
        //get cpu count
        const cpuCount = require('os').cpus().length;
        let result = []
        fs.mkdirSync(path.join(__dirname, './package'), { recursive: true })
        for (let i = 0; i < threadCount; i++) {
            let worker = new Worker(__filename, { workerData: { fileArray: fileArray, id: i } })
                .on('message', (message) => {
                    console.log(message.filename, message.packedFiles.length, "files")
                    fs.writeFileSync(path.join(__dirname, './package', message.filename + ".json"), JSON.stringify(message))
                })
                .on('error', (err) => { throw err; })
                .on('exit', () => {
                    console.log(`Worker ${worker.threadId} finished`);
                });

            workers.push(worker);
        }
    }
    extract()
} else {
    const { workerData, parentPort } = require('worker_threads');
    const { fileArray, id } = workerData;
    //console.log(fileArray)
    //console.log(id)
    for (let i = 0; i < fileArray.length; i++) {
        if (i % threadCount == id) {
            let filePath = fileArray[i]
            let fileBuffer = new Uint8Array(fs.readFileSync(filePath))
            let hash = {
                "md5": require("crypto").createHash("md5").update(fileBuffer).digest("hex"),
                "sha256": require("crypto").createHash("sha256").update(fileBuffer).digest("hex")
            }
            let result = getEntires(path.basename(filePath), fileBuffer)
            //fs.writeFileSync(path.join(__dirname, './entires', path.basename(filePath) + ".json"), JSON.stringify(result))
            parentPort.postMessage({ filename: path.basename(filePath), packedFiles: result.map(e => e.name), hash })
            //console.log(path.basename(filePath), result.length, "files")
            let pfh = calcPackagedFileHash(path.basename(filePath), result, fileBuffer)
            let textformat = []
            textformat.push(`##${path.basename(filePath)}\t${hash.md5}\t${hash.sha256}`)
            pfh.map(e => {
                textformat.push(`${e.filename}\t${e.hash}`)
            })
            fs.writeFileSync(path.join(__dirname, './packageListIncludeFileHash', path.basename(filePath) + ".txt"), textformat.join("\n"))
            extractFileFromRFE(exactFilesFromBufferFilter(path.basename(filePath), result, fileBuffer, [/.xml/, /.txt/]))
        }
    }
}

function calcPackagedFileHash(filename, entries, buf) {
    const { xxh64 } = require('@node-rs/xxhash')
    let headerOffset = encryption.generateHeaderOffset(filename);
    let entryOffset = encryption.generateEntriesOffset(filename);
    // let fileHeader = FileHeader.readEncryptHeader(filename, buf);
    // let entries = FileEntry.readEntries(filename, fileHeader, buf);
    let currentPos = headerOffset + entryOffset + entries.reduce((a, b) => a + b.toBuffer().byteLength, 0);
    let contentStartOff = BigInt(currentPos + 1023) & BigInt.asUintN(64, (BigInt(0) - BigInt(1024))); //由于用了BigInt 平台支持可能会有问题。
    /**
     * @type {RawFileEntry[]}
     */
    let rfe = entries.map(entry => RawFileEntry.fromEncryptedPackedBuffer(buf, Number(contentStartOff), entry));
    let hashes = rfe.map(e => {
        return {
            filename: e.originalEntry.name,
            hash: xxh64(e.content).toString(16)
        }
    })
    return hashes
}

function getEntires(filename, buf) {
    let fileHeader = FileHeader.readEncryptHeader(filename, buf);
    let entries = FileEntry.readEntries(filename, fileHeader, buf);
    return entries
}
/**
 * 
 * @param {string} filename 
 * @param {FileEntry[]} entries 
 * @param {Uint8Array} buf 
 * @param {RegExp[]} filenameFilters 
 * @returns 
 */
function exactFilesFromBufferFilter(filename, entries, buf, filenameFilters) {
    let headerOffset = encryption.generateHeaderOffset(filename);
    let entryOffset = encryption.generateEntriesOffset(filename);
    // let fileHeader = FileHeader.readEncryptHeader(filename, buf);
    // let entries = FileEntry.readEntries(filename, fileHeader, buf);
    let currentPos = headerOffset + entryOffset + entries.reduce((a, b) => a + b.toBuffer().byteLength, 0);
    let contentStartOff = BigInt(currentPos + 1023) & BigInt.asUintN(64, (BigInt(0) - BigInt(1024))); //由于用了BigInt 平台支持可能会有问题。
    //console.log(contentStartOff)
    let rawFileEntries = entries.filter(e => {
        let flag = false
        filenameFilters.forEach(f => {
            if (f.test(e.name)) {
                flag = true
            }
        })
        return flag
    }).map(function (entry) {
        return RawFileEntry.fromEncryptedPackedBuffer(buf, Number(contentStartOff), entry);
    });
    return rawFileEntries;
}