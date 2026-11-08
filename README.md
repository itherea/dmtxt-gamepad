# 🎮 dmtxt-gamepad

> **Gamepad & Joystick MIDI CC plugin for [Hydra](https://hydra.ojack.xyz) Livecoding Video Synthesizer.**  
> Map standard USB & Bluetooth controllers (Xbox, PlayStation, 8BitDo, generic USB sticks) directly to Hydra's MIDI `cc` variables with zero dependencies.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Hydra](https://img.shields.io/badge/Hydra-Synth-00ffcc.svg)](https://hydra.ojack.xyz)
[![Platform](https://img.shields.io/badge/Platform-Web%20Gamepad%20API-ff0077.svg)](https://w3c.github.io/gamepad/)

---

## ⚡ Features

- 🔌 **Zero External Drivers / Daemons:** Uses the browser's native HTML5 Gamepad API. Plug in and play.
- 🎛️ **MIDI CC Compatible:** Exposes values through standard `cc[n]` and `cc(n)` calls.
- 📺 **Built-in Visual HUD:** Call `joy.show()` to see live meters for analog sticks, triggers, and active buttons.
- 🎯 **Deadzone Compensation:** Configurable threshold (`joy.deadzone`) to prevent stick drift when idle.
- 🌊 **Smooth Interpolation (Lerp):** Optional smoothing (`joy.smooth`) for fluid camera pans, zooms, and rotation.
- 📐 **Easy Range Helper:** Rescale CC parameters with `cc.range(channel, min, max)`.

---

## 🚀 Quick Start / Inicio Rápido

### 1. Load the plugin inside Hydra / Cargar en Hydra

Evaluate the following in your Hydra editor (**Ctrl + Enter**):

```javascript
// Load directly via jsDelivr CDN (or local server)
await loadScript('https://cdn.jsdelivr.net/gh/dmtxt/dmtxt-gamepad@main/dmtxt-gamepad.js')

// Start listening and display the on-screen monitor
joy.start().show()
```

> [!IMPORTANT]
> **Browser Security Notice:** Browsers do not expose gamepad inputs until you **press at least one button** on the controller while the browser tab is focused.

---

### 2. Livecoding Example / Ejemplo en Vivo

```javascript
// Left Stick (cc[0], cc[1]): Modulate frequency & phase
// Right Stick (cc[2], cc[3]): Rotation & Scale
// Triggers (cc[4], cc[5]): Color modulation
// Button A (cc[10]): Trigger noise distortion
osc(() => cc[0] * 60 + 5, 0.1, () => cc[1] * 2)
  .color(() => cc[4] * 2 + 0.2, () => cc[5] + 0.5, 1)
  .rotate(() => cc[2] * Math.PI)
  .scale(() => cc[3] * 3 + 0.5)
  .modulate(noise(() => cc[10] * 8))
  .out()
```

---

## 🗺️ Controller Mapping / Mapeo de Controles

```
                  [LT: cc[4]]             [RT: cc[5]]
                  [LB: cc[14]]            [RB: cc[15]]
                       _                       _
                     /   \___________________/   \
                    |   (^)                 (Y:cc[13])   |
      [D-Pad:       | (<) (>)             (X:12) (B:11)  |
       cc[22..25]   |   (v)      [Select]   [Start] (A:10) |
                    |            cc[18]     cc[19]       |
                    |     (LX/LY)             (RX/RY)    |
                     \___ cc[0]/[1] _________ cc[2]/[3] _/
                         (L3: cc[20])        (R3: cc[21])
```

| Control | MIDI CC | Range | Description |
| :--- | :--- | :--- | :--- |
| **Left Stick X** | `cc[0]` | `0.0` to `1.0` | Center is `0.5` |
| **Left Stick Y** | `cc[1]` | `0.0` to `1.0` | Center is `0.5` |
| **Right Stick X** | `cc[2]` | `0.0` to `1.0` | Center is `0.5` |
| **Right Stick Y** | `cc[3]` | `0.0` to `1.0` | Center is `0.5` |
| **Left Trigger (LT / L2)** | `cc[4]` | `0.0` to `1.0` | Analog pressure |
| **Right Trigger (RT / R2)** | `cc[5]` | `0.0` to `1.0` | Analog pressure |
| **Button A / Cross** | `cc[10]` | `0` or `1` | Face button down |
| **Button B / Circle** | `cc[11]` | `0` or `1` | Face button right |
| **Button X / Square** | `cc[12]` | `0` or `1` | Face button left |
| **Button Y / Triangle** | `cc[13]` | `0` or `1` | Face button up |
| **Left Bumper (LB / L1)** | `cc[14]` | `0` or `1` | Shoulder button |
| **Right Bumper (RB / R1)** | `cc[15]` | `0` or `1` | Shoulder button |
| **Select / Back / Share** | `cc[18]` | `0` or `1` | Option button |
| **Start / Options** | `cc[19]` | `0` or `1` | Menu button |
| **L3 (Left Stick Click)** | `cc[20]` | `0` or `1` | Thumbstick button |
| **R3 (Right Stick Click)** | `cc[21]` | `0` or `1` | Thumbstick button |
| **D-Pad (Up, Down, Left, Right)** | `cc[22]..cc[25]` | `0` or `1` | Directional pad |

---

## 🛠️ API & Configuration

### Properties & Configuration

- `joy.start(gamepadIndex = 0)`: Starts polling the gamepad (defaults to the first connected controller).
- `joy.stop()`: Pauses polling.
- `joy.show(visible = true)`: Toggles the on-screen translucent debug HUD.
- `joy.hide()`: Closes the on-screen HUD.
- `joy.deadzone`: Deadzone threshold for analog sticks (default: `0.08`).
- `joy.smooth`: Lerp smoothing factor between `0` (instant) and `0.95` (silky smooth).

### Direct Convenience Getters

Instead of typing `cc[0]`, you can also use named getters directly:

```javascript
joy.lx   // Left stick X [0..1]
joy.ly   // Left stick Y [0..1]
joy.rx   // Right stick X [0..1]
joy.ry   // Right stick Y [0..1]
joy.lt   // Left trigger [0..1]
joy.rt   // Right trigger [0..1]
joy.btn(0) // Button A (alias for cc[10])
```

### Range Helper: `cc.range(channel, min, max)`

Eliminate manual math by letting the helper scale the normalized `0..1` value directly:

```javascript
// Scales cc[0] between 10 and 120 automatically
osc(() => cc.range(0, 10, 120), 0.1, () => cc.range(1, 0, 3)).out()
```

---

## 🎨 Creative Examples

### 1. Feedback Loop Vortex
```javascript
joy.smooth = 0.4 // Smooth out stick turns

src(o0)
  .scale(() => cc.range(3, 0.95, 1.05))
  .rotate(() => (cc[2] - 0.5) * 0.1)
  .modulate(noise(3, 0.1), () => cc[4] * 0.2)
  .blend(
    osc(() => cc.range(0, 5, 40), 0.1, 1.5)
      .color(() => cc[5], 0.4, 0.9)
      .mask(shape(4, 0.6)),
    () => cc[10] ? 0.8 : 0.05
  )
  .out(o0)
```

### 2. Kaleidoscope Glitch
```javascript
osc(20, 0.05, () => cc[1] * 2)
  .kaleid(() => Math.floor(cc.range(0, 2, 12)))
  .rotate(() => cc[2] * Math.PI)
  .pixelate(() => cc.range(4, 20, 200), () => cc.range(5, 20, 200))
  .color(1, () => cc[3], 0.8)
  .modulatePixelate(noise(4), () => cc[11] * 20)
  .out()
```

---

## 📦 Local Development

If you are running Hydra locally:

1. Clone or copy `dmtxt-gamepad.js` into your Hydra `public/` directory.
2. In Hydra, run:
   ```javascript
   await loadScript('/dmtxt-gamepad.js')
   joy.start().show()
   ```
3. Or embed it into `index.html` to have it available on every boot:
   ```html
   <script src="/dmtxt-gamepad.js" defer></script>
   ```

---

## 📄 License

MIT © [dmtxt](https://github.com/dmtxt)
