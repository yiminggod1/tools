const { parentPort, workerData } = require("node:worker_threads");
const endAt = Date.now() + workerData.durationMs;
let operations = 0;
let value = 0.25;

function runSlice() {
  const sliceEnd = Math.min(endAt, Date.now() + 100);
  let sliceOperations = 0;
  while (Date.now() < sliceEnd) {
    for (let index = 0; index < 4000; index++) {
      value = Math.sqrt(value + index * 0.000001);
      sliceOperations++;
    }
  }
  operations += sliceOperations;
  const done = Date.now() >= endAt;
  parentPort.postMessage({ type: done ? "done" : "progress", operations });
  if (!done) setImmediate(runSlice);
}

runSlice();