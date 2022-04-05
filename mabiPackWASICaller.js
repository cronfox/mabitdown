const { readFile } = require('fs/promises');
const { WASI } = require('wasi');
const { argv, env } = require('process');
const { join } = require('path');

arg = argv
arg.shift()
arg.shift()
const wasi = new WASI({
  args: ['mabi-pack2.wasm',...arg],
  env,
  preopens: {
    '/': './'
  }
});

// Some WASI binaries require:
//   const importObject = { wasi_unstable: wasi.wasiImport };
const importObject = { wasi_snapshot_preview1: wasi.wasiImport };

(async () => {
    
  const wasm = await WebAssembly.compile(
    await readFile(join(__dirname, 'mabi-pack2.wasm'))
  );
  const instance = await WebAssembly.instantiate(wasm, importObject);
  wasi.start(instance);
})();