/**
 * dmtxt-gamepad.js
 * dmtxt Gamepad Plugin for Hydra Visual Synthesizer
 * 
 * Maps standard USB/Bluetooth joysticks & gamepads to MIDI CC variables (cc[0..127] and cc(n)).
 * Built using the native HTML5 Gamepad API — zero external dependencies.
 *
 * Author: dmtxt
 * License: MIT
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    const plugin = factory();
    root.dmtxtGamepad = plugin;
    root.joy = plugin;
  }
}(typeof self !== 'undefined' ? self : this, function () {

  const ccValues = new Float32Array(128).fill(0);
  const rawValues = new Float32Array(128).fill(0);

  function applyDeadzone(val, deadzone) {
    if (Math.abs(val) < deadzone) return 0;
    const sign = Math.sign(val);
    return sign * ((Math.abs(val) - deadzone) / (1 - deadzone));
  }

  function normAxis(val, deadzone) {
    const clean = applyDeadzone(val, deadzone);
    return (clean + 1) / 2; // [-1, 1] -> [0, 1]
  }

  function getCC(index, def = 0) {
    const i = Math.floor(Number(index));
    return (i >= 0 && i < 128) ? ccValues[i] : def;
  }

  const ccProxy = new Proxy(getCC, {
    get(target, prop) {
      if (typeof prop === 'string' && !isNaN(prop)) {
        const i = Number(prop);
        return (i >= 0 && i < 128) ? ccValues[i] : 0;
      }
      if (prop === 'length') return 128;
      if (prop === 'values') return ccValues;
      if (prop === 'range') {
        return (idx, min, max) => min + (getCC(idx) * (max - min));
      }
      return target[prop];
    },
    set(target, prop, value) {
      if (typeof prop === 'string' && !isNaN(prop)) {
        const i = Number(prop);
        if (i >= 0 && i < 128) ccValues[i] = Number(value);
        return true;
      }
      target[prop] = value;
      return true;
    }
  });

  const joy = {
    active: false,
    gamepadIndex: 0,
    deadzone: 0.08,
    smooth: 0, // 0 = instant, 0.1..0.9 = lerp smoothing
    connected: false,
    name: 'No gamepad detected',
    hudElement: null,

    // Quick getters
    get lx() { return ccValues[0]; },
    get ly() { return ccValues[1]; },
    get rx() { return ccValues[2]; },
    get ry() { return ccValues[3]; },
    get lt() { return ccValues[4]; },
    get rt() { return ccValues[5]; },

    axis(n, min = 0, max = 1) {
      const v = (n >= 0 && n < 6) ? ccValues[n] : 0;
      return min + v * (max - min);
    },

    btn(n) {
      const idx = 10 + n;
      return (idx >= 0 && idx < 128) ? ccValues[idx] : 0;
    },

    start(targetIndex = null) {
      if (targetIndex !== null) this.gamepadIndex = targetIndex;
      this.active = true;
      window.cc = ccProxy;

      window.addEventListener('gamepadconnected', (e) => {
        this.connected = true;
        this.name = e.gamepad.id;
        console.log(`🎮 [dmtxt-gamepad] Connected (#${e.gamepad.index}): ${e.gamepad.id}`);
        this._updateHudInfo();
      });

      window.addEventListener('gamepaddisconnected', (e) => {
        if (e.gamepad.index === this.gamepadIndex) {
          this.connected = false;
          this.name = 'Disconnected';
          console.warn(`🎮 [dmtxt-gamepad] Disconnected (#${e.gamepad.index})`);
          this._updateHudInfo();
        }
      });

      this._loop();
      console.log('✨ [dmtxt-gamepad] Active. Press any button on your controller to wake the Gamepad API.');
      return this;
    },

    stop() {
      this.active = false;
      return this;
    },

    _loop() {
      if (!this.active) return;

      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      let gp = gamepads[this.gamepadIndex];

      if (!gp) {
        for (let i = 0; i < gamepads.length; i++) {
          if (gamepads[i]) {
            gp = gamepads[i];
            this.gamepadIndex = i;
            break;
          }
        }
      }

      if (gp) {
        this.connected = true;
        this.name = gp.id;

        // Ejes (Sticks)
        for (let i = 0; i < gp.axes.length && i < 4; i++) {
          rawValues[i] = normAxis(gp.axes[i], this.deadzone);
        }

        // Gatillos analógicos (LT / RT)
        if (gp.buttons.length > 7) {
          rawValues[4] = gp.buttons[6].value;
          rawValues[5] = gp.buttons[7].value;
        }

        // Botones (cc[10..n])
        for (let i = 0; i < gp.buttons.length && (10 + i) < 128; i++) {
          rawValues[10 + i] = gp.buttons[i].value;
        }

        // Suavizado (lerp)
        const factor = 1 - Math.max(0, Math.min(0.95, this.smooth));
        for (let i = 0; i < 128; i++) {
          ccValues[i] += (rawValues[i] - ccValues[i]) * factor;
        }

        if (this.hudElement) this._renderHud();
      } else {
        this.connected = false;
      }

      requestAnimationFrame(() => this._loop());
    },

    show(visible = true) {
      if (!visible) {
        this.hide();
        return this;
      }
      if (!this.hudElement) {
        const hud = document.createElement('div');
        hud.id = 'dmtxt-gamepad-hud';
        hud.style.cssText = `
          position: fixed;
          bottom: 15px;
          right: 15px;
          width: 300px;
          background: rgba(16, 17, 24, 0.88);
          backdrop-filter: blur(10px);
          color: #00ffcc;
          font-family: ui-monospace, Menlo, Monaco, Consolas, monospace;
          font-size: 11px;
          border-radius: 8px;
          border: 1px solid rgba(0, 255, 204, 0.35);
          box-shadow: 0 8px 24px rgba(0,0,0,0.6);
          padding: 10px 12px;
          z-index: 999999;
          user-select: none;
        `;
        document.body.appendChild(hud);
        this.hudElement = hud;
      }
      this.hudElement.style.display = 'block';
      this._updateHudInfo();
      return this;
    },

    hide() {
      if (this.hudElement) {
        this.hudElement.style.display = 'none';
      }
      return this;
    },

    _updateHudInfo() {
      if (!this.hudElement) return;
      this.hudElement.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,0.12); padding-bottom: 4px;">
          <b style="color: #fff; letter-spacing: 0.5px;">🎮 DMTXT GAMEPAD</b>
          <span style="cursor:pointer; color:#888; font-size:14px;" onclick="window.joy.hide()">✕</span>
        </div>
        <div id="joy-hud-name" style="color: ${this.connected ? '#00ffcc' : '#ff5577'}; margin-bottom: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${this.connected ? '● ' + this.name.split('(')[0] : '○ Press any button on controller'}
        </div>
        <div id="joy-hud-bars"></div>
        <div id="joy-hud-buttons" style="margin-top:6px; display:flex; flex-wrap:wrap; gap:3px;"></div>
      `;
    },

    _renderHud() {
      if (!this.hudElement) return;
      const barsContainer = this.hudElement.querySelector('#joy-hud-bars');
      const btnsContainer = this.hudElement.querySelector('#joy-hud-buttons');
      if (!barsContainer || !btnsContainer) return;

      const labels = ['cc[0] LX', 'cc[1] LY', 'cc[2] RX', 'cc[3] RY', 'cc[4] LT', 'cc[5] RT'];
      let barsHtml = '';
      for (let i = 0; i < 6; i++) {
        const val = ccValues[i];
        const pct = Math.round(val * 100);
        barsHtml += `
          <div style="display:flex; align-items:center; margin-bottom: 2px;">
            <span style="width: 75px; color:#aaa;">${labels[i]}:</span>
            <div style="flex:1; background: #222; height: 7px; border-radius: 3px; overflow:hidden; margin: 0 6px;">
              <div style="width: ${pct}%; background: #00ffcc; height: 100%;"></div>
            </div>
            <span style="width: 32px; text-align:right; color:#fff;">${val.toFixed(2)}</span>
          </div>
        `;
      }
      barsContainer.innerHTML = barsHtml;

      let btnsHtml = '';
      for (let b = 0; b < 16; b++) {
        const val = ccValues[10 + b];
        const active = val > 0.1;
        btnsHtml += `
          <span style="
            background: ${active ? '#00ffcc' : '#1e2029'};
            color: ${active ? '#000' : '#666'};
            padding: 1px 4px;
            border-radius: 3px;
            font-size: 9px;
            font-weight: bold;
          ">B${b}</span>
        `;
      }
      btnsContainer.innerHTML = btnsHtml;
    }
  };

  window.dmtxtGamepad = joy;
  window.joy = joy;
  window.cc = ccProxy;

  if (!window.loadScript) {
    window.loadScript = function (url) {
      return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = url;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    };
  }

  return joy;
}));
