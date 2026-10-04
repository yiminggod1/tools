# RigCheck

RigCheck is a cross-platform desktop hardware inventory and short-duration benchmark app built with Electron.

## Run locally

```sh
npm install
npm start
```

## Build an installer

Build for the current operating system with `npm run dist`, or use `npm run dist:linux`, `npm run dist:windows`, or `npm run dist:mac` on the matching host platform. Build artifacts are written to `release/`.

## Hardware and safety notes

- Hardware inventory reads CPU, memory, graphics, motherboard, BIOS, disks, CPU temperature, and operating-system details through local system APIs. Sensor and disk-health availability depends on the operating system, drivers, and permissions.
- CPU stress uses up to 16 worker threads for at most 30 seconds. If a readable CPU temperature reaches 90°C, the test stops automatically. The stop button remains available.
- GPU testing uses WebGL and cannot guarantee full GPU utilization. Memory testing allocates a small temporary buffer. Disk inventory is read-only; there is no disk-write stress test.
- Benchmark records are kept in this browser profile only. No hardware information is uploaded. The app does not expose disk serial numbers or network addresses to the interface.