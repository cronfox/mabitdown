const { RawFileEntry } = require("../node-mabi-it/built/exact")
const { FileEntry, FileHeader } = require("../node-mabi-it").common
const fs = require('fs')
const path = require('path')
function ArraytoEntires(arr) {
    arr.map(e=>{e.key=Buffer.from(e.key,"base64"); return e})
    arr.map(e=>FileEntry.fromObject(e))
    return arr
}



if (isMainThread) {
    function extract() {
        //filePath = process.argv[2]
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
                    console.log(message.filename,message.packedFiles.length,"files")
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
}