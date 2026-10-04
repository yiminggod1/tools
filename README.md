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

- Hardware inventory lists available CPU, memory-module, graphics, display, motherboard, BIOS, disk, audio, network, USB, temperature, and operating-system models. Sensor and model availability depends on the operating system, drivers, and permissions; serial numbers and network addresses are not shown.
- CPU stress uses up to 16 worker threads for at most 30 seconds. If a readable CPU temperature reaches 90°C, the test stops automatically. The stop button remains available.
- GPU testing renders an animated Mandelbulb scene with live display FPS, frame time, 1% low, peak, and frame-history graph. Profiles include 540p, 720p, 1080p, and native 5K (5120×2880). Before allocating the 5K canvas, the app checks GPU viewport, texture, and renderbuffer limits; one RGBA frame needs about 56 MiB.
- When `EXT_disjoint_timer_query` is supported, the app asynchronously measures GPU execution time every fourth frame and uses normalized pixel-iteration throughput for the GPU score. Otherwise it reports display-paced FPS, marks GPU timing unavailable, and excludes GPU from the score rather than treating VSync as GPU speed.
- RIG is a 0–100 weighted score: CPU 40%, GPU 40%, memory 20%. A score of 100 maps to 80 million CPU test operations/second, 16.67 ms GPU time for 1280×720 with 12 fractal iterations, or 25,000 MB/s of measured memory traffic. Partial scores show their test coverage; only complete runs enter the local leaderboard.
- Memory bandwidth testing reads and writes a temporary 32 MB buffer. Disk inventory is read-only; there is no disk-write stress test. A JSON report can be exported locally after testing.
- The performance guide recommends reversible OS/vendor settings only. RigCheck does not change clock speeds, voltage, fan curves, firmware, or thermal limits, and cannot promise universal overclocking or a 3× gain.
- Benchmark records stay in this computer's local application storage. No hardware information is uploaded.