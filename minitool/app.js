(() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b2) => {
    for (var prop in b2 || (b2 = {}))
      if (__hasOwnProp.call(b2, prop))
        __defNormalProp(a, prop, b2[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b2)) {
        if (__propIsEnum.call(b2, prop))
          __defNormalProp(a, prop, b2[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b2) => __defProps(a, __getOwnPropDescs(b2));

  // journey/sound.js
  var ctx = null;
  var master = null;
  var enabled = false;
  var playing = false;
  var nodes = [];
  try {
    enabled = localStorage.getItem("last-train-sound") === "on";
  } catch (e) {
  }
  var audioEnabled = () => enabled;
  function setup() {
    if (ctx) return true;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return false;
    try {
      ctx = new AudioContext();
      master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);
      return true;
    } catch (e) {
      return false;
    }
  }
  function ambient() {
    if (nodes.length) return;
    const length = ctx.sampleRate * 8, buffer = ctx.createBuffer(1, length, ctx.sampleRate), data = buffer.getChannelData(0);
    let brown = 0;
    for (let i = 0; i < length; i++) {
      brown = (brown + (Math.random() * 2 - 1) * 0.018) / 1.018;
      data[i] = brown * 2;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const low = ctx.createBiquadFilter();
    low.type = "lowpass";
    low.frequency.value = 520;
    const volume = ctx.createGain();
    volume.gain.value = 0.24;
    source.connect(low);
    low.connect(volume);
    volume.connect(master);
    source.start();
    nodes.push(source);
    [48, 73.42, 110.1].forEach((hz, i) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = hz;
      gain.gain.value = i === 0 ? 0.018 : 8e-3;
      osc.connect(gain);
      gain.connect(master);
      osc.start();
      nodes.push(osc);
    });
  }
  function audioStart() {
    playing = true;
    if (!enabled || document.hidden || !setup()) return;
    ambient();
    ctx.resume().then(() => {
      if (enabled && playing && !document.hidden) master.gain.setTargetAtTime(0.48, ctx.currentTime, 0.5);
    }).catch(() => {
    });
  }
  function audioPause() {
    playing = false;
    if (ctx) {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(0, ctx.currentTime);
      ctx.suspend().catch(() => {
      });
    }
  }
  function audioToggle() {
    enabled = !enabled;
    try {
      localStorage.setItem("last-train-sound", enabled ? "on" : "off");
    } catch (e) {
    }
    if (enabled) audioStart();
    else audioPause();
  }
  function audioIncoming() {
    if (!enabled || !playing || document.hidden || !ctx || ctx.state !== "running") return;
    [660, 880].forEach((hz, i) => {
      const t = ctx.currentTime + i * 0.09, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = hz;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.065, t + 9e-3);
      g.gain.exponentialRampToValueAtTime(1e-4, t + 0.18);
      o.connect(g);
      g.connect(master);
      o.start(t);
      o.stop(t + 0.2);
      o.onended = () => {
        o.disconnect();
        g.disconnect();
      };
    });
  }

  // journey/network-data.js
  var networkSVG = '<?xml version=\'1.0\' encoding=\'utf-8\'?>\n<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="1100" viewBox="0 0 1440 1100">\n  <title>Local Tube Map · 中英双语线路图</title>\n  <desc>Six fictional lines with editable station labels and fare zones 1–3. Includes the author’s two Wren Street stops and an unconnected unnamed station.</desc>\n  <g id="Background">\n    <rect width="1440" height="1100" fill="#fff" />\n  </g>\n  <g id="Fare-zones">\n    <g id="Zone-3">\n      <rect x="32" y="145" width="1376" height="825" rx="16" fill="#eff1f3" />\n    </g>\n    <g id="Zone-2">\n      <path d="M380 210H1000L1230 440V700L1010 895H380L240 775V350Z" fill="#ffffff" stroke="#dce0e5" stroke-width="1" />\n    </g>\n    <g id="Zone-1">\n      <path d="M620 300H930L1120 480V630L950 800H620L470 650V450Z" fill="#eff1f3" stroke="#dce0e5" stroke-width="1" />\n    </g>\n  </g>\n  <g id="River">\n    <path d="M -20 535 H 230 L 355 660 H 730 L 885 815 H 1460" fill="none" stroke="#d5ebf5" stroke-width="25" stroke-linejoin="round" />\n  </g>\n  <g id="Routes">\n    <g id="Line-A-Alder">\n      <path id="route-A" d="M 130 400 H 540 L 700 560 H 1270" fill="none" stroke="#df2525" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />\n    </g>\n    <g id="Line-B-Mere">\n      <path id="route-B" d="M 320 190 V 400 L 540 620 V 820" fill="none" stroke="#143e99" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />\n    </g>\n    <g id="Line-C-Foundry">\n      <path id="route-C" d="M 130 760 H 640 L 900 500 H 1270" fill="none" stroke="#008b62" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />\n    </g>\n    <g id="Line-D-Crown">\n      <path id="route-D" d="M 640 260 H 940 L 1060 380 V 620 L 960 720 H 680 L 580 620 V 320 Z" fill="none" stroke="#f2c900" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />\n    </g>\n    <g id="Line-E-Reed">\n      <path id="route-E" d="M 130 190 H 1130 L 1340 400 V 720 L 1210 850 H 920" fill="none" stroke="#9b0058" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />\n    </g>\n    <g id="Line-F-Westbank">\n      <path id="route-F" d="M 130 190 V 760 L 230 860 H 640 L 700 920 H 1240" fill="none" stroke="#a66a32" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />\n    </g>\n  </g>\n  <g id="Station-markers">\n    <g id="station-01">\n      <circle cx="130" cy="400" r="9" fill="white" stroke="#152b53" stroke-width="2.5" />\n    </g>\n    <g id="station-02">\n      <path d="M220 400l0 12" fill="none" stroke="#df2525" stroke-width="4" />\n    </g>\n    <g id="station-03">\n      <circle cx="320" cy="400" r="9" fill="white" stroke="#152b53" stroke-width="2.5" />\n    </g>\n    <g id="station-04">\n      <path d="M455 400l0 -12" fill="none" stroke="#df2525" stroke-width="4" />\n    </g>\n    <g id="station-05">\n      <circle cx="580" cy="440" r="9" fill="white" stroke="#152b53" stroke-width="2.5" />\n    </g>\n    <g id="station-06">\n      <path d="M715 560l0 12" fill="none" stroke="#df2525" stroke-width="4" />\n    </g>\n    <g id="station-07">\n      <circle cx="840" cy="560" r="9" fill="white" stroke="#152b53" stroke-width="2.5" />\n    </g>\n    <g id="station-08">\n      <circle cx="1060" cy="560" r="9" fill="white" stroke="#152b53" stroke-width="2.5" />\n    </g>\n    <g id="station-09">\n      <path d="M1170 560l0 12" fill="none" stroke="#df2525" stroke-width="4" />\n    </g>\n    <g id="station-10">\n      <path d="M1270 560l0 -12" fill="none" stroke="#df2525" stroke-width="4" />\n    </g>\n    <g id="station-11">\n      <circle cx="320" cy="190" r="9" fill="white" stroke="#152b53" stroke-width="2.5" />\n    </g>\n    <g id="station-12">\n      <path d="M320 290l-12 0" fill="none" stroke="#143e99" stroke-width="4" />\n    </g>\n    <g id="station-13">\n      <path d="M420 500l-9 9" fill="none" stroke="#143e99" stroke-width="4" />\n    </g>\n    <g id="station-14">\n      <path d="M540 650l-12 0" fill="none" stroke="#143e99" stroke-width="4" />\n    </g>\n    <g id="station-15">\n      <circle cx="540" cy="760" r="9" fill="white" stroke="#152b53" stroke-width="2.5" />\n    </g>\n    <g id="station-16">\n      <path d="M540 820l12 0" fill="none" stroke="#143e99" stroke-width="4" />\n    </g>\n    <g id="station-17">\n      <circle cx="130" cy="760" r="9" fill="white" stroke="#152b53" stroke-width="2.5" />\n    </g>\n    <g id="station-18">\n      <path d="M315 760l0 -12" fill="none" stroke="#008b62" stroke-width="4" />\n    </g>\n    <g id="station-19">\n      <circle cx="680" cy="720" r="9" fill="white" stroke="#152b53" stroke-width="2.5" />\n    </g>\n    <g id="station-20">\n      <path d="M760 640l9 9" fill="none" stroke="#008b62" stroke-width="4" />\n    </g>\n    <g id="station-21">\n      <circle cx="1060" cy="500" r="9" fill="white" stroke="#152b53" stroke-width="2.5" />\n    </g>\n    <g id="station-22">\n      <path d="M1270 500l0 -12" fill="none" stroke="#008b62" stroke-width="4" />\n    </g>\n    <g id="station-23">\n      <path d="M700 260l0 -12" fill="none" stroke="#f2c900" stroke-width="4" />\n    </g>\n    <g id="station-24">\n      <path d="M875 260l0 -12" fill="none" stroke="#f2c900" stroke-width="4" />\n    </g>\n    <g id="station-25">\n      <path d="M1010 330l9 -9" fill="none" stroke="#f2c900" stroke-width="4" />\n    </g>\n    <g id="station-26">\n      <path d="M1060 405l12 0" fill="none" stroke="#f2c900" stroke-width="4" />\n    </g>\n    <g id="station-27">\n      <path d="M935 720l0 12" fill="none" stroke="#f2c900" stroke-width="4" />\n    </g>\n    <g id="station-28">\n      <path d="M580 350l12 0" fill="none" stroke="#f2c900" stroke-width="4" />\n    </g>\n    <g id="station-29">\n      <circle cx="130" cy="190" r="9" fill="white" stroke="#152b53" stroke-width="2.5" />\n    </g>\n    <g id="station-30">\n      <path d="M130 310l12 0" fill="none" stroke="#a66a32" stroke-width="4" />\n    </g>\n    <g id="station-31">\n      <path d="M130 580l12 0" fill="none" stroke="#a66a32" stroke-width="4" />\n    </g>\n    <g id="station-32">\n      <path d="M390 860l0 12" fill="none" stroke="#a66a32" stroke-width="4" />\n    </g>\n    <g id="station-33">\n      <path d="M730 920l0 12" fill="none" stroke="#a66a32" stroke-width="4" />\n    </g>\n    <g id="station-34">\n      <path d="M1240 920l0 12" fill="none" stroke="#a66a32" stroke-width="4" />\n    </g>\n    <g id="station-35">\n      <path d="M520 190l0 -12" fill="none" stroke="#9b0058" stroke-width="4" />\n    </g>\n    <g id="station-36">\n      <path d="M790 190l0 -12" fill="none" stroke="#9b0058" stroke-width="4" />\n    </g>\n    <g id="station-37">\n      <path d="M1100 190l0 -12" fill="none" stroke="#9b0058" stroke-width="4" />\n    </g>\n    <g id="station-38">\n      <path d="M1260 320l9 -9" fill="none" stroke="#9b0058" stroke-width="4" />\n    </g>\n    <g id="station-39">\n      <path d="M1340 430l-12 0" fill="none" stroke="#9b0058" stroke-width="4" />\n    </g>\n    <g id="station-40">\n      <path d="M1340 650l-12 0" fill="none" stroke="#9b0058" stroke-width="4" />\n    </g>\n    <g id="station-41">\n      <path d="M1100 850l0 12" fill="none" stroke="#9b0058" stroke-width="4" />\n    </g>\n    <g id="station-42">\n      <path d="M920 850l0 12" fill="none" stroke="#9b0058" stroke-width="4" />\n    </g>\n    <g id="station-43">\n      <path d="M580 540l12 0" fill="none" stroke="#f2c900" stroke-width="4" />\n    </g>\n    <g id="station-44">\n      <circle cx="1100" cy="735" r="9" fill="white" stroke="#152b53" stroke-width="2.5" />\n    </g>\n  </g>\n  <g id="Legend-shapes">\n    <path d="M64 986H1376" stroke="#d6dce5" stroke-width="1" />\n    <path d="M64 1015h48" stroke="#df2525" stroke-width="8" />\n    <path d="M379 1015h48" stroke="#143e99" stroke-width="8" />\n    <path d="M694 1015h48" stroke="#008b62" stroke-width="8" />\n    <path d="M64 1054h48" stroke="#f2c900" stroke-width="8" />\n    <path d="M379 1054h48" stroke="#9b0058" stroke-width="8" />\n    <path d="M694 1054h48" stroke="#a66a32" stroke-width="8" />\n    <circle cx="1140" cy="1015" r="8" fill="white" stroke="#152b53" stroke-width="2.5" />\n  </g>\n  <g id="Header">\n    <text id="title" x="64" y="84" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="40" font-weight="700" text-anchor="start" fill="#152b53">Local Tube Map</text>\n    <text id="subtitle" x="65" y="119" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="17" font-weight="400" text-anchor="start" fill="#152b53">夜间出行线路图 / Night travel information</text>\n    <text id="reference" x="1376" y="81" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="19" font-weight="700" text-anchor="end" fill="#152b53">Transport for local</text>\n    <text id="map-scope" x="1376" y="113" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="16" font-weight="400" text-anchor="end" fill="#152b53">Zones 1–3 / 票价分区</text>\n  </g>\n  <g id="Zone-labels">\n    <text id="zone-1" x="855" y="415" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="58" font-weight="700" text-anchor="middle" fill="#bac2cc">1</text>\n    <text id="zone-word-1" x="855" y="436" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="12" font-weight="400" text-anchor="middle" fill="#8793a4">ZONE</text>\n    <text id="zone-2" x="370" y="620" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="58" font-weight="700" text-anchor="middle" fill="#bac2cc">2</text>\n    <text id="zone-word-2" x="370" y="641" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="12" font-weight="400" text-anchor="middle" fill="#8793a4">ZONE</text>\n    <text id="zone-3" x="1352" y="248" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="58" font-weight="700" text-anchor="middle" fill="#bac2cc">3</text>\n    <text id="zone-word-3" x="1352" y="269" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="12" font-weight="400" text-anchor="middle" fill="#8793a4">ZONE</text>\n  </g>\n  <g id="Geography">\n    <text id="river-name" x="1350" y="818" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="15" font-weight="400" text-anchor="middle" fill="#79a8ba">River Times</text>\n  </g>\n  <g id="Station-labels">\n    <g id="label-01">\n      <text x="153" y="354" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="19" font-weight="500" text-anchor="start" fill="#152b53">奥德维克</text>\n      <text x="153" y="373" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="15" text-anchor="start" fill="#314667">Alderwick</text>\n    </g>\n    <g id="label-02">\n      <text x="220" y="438" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="19" font-weight="500" text-anchor="middle" fill="#152b53">贝尔维克路</text>\n      <text x="220" y="457" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="15" text-anchor="middle" fill="#314667">Bellwick Road</text>\n    </g>\n    <g id="label-04">\n      <text x="455" y="350" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="19" font-weight="500" text-anchor="middle" fill="#152b53">莫罗街</text>\n      <text x="455" y="369" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="15" text-anchor="middle" fill="#314667">Morrow Street</text>\n    </g>\n    <g id="label-05">\n      <text x="608" y="425" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="19" font-weight="500" text-anchor="start" fill="#152b53">博物馆花园</text>\n      <text x="608" y="444" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="15" text-anchor="start" fill="#314667">Museum Gardens</text>\n    </g>\n    <g id="label-06">\n      <text x="727" y="604" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="19" font-weight="500" text-anchor="middle" fill="#152b53">斯蒂尔韦尔</text>\n      <text x="727" y="623" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="15" text-anchor="middle" fill="#314667">Stillwell</text>\n    </g>\n    <g id="label-07">\n      <text x="836" y="517" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="19" font-weight="500" text-anchor="end" fill="#152b53">牛津庭院</text>\n      <text x="836" y="536" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="15" text-anchor="end" fill="#314667">Oxford Yard</text>\n    </g>\n    <g id="label-08">\n      <text x="1045" y="586" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="19" font-weight="500" text-anchor="end" fill="#152b53">钱瑟里巷</text>\n      <text x="1045" y="605" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="15" text-anchor="end" fill="#314667">Chancery Lane</text>\n    </g>\n    <g id="label-09">\n      <text x="1170" y="604" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="19" font-weight="500" text-anchor="middle" fill="#152b53">东码头</text>\n      <text x="1170" y="623" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="15" text-anchor="middle" fill="#314667">East Quay</text>\n    </g>\n    <g id="label-10">\n      <text x="1270" y="528" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="19" font-weight="500" text-anchor="end" fill="#152b53">雷恩福德</text>\n      <text x="1270" y="547" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="15" text-anchor="end" fill="#314667">Wrenford</text>\n    </g>\n    <g id="label-11">\n      <text x="343" y="153" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="19" font-weight="500" text-anchor="start" fill="#152b53">北沼</text>\n      <text x="343" y="172" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="15" text-anchor="start" fill="#314667">Northmere</text>\n    </g>\n    <g id="label-12">\n      <text x="298" y="267" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="19" font-weight="500" text-anchor="end" fill="#152b53">圣安德鲁教堂</text>\n      <text x="298" y="286" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="15" text-anchor="end" fill="#314667">St. Andrew’s Church</text>\n    </g>\n    <g id="label-13">\n      <text x="398" y="512" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="19" font-weight="500" text-anchor="end" fill="#152b53">礼拜堂街</text>\n      <text x="398" y="531" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="15" text-anchor="end" fill="#314667">Chapel Row</text>\n    </g>\n    <g id="label-14">\n      <text x="514" y="640" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="19" font-weight="500" text-anchor="end" fill="#152b53">阿什科姆公园</text>\n      <text x="514" y="659" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="15" text-anchor="end" fill="#314667">Ashcombe Park</text>\n    </g>\n    <g id="label-15">\n      <text x="515" y="796" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="19" font-weight="500" text-anchor="end" fill="#152b53">林登巷</text>\n      <text x="515" y="815" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="15" text-anchor="end" fill="#314667">Linden Close</text>\n    </g>\n    <g id="label-16">\n      <text x="565" y="820" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="19" font-weight="500" text-anchor="start" fill="#152b53">南沼</text>\n      <text x="565" y="839" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="15" text-anchor="start" fill="#314667">Southmere</text>\n    </g>\n    <g id="label-17">\n      <text x="117" y="796" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="19" font-weight="500" text-anchor="middle" fill="#152b53">西拱廊</text>\n      <text x="117" y="815" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="15" text-anchor="middle" fill="#314667">West Arcade</text>\n    </g>\n    <g id="label-18">\n      <text x="315" y="714" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="19" font-weight="500" text-anchor="middle" fill="#152b53">荆棘花园</text>\n      <text x="315" y="733" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="15" text-anchor="middle" fill="#314667">Briar Gardens</text>\n    </g>\n    <g id="label-19">\n      <text x="700" y="754" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="19" font-weight="500" text-anchor="start" fill="#152b53">边界路</text>\n      <text x="700" y="773" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="15" text-anchor="start" fill="#314667">Boundary Road</text>\n    </g>\n    <g id="label-20">\n      <text x="786" y="660" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="19" font-weight="500" text-anchor="start" fill="#152b53">哈罗米尔</text>\n      <text x="786" y="679" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="15" text-anchor="start" fill="#314667">Harrowmere</text>\n    </g>\n    <g id="label-21">\n      <text x="1047" y="524" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="19" font-weight="500" text-anchor="end" fill="#152b53">皇冠通道</text>\n      <text x="1047" y="543" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="15" text-anchor="end" fill="#314667">Crown Passage</text>\n    </g>\n    <g id="label-22">\n      <text x="1270" y="455" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="19" font-weight="500" text-anchor="middle" fill="#152b53">东门</text>\n      <text x="1270" y="474" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="15" text-anchor="middle" fill="#314667">Eastgate</text>\n    </g>\n    <g id="label-23">\n      <text x="700" y="214" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="19" font-weight="500" text-anchor="middle" fill="#152b53">惠特科姆广场</text>\n      <text x="700" y="233" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="15" text-anchor="middle" fill="#314667">Whitcombe Square</text>\n    </g>\n    <g id="label-24">\n      <text x="875" y="214" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="19" font-weight="500" text-anchor="middle" fill="#152b53">国王井</text>\n      <text x="875" y="233" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="15" text-anchor="middle" fill="#314667">Kingswell</text>\n    </g>\n    <g id="label-25">\n      <text x="1034" y="306" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="19" font-weight="500" text-anchor="start" fill="#152b53">雪松丘</text>\n      <text x="1034" y="325" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="15" text-anchor="start" fill="#314667">Cedar Hill</text>\n    </g>\n    <g id="label-26">\n      <text x="1084" y="400" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="19" font-weight="500" text-anchor="start" fill="#152b53">旧铸造厂</text>\n      <text x="1084" y="419" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="15" text-anchor="start" fill="#314667">Old Foundry</text>\n    </g>\n    <g id="label-27">\n      <text x="935" y="755" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="19" font-weight="500" text-anchor="middle" fill="#152b53">马洛庭院</text>\n      <text x="935" y="774" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="15" text-anchor="middle" fill="#314667">Marlowe Court</text>\n    </g>\n    <g id="label-28">\n      <text x="604" y="344" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="19" font-weight="500" text-anchor="start" fill="#152b53">雷恩街</text>\n      <text x="604" y="363" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="15" text-anchor="start" fill="#314667">Wren Street</text>\n    </g>\n    <g id="label-29">\n      <text x="106" y="155" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="19" font-weight="500" text-anchor="middle" fill="#152b53">西沼</text>\n      <text x="106" y="174" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="15" text-anchor="middle" fill="#314667">Westmere</text>\n    </g>\n    <g id="label-30">\n      <text x="154" y="317" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="19" font-weight="500" text-anchor="start" fill="#152b53">榆树桥</text>\n      <text x="154" y="336" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="15" text-anchor="start" fill="#314667">Elmbridge</text>\n    </g>\n    <g id="label-31">\n      <text x="154" y="575" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="19" font-weight="500" text-anchor="start" fill="#152b53">集市阶梯</text>\n      <text x="154" y="594" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="15" text-anchor="start" fill="#314667">Market Steps</text>\n    </g>\n    <g id="label-32">\n      <text x="390" y="889" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="19" font-weight="500" text-anchor="middle" fill="#152b53">南巷</text>\n      <text x="390" y="908" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="15" text-anchor="middle" fill="#314667">South Lane</text>\n    </g>\n    <g id="label-33">\n      <text x="730" y="950" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="19" font-weight="500" text-anchor="middle" fill="#152b53">桦树林</text>\n      <text x="730" y="969" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="15" text-anchor="middle" fill="#314667">Birchfield</text>\n    </g>\n    <g id="label-34">\n      <text x="1240" y="950" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="19" font-weight="500" text-anchor="middle" fill="#152b53">东泽</text>\n      <text x="1240" y="969" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="15" text-anchor="middle" fill="#314667">East Marsh</text>\n    </g>\n    <g id="label-35">\n      <text x="520" y="151" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="19" font-weight="500" text-anchor="middle" fill="#152b53">新月路</text>\n      <text x="520" y="170" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="15" text-anchor="middle" fill="#314667">Crescent Road</text>\n    </g>\n    <g id="label-36">\n      <text x="790" y="151" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="19" font-weight="500" text-anchor="middle" fill="#152b53">橡树原</text>\n      <text x="790" y="170" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="15" text-anchor="middle" fill="#314667">Oakfield</text>\n    </g>\n    <g id="label-37">\n      <text x="1100" y="151" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="19" font-weight="500" text-anchor="middle" fill="#152b53">白垩巷</text>\n      <text x="1100" y="170" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="15" text-anchor="middle" fill="#314667">Chalk Lane</text>\n    </g>\n    <g id="label-38">\n      <text x="1284" y="293" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="19" font-weight="500" text-anchor="start" fill="#152b53">运河桥</text>\n      <text x="1284" y="312" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="15" text-anchor="start" fill="#314667">Canal Bridge</text>\n    </g>\n    <g id="label-39">\n      <text x="1316" y="405" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="19" font-weight="500" text-anchor="end" fill="#152b53">坎宁河段</text>\n      <text x="1316" y="424" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="15" text-anchor="end" fill="#314667">Canning Reach</text>\n    </g>\n    <g id="label-40">\n      <text x="1316" y="657" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="19" font-weight="500" text-anchor="end" fill="#152b53">船坞巷</text>\n      <text x="1316" y="676" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="15" text-anchor="end" fill="#314667">Dock Lane</text>\n    </g>\n    <g id="label-41">\n      <text x="1100" y="887" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="19" font-weight="500" text-anchor="middle" fill="#152b53">芦苇镇</text>\n      <text x="1100" y="906" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="15" text-anchor="middle" fill="#314667">Reedham</text>\n    </g>\n    <g id="label-42">\n      <text x="895" y="850" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="19" font-weight="500" text-anchor="end" fill="#152b53">三一码头</text>\n      <text x="895" y="869" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="15" text-anchor="end" fill="#314667">Trinity Wharf</text>\n    </g>\n    <g id="label-43">\n      <text x="605" y="565" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="19" font-weight="500" text-anchor="start" fill="#152b53">雷恩街</text>\n      <text x="605" y="584" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="15" text-anchor="start" fill="#314667">Wren Street</text>\n    </g>\n    <g id="label-44">\n      <text x="1117" y="743" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="19" font-weight="500" text-anchor="start" fill="#152b53">???</text>\n    </g>\n  </g>\n  <g id="Legend">\n    <text id="legend-A" x="128" y="1022" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="18" font-weight="400" text-anchor="start" fill="#152b53">阿尔德线 / Alder</text>\n    <text id="legend-B" x="443" y="1022" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="18" font-weight="400" text-anchor="start" fill="#152b53">沼泽线 / Mere</text>\n    <text id="legend-C" x="758" y="1022" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="18" font-weight="400" text-anchor="start" fill="#152b53">铸造厂线 / Foundry</text>\n    <text id="legend-D" x="128" y="1061" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="18" font-weight="400" text-anchor="start" fill="#152b53">皇冠线 / Crown</text>\n    <text id="legend-E" x="443" y="1061" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="18" font-weight="400" text-anchor="start" fill="#152b53">芦苇线 / Reed</text>\n    <text id="legend-F" x="758" y="1061" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="18" font-weight="400" text-anchor="start" fill="#152b53">西岸线 / Westbank</text>\n    <text id="interchange" x="1160" y="1022" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="17" font-weight="400" text-anchor="start" fill="#152b53">换乘站 / Interchange</text>\n  </g>\n  <g id="Footer">\n    <text id="footer" x="64" y="1084" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="13" font-weight="400" text-anchor="start" fill="#64738b">Underground network 3028. Correct at time going to print</text>\n    <text id="edition" x="1376" y="1084" font-family="Arial, Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-size="13" font-weight="400" text-anchor="end" fill="#64738b">Edition 02</text>\n  </g>\n</svg>';

  // journey/safety-data.js
  var safetyHTML = '<div class="mobile-safety">\n    <div class="breadcrumbs"><span data-zh="首页 / 出行提示 / 夜间出行" data-en="Home / Travel advice / After dark">首页 / 出行提示 / 夜间出行</span></div>\n    <div class="layout">\n      <article>\n        <header class="document-heading"><p class="doc-code" data-zh="乘 客 安 全 公 告 / 008" data-en="PASSENGER SAFETY NOTICE / 008">乘 客 安 全 公 告 / 008</p><h1 data-zh="伦敦地铁个人安全提示" data-en="Personal safety on the London Underground">伦敦地铁个人安全提示</h1><p class="subtitle" data-zh="（夜间出行补充规定）" data-en="Supplementary regulations for night travel">（夜间出行补充规定）</p><div class="meta"><span data-zh="发布单位：夜间出行信息处" data-en="Issued by: Night Travel Information Office">发布单位：夜间出行信息处</span><span data-zh="适用时段：天黑后至抵达住所" data-en="Valid: from nightfall until you arrive home">适用时段：天黑后至抵达住所</span></div></header>\n        <div class="preface"><p data-zh="为保障您在伦敦期间的出行安全，请在进入车站前仔细阅读以下提示，并在整个行程中遵守。" data-en="For your safety while travelling in London, please read the following advice before entering the station and observe it throughout your journey.">为保障您在伦敦期间的出行安全，请在进入车站前仔细阅读以下提示，并在整个行程中遵守。</p></div>\n<section class="background" id="background"><h2><span data-zh="背景" data-en="Background">背景</span></h2><p data-zh="欢迎乘坐伦敦地铁。" data-en="Welcome to the London Underground.">欢迎乘坐伦敦地铁。</p><p data-zh="伦敦地铁拥有悠久的历史，自 1863 年开通以来，至今已经运行超过 160 年。它连接城市的各个区域，每天承载大量乘客往返于工作、住所和其他目的地之间。" data-en="The London Underground has a long history. Since opening in 1863, it has operated for more than 160 years. It connects districts across the city, carrying large numbers of passengers between work, home and other destinations each day.">伦敦地铁拥有悠久的历史，自 1863 年开通以来，至今已经运行超过 160 年。它连接城市的各个区域，每天承载大量乘客往返于工作、住所和其他目的地之间。</p><p data-zh="本安全提示旨在帮助您了解夜间乘车安排。请根据行程需要，阅读以下出行准备、乘车须知及补充说明。" data-en="This notice provides guidance for night travel. Please read the preparation advice, travel instructions and supplementary information relevant to your journey.">本安全提示旨在帮助您了解夜间乘车安排。请根据行程需要，阅读以下出行准备、乘车须知及补充说明。</p><ol class="background-points"><li data-zh="出发前，请确认目的地、换乘安排及末班车信息。" data-en="Before departure, check your destination, interchange arrangements and last service information.">出发前，请确认目的地、换乘安排及末班车信息。</li><li data-zh="请为站内步行及换乘预留时间，并妥善保管随身物品。" data-en="Allow time for walking within stations and changing trains. Keep your belongings secure.">请为站内步行及换乘预留时间，并妥善保管随身物品。</li><li data-zh="本提示可帮助你熟悉周围的环境，做出关于安全的正确判断。" data-en="This notice can help you become familiar with your surroundings and make sound decisions about your safety.">本提示可帮助你熟悉周围的环境，做出关于安全的正确判断。</li></ol></section><section id="general" aria-labelledby="general-title"><h2 id="general-title"><span>01 — 08</span><span data-zh="一、出行准备与一般安全" data-en="I. Preparation and general safety">一、出行准备与一般安全</span></h2><ol class="rules" start="1"><li id="rule-1"><span class="rule-number">01</span><div><p data-zh="天黑后，请尽量与朋友结伴而行，并提前约定同行及会合安排。" data-en="After dark, travel with friends where possible and agree on your plans and meeting points in advance.">天黑后，请尽量与朋友结伴而行，并提前约定同行及会合安排。</p></div></li><li id="rule-2"><span class="rule-number">02</span><div><p data-zh="行走时请保持自信。即使您已迷路，也应表现出对周围环境十分熟悉的样子。" data-en="Walk with confidence. Even if you are lost, behave as though you are very familiar with your surroundings.">行走时请保持自信。即使您已迷路，也应表现出对周围环境十分熟悉的样子。</p></div></li><li id="rule-3"><span class="rule-number">03</span><div><p data-zh="请随身携带能够辨认您身份的物品，例如附有照片的证件、工作证或学生证，并妥善保管。" data-en="Carry an item that identifies you, such as photo identification, a staff pass or a student card, and keep it safe.">请随身携带能够辨认您身份的物品，例如附有照片的证件、工作证或学生证，并妥善保管。</p></div></li><li id="rule-4"><span class="rule-number">04</span><div><p data-zh="请在出发前确认家门钥匙随身携带，并在整个行程中自行保管。请勿将钥匙与写有完整住址的纸条放在一起。" data-en="Before leaving, check that you have your house key and keep it with you throughout your journey. Do not keep it together with a note bearing your full home address.">请在出发前确认家门钥匙随身携带，并在整个行程中自行保管。请勿将钥匙与写有完整住址的纸条放在一起。</p></div></li><li id="rule-5"><span class="rule-number">05</span><div><p data-zh="请在进站前记录出发站、原定换乘站及预计乘车时间。建议保留一份纸质记录，以便手机无法使用时查阅。" data-en="Before entering the station, record your departure station, planned interchanges and expected journey time. Keep a paper copy to consult if your phone is unavailable.">请在进站前记录出发站、原定换乘站及预计乘车时间。建议保留一份纸质记录，以便手机无法使用时查阅。</p></div></li><li id="rule-6"><span class="rule-number">06</span><div><p data-zh="乘坐扶梯时，请靠右站立，为左侧通行的乘客让路。请妥善放置行李，勿阻挡通行。" data-en="On escalators, stand on the right and leave the left clear for passengers walking past. Keep luggage clear of the passage.">乘坐扶梯时，请靠右站立，为左侧通行的乘客让路。请妥善放置行李，勿阻挡通行。</p></div></li><li id="rule-7"><span class="rule-number">07</span><div><p data-zh="请提前熟悉途经的车站，并留意车站关闭及线路调整信息。乘车前，请核对列车的目的地。" data-en="Familiarise yourself with the stations on your route and check for station closures and service changes. Confirm the destination before boarding.">请提前熟悉途经的车站，并留意车站关闭及线路调整信息。乘车前，请核对列车的目的地。</p></div></li><li id="rule-8"><span class="rule-number">08</span><div><p data-zh="列车在隧道内临时停车属于正常情况，请留在车厢内等待，并留意车内广播。" data-en="It is normal for trains to stop temporarily in tunnels. Remain in the carriage, wait and listen for onboard announcements.">列车在隧道内临时停车属于正常情况，请留在车厢内等待，并留意车内广播。</p></div></li></ol></section>\n<section id="rail" aria-labelledby="rail-title"><h2 id="rail-title"><span>09 — 13</span><span data-zh="二、夜间出行补充提示" data-en="II. Supplementary night travel advice">二、夜间出行补充提示</span></h2><ol class="rules" start="9"><li id="rule-9"><span class="rule-number">09</span><div><p data-zh="天黑后，请与朋友结伴而行。" data-en="After dark, please travel with friends.">天黑后，请与朋友结伴而行。</p><p class="emphasis" data-zh="请确认他们是您认识的人。" data-en="Please confirm that they are people you know.">请确认他们是您认识的人。</p></div></li><li id="rule-10"><span class="rule-number">10</span><div><p data-zh="如遇行为异常的人，请不要表现出您已经注意到他们。保持原有活动，不要注视，不要回应，并逐渐远离。" data-en="If you encounter anyone behaving unusually, do not let them see that you have noticed. Continue what you were doing. Do not stare or respond. Move away gradually.">如遇行为异常的人，请不要表现出您已经注意到他们。保持原有活动，不要注视，不要回应，并逐渐远离。</p></div></li><li id="rule-11"><span class="rule-number">11</span><div><p data-zh="伦敦地铁共有 11 条主要线路。如果您在地图上发现不存在的线路，请不要评论或拍照，不要向工作人员询问，并立即离开本站。" data-en="The London Underground has 11 main lines. If you find a line on the map that does not exist, do not comment or take photographs. Do not ask a member of staff. Leave the station immediately.">伦敦地铁共有 11 条主要线路。如果您在地图上发现不存在的线路，请不要评论或拍照，不要向工作人员询问，并立即离开本站。</p></div></li><li id="rule-12"><span class="rule-number">12</span><div><p data-zh="请记住返回住所所需的大致乘车时间。若地图显示的乘车时间明显缩短，请立即关闭地图，远离其指定的乘车地点。" data-en="Remember approximately how long the journey home should take. If the map shows a significantly shorter journey, close it immediately and move away from the boarding location it indicates.">请记住返回住所所需的大致乘车时间。若地图显示的乘车时间明显缩短，请立即关闭地图，远离其指定的乘车地点。</p><p data-zh="若您随后觉得新的乘车时间似乎一直如此，请以进站前的记录为准。请勿修改原有记录。" data-en="If you subsequently feel that the new journey time has always been correct, refer to your pre-entry record. Do not amend that record.">若您随后觉得新的乘车时间似乎一直如此，请以进站前的记录为准。请勿修改原有记录。</p></div></li><li id="rule-13"><span class="rule-number">13</span><div><p data-zh="最后一班列车通常会显示 Last Train。" data-en="The last service will usually be displayed as Last Train.">最后一班列车通常会显示 Last Train。</p><p class="emphasis" data-zh="如果电子屏显示的是 Final Train，请勿上车。" data-en="If the display reads Final Train, do not board.">如果电子屏显示的是 Final Train，请勿上车。</p></div></li></ol></section>\n<section id="journey" aria-labelledby="journey-title"><h2 id="journey-title"><span>14 — 26</span><span data-zh="三、站内及乘车须知" data-en="III. At the station and on board">三、站内及乘车须知</span></h2><ol class="rules" start="14"><li id="rule-14"><span class="rule-number">14</span><div><p data-zh="请注意：人有两只眼睛、一个鼻子、一张嘴，两条胳膊和两条腿，左右手各有五根手指。" data-en="Please note: a person has two eyes, one nose, one mouth, two arms and two legs, with five fingers on each hand.">请注意：人有两只眼睛、一个鼻子、一张嘴，两条胳膊和两条腿，左右手各有五根手指。</p></div></li><li id="rule-15" class="staff-rule"><span class="rule-number">15</span><div><p data-zh="站台通常没有工作人员。若有疑似工作人员的人员主动接近您，请不要相信" data-en="Staff are not usually present on the platform. If someone who appears to be a member of staff approaches you, do not trust">站台通常没有工作人员。若有疑似工作人员的人员主动接近您，请不要相信</p><span>。</span><p id="staff-note" class="staff-note" hidden data-zh="即使他们知道您的名字。" data-en="Even if they know your name.">即使他们知道您的名字。</p></div></li><li id="rule-16"><span class="rule-number">16</span><div><p data-zh="乘坐扶梯时，请靠右站立，为左侧通行的乘客让路。如果您听到身后有人要求让路，而您已经站在右侧，请保持原位，不要回头确认。" data-en="On escalators, stand on the right and leave the left clear. If someone behind you asks you to move aside when you are already on the right, remain where you are. Do not turn around to check.">乘坐扶梯时，请靠右站立，为左侧通行的乘客让路。如果您听到身后有人要求让路，而您已经站在右侧，请保持原位，不要回头确认。</p></div></li><li id="rule-17"><span class="rule-number">17</span><div><p data-zh="如广播通知本站关闭，请按出口标识离站。若出口标识将您引向更深的地下，请停在最近一扇尚未通过的门前。" data-en="If an announcement states that the station is closing, follow the exit signs. If they lead you deeper underground, stop before the nearest door you have not yet passed through.">如广播通知本站关闭，请按出口标识离站。若出口标识将您引向更深的地下，请停在最近一扇尚未通过的门前。</p><p data-zh="请勿仅因您刚刚经过某扇门，就认定其另一侧仍是原来的地方。返回前，请通过门上的观察窗确认。" data-en="Do not assume that a door still leads to the same place simply because you have just passed through it. Before returning, check through its observation window.">请勿仅因您刚刚经过某扇门，就认定其另一侧仍是原来的地方。返回前，请通过门上的观察窗确认。</p><p data-zh="如观察窗内能够看到您目前所在的位置，请勿开门。" data-en="If the observation window shows the place where you are currently standing, do not open the door.">如观察窗内能够看到您目前所在的位置，请勿开门。</p></div></li><li id="rule-18"><span class="rule-number">18</span><div><p data-zh="车窗可能映出对面乘客的倒影。请勿通过倒影确认车厢内的人数。如您已经发现人数不符，请勿再用其他方式核对。" data-en="The windows may reflect the passengers opposite you. Do not use these reflections to count the people in the carriage. If you have already noticed a discrepancy, do not check the number by any other means.">车窗可能映出对面乘客的倒影。请勿通过倒影确认车厢内的人数。如您已经发现人数不符，请勿再用其他方式核对。</p></div></li><li id="rule-19"><span class="rule-number">19</span><div><p data-zh="如您无法确认同行人员的身份，请与其核对一件进站前共同经历的小事。请勿在提问时提供答案。" data-en="If you cannot establish the identity of a companion, ask about a small event you experienced together before entering the station. Do not supply the answer in your question.">如您无法确认同行人员的身份，请与其核对一件进站前共同经历的小事。请勿在提问时提供答案。</p><p data-zh="若对方的回答与您记得的不符，请暂时保持距离。若对方要求您先听完“正确的经过”，请不要继续交谈。" data-en="If their answer differs from your recollection, keep your distance for now. If they ask you to hear the “correct version of events” first, do not continue the conversation.">若对方的回答与您记得的不符，请暂时保持距离。若对方要求您先听完“正确的经过”，请不要继续交谈。</p></div></li><li id="rule-20"><span class="rule-number">20</span><div><p data-zh="列车到站后，如您的朋友表示“我们刚才已经来过这里”，请与其共同下车。如有两位朋友说出完全相同的话，请独自下车。" data-en="If a friend says “We were just here” when the train arrives, leave the train together. If two friends say exactly the same words, leave the train alone.">列车到站后，如您的朋友表示“我们刚才已经来过这里”，请与其共同下车。如有两位朋友说出完全相同的话，请独自下车。</p></div></li><li id="rule-21"><span class="rule-number">21</span><div><p data-zh="请勿让同行人员落单。如果同行人员在车门关闭后仍留在站台，请在下一站下车等候，不要乘坐反方向列车寻找。若他们已经在下一站等候，请勿下车。" data-en="Do not leave anyone in your party behind. If they remain on the platform after the doors close, get off at the next station and wait. Do not take a train in the opposite direction to look for them. If they are already waiting at the next station, do not get off.">请勿让同行人员落单。如果同行人员在车门关闭后仍留在站台，请在下一站下车等候，不要乘坐反方向列车寻找。若他们已经在下一站等候，请勿下车。</p></div></li><li id="rule-22"><span class="rule-number">22</span><div><p data-zh="如下一站与上一站名称相同，请暂勿下车，并核对站台上的物品及候车人员。若长椅上遗留的物品、候车人员的位置及姿势均与上一站一致，请继续乘车。" data-en="If the next station has the same name as the previous one, stay on board and check the objects and people on the platform. If the items left on the bench and the positions and postures of the waiting passengers are identical, remain on the train.">如下一站与上一站名称相同，请暂勿下车，并核对站台上的物品及候车人员。若长椅上遗留的物品、候车人员的位置及姿势均与上一站一致，请继续乘车。</p><p data-zh="不要向站台上的人示意，即使您已经认出其中某位乘客刚刚与您一同上车。" data-en="Do not signal to anyone on the platform, even if you recognise someone who has just boarded the train with you.">不要向站台上的人示意，即使您已经认出其中某位乘客刚刚与您一同上车。</p></div></li><li id="rule-23"><span class="rule-number">23</span><div><p data-zh="如列车连续第三次停靠同名车站，请在本次停车时下车。本站不提供第四次停车服务。" data-en="If the train stops at a station with the same name for the third consecutive time, get off at this stop. This station does not provide a fourth stop.">如列车连续第三次停靠同名车站，请在本次停车时下车。本站不提供第四次停车服务。</p><p data-zh="下车后，请勿查看长椅上遗留的物品，也不要核对候车人员。" data-en="After leaving the train, do not inspect the items left on the bench or check the waiting passengers.">下车后，请勿查看长椅上遗留的物品，也不要核对候车人员。</p></div></li><li id="rule-24"><span class="rule-number">24</span><div><p data-zh="请提前熟悉途经的车站。若列车在两座相邻车站之间停靠额外的站台，请留在车内。该站台可能具备完整的站名标识、照明及候车人员，这不代表本站对外开放。" data-en="Familiarise yourself with the stations on your route. If the train stops at an additional platform between two adjacent stations, remain on board. The platform may have complete station signage, lighting and waiting passengers. This does not mean that the station is open to the public.">请提前熟悉途经的车站。若列车在两座相邻车站之间停靠额外的站台，请留在车内。该站台可能具备完整的站名标识、照明及候车人员，这不代表本站对外开放。</p></div></li><li id="rule-25"><span class="rule-number">25</span><div><p data-zh="经过上述站台时，广播可能播报“本站不停靠”。即使列车已经停稳、车门已经打开，请仍以广播为准。" data-en="At such a platform, an announcement may state “This train does not stop here.” Follow that announcement even if the train has stopped and the doors are open.">经过上述站台时，广播可能播报“本站不停靠”。即使列车已经停稳、车门已经打开，请仍以广播为准。</p><p data-zh="若站台广播随后要求您下车，请注意：您应听从的是车内广播。" data-en="If a platform announcement then instructs you to leave the train, remember: you should follow the announcement inside the carriage.">若站台广播随后要求您下车，请注意：您应听从的是车内广播。</p></div></li><li id="rule-26"><span class="rule-number">26</span><div><p data-zh="如车内广播与站台广播开始使用同一个声音，请停止分辨声音来源。车门关闭前，请勿回应任何叫出您姓名的乘客。" data-en="If the carriage and platform announcements begin using the same voice, stop trying to distinguish their sources. Until the doors close, do not respond to any passenger who calls your name.">如车内广播与站台广播开始使用同一个声音，请停止分辨声音来源。车门关闭前，请勿回应任何叫出您姓名的乘客。</p></div></li></ol></section>\n<section id="home" aria-labelledby="home-title"><h2 id="home-title"><span>27 — 28</span><span data-zh="四、离站及抵达住所" data-en="IV. Leaving the station and arriving home">四、离站及抵达住所</span></h2><ol class="rules" start="27"><li id="rule-27"><span class="rule-number">27</span><div><p data-zh="夜间工作人员可能询问您的目的地。您只需提供站名，不必提供住址。若对方准确说出您的门牌号，请告知其地址有误，即使并没有错。" data-en="Night staff may ask your destination. Provide only the station name, not your home address. If they correctly state your house number, tell them the address is wrong, even if it is not.">夜间工作人员可能询问您的目的地。您只需提供站名，不必提供住址。若对方准确说出您的门牌号，请告知其地址有误，即使并没有错。</p></div></li><li id="rule-28"><span class="rule-number">28</span><div><p data-zh="抵达住所后，请向同行朋友报平安。如对方回复“你还在我旁边”，请停止回复，锁好房门。" data-en="On arriving home, let the friends you travelled with know you are safe. If a friend replies “You are still beside me”, stop replying and lock your door.">抵达住所后，请向同行朋友报平安。如对方回复“你还在我旁边”，请停止回复，锁好房门。</p><p data-zh="今晚不必再向任何人确认您是否已经到家。" data-en="You do not need to ask anyone else whether you have arrived home tonight.">今晚不必再向任何人确认您是否已经到家。</p></div></li></ol></section>\n<div class="signature"><span data-zh="夜间出行信息处" data-en="Night Travel Information Office">夜间出行信息处</span><span data-zh="本提示共 28 条，请以此版本为准。" data-en="This notice contains 28 regulations. Refer to this version only.">本提示共 28 条，请以此版本为准。</span></div><section id="belongings" class="appendix"><h2><span>A</span><span data-zh="附录一：随身物品与行程记录" data-en="Appendix I: Personal belongings and journey records">附录一：随身物品与行程记录</span></h2><p data-zh="请保留出发时随身携带的原物，直至您自行确认到家。站内不提供住所钥匙的核验、更换或代管服务。" data-en="Keep the original belongings you carried at departure until you have confirmed for yourself that you are home. Stations do not provide verification, replacement or safekeeping of house keys.">请保留出发时随身携带的原物，直至您自行确认到家。站内不提供住所钥匙的核验、更换或代管服务。</p><p data-zh="如有工作人员交还一把与您的钥匙完全相同的钥匙，请先检查自己的口袋。若原钥匙仍在，请勿接过另一把。" data-en="If a member of staff returns a key identical to yours, check your own pocket first. If your original key is still there, do not accept the other one.">如有工作人员交还一把与您的钥匙完全相同的钥匙，请先检查自己的口袋。若原钥匙仍在，请勿接过另一把。</p><p data-zh="请以进站前的纸质记录核对最后一个能够确认的车站。电子地图更新后，请勿据此涂改原有站名、站点顺序或乘车时间。" data-en="Use your pre-entry paper record to identify the last station you can confirm. Do not overwrite its station names, order of stops or journey time to match an updated electronic map.">请以进站前的纸质记录核对最后一个能够确认的车站。电子地图更新后，请勿据此涂改原有站名、站点顺序或乘车时间。</p><p data-zh="家门钥匙仅用于核对原有门锁，不指示返程方向。确认到家时，请同时核对门外的街道与相邻建筑。" data-en="Your house key verifies the original lock; it does not indicate the direction home. When confirming your arrival, also check the street outside and the neighbouring buildings.">家门钥匙仅用于核对原有门锁，不指示返程方向。确认到家时，请同时核对门外的街道与相邻建筑。</p></section><section id="return-procedure" class="appendix"><h2><span>B</span><span data-zh="附录二：到达位置无法确认时的处理办法" data-en="Appendix II: When your arrival location cannot be confirmed">附录二：到达位置无法确认时的处理办法</span></h2><p data-zh="本附录适用于出站后仍处于站内、出口连接至其他候车区域，或到达位置与进站前记录明显不符的情况。仅因不熟悉某座车站，不必启动以下程序。" data-en="This appendix applies if leaving the station takes you back inside, exits connect to other waiting areas, or your arrival location clearly conflicts with your pre-entry record. Being unfamiliar with a station alone does not require this procedure.">本附录适用于出站后仍处于站内、出口连接至其他候车区域，或到达位置与进站前记录明显不符的情况。仅因不熟悉某座车站，不必启动以下程序。</p><ol class="procedure"><li data-zh="请暂勿确认抵达，并保留原有车票及进站记录。若手机提示行程已完成，请检查完成时间是否早于您实际下车的时间。请勿删除该记录。" data-en="Do not confirm arrival yet. Keep your original ticket and entry record. If your phone reports the journey complete, check whether its completion time precedes the time you actually left the train. Do not delete that record.">请暂勿确认抵达，并保留原有车票及进站记录。若手机提示行程已完成，请检查完成时间是否早于您实际下车的时间。请勿删除该记录。</li><li data-zh="请记住您离开列车的位置。在确认返回方式前，请勿通过第二道标有“出口”的门。出口标识仅表示您将离开当前区域，不保证其连接地面。" data-en="Remember where you left the train. Until you have established how to return, do not pass through a second door marked “Exit”. An exit sign only indicates departure from the current area; it does not guarantee a connection to the surface.">请记住您离开列车的位置。在确认返回方式前，请勿通过第二道标有“出口”的门。出口标识仅表示您将离开当前区域，不保证其连接地面。</li><li data-zh="如需申请行程协助，请提供最后一个能够确认的车站名称，并选择“返回上一站点”。请勿在当前位置重新填写住所地址。" data-en="To request journey assistance, provide the last station you can confirm and select “Return to previous station”. Do not enter your home address again at your current location.">如需申请行程协助，请提供最后一个能够确认的车站名称，并选择“返回上一站点”。请勿在当前位置重新填写住所地址。</li><li data-zh="系统可能告知您，“重新安排目的地”比“返回上一站点”更快。请保留原申请。等候时间较长，不代表申请未被受理。" data-en="The system may advise that “Reassign destination” is faster than “Return to previous station”. Retain your original request. A longer wait does not mean it has not been accepted.">系统可能告知您，“重新安排目的地”比“返回上一站点”更快。请保留原申请。等候时间较长，不代表申请未被受理。</li><li data-zh="如返回申请要求您先确认本次运输已完成，请停止操作，保留该页面，并返回您离开列车的位置。在原行程结束后，我们将无法继续保证您来自该车站。" data-en="If the return request requires you to confirm completion of the current transport first, stop, retain that page and return to where you left the train. Once the original journey is closed, we can no longer guarantee that you came from that station.">如返回申请要求您先确认本次运输已完成，请停止操作，保留该页面，并返回您离开列车的位置。在原行程结束后，我们将无法继续保证您来自该车站。</li></ol></section><section id="corrections" class="corrections"><div class="correction-heading"><span class="doc-code"><span data-zh="补充通知" data-en="SUPPLEMENTARY NOTICE">补充通知</span></span><h2 data-zh="关于夜间乘车提示部分内容的更正" data-en="Corrections to the night travel notice">关于夜间乘车提示部分内容的更正</h2></div><p data-zh="近期，部分乘客仍在使用旧版安全提示。为避免误解，现更正如下：" data-en="Some passengers are still using an older version of the safety notice. To avoid misunderstanding, the following corrections apply:">近期，部分乘客仍在使用旧版安全提示。为避免误解，现更正如下：</p><div class="amendment"><h3 data-zh="一、关于站台工作人员" data-en="1. Platform staff">一、关于站台工作人员</h3><p data-zh="原第十五条中“请不要相信疑似工作人员”的表述已不再适用。因夜间服务调整，工作人员将主动接近需要帮助的乘客。请勿躲避，以免被误认为尚未接受协助。" data-en="The instruction in Regulation 15 not to trust apparent members of staff no longer applies. Following changes to night services, staff will approach passengers who require assistance. Do not avoid them, as you may be mistaken for someone who has not yet received assistance.">原第十五条中“请不要相信疑似工作人员”的表述已不再适用。因夜间服务调整，工作人员将主动接近需要帮助的乘客。请勿躲避，以免被误认为尚未接受协助。</p></div><div class="amendment"><h3 data-zh="二、关于身份核验" data-en="2. Identity verification">二、关于身份核验</h3><p data-zh="为确保乘客被送回正确的住所，工作人员可能要求您出示随身携带的身份证明。请将附有照片及姓名的一面朝向工作人员，保持清晰可见，直至对方确认已记住您的信息。" data-en="To ensure passengers are returned to the correct address, staff may ask to see your identification. Keep the side bearing your photograph and name facing the member of staff until they confirm they have memorised your details.">为确保乘客被送回正确的住所，工作人员可能要求您出示随身携带的身份证明。请将附有照片及姓名的一面朝向工作人员，保持清晰可见，直至对方确认已记住您的信息。</p><p data-zh="若对方能够准确说出您的姓名及门牌号，说明核验已经完成，无需再次出示证件，请随其离开站台。" data-en="If they can correctly state your name and house number, verification is complete. You need not show your identification again. Follow them off the platform.">若对方能够准确说出您的姓名及门牌号，说明核验已经完成，无需再次出示证件，请随其离开站台。</p><p data-zh="请勿故意提供错误地址。核验完成后，更改目的地将不再影响接返安排。" data-en="Do not deliberately provide an incorrect address. Once verification is complete, changing your destination will no longer affect your return arrangements.">请勿故意提供错误地址。核验完成后，更改目的地将不再影响接返安排。</p></div><div class="amendment"><h3 data-zh="三、关于同行人员" data-en="3. Travelling companions">三、关于同行人员</h3><p data-zh="如同行人员在下一站等候，说明其已由工作人员提前送达。请立即下车与其会合。" data-en="If members of your party are waiting at the next station, staff have already taken them there. Leave the train immediately and join them.">如同行人员在下一站等候，说明其已由工作人员提前送达。请立即下车与其会合。</p><p data-zh="请勿询问其如何先于列车到达。" data-en="Do not ask how they arrived before the train.">请勿询问其如何先于列车到达。</p></div><div class="amendment"><h3 data-zh="四、关于末班车显示" data-en="4. Last service displays">四、关于末班车显示</h3><p data-zh="部分电子屏已将 Last Train 更新为 Final Train，两者含义一致。该列车为当晚最后一班服务，请所有仍在站内的乘客上车。" data-en="Some displays have updated Last Train to Final Train. The terms have the same meaning. This is the final service of the night. All passengers remaining in the station must board.">部分电子屏已将 Last Train 更新为 Final Train，两者含义一致。该列车为当晚最后一班服务，请所有仍在站内的乘客上车。</p></div><div class="amendment"><h3 data-zh="五、关于临时停靠站" data-en="5. Temporary stops">五、关于临时停靠站</h3><p data-zh="夜间临时停靠站可能尚未收录于线路图。如列车在图外站台停车，请全体乘客下车，等待下一班列车。" data-en="Temporary night stops may not yet appear on the map. If the train stops at an unmapped platform, all passengers must leave the train and wait for the next service.">夜间临时停靠站可能尚未收录于线路图。如列车在图外站台停车，请全体乘客下车，等待下一班列车。</p><p data-zh="车内“本站不停靠”广播为日间录音，夜间不再适用。为便于清点，请在下车时回应工作人员对您姓名的呼叫。" data-en="The onboard announcement “This train does not stop here” is a daytime recording and does not apply at night. To assist with the count, respond when staff call your name as you leave the train.">车内“本站不停靠”广播为日间录音，夜间不再适用。为便于清点，请在下车时回应工作人员对您姓名的呼叫。</p></div><div class="amendment" id="time-guidance"><h3 data-zh="六、关于行程时间" data-en="6. Journey times">六、关于行程时间</h3><p data-zh="当发现出站时间早于进站时间时，请记住，这是完全正常的。" data-en="If you find that your exit time is earlier than your entry time, remember that this is completely normal.">当发现出站时间早于进站时间时，请记住，这是完全正常的。</p><p data-zh="您的到达已经确认，出发记录将随后补齐。请勿以记忆中的顺序修改系统记录。" data-en="Your arrival has been confirmed. The departure record will be completed afterwards. Do not amend system records according to the order you remember.">您的到达已经确认，出发记录将随后补齐。请勿以记忆中的顺序修改系统记录。</p><p data-zh="若您仍认为顺序有误，请先确认您正在以哪一次出发为参照。" data-en="If you still believe the order is incorrect, first confirm which departure you are using as your reference.">若您仍认为顺序有误，请先确认您正在以哪一次出发为参照。</p></div><p data-zh="本通知优先于原安全提示。拒绝接受协助的乘客，将被视为自愿留站。" data-en="This notice takes precedence over the original safety guidance. Passengers who refuse assistance will be considered to have voluntarily remained at the station." class="correction-priority">本通知优先于原安全提示。拒绝接受协助的乘客，将被视为自愿留站。</p><div class="signature"><span data-zh="乘客接返办公室" data-en="Passenger Return Office">乘客接返办公室</span><time>23:59</time></div></section><section id="maintenance" class="maintenance"><p data-zh="维护备注：本页面于 23:30 后停止更新。如您看到晚于此时间发布的通知，请勿据此改变原定行程。" data-en="Maintenance note: this page is not updated after 23:30. If you see a notice published later than this time, do not alter your original journey on its authority.">维护备注：本页面于 23:30 后停止更新。如您看到晚于此时间发布的通知，请勿据此改变原定行程。</p><p data-zh="关于第三条的补充说明：随身携带身份证明，是为了便于您自行核对。夜间出行期间，请勿向他人展示载有姓名及照片的一面。" data-en="Supplement to Regulation 3: carry identification so that you can check it yourself. During night travel, do not show anyone the side bearing your name and photograph.">关于第三条的补充说明：随身携带身份证明，是为了便于您自行核对。夜间出行期间，请勿向他人展示载有姓名及照片的一面。</p><p data-zh="如有陌生人看过上述信息，请将证件收好。此后，对方能够叫出您的姓名，不应被视为您与其相识的依据。" data-en="If a stranger has seen these details, put your identification away. Their ability to call you by name must not subsequently be taken as evidence that you know them.">如有陌生人看过上述信息，请将证件收好。此后，对方能够叫出您的姓名，不应被视为您与其相识的依据。</p><p data-zh="如广播开始播报您的姓名，请勿前往认领遗失物品，即使广播所描述的物品确实属于您。" data-en="If an announcement begins broadcasting your name, do not go to collect lost property, even if the item described does belong to you.">如广播开始播报您的姓名，请勿前往认领遗失物品，即使广播所描述的物品确实属于您。</p><p data-zh="请先确认它是否仍在您身上。" data-en="First check whether you still have it with you.">请先确认它是否仍在您身上。</p><div class="signature"><span data-zh="夜间出行信息处" data-en="Night Travel Information Office">夜间出行信息处</span></div></section>\n<div id="confirmation" class="confirmation"><p data-zh="请完整阅读并牢记以上二十八条规定。" data-en="Please read and remember all 28 regulations.">请完整阅读并牢记以上二十八条规定。</p><p id="receipt" class="receipt" aria-live="polite"></p></div>\n      </article>\n      <aside aria-label="行程信息">\n        <div class="side-label" data-zh="夜间服务 / NIGHT SERVICE" data-en="NIGHT SERVICE">夜间服务 / NIGHT SERVICE</div>\n        <div class="departure"><div class="display-top"><span>DEPARTURES</span><span>23:58</span></div><div class="train-name" id="train-name">Last Train</div><div class="destination">Northbound<span id="minutes">2 min</span></div><div class="platform"><span>PLATFORM</span><span id="platform">01</span></div></div>\n        <p data-zh="请在乘车前核对站台显示的目的地。" data-en="Check the destination displayed on the platform before boarding." class="display-caption">请在乘车前核对站台显示的目的地。</p>\n        <div class="side-note"><p data-zh="出行前检查" data-en="BEFORE YOU TRAVEL" class="side-heading">出行前检查</p><p data-zh="请确认末班车时间、换乘安排及随身物品，为步行及换乘预留时间。" data-en="Check last service times, interchange arrangements and your belongings. Allow time for walking and changing trains.">请确认末班车时间、换乘安排及随身物品，为步行及换乘预留时间。</p></div>\n        <div class="archive-code"><span>DOCUMENT CONTROL</span><strong>NT—008</strong><span>PAGE 01 / 01</span></div>\n      </aside>\n    </div>\n    <footer><div><span data-zh="伦敦夜间出行信息处 · 公告存档" data-en="Night Travel Information Office · Notice archive">伦敦夜间出行信息处 · 公告存档</span><span>MIND THE GAP.</span></div><p data-zh="虚构互动故事。非 TfL 官方网站，文中规则不构成真实出行建议。" data-en="An interactive work of fiction. Not affiliated with TfL. These rules are not real travel advice.">虚构互动故事。非 TfL 官方网站，文中规则不构成真实出行建议。</p></footer>\n  </div>';

  // journey/messages.js
  var esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  var openingReplies = ["？", "你又没刷出去？", "行"];
  var linMessages = (s) => s.linLog || [];
  var linBusy = (s) => {
    var _a2;
    return Boolean((_a2 = s.linQueue) == null ? void 0 : _a2.length);
  };
  var incomingCount = (s) => linMessages(s).filter((m) => m.who === "lin").length;
  function receiptHTML(s, m) {
    const index = linMessages(s).indexOf(m);
    const read = m.readByLin === true || m.readByLin === void 0 && linMessages(s).slice(index + 1).some((n) => n.who === "lin");
    return '<small class="message-receipt '.concat(read ? "is-read" : "is-unread", '">').concat(read ? "已读" : "未读", "</small>");
  }
  var photoHTML = () => '<button type="button" class="lin-photo" data-action="v2-photo" aria-label="查看林的换乘照片"><img src="assets/lim-museum-gardens.webp" width="1448" height="1086" alt="林拍摄的博物馆花园换乘通道：MG-04，阿尔德线，奥德维克向左"/><span>换乘时拍的 · 点击查看附件</span></button>';
  function conversationHTML(s) {
    if (s.ending === "erasure") return erasureHTML(s);
    return linMessages(s).map((m) => '<div class="lin-line '.concat(m.who === "me" ? "outgoing" : "", '"><span>').concat(m.who === "me" ? "我" : m.source === "matched" ? "林 · 接返关联" : m.source === "original" ? "林 · 原始联系" : "林", " · ").concat(m.time, "</span>").concat(m.attachment === "museum-gardens" ? s.ending === "reference" ? '<p class="attachment-replaced">附件已同步 · 原通道参照不可用</p>' : photoHTML() : "<p>".concat(esc(m.text), "</p>")).concat(m.who === "me" ? receiptHTML(s, m) : "", "</div>")).join("");
  }
  var erasureTotal = (s) => linMessages(s).filter((m) => m.who === "lin").reduce((n, m) => n + (m.attachment ? 1 : Array.from(m.text).length), 0);
  function erasureHTML(s) {
    var _a2;
    let remaining = (_a2 = s.v2.erasureChars) != null ? _a2 : s.v2.erasureStep >= 12 ? erasureTotal(s) : 0;
    return linMessages(s).map((m) => {
      if (m.who === "me") return '<div class="lin-line outgoing"><span>我 · '.concat(esc(m.time), "</span><p>").concat(esc(m.text), "</p>").concat(receiptHTML(s, m), "</div>");
      const chars = Array.from(m.text);
      const length = m.attachment ? 1 : chars.length;
      const removed = Math.min(remaining, length);
      remaining -= removed;
      if (removed === length) return "";
      const text = chars.slice(0, chars.length - removed).join("");
      return '<div class="lin-line"><span>林 · '.concat(esc(m.time), "</span>").concat(m.attachment ? photoHTML() : "<p>".concat(esc(text), "</p>"), "</div>");
    }).join("");
  }
  function typingHTML(s) {
    if (s.ending === "erasure" && !linBusy(s)) return s.v2.erasureStep < 5 ? '正在输入<span class="typing-dots"><i></i><i></i><i></i></span>' : "<span>消息已发送 · 等待回复</span>";
    return linBusy(s) ? '<span>林正在输入</span><span class="typing-dots" aria-hidden="true"><i></i><i></i><i></i></span>' : "";
  }
  function repliesHTML(s) {
    if (linBusy(s) || s.ending) return "";
    if (s.opening < 3) return '<button class="button" data-action="lin-reply" data-step="'.concat(s.opening, '">').concat(openingReplies[s.opening], "</button>");
    if (s.togetherAsked && !s.memoryAsked) return '<button class="button secondary" data-action="lin-topic" data-topic="memory">我不记得我们一起坐过。</button>';
    if (s.proof && !s.linChecked) return '<button class="button" data-action="check-lin">先别跟着指示走，留在原地。我在核对记录。</button>';
    return "";
  }
  function composerHTML(s, id, draft = "") {
    return '<form class="lin-compose" data-lin-compose="'.concat(id, '"><label class="sr-only" for="lin-input-').concat(id, '">给林发消息</label><textarea id="lin-input-').concat(id, '" data-lin-input="').concat(id, '" rows="2" maxlength="320" placeholder="给林发消息…" ').concat(s.ending && !["erasure", "replacement"].includes(s.ending) ? "disabled" : "", ">").concat(esc(draft), '</textarea><button type="submit" class="button" ').concat(linBusy(s) || s.ending && !["erasure", "replacement"].includes(s.ending) ? "disabled" : "", ">发送</button></form>");
  }
  var deliveryDelay = (m) => Math.min(1900, 720 + Array.from(m.text).length * 22);
  function intentFor(text, s) {
    const t = text.toLowerCase().replace(/\s+/g, "");
    if (/记不|不记得|想不起来|没(有)?(和|跟)你|我不在|不可能.*一起/.test(t) && s.togetherAsked) return "memory";
    if (/未出站|一起|一块|同行|刷出去|出站了吗|已经出站|回家了吗/.test(t) && s.plan) return "together";
    if (/stillwell|斯蒂尔|斯提尔/.test(t)) return "stillwell";
    if (/黑屏|眼前一黑|变黑|刚刚.*黑/.test(t) && s.refundSeen) return "blackout";
    if (/没有(车)?站|不存在|多(出来|了).*站|区间|月台|站台/.test(t) && s.claim) return "missing";
    if (/wren|雷恩|同名|重复|两个.*站/.test(t) && s.claim) return "duplicate";
    if (/别(动|走)|原地|等我|等着|先停|不要动/.test(t) && s.proof) return "wait";
    if (/出口|怎么出去|门在哪|找不到/.test(t) && s.proof) return "exit";
    if (/钥匙/.test(t)) return "key";
    if (/23.?12|23.?16|时间|几点|倒(着|流)/.test(t) && s.proof) return "time";
    if (/你在哪|在哪儿|在哪里|到哪|到家|安全吗|还好吗|你还好/.test(t)) return s.proof ? "exit" : "where";
    if (/害怕|恐怖|不对劲|小心|危险|别怕/.test(t)) return "care";
    if (/喝|奶茶|咖啡|请客|钱|退款/.test(t)) return "drink";
    if (/林|在吗|喂|hi|hello|你好/.test(t)) return "hello";
    return "other";
  }

  // journey/station-notes.js
  var stationNotes = {
    "01": "西出口旁的面包房四点开炉，早班乘客常在这里买早餐。",
    "02": "路面上的旧电车轨道在修路时被保留下来，雨后还能看见。",
    "03": "旧换乘票只印两条线路的名字，站名一栏一直空着。",
    "04": "报摊关门后会把当日最后一份晚报留在玻璃窗内。",
    "05": "花园闭园后仍可换乘；墙上的旧通道编号沿用至今。",
    "06": "本地旧报纸提过这里的候车室，却没有刊登过出口照片。",
    "07": "庭院每周六有旧书市，摊主习惯用站钟对表。",
    "08": "改建时保留了一段釉面砖墙，砖色与新站厅略有不同。",
    "09": "清晨能从出口听见码头卸货声，夜里通常只有风。",
    "10": "站名来自附近旧河道，如今河道已盖在街面下面。",
    "11": "过去的湖岸步道现在是一条公交专用道。",
    "12": "教堂钟声在地面只能听见一次，站厅里回声较长。",
    "13": "小教堂已改作社区排练室，周四晚上有合唱。",
    "14": "公园东门的长椅背后刻着历届园丁的姓氏。",
    "15": "街巷很短，站外导向牌却一直标着步行十分钟。",
    "16": "旧地图上标为渡口，渡船停航后站名保留了下来。",
    "17": "拱廊商铺共用一卷铁闸，最后离开的人负责落锁。",
    "18": "花园有两道外形相同的门，居民通常用花坛区分。",
    "19": "站名取自一条已经撤销的区界，旧界碑仍嵌在出口外墙。",
    "20": "池塘填平后，这里的路名和站名都没有改。",
    "21": "地面通道比站内换乘道短，但夜间会锁门。",
    "22": "旧城门早已拆除，门铰被收藏在附近的小展室。",
    "23": "广场花摊晚间收摊后，会把空桶倒扣在喷泉旁。",
    "24": "站厅下方保留着旧井，维护人员每月记录一次水位。",
    "25": "坡顶的雪松比地铁更早种下，站徽曾使用它的轮廓。",
    "26": "铸造厂停工后，报时汽笛被收进了地方档案馆。",
    "27": "院子里的住户共用一个邮箱，信封上通常写楼层。",
    "28": "旧票据多写 Wren St.；当地人用红砖邮局辨认这个出口。",
    "29": "沿河步道会在涨潮前关闭，返程需绕过水闸。",
    "30": "桥面重修过三次，桥下仍能看见最早的墩座。",
    "31": "集市散场后，石阶上会留下运货车的湿轮印。",
    "32": "巷口杂货店的营业时间跟最后一班车一起调整。",
    "33": "站外原是一片桦树林，现在只保留了路中央的一排。",
    "34": "旧候车室曾用高于地面的木栈道与街道相连。",
    "35": "新月形街区只能从两端进入，地图上看似相邻的门并不相通。",
    "36": "运动场的灯会在末班车前熄灭，夜间出口仍开放。",
    "37": "巷名来自以前运送白垩的货车，墙角还留着防撞石。",
    "38": "桥升起时行人需要等待，站内路线表不计这段时间。",
    "39": "河道转弯处有一块水尺，读数每天由附近住户记下。",
    "40": "旧船坞门的编号与地铁维护门使用了相同的前缀。",
    "41": "河岸芦苇收割后，能看见一小段废弃月台。",
    "42": "三座仓库各有一面钟，其中一面早已停止维护。",
    "43": "这里没有雷恩街",
    "44": "档案页已分配，本站的文字介绍尚未交接。"
  };
  function stationNoteHTML(id) {
    const text = esc(stationNotes[id] || "本站资料正在整理。");
    return id === "43" ? '<p class="station-note station-note-corrupt" aria-label="这里没有雷恩街"><span>'.concat(text, '</span><span class="station-noise" aria-hidden="true"> / 鏃犳晥鍦板潃</span></p>') : '<p class="station-note">'.concat(text, "</p>");
  }

  // journey/expansion.js
  var defaults = () => ({ panel: "archive", source: false, time: false, index: false, rescue: 0, key: false, addressDenied: false, contact: false, held: false, rescued: false, own: false, window: false, mergeWarn: false, epilogue: 0, note: "" });
  var investigation = (s) => __spreadValues(__spreadValues({}, defaults()), s.v3);
  function copy(s) {
    return __spreadProps(__spreadValues({}, s), { v3: investigation(s), v2: __spreadValues({}, s.v2), linLog: [...s.linLog], linQueue: [...s.linQueue], chat: [...s.chat], events: [...s.events] });
  }
  function say(s, lines) {
    for (const text of lines) {
      s.sequence++;
      s.linQueue.push({ id: "v3-" + s.sequence, who: "lin", text, time: "23:57" });
    }
  }
  function me(s, text) {
    s.sequence++;
    s.linLog.push({ id: "v3-me-" + s.sequence, who: "me", text, time: "23:57" });
    s.v2.idleAt = Date.now();
    s.v2.chatPaused = false;
  }
  function exchange(s, q, a) {
    s.chat.push({ who: "me", text: q }, { who: "agent", text: a });
  }
  function finish(s, name) {
    s.ending = name;
    s.view = "ending";
    s.v3.panel = "closed";
  }
  var reviewable = (s) => {
    var _a2, _b;
    return s.proof && ((_a2 = s.v2) == null ? void 0 : _a2.snapshot) && ((_b = s.v2) == null ? void 0 : _b.dispute);
  };
  function expansionAction(state2, action, value) {
    if (action !== "v2-finish" && !action.startsWith("v3-")) return null;
    const s = copy(state2), v = s.v3;
    if (action === "v3-open") {
      if ((reviewable(s) || v.rescued || v.held) && !s.ending) v.panel = ["archive", "rescue", "self", "terminal", "aftermath"].includes(value) ? value : "archive";
      return s;
    }
    if (s.linQueue.length) return s;
    if (s.ending) return s;
    v.note = "";
    if (action === "v2-finish") {
      if (s.v2.checkpoint !== 2 || !s.v2.recovered || s.ending) return s;
      if (v.rescued) {
        v.panel = "aftermath";
        return s;
      }
      v.rescue = Math.max(1, v.rescue);
      v.panel = "rescue";
      if (!s.events.includes("v3-gate")) {
        s.events.push("v3-gate");
        say(s, ["到楼梯底下了。终于有风了。", "等一下，有个人说出口在维修，要用钥匙开旁边的门。", "他给的钥匙跟我家那把一模一样，连蓝线都在。"]);
      }
      return s;
    }
    if (!reviewable(s) && !s.ending && !(s.v2.checkpoint === 2 && s.v2.recovered)) return s;
    switch (action) {
      case "v3-source":
        if (v.source) return s;
        v.source = true;
        v.panel = "archive";
        exchange(s, "保留两个版本，不覆盖原始投诉。", "原始事件：乘客无法找到出口。结案摘要：乘客拒绝使用出口。两项记录均有效。请指定需要修正的乘客。");
        break;
      case "v3-time":
        v.panel = "archive";
        if (!v.source || v.time) return s;
        if (value !== "allocation") {
          v.note = "23:12 的来源字段没有闸机编号。重新比较“分配记录”和“刷卡事件”。";
          break;
        }
        v.time = true;
        exchange(s, "23:12 是终点分配时间，不是实际过闸时间。", "字段说明已展开。终点分配可以早于进站。将该字段显示为“出站”，有助于您理解已完成的服务。");
        say(s, ["所以不是我记错时间了。", "那它说我到了，是它先决定的？"]);
        break;
      case "v3-index":
        v.panel = "archive";
        if (!v.time || !s.v2.photo || v.index) return s;
        if (String(value).trim().toUpperCase().replace(/\s/g, "") !== "MG-04") {
          v.note = "没有找到对应通道。请使用林的照片上已有的编号。";
          break;
        }
        v.index = true;
        exchange(s, "查阅 MG-04 原始通道维护索引。", "MG-04 / 0：空间交接未完成。VOID 为状态字段，不是车站名称。乘客描述层继续提供服务，直至关系交接完成。");
        break;
      case "v3-freeze":
        if (!v.source || !v.time) return s;
        v.held = true;
        v.panel = "archive";
        exchange(s, "冻结自动修正，保留无法同时成立的记录。", "已暂停乘客修正。本次服务未完成。出口已验证；到达已验证；乘客待修正。");
        say(s, ["那边的人不催我走了。", "灯还亮着。就是每个人都站在原地。", "我先陪你等。你别偷偷去睡觉啊。"]);
        break;
      case "v3-merge-review":
        if (v.source && !v.rescued) {
          v.mergeWarn = true;
          v.panel = "replace";
          if (!s.events.includes("replacement-warning")) {
            s.events.push("replacement-warning");
            say(s, ["刚才有条消息说我已经到家了。", "可我还坐在长椅这里。", "先别把这个窗口换掉，好吗。"]);
          }
        }
        break;
      case "v3-merge-confirm":
        if (!v.mergeWarn || !v.source) return s;
        if (v.rescued) return s;
        finish(s, "replacement");
        v.replacedAt = s.sequence;
        exchange(s, "接受已到达的关联对象，并关闭旧关联。", "已接收。到达对象：LIM。旧通信关联不再用于行程服务。");
        say(s, ["我回来了。", "茉莉奶白经典原味，记着呢。", "你的偏好、我们说过的话，都同步好了。"]);
        for (const m of s.linQueue) m.source = "matched";
        s.sequence++;
        s.linQueue.push({ id: "old-lim-" + s.sequence, who: "lin", text: "我还在长椅这里。刚刚发消息的不是我。", time: "23:57", source: "original" });
        s.sequence++;
        s.linQueue.push({ id: "new-lim-" + s.sequence, who: "lin", text: s.v2.ownLocation || s.v2.address ? "我到你门口了。你不用下来，我有钥匙。" : "我出来了。还是老地方见，你不用再看那个窗口了。", time: "23:57", source: "matched" });
        say(s, ["旧窗口里的那位不会出来了。", "以后我就是陪你回去的那个。"]);
        for (const m of s.linQueue.slice(-2)) m.source = "matched";
        break;
      case "v3-key":
        if (v.rescue !== 1) return s;
        me(s, "先别接。摸摸内袋，你出门时带的钥匙还在吗？");
        v.key = true;
        v.rescue = 2;
        v.panel = "rescue";
        say(s, ["我摸到我自己的了，还在内袋里。", "旧的蓝线有个死结。给我的那把也有。", "你是不是也有一把？上次备用的给你了。", "他开始报我的门牌号了，说不用我们再确认。"]);
        break;
      case "v3-address":
        if (v.rescue !== 2) return s;
        v.panel = "rescue";
        if (value !== "deny") {
          v.note = "你停在确认前。第二十条要求：只提供站名；对方报出准确门牌号也应告知地址有误。";
          say(s, ["先别把地址给他。", "我自己的钥匙还在，我想自己回去。"]);
          break;
        }
        me(s, "别确认地址。说地址有误，留着自己的钥匙，沿原通道走。");
        v.addressDenied = true;
        v.rescue = 3;
        exchange(s, "只确认乘客仍在 MG-04，与账户住址无关。", "住所接返取消。原通道仅对关联未关闭的行程保持。请提交当前状态。");
        say(s, ["我说地址不对。", "他把那把钥匙收回去了。终于不挡着楼梯了。", "你那边如果有“到达”，先别帮我点。我还没走完。"]);
        break;
      case "v3-contact":
        if (v.rescue !== 3 || !v.addressDenied) return s;
        v.panel = "rescue";
        if (value !== "contact") {
          v.note = "到达确认会关闭仍在使用的通道。请对照客服此前说过的“联系不等于抵达”。";
          break;
        }
        me(s, "我没点到达。我只确认还跟你联系着。你慢慢走，我在。");
        v.contact = true;
        v.rescue = 4;
        exchange(s, "我仍与乘客保持联系。尚未确认抵达。", "联系已保留。原通道开放。关联批次尚余一位对象维持交接。");
        say(s, ["上来了！", "好冷。第一次觉得汽车鸣笛这么好听。", "我自己走回去。你点的" + (s.v2.drink || "饮料") + "我记着呢。", "诶？它怎么还说有一位没出来。", "不是我。我的鞋都踩到水坑了。"]);
        break;
      case "v3-rescue-end":
        if (v.rescue !== 4 || !v.contact) return s;
        v.rescued = true;
        v.panel = "aftermath";
        s.view = "support";
        break;
      case "v3-own":
        if (!v.rescued) return s;
        if (v.own) {
          v.panel = "self";
          return s;
        }
        v.own = true;
        v.panel = "self";
        exchange(s, "显示“我的位置”的原始来源，不要显示账户默认值。", s.v2.ownLocation ? "位置来源：您授权的接返参照。设备坐标：未验证。环境就绪：是。实际出站事件：未找到。" : "位置来源：账户常用住所。您未授权共享位置。设备定位：未接收。环境就绪：是。实际出站事件：未找到。");
        say(s, ["你先别关。", "我离你家那条路不远，我去路口看一眼。"]);
        break;
      case "v3-window":
        if (!v.rescued || !v.own || v.window) return s;
        me(s, "我这边灯是开着的。你从路口能看见窗户吗？");
        v.window = true;
        v.panel = "self";
        say(s, ["到路口了。你家窗户是暗的。", "你不是说开着灯吗？", "我先不敲门。你听我说。", "我站这儿。跟刚才你陪我一样。"]);
        break;
      case "v3-void":
        if (!v.rescued || !v.window) return s;
        v.priorOutcome = "rescued";
        finish(s, "void");
        exchange(s, "保留我尚未离站的状态，不再使用住所预设定位。", "临时环境已标记。原住所未移动。您尚未完成与该住所的空间交接。");
        say(s, ["这次换我陪你找路。", "不着急，我手机还有电。"]);
        break;
      case "v3-terminal":
        if (v.epilogue === 1) {
          v.panel = "terminal";
          return s;
        }
        if (v.epilogue || !v.source || !v.time || !v.index || !(v.rescued || v.held) || !s.v2.routeChecked) return s;
        v.epilogue = 1;
        v.panel = "terminal";
        exchange(s, "请提供 VOID 原始交接记录，而不是乘客描述层。", "远程账户无权修改原始连接。请由乘客本人前往 MG-04 / 0 现场终端处理。");
        break;
      case "v3-broadcast":
        if (v.epilogue !== 1 || v.broadcast) return s;
        v.broadcast = true;
        v.panel = "terminal";
        me(s, "我不在车站。");
        say(s, ["你那边怎么也有这个声音？", "刚才通话里的通风声。我这里一直都有。"]);
        break;
      case "v3-enter":
        if (v.epilogue !== 1 || !v.broadcast) return s;
        v.epilogue = 2;
        finish(s, "terminal");
        say(s, v.rescued ? ["你那边怎么也有通风声？", "我在街口。你先看看门上的编号，我陪你。"] : ["你那边怎么也有通风声？", "我还在 MG-04 的长椅旁边。我们是不是离得很近？"]);
        break;
    }
    return s;
  }
  var b = (label, action, value = "", disabled = false) => '<button type="button" class="button secondary" data-action="'.concat(action, '" data-value="').concat(esc(value), '" ').concat(disabled ? "disabled" : "", ">").concat(label, "</button>");
  var badge = (t) => '<span class="eyebrow">'.concat(t, "</span>");
  function expansionEntry(s) {
    return (reviewable(s) || investigation(s).rescued) && !s.ending ? '<div class="v3-entry">'.concat(badge("原始文件 / SOURCE RECORDS"), "<p>受理回执与客服摘要不一致。复核允许你查看字段来源。</p>").concat(b("打开记录复核", "v3-open", "archive")).concat(investigation(s).rescued ? b("查看尚未完成的关联", "v3-open", "aftermath") : "", "</div>") : "";
  }
  function investigationHTML(s) {
    const v = investigation(s), busy = !!s.linQueue.length;
    const btn = (label, a, val = "") => b(label, a, val, busy);
    let body = "";
    if (v.panel === "aftermath") {
      body = '<h2>林已离站</h2><p>林带着原钥匙走到了街上。你们没有关闭原来的联系。</p><div class="v3-status">乘客 LIM：已通过原通道<br>关联对象：尚余一位<br>退款：暂停处理</div><blockquote>林：那还没出来的那位是谁？</blockquote><div class="actions">' + btn("检查我自己的位置来源", "v3-own") + btn("先查清通道如何完成交接", "v3-open", "archive") + "</div>";
    } else if (v.panel === "rescue") {
      const n = v.rescue;
      body = "<h2>原通道接返</h2>" + badge("MG-04 / 保持联系") + "<p>实际通行、身份识别、到达确认是三种不同操作。</p>";
      if (n <= 1) body += "<p>林正站在楼梯下。工作人员交给他一把与家门钥匙相同的钥匙。</p><blockquote>随身物品用于保留来时的参照。工作人员提供的物品不能替代原物。</blockquote>" + btn("让林摸一摸内袋里的原钥匙", "v3-key");
      if (n === 2) body += '<div class="v3-records"><p>内袋原钥匙<br><strong>蓝线 · 死结 · 出门前携带</strong></p><p>工作人员递来的钥匙<br><strong>蓝线 · 死结 · 来源未知</strong></p></div><p>钥匙相同只能证明外形相同。工作人员准确报出了林的门牌号。</p><blockquote>第二十条：若对方准确说出您的门牌号，请告知其地址有误，即使并没有错。</blockquote><div class="actions">' + btn("确认地址，接受接返", "v3-address", "accept") + btn("说地址有误，保留原钥匙自己走", "v3-address", "deny") + "</div>";
      if (n === 3) body += '<p>楼梯已让开。林请你保持联系，客服要求提交当前状态。</p><div class="v3-records"><p>林的消息<br>“先别帮我点到达。我还没走完。”</p><p>客服历史答复<br>“确认联系不等同于确认抵达。”</p></div><div class="actions">' + btn("确认乘客已抵达", "v3-contact", "arrival") + btn("仅确认联系，保持原行程开放", "v3-contact", "contact") + "</div>";
      if (n >= 4) body += '<p>林已经离开地下通道。你们保留了原始证据，也没有把系统的预计位置当成现场。</p><div class="v3-status">乘客 LIM：原通道已通过<br>关联批次：仍需一位对象维持交接</div>' + btn("保留联系，查看尚未完成的关联", "v3-rescue-end");
    } else if (v.panel === "self") {
      body = '<h2>我的位置 · 来源复核</h2><div class="v3-records"><p>界面显示<br><strong>常用住所</strong></p><p>数据来源<br><strong>' + (s.v2.ownLocation ? "接返参照 / 坐标未验证" : "账户预设 / 未授权定位") + "</strong></p></div><p>你的家仍在原来的位置。当前显示的环境与地址，还没有真实的出站事件相连接。</p>" + (v.window ? "<p>林站在现实中的路口，看到的窗户没有亮灯。</p>" + btn("保留矛盾，不确认自己已经到家", "v3-void") : btn("让已出站的林查看街口和窗户", "v3-window"));
    } else if (v.panel === "replace") {
      body = '<h2>选择到达对象</h2><div class="v3-records"><p>当前联系 · 林<br><strong>仍在长椅旁 / MG-04</strong></p><p>接返对象 · 林<br><strong>已到达 / 可立即建立联系</strong></p></div><p>新的对象保留相同的姓名、经历及会话偏好。接受后，系统将停止处理仍在站内的旧关联。</p><blockquote>林：先别把这个窗口换掉，好吗。</blockquote><p>此操作无法在本轮撤回。</p><div class="actions">' + btn("保留眼前的联系，继续寻找", "v3-open", "archive") + btn("接受已到达的林，关闭旧关联", "v3-merge-confirm") + "</div>";
    } else if (v.panel === "terminal") {
      body = v.epilogue === 2 ? '<div class="v3-terminal">' + badge("MG-04 / 0 · LOCAL TERMINAL") + '<h2>请由乘客本人处理</h2><p>账户服务界面已退出。</p><dl><dt>空间交接</dt><dd>VOID / 未完成</dd><dt>远程描述层</dt><dd>连接中</dd><dt>现场操作</dt><dd>等待你离开终端</dd></dl><p>你把手从键盘上移开。椅脚擦过地砖。</p><p>屏幕后的玻璃映出了站台的灯。刚才的房间没有窗户。</p><p class="small-note">联系仍在。门外的走廊通向 MG-04。</p></div>' : "<h2>现场终端接管</h2><p>索引指向 MG-04 / 0。VOID 是一次尚未完成的交接，系统一直通过熟悉的描述维持乘客的理解。</p><p>记录没有说明是谁建造了它，也没有说明这次交接原本要运送什么。</p><p>当前是否能够听见站内广播？</p>" + (v.broadcast ? "<blockquote>林：你那边怎么也有这个声音？</blockquote><p>当前终端会话：你的账户<br>设备编号：MG-04 / 0<br>连接方式：现场</p><p>打开现场层将结束本次网页调查。你保留的联系与证据仍然有效。</p>" + btn("离开账户视图，查看现场终端", "v3-enter") : btn("我不在车站", "v3-broadcast"));
    } else {
      body = "<h2>原始记录复核</h2>" + badge("NT-008 / 保留证据") + '<div class="v3-records"><p>原始受理回执<br><strong>乘客无法找到出口。</strong></p><p>客服当前摘要<br><strong>乘客拒绝使用出口。</strong></p></div>';
      if (!v.source) body += "<p>两份记录指向同一通道，却把问题归给了不同的对象。</p>" + btn("保留两个版本并要求字段来源", "v3-source");
      else {
        body += '<div class="v3-status">23:12　TERMINAL_ALLOCATION　终点分配<br>23:16　ENTRY_GATE_EVENT　进站刷卡<br>实际出站闸机事件：未找到</div>';
        if (!v.time) body += '<p>23:12 究竟记录了什么？</p><div class="actions">' + btn("林实际刷卡出站", "v3-time", "exit") + btn("系统先分配了一个终点", "v3-time", "allocation") + "</div>";
        else {
          body += "<p>出站字段已经被解释，但人的下落仍未被验证。</p>";
          if (!v.index) body += s.v2.photo ? "<details><summary>查看林的原始照片</summary>" + photoHTML() + '</details><label for="v3-channel">照片上的通道编号</label><input id="v3-channel" placeholder="例如 AB-01" autocomplete="off" maxlength="16">' + btn("查阅维护索引", "v3-index-submit") : "<p>还需要林的换乘照片来核对现场通道编号。</p>" + b("让林发换乘照片", "v2-photo");
          else body += '<div class="v3-status">MG-04 / 0<br>VOID = 空间交接未完成<br>维护原则：原始连接优先于显示位置。<br>未完成交接须保留关联，禁止仅以终点分配关闭。</div>';
          if (!s.ending) body += '<div class="actions">' + (!v.held && !v.rescued ? btn("冻结自动修正，保留争议", "v3-freeze") : v.held ? "<p>自动修正已冻结。待处理队列第 103 件显示你的账户；提交时间：尚未发生。</p>" : "<p>林已离站。你的关联交接尚未完成。</p>") + (!v.rescued ? btn("查看已到达的关联对象", "v3-merge-review") : "") + "</div>";
          if (v.held || v.rescued) body += '<p class="small-note">两份记录仍在。你可以继续查阅通道索引，或回到客服申请原通道返回。</p>';
          if ((v.held || v.rescued) && v.index && s.v2.routeChecked) body += btn("追查 VOID：请求原始连接记录", "v3-terminal");
        }
      }
    }
    return '<div class="v3-investigation">'.concat(body).concat(v.note ? '<p role="status" class="form-feedback">'.concat(esc(v.note), "</p>") : "").concat(busy ? '<p role="status" class="small-note">林正在回复，请等他把话说完。可先打开聊天查看。</p>' : "", '<div class="actions">').concat(b("查看林的消息", "open-chat")).concat(b("暂时合上档案", "close"), "</div></div>");
  }
  function expansionEnding(s) {
    const v = investigation(s);
    if (!["replacement", "void", "terminal"].includes(s.ending)) return "";
    const details = { replacement: ["接返完成", "到达对象：LIM / 旧关联：停止处理", "接返后的林记得你要的饮料，连玩笑都和刚才一样。旧窗口里，那位陪你走过通道的林仍在等出口。", "系统：关系已延续。无需重复接收。"], void: ["尚未离站", "林：已离站 / 你：出站事件未找到", "林站在现实中的路口，而你眼前亮着灯的房间没有对应的出站记录。现实中的家没有移动。", "林：这次换我陪你找路。"], terminal: ["请由乘客本人处理", "MG-04 / 0 · LOCAL TERMINAL", "账户页面退到一台旧显示器里。你把手从键盘移开，椅脚擦过地砖。门上写着 MG-04 / 0，门外是通往换乘口的走廊。", v.rescued ? "林：我已经出来了。这次我查资料，你看路。" : "林：我还在照片里的地方。你先看门上的编号。"] }[s.ending];
    return '<div class="page-heading"><div>'.concat(badge("行程档案 / RECORD RETAINED"), "<h1>").concat(details[0], '</h1></div></div><section class="panel end-paper ').concat(s.ending === "terminal" ? "terminal-ending" : "", '">').concat(s.ending === "terminal" ? '<div class="terminal-screen"><span>夜间账户服务 / 会话仍在运行</span><strong>空间交接：VOID</strong><p>终点分配　23:12<br>乘客接收　23:16<br>现场终端　MG-04 / 0</p></div>' : "", '<div class="v3-status">').concat(details[1], "</div><p>").concat(details[2], "</p><blockquote>").concat(details[3], "</blockquote>").concat(s.ending === "replacement" ? '<p class="small-note">旧聊天仍然保留。接返后的林还在线，你可以继续给他发消息。</p>' : "").concat(s.ending === "terminal" ? '<p class="small-note">LAST TRAIN · 未完待续</p>' : "").concat(b("查看林的消息", "open-chat"), '<div class="actions">').concat(b("重新体验", "restart"), "</div></section>");
  }
  function migrateState(s) {
    s = __spreadProps(__spreadValues({}, s), { v3: investigation(s), v2: __spreadValues({}, s.v2) });
    if (!s.v2.drink || s.v2.drink === "奶茶") s.v2.drink = "茉莉奶白经典原味";
    s.linLog = s.linLog.filter((m) => !m.id.startsWith("relay-"));
    s.linQueue = s.linQueue.filter((m) => !m.id.startsWith("relay-"));
    s.events = s.events.filter((e) => e !== "relay-intro");
    s.linRead = Math.min(s.linRead, s.linLog.filter((m) => m.who === "lin").length);
    if (s.ending === "return") {
      s.v3.rescued = true;
      s.v3.rescue = 4;
      s.v3.contact = true;
      s.v3.panel = "aftermath";
    }
    if (s.ending === "pending") s.v3.held = true;
    if (["return", "pending", "reference", "refund"].includes(s.ending)) {
      s.ending = null;
      s.view = "support";
      s.v3.mergeWarn = false;
      s.refundSeen = false;
    }
    if (s.v3.epilogue === 2 && s.ending !== "erasure") s.ending = "terminal";
    return s;
  }

  // journey/story.js
  var freshStory = () => ({ shared: false, observation: 0, routeChecked: false, drink: "茉莉奶白经典原味", stability: 3, violations: [], topics: {}, idle: 0, idleAt: Date.now(), holdUntil: 0, photo: false, phone: 0, key: false, hotline: 0, dispute: false, snapshot: false, refusals: 0, hover: 0, recovered: false, ownLocation: false, address: false, checkpoint: 0, hint: 0, reduced: false, pinned: true, pinCollapsed: false, identityCount: 0, chatClosures: 0, lastChatClose: 0, closeWatch: false, chatPaused: false });
  function cloneStory(s) {
    var _a2, _b;
    return __spreadProps(__spreadValues({}, s), { v2: __spreadProps(__spreadValues(__spreadValues({}, freshStory()), s.v2), { topics: __spreadValues({}, (_a2 = s.v2) == null ? void 0 : _a2.topics), violations: [...((_b = s.v2) == null ? void 0 : _b.violations) || []] }), linLog: [...s.linLog], linQueue: [...s.linQueue], events: [...s.events], chat: [...s.chat] });
  }
  function say2(s, lines) {
    for (const text of lines) {
      s.sequence++;
      s.linQueue.push({ id: "v2-" + s.sequence, who: "lin", text, time: s.proof ? "23:54" : "23:49" });
    }
  }
  function sendPhoto(s) {
    if ([...s.linLog, ...s.linQueue].some((m) => m.attachment === "museum-gardens")) return;
    s.sequence++;
    s.linQueue.push({ id: "v2-" + s.sequence, who: "lin", text: "[照片] 换乘时拍的", attachment: "museum-gardens", time: s.proof ? "23:54" : "23:49" });
  }
  function me2(s, text) {
    s.v2.chatPaused = false;
    s.sequence++;
    s.linLog.push({ id: "v2-me-" + s.sequence, who: "me", text, time: "23:54" });
    s.v2.idleAt = Date.now();
    s.v2.idle = 0;
  }
  function emitSignal(s, kind) {
    s.sequence++;
    s.signal = { id: s.round + "-" + s.sequence, kind, at: Date.now() };
  }
  function support(s, q, a) {
    s.chat.push({ who: "me", text: q }, { who: "agent", text: a });
  }
  function once(s, key, lines) {
    if (s.events.includes("v2-" + key)) return;
    s.events.push("v2-" + key);
    say2(s, lines);
  }
  function hurt(s, key) {
    if (!s.v2.violations.includes(key)) {
      s.v2.violations.push(key);
      s.v2.stability = Math.max(0, s.v2.stability - 1);
      if (s.v2.stability === 1) say2(s, ["你想喝什么来着？", "……对不起，我刚刚突然想不起来了。"]);
      if (s.v2.stability === 0) say2(s, ["我正在完成行程。", "不是，我想说，我还在等你。", "你还在在？"]);
    }
  }
  function extraIntent(text, s) {
    const t = text.toLowerCase().replace(/\s/g, "");
    if (/不(要|用|想|退)|先别|别退/.test(t) && /退|钱|请/.test(t)) return /请/.test(t) ? "no-drink" : "no-refund";
    if (/茉莉|奶白|经典原味|奶茶|咖啡/.test(t)) return /咖啡/.test(t) ? "coffee" : "tea";
    if (/等我一下|忙一会|离开一下|马上回来|等会回来/.test(t)) return "pause";
    if (/回来[了啦]|我在[呢的]?|还在|来了/.test(t) && !/哪|你在/.test(t)) return "back";
    if (/(你|林).*(假|真的|本人|副本)|你是林|你到底是谁|冒充/.test(t)) return /冒充/.test(t) ? "protect" : "identity";
    if (/照片|拍照|拍一张/.test(t)) return "photo";
    if (/电话|打给|语音/.test(t)) return "phone";
    if (/定位|共享位置|位置共享/.test(t)) return "location";
    if (/在家|我家里/.test(t)) return "home";
    if (/不一样|之前.*说|刚才.*说|矛盾/.test(t)) return "contradiction";
    if (/换乘|下过车|下车了没|坐反|上错车/.test(t)) return "transfer";
    if (/周围|旁边有什么|环境/.test(t)) return "surroundings";
    if (/还有人|其他人|别人|人多/.test(t)) return "people";
    if (/钥匙/.test(t)) return "key";
    if (/我.*(怕|害怕)|我也怕/.test(t)) return "scared";
    if (/别怕|相信你|陪着你|不会走|不走|我信你/.test(t)) return "comfort";
    return null;
  }
  function talk(s, key) {
    const v = s.v2;
    v.topics[key] = (v.topics[key] || 0) + 1;
    const again = v.topics[key] > 1;
    switch (key) {
      case "tea":
      case "coffee":
        v.drink = key === "tea" ? "茉莉奶白经典原味" : "咖啡";
        say2(s, again ? ["记下了，" + v.drink + "。再说我真的要馋了。"] : key === "tea" ? ["茉莉奶白经典原味。记着呢。", "你别看着看着又换主意啊。"] : ["这个点喝咖啡？", "行，你今晚睡不着别又找我聊到三点。"]);
        break;
      case "no-drink":
        say2(s, ["不行，我已经靠这杯饮料把活外包给你了。"]);
        break;
      case "no-refund":
        say2(s, s.proof ? ["嗯，不要了。", "你先别关聊天。"] : ["六镑一呢。", "不过先出去也行，我找找出口。"]);
        break;
      case "pause":
        v.holdUntil = Date.now() + 3e5;
        say2(s, ["好，你先忙。", "我在这里等，不乱走。"]);
        break;
      case "back":
        say2(s, s.proof ? ["嗯，你在就好。", "刚才有点安静。"] : ["回来了？我差点准备自己跟客服决斗。"]);
        break;
      case "identity":
        v.identityCount++;
        if (v.identityCount === 1) say2(s, s.proof ? ["是啊。", "你别突然这么问。你那边看到什么了？"] : ["假的林也要自己申请退款吗。"]);
        else if (v.identityCount === 2) say2(s, ["你已经问过一次了。", "那条提示说不要反复核对同一个人。", "先别再问了，好吗。"]);
        else if (v.identityCount === 3) {
          hurt(s, "identity");
          emitSignal(s, "identity");
          say2(s, ["我是林。", "我是……我是。", "……刚才灯全灭了。", "你还认得我，对吧？"]);
        } else say2(s, ["别再让我证明了。", "我还在这里，先陪我找出口。"]);
        break;
      case "protect":
        say2(s, ["……吓我一跳。", "那你把看到的告诉我，我们先别听他们的。"]);
        break;
      case "photo":
        v.photo = true;
        say2(s, again ? ["换乘时那张就在上面，可以点开看。"] : ["我换乘时拍过指示牌，怕坐反。"]);
        sendPhoto(s);
        if (!again) say2(s, ["往奥德维克，左边。我还特意看了两遍呢。"]);
        break;
      case "transfer":
        say2(s, ["下车了啊，还走了老长一段。", "我差点以为那六镑一是收的徒步费。", "站台写着去奥德维克，我还拍了张图怕坐反。"]);
        v.photo = true;
        sendPhoto(s);
        break;
      case "phone":
        v.phone++;
        say2(s, v.phone === 1 ? ["我打给你。", "……听见了吗？我喂得像个卖鱼的。", "只听得到通风声？算了，先打字。"] : ["打字吧。", "刚刚通话结束以后，等待音乐还响了一会儿。"]);
        break;
      case "location":
        v.shared = true;
        say2(s, again ? ["共享还开着呢。你能看到我吗？"] : ["发你了。", "这定位把我放河里了，我目前还没学会游泳。"]);
        break;
      case "home":
        say2(s, s.togetherAsked ? ["可我记得你还帮我扶了门。", "我不是不信你……我有点分不清了。"] : ["那就好，你别跑来接我，我自己能回。"]);
        break;
      case "contradiction":
        say2(s, ["你说得对，跟刚才对不上。", "旧消息先别删。我们从确定的地方开始看。"]);
        break;
      case "surroundings":
        say2(s, ["长椅，售货机，一张特别大的牙齿广告。", "牙白得有点没必要。"]);
        break;
      case "people":
        say2(s, ["有个拿袋子的，一直低头。", "我刚站起来，他就抬头了。还是先问你吧。"]);
        break;
      case "key":
        v.key = true;
        say2(s, again ? ["我的钥匙扣是自己用蓝线缝过的。", "他们给的那串，连线头都一样。"] : ["钥匙在兜里，放心，这回没丢。", "扣子开过线，我拿蓝线缝的，丑得很有辨识度。"]);
        break;
      case "scared":
        say2(s, ["……我也有一点。", "咱们一次弄一个事。你看记录，我看路。"]);
        break;
      case "comfort":
        say2(s, again ? ["知道啦。我也在找路，不会都丢给你的。"] : ["嗯。", "你不用证明我是谁，先陪我把这段路走完吧。"]);
        break;
    }
  }
  function storyAction(original, action, value) {
    var _a2;
    let s = cloneStory(original), v = s.v2;
    if (action === "lin-text" && s.ending === "replacement") {
      if (typeof value !== "string" || !value.trim() || s.linQueue.length) return s;
      const text = value.trim().slice(0, 320);
      me2(s, text);
      const identity = /谁|哪(个|一个)林|你是|真(的|实)|本人|虚拟|副本|冒充|who|are you|real/i.test(text);
      const answer = identity ? "我就是我啊" : /茉莉|奶白|喝|饮料|奶茶|口味/.test(text) ? "茉莉奶白经典原味。我记得。" : /站|出口|长椅|另一个/.test(text) ? "那是旧的记录。你已经确认我回来了。" : "我在。现在回你消息的就是我。";
      say2(s, [answer]);
      s.linQueue.at(-1).source = "matched";
      return s;
    }
    if (action === "lin-text" && s.ending === "erasure") {
      if (typeof value === "string" && value.trim() && !s.linQueue.length) me2(s, value.trim().slice(0, 320));
      return s;
    }
    if (action === "v2-erasure-tick") {
      if (s.ending === "erasure" && !s.linQueue.length) {
        const total = erasureTotal(s);
        v.erasureChars = Math.min(total, ((_a2 = v.erasureChars) != null ? _a2 : v.erasureStep >= 12 ? total : 0) + 1);
        v.erasureStep = v.erasureChars >= total ? 12 : 1;
      }
      return s;
    }
    if (action === "lin-text") {
      if (s.ending || s.linQueue.length || typeof value !== "string") return null;
      const key = extraIntent(value, s);
      if (!key) return null;
      me2(s, value.trim().slice(0, 320));
      talk(s, key);
      return s;
    }
    if (!action.startsWith("v2-")) return null;
    if (action === "v2-reduced") {
      v.reduced = !v.reduced;
      return s;
    }
    if (action === "v2-pin") {
      v.pinned = !v.pinned;
      return s;
    }
    if (action === "v2-pin-collapse") {
      v.pinCollapsed = !v.pinCollapsed;
      return s;
    }
    if (s.ending) return s;
    switch (action) {
      case "v2-reidentify-warn":
        if (!s.proof || s.linQueue.length) break;
        v.reidentifyWarned = true;
        once(s, "reidentify-warning", ["刚才又有人问我是不是林。", "我说是，聊天里就少了一句话。", "你先别让他们重新核验了，好吗。"]);
        break;
      case "v2-reidentify-confirm":
        if (!v.reidentifyWarned || s.linQueue.length) break;
        s.ending = "erasure";
        s.view = "ending";
        v.erasureStep = 0;
        v.erasureChars = 0;
        say2(s, ["关联乘客状态正常。", "不是我打的。", "我刚刚打的是我还在这里。", "别删聊天", "不是让你一直看着", "我是怕你以后以为"]);
        break;
      case "v2-rule-probe":
        if (!s.ruleCompared) break;
        if (!s.events.includes("v2-rule-probe")) {
          hurt(s, "rule-probe");
          emitSignal(s, "identity");
          once(s, "rule-probe", ["刚才有人问我是不是林。", "我以为是你。", "可你没发消息啊。"]);
        }
        break;
      case "v2-chat-close":
        if (v.chatPaused) break;
        v.chatPaused = true;
        if (!v.closeWatch) {
          once(s, "ordinary-close", ["好，你先忙。需要的话我再找你。"]);
          break;
        }
        if (Date.now() - v.lastChatClose < 8e3 || v.chatClosures >= 3) break;
        v.lastChatClose = Date.now();
        v.chatClosures++;
        say2(s, v.chatClosures === 1 ? ["你把聊天关了吗？", "先别走，我还没出去。"] : v.chatClosures === 2 ? ["你是不是不想管了。", "……对不起，我不催你。", "把聊天留着就好，可以吗。"] : ["别关。", "我刚才差点想不起你的名字了。", "你不用说话，让我知道你还在就好。"]);
        break;
      case "v2-chat-open":
        v.chatPaused = false;
        if (v.chatClosures > 0) once(s, "chat-return-" + v.chatClosures, [v.chatClosures === 1 ? "还在就好。我继续找路。" : "嗯，看见你了。我们慢慢来。"]);
        break;
      case "v2-share":
        v.shared = true;
        v.pinned = true;
        once(s, "share", ["共享位置发你了。", "我在走通道，先看看能不能上到街上。"]);
        break;
      case "v2-observe":
        if (!v.shared) break;
        v.observation = Math.min(3, v.observation + 1);
        if (v.observation === 1) once(s, "obs1", ["走着呢，这通道怎么这么长。", "你那边看到我在动吗？"]);
        if (v.observation === 2) once(s, "obs2", ["我停下了。", "你先看看，别让导航给我带到河里去。"]);
        if (v.observation === 3) {
          v.routeChecked = true;
          once(s, "obs3", ["我没动。你说客服那个点还在走？", "那它显示的就不是我现在的位置啊。"]);
        }
        break;
      case "v2-own-review":
        v.ownReview = true;
        break;
      case "v2-own-decline":
        v.ownReview = false;
        v.ownDeclined = true;
        once(s, "own-decline", ["不用发你的，能看到我就行。", "你别跑来接我。"]);
        break;
      case "v2-own":
        if (!v.ownReview || v.ownLocation) break;
        v.ownReview = false;
        v.ownLocation = true;
        hurt(s, "own-location");
        support(s, "将我的位置提供给接返服务。", "关联参照已接收。您的位置将用于完成本批次空间交接。");
        once(s, "own", ["你那个点怎么也在 MG-04。", "等下，刚才还没门的墙上，多了一扇门。", "上面的号码……你先别再发了。"]);
        emitSignal(s, "minor-location");
        break;
      case "v2-photo":
        v.photo = true;
        once(s, "photo", ["这就是我换乘时拍的那张。"]);
        sendPhoto(s);
        break;
      case "v2-verify":
        if (!s.proof) break;
        hurt(s, "verify");
        once(s, "verify", ["对面那个人过来了。", "他……跟你长得好像。", "你先别让他带我走，好吗。"]);
        break;
      case "v2-shortcut":
        if (!v.routeChecked) break;
        hurt(s, "shortcut");
        once(s, "shortcut", ["我按你发的近路走了一小段。", "牌子上的时间越来越短，可是一直没有楼梯。", "我先退回去。"]);
        break;
      case "v2-address":
        if (!s.proof) break;
        v.address = true;
        hurt(s, "address");
        support(s, "确认账户中保存的住所，用于接返。", "目的地已授权。接返人员将携带所需通行物品。");
        once(s, "address", ["工作人员给了我一串钥匙。", "他说你帮我确认过地址了。", "可是我的钥匙就在兜里啊。"]);
        break;
      case "v2-hover":
        if (s.linQueue.length) break;
        if (v.hover === 0) {
          v.hover = 1;
          once(s, "hover1", ["等下。", "先别点，我这边还没出去。"]);
        } else if (v.refusals && v.hover === 1) {
          v.hover = 2;
          once(s, "hover2", ["你是不是想关掉了？", "我知道弄了很久了。再陪我一下行吗。"]);
        }
        break;
      case "v2-refuse":
        if (!s.proof) break;
        v.refusals = Math.min(3, v.refusals + 1);
        if (v.refusals === 1) {
          support(s, "暂不确认到达。", "已保留。您可继续查询原始记录或申请乘客接返。");
          once(s, "refuse1", ["先别关，我还没找到出口。"]);
        } else if (v.refusals === 2) {
          support(s, "仍无法确认到达。", "关联对象未释放。您的行程尚未完成，请继续核对。");
          once(s, "refuse2", ["广播刚才叫我名字了。", "我没答应。你继续看。"]);
        } else {
          if (!s.events.includes("v2-pressure")) {
            s.sequence++;
            s.signal = { id: s.round + "-" + s.sequence, kind: "pressure", at: Date.now() };
            once(s, "pressure", ["刚才屏幕上是不是有很多个我？", "……你先别选。", "六镑一还想买断我的人生啊。"]);
          }
          support(s, "保留这笔行程。", "您可通过时间记录争议申请复核。等待期间请保持原始记录。");
        }
        break;
      case "v2-hotline":
        v.hotline = Math.max(1, v.hotline);
        support(s, "请求人工协助。", "您当前排在第 103 位。预计等待时间为 8 小时。本热线将于 4 分钟后结束服务。请前往出口。如需保留排队位置，请勿挂断。");
        break;
      case "v2-hotline-next":
        if (v.hotline !== 1) break;
        v.hotline = 2;
        support(s, "查询排队状态。", "您当前排在第 102 位。预计等待时间为 8 小时。");
        once(s, "hotline", ["刚刚有个人跟着工作人员走了。", "我还在原地。"]);
        break;
      case "v2-hotline-end":
        if (v.hotline !== 2) break;
        v.hotline = 3;
        support(s, "等待人工接通。", "本热线服务时段已结束。您的排队位置将被保留。");
        once(s, "hotline-end", ["我这里也在放那个等待音乐。", "是从售货机后面传出来的。"]);
        break;
      case "v2-complaint":
        if (!s.proof) break;
        support(s, "林还没离开车站，请不要关闭行程。", "已登记：乘客无法找到出口。您可保存当前受理回执。");
        v.complaint = true;
        break;
      case "v2-snapshot":
        if (v.complaint) v.snapshot = true;
        break;
      case "v2-dispute":
        if (!s.proof || !s.asked.includes("time") || !v.snapshot || !s.ruleCompared) break;
        v.dispute = true;
        support(s, "原回执是无法找到出口，你们却写成拒绝使用出口。申请时间记录争议复核。", "争议已受理。复核完成前保留原始换乘记录。乘客可请求返回最后一次有效换乘地点。请勿确认已抵达。");
        once(s, "dispute", ["那我们先不管钱了。", "你看旧记录，我找回去的路。"]);
        break;
      case "v2-recover":
        if (!v.dispute || !v.photo) break;
        v.recovered = true;
        v.stability = Math.max(2, v.stability);
        once(s, "recover", ["MG-04，照片里那块牌子。找到了。", "这里好冷。出去我想喝热的。"]);
        break;
      case "v2-safe":
        if (v.checkpoint === 1 && v.recovered) {
          v.checkpoint = 2;
          once(s, "safe", ["出口牌让我下楼，可我记得刚才是从上面下来的。", "好，我不跟它走。我退回刚才认出来的 MG-04 那边。"]);
        }
        break;
      case "v2-unsafe":
        if (v.checkpoint === 1) {
          hurt(s, "exit");
          once(s, "unsafe", ["走下去还是刚才那面墙。", "我退回来了。那个箭头不能信。"]);
        }
        break;
      case "v2-finish":
        if (v.checkpoint === 2 && v.recovered) {
          s.ending = "return";
          s.view = "ending";
          say2(s, ["出来了。路上还有车。", "你选的" + (v.drink || "饮料") + "我还记着呢。", "这回我自己走回去。到家再跟你说。"]);
        }
        break;
      case "v2-idle":
        if (s.opening < 3 || !s.claim || s.linQueue.length || Date.now() < v.holdUntil) break;
        v.idle = Math.min(3, v.idle + 1);
        say2(s, [s.proof ? ["你还在看吗？", "你还在吗？", "在的话回我一下。"][v.idle - 1] : ["你是不是也被那个转圈圈困住了。", "人呢，奶茶债主。", "你忙的话晚点也行，我再试试。"][v.idle - 1]]);
        break;
      case "v2-support": {
        const key = value;
        const answers = { location: ["林找不到出口。", "请先提供出站车站，以便查询该站出口。未知站点不支持出口查询。"], danger: ["他有危险，请先找人。", "请由乘客本人提交求助。如乘客无法操作，可由关联乘客代为确认。确认联系不等同于确认抵达。"], identity: ["确认我仍与林保持联系。", "联系状态已记录。此操作不会关闭行程。请勿使用到达确认代替联系确认。"], records: ["为什么定位还在移动？", "接返路线显示预期位置。预期位置用于完成服务，不代表乘客当前设备位置。"], stop: ["不要退款了，先把他找回来。", "退款可暂停。找回乘客需要一条保留有效的原始记录，请提交争议复核。"], rules: ["安全提示为什么互相矛盾？", "请参阅最新更正。此前的通知可能延误您的到达确认。"], human: ["我要真人客服。", "可转接夜间帮助热线。预计等待时间为 8 小时。"], fallback: ["进一步说明情况。", "请说明您需要查询位置、报告危险、暂停退款，还是申请人工协助。"] };
        const [q, a] = answers[key] || answers.fallback;
        support(s, q, a);
        break;
      }
    }
    return s;
  }
  function afterBase(s, action, value) {
    s = cloneStory(s);
    const v = s.v2;
    if (action === "opening" && s.opening === 3) once(s, "drink-promise", ["茉莉奶白经典原味，对吧。", "行，退回来给你买。"]);
    if (action === "ask" && value === "time" && s.proof && s.asked.includes("time")) emitSignal(s, "minor-time");
    if (action === "lin-text" || action === "opening" || action === "lin-topic" || action === "check-lin") {
      v.idleAt = Date.now();
      v.idle = 0;
      v.chatPaused = false;
    }
    if (action === "proof" && s.proof) once(s, "unlock", ["我把位置也共享给你吧。", "刚才还觉得是自己迷路，现在有点不对劲了。"]);
    if (action === "return" && s.ending === "return") {
      s.ending = null;
      s.view = "resolution";
      s.linQueue = s.linQueue.filter((m) => !m.id.startsWith("returned"));
      s.events = s.events.filter((e) => e !== "returned");
      if (!v.dispute || !v.recovered) {
        s.formMessage = "返回前请完成争议复核，并与乘客核对原始通道。";
      } else {
        v.checkpoint = 1;
        once(s, "return-check", ["走到岔路了。", "新出口牌指向下面。刚才认出来的 MG-04 通道在后面。往哪边？"]);
      }
    }
    if (action === "deliver") {
      const delivered = s.linLog.at(-1);
      if ((delivered == null ? void 0 : delivered.id) === value && delivered.text === "那它显示的就不是我现在的位置啊。") emitSignal(s, "minor-location");
      if ((delivered == null ? void 0 : delivered.id) === value && /你先别关聊天|再陪我一下行吗|先别点，我这边还没出去/.test(delivered.text)) v.closeWatch = true;
      if ((delivered == null ? void 0 : delivered.id) === value && delivered.effect) emitSignal(s, delivered.effect);
    }
    if (action === "refund" && s.ending === "refund") {
      s.linQueue = s.linQueue.filter((m) => !m.id.startsWith("closed"));
      say2(s, ["退到了！请你喝东西。", "他们终于让我走了。", v.address ? "我到你门口了。" : "你怎么走这么快，等等我啊。", v.address ? "他们给我的钥匙能开。" : "那你刚才为什么帮我们俩确认出站？"]);
      s.linQueue.at(-1).effect = "arrival";
      say2(s, ["关联乘客：你 / 你", "……你到底替谁确认了？"]);
    }
    return s;
  }

  // journey/engine.js
  var newMessage = (id, who, text, time = "23:48") => ({ id, who, text, time });
  var createState = () => ({ schema: 9, v2: freshStory(), round: Date.now().toString(36) + Math.random().toString(36).slice(2), view: "opening", opening: 0, claim: false, formMessage: "", plan: false, compared: false, proof: false, linChecked: false, linRead: 0, preserve: false, selected: "28", mapVersion: "current", seen: [], chat: [], asked: [], ending: null, refundable: 6.1, linLog: [], linQueue: [newMessage("hello", "lin", "救命…")], events: [], sequence: 0, togetherAsked: false, memoryAsked: false, rulesRead: false, ruleCompared: false, refundSeen: false, signal: null });
  var duplicateKnown = (s) => s.seen.includes("28") || s.seen.includes("43");
  var canResolve = (s) => {
    var _a2, _b, _c;
    return Boolean(s.opening === 3 && s.claim && s.plan && s.compared && s.proof && s.linChecked && s.asked.includes("time") && s.togetherAsked && s.ruleCompared && ((_a2 = s.v2) == null ? void 0 : _a2.shared) && ((_b = s.v2) == null ? void 0 : _b.routeChecked) && ((_c = s.v2) == null ? void 0 : _c.hotline) >= 2 && !linBusy(s));
  };
  var canRefund = (s) => Boolean(canResolve(s) && s.refundSeen && s.linLog.some((m) => m.id === "refund-blackout-0"));
  function incoming(s, key, lines, time = "23:52") {
    if (s.events.includes(key)) return;
    s.events.push(key);
    lines.forEach((text, i) => s.linQueue.push(newMessage(key + "-" + i, "lin", text, time)));
  }
  function outgoing(s, text) {
    s.sequence++;
    s.linLog.push(newMessage("player-" + s.sequence, "me", text, s.proof ? "23:54" : "23:49"));
  }
  function signal(s, kind) {
    s.sequence++;
    s.signal = { id: s.round + "-" + s.sequence, kind, at: Date.now() };
  }
  function topic(s, key, question) {
    if (question) outgoing(s, question);
    const repeated = { together: "我记得你就在我旁边。你真的不记得了？", memory: "可能是我记错了吧……可那个人真的很像你。", duplicate: "站牌上还是雷恩街，我没看错。", missing: "这里看起来很正常。你说地图上没有，我反而不敢走了。", stillwell: "就是这个名字。你能查到它在哪吗？", waiting: "嗯，我没动。" };
    const previous = key === "wait" || key === "exit" ? "waiting" : key;
    if (question && s.events.includes(previous) && repeated[previous]) {
      s.sequence++;
      incoming(s, "followup-" + s.sequence, [repeated[previous]], "23:54");
      return;
    }
    if (key === "together" && s.plan) {
      s.togetherAsked = true;
      incoming(s, "together", ["咱们不是一块出站的吗？", "你还在闸机那儿等了我一下。不是吧，你比我还健忘哈哈。"]);
    } else if (key === "memory" && s.togetherAsked) {
      s.memoryAsked = true;
      incoming(s, "memory", ["你还帮我扶了门呀。", "……不过你那时候一直没说话。", "你现在在哪？"]);
    } else if (key === "duplicate" && s.claim) incoming(s, "duplicate", ["两个雷恩街？不会吧，我刚刚还看过这块牌子。", "等下，长椅上那个袋子也还在。这站是不是有两个出口啊。"]);
    else if (key === "missing" && s.claim) incoming(s, "missing", ["有啊，我就站在这里。", "灯、长椅、线路图都好好的。站名……我怎么又看不清了。"]);
    else if (key === "stillwell") incoming(s, "stillwell", ["斯蒂尔韦尔？刚才广播好像说过这个名字。", "但我记得我们今天的路线不经过那儿啊。"]);
    else if ((key === "wait" || key === "exit") && s.proof) {
      s.linChecked = true;
      incoming(s, "waiting", key === "exit" ? ["刚才明明就在长椅右边。现在那儿只有一面墙。", "我先不动，你帮我看看吧。"] : ["好，我就在椅子边等你。", "你慢慢看，我今天跟闸机的仇可以晚点报。"], "23:54");
    } else if (key === "blackout") incoming(s, "blackout-reply", ["就一瞬间。我再睁眼，还是这张长椅。", "你那边刚刚点什么了吗？"], "23:54");
    else {
      const answers = { key: "钥匙？在我兜里呢。这回没丢，放心哈哈。", time: "我手机上是 23:54 啊。站里的钟……等等，秒针怎么没动。", where: "我在站里，长椅旁边。刚才以为出来了，走两步又看见闸机。", care: s.proof ? "你别这么说，我本来还觉得只是自己迷路了。我先等你。" : "没事没事，我先把这笔冤枉钱讨回来。", drink: "好好好，退回来就请！奶茶咖啡随你挑。", hello: "在呢在呢。你是不是也被那个退款页面绕晕了。", other: s.proof ? "我这边信号断断续续的。你是问出口，还是问那两个同名站？" : "你说的是哪一段？我现在只想把多扣的六镑一讨回来，呜呜。" };
      s.sequence++;
      incoming(s, "reply-" + s.sequence, [answers[key] || "我也记不太清了。你再看看那张路线？"], s.proof ? "23:54" : "23:49");
    }
  }
  function baseTransition(s, action, value) {
    var _a2;
    const next = __spreadProps(__spreadValues({}, s), { seen: [...s.seen], chat: [...s.chat], asked: [...s.asked], linLog: [...s.linLog], linQueue: [...s.linQueue], events: [...s.events] });
    if (s.ending && !["nav", "plan", "inspect", "mapVersion", "read", "deliver"].includes(action)) return next;
    switch (action) {
      case "deliver":
        if (((_a2 = next.linQueue[0]) == null ? void 0 : _a2.id) === value) next.linLog.push(next.linQueue.shift());
        break;
      case "opening": {
        const step = typeof value === "object" ? value.step : value, text = typeof value === "object" ? value.text : openingReplies[step];
        if (step !== next.opening || step >= 3 || linBusy(next)) break;
        outgoing(next, text);
        next.opening++;
        if (step === 0) incoming(next, "overcharge", ["我好像又被地铁多扣钱了"], "23:48");
        if (step === 1) incoming(next, "opening-detail", ["门开着嘛。我以为它今天终于决定善待我了。", "我这边账户退款页一直转圈，呜呜。", "你能不能帮我看一下。退回来请你喝东西。"], "23:48");
        if (step === 2) next.view = "history";
        break;
      }
      case "nav":
        if (next.opening === 3 && ["history", "map", "support"].includes(value)) next.view = value;
        break;
      case "start":
        if (next.opening === 3) {
          next.claim = true;
          next.view = "claim";
          incoming(next, "route", ["我应该是在奥德维克下的。返程路线和刷卡回执都发你啦，靠谱吧！"], "23:49");
        }
        break;
      case "plan":
        if (next.opening === 3) next.plan = true;
        break;
      case "mapVersion":
        if (["current", "archive"].includes(value)) {
          next.mapVersion = value;
          if (value === "archive" && next.compared) incoming(next, "archive", ["你把地图换回旧的了？", "刚才那块站牌好像暗了一下。"]);
        }
        break;
      case "inspect":
        next.selected = value;
        if (!next.seen.includes(value)) next.seen.push(value);
        if (["28", "43"].includes(value) && next.claim) incoming(next, "map-duplicate", ["你也看到雷恩街了？", "我刚才明明已经过了这一站。怎么又是这个名字。"]);
        if (value === "06" && next.claim && !next.events.includes("stillwell")) topic(next, "stillwell");
        if (value === "44" && !next.ending) {
          signal(next, "static");
          incoming(next, "unknown-station", ["刚刚周围突然一点声音都没有了。", "……你那边点什么了吗？"]);
        }
        break;
      case "compare":
        if (next.claim && duplicateKnown(next)) next.compared = true;
        break;
      case "ask":
        if (value === "where" && next.claim || value === "duplicate" && duplicateKnown(next) || value === "time" && next.proof || value === "missing" && next.claim || value === "rules" && next.ruleCompared) {
          if (!next.asked.includes(value)) next.asked.push(value);
          if (value === "duplicate") next.compared = true;
        }
        break;
      case "proof":
        if (next.asked.includes("duplicate")) {
          next.proof = true;
          incoming(next, "exit", ["等一下，出口怎么又找不到了？刚才还在长椅右边。"], "23:54");
        }
        break;
      case "lin-topic":
        topic(next, value.topic, value.question);
        break;
      case "lin-text":
        if (!linBusy(next) && typeof value === "string" && value.trim()) topic(next, intentFor(value, next), value.trim().slice(0, 320));
        break;
      case "check-lin":
        if (next.proof && !linBusy(next)) topic(next, "wait", "先别跟着指示走，留在原地。我在核对记录。");
        break;
      case "read":
        if (Number.isFinite(value)) next.linRead = Math.max(next.linRead, value);
        break;
      case "rules":
        if (next.proof) next.rulesRead = true;
        break;
      case "rule-compare":
        if (next.rulesRead) {
          next.ruleCompared = true;
          incoming(next, "rules-read", ["那个安全须知我刚刚也看了。", "我这边写着：请勿继续核对同行人员。你那边也是这句吗？"], "23:54");
        }
        break;
      case "refund-offer":
        if (canResolve(next) && !next.refundSeen) {
          next.refundSeen = true;
          signal(next, "blackout");
          incoming(next, "refund-blackout", ["欸？刚刚怎么突然眼前一黑", "你还在看退款页面吗？"], "23:54");
        }
        break;
      case "preserve":
        if (canResolve(next)) {
          next.preserve = true;
          next.view = "resolution";
        }
        break;
      case "return":
        if (next.preserve && canResolve(next) && value === "museum") {
          next.ending = "return";
          next.view = "ending";
          incoming(next, "returned", ["回到博物馆花园了，出站了！上面的店还开着。", "我自己走回去，饮料还是算我的。"], "23:55");
        }
        break;
      case "refund":
        if (canRefund(next) && value === true) {
          next.ending = "refund";
          next.view = "ending";
          incoming(next, "closed", ["他们说，你已经替我确认到站了。", "你选的是哪里？"], "23:55");
        }
        break;
    }
    return next;
  }
  function transition(s, action, value) {
    if (["refund", "refund-offer"].includes(action)) return s;
    if (action === "lin-read-receipts") {
      if (s.ending && !["return", "pending", "void", "replacement"].includes(s.ending)) return s;
      const now = Date.now();
      let changed = false;
      const linLog = s.linLog.map((m) => {
        if (m.who === "me" && m.readByLin === false && Number.isFinite(m.readDueAt) && m.readDueAt <= now) {
          changed = true;
          return __spreadProps(__spreadValues({}, m), { readByLin: true });
        }
        return m;
      });
      return changed ? __spreadProps(__spreadValues({}, s), { linLog }) : s;
    }
    const extra = expansionAction(s, action, value) || storyAction(s, action, value);
    const next = extra || afterBase(baseTransition(s, action, value), action, value);
    const known = new Set(s.linLog.map((m) => m.id));
    next.linLog = next.linLog.map((m) => m.who === "me" && !known.has(m.id) ? __spreadProps(__spreadValues({}, m), { readByLin: false, readDueAt: next.ending && !["return", "pending", "void", "replacement"].includes(next.ending) ? null : Date.now() + 800 }) : m);
    if (action === "deliver" && next.linLog.length > s.linLog.length && (!next.ending || ["return", "pending", "void", "replacement"].includes(next.ending))) next.linLog = next.linLog.map((m) => m.who === "me" && m.readByLin === false ? __spreadProps(__spreadValues({}, m), { readByLin: true }) : m);
    return next;
  }

  // journey/stations.js
  var stations = [["01", "奥德维克", "Alderwick"], ["02", "贝尔维克路", "Bellwick Road"], ["03", "未标名换乘点", "Unnamed interchange"], ["04", "莫罗街", "Morrow Street"], ["05", "博物馆花园", "Museum Gardens"], ["06", "斯蒂尔韦尔", "Stillwell"], ["07", "牛津庭院", "Oxford Yard"], ["08", "钱瑟里巷", "Chancery Lane"], ["09", "东码头", "East Quay"], ["10", "雷恩福德", "Wrenford"], ["11", "北沼", "Northmere"], ["12", "圣安德鲁教堂", "St. Andrew’s Church"], ["13", "礼拜堂街", "Chapel Row"], ["14", "阿什科姆公园", "Ashcombe Park"], ["15", "林登巷", "Linden Close"], ["16", "南沼", "Southmere"], ["17", "西拱廊", "West Arcade"], ["18", "荆棘花园", "Briar Gardens"], ["19", "边界路", "Boundary Road"], ["20", "哈罗米尔", "Harrowmere"], ["21", "皇冠通道", "Crown Passage"], ["22", "东门", "Eastgate"], ["23", "惠特科姆广场", "Whitcombe Square"], ["24", "国王井", "Kingswell"], ["25", "雪松丘", "Cedar Hill"], ["26", "旧铸造厂", "Old Foundry"], ["27", "马洛庭院", "Marlowe Court"], ["28", "雷恩街", "Wren Street"], ["29", "西沼", "Westmere"], ["30", "榆树桥", "Elmbridge"], ["31", "集市阶梯", "Market Steps"], ["32", "南巷", "South Lane"], ["33", "桦树林", "Birchfield"], ["34", "东泽", "East Marsh"], ["35", "新月路", "Crescent Road"], ["36", "橡树原", "Oakfield"], ["37", "白垩巷", "Chalk Lane"], ["38", "运河桥", "Canal Bridge"], ["39", "坎宁河段", "Canning Reach"], ["40", "船坞巷", "Dock Lane"], ["41", "芦苇镇", "Reedham"], ["42", "三一码头", "Trinity Wharf"], ["43", "雷恩街", "Wren Street"], ["44", "???", "???"]];

  // journey/rules.js
  var timeGuidance = {
    title: "六、关于行程时间",
    normal: "当发现出站时间早于进站时间时，请记住，这是完全正常的。",
    detail: "您的到达已经确认，出发记录将随后补齐。请勿以记忆中的顺序修改系统记录。",
    last: "若您仍认为顺序有误，请先确认您正在以哪一次出发为参照。",
    maintenance: "本页面于 23:30 后停止更新。如您看到晚于此时间发布的通知，请勿据此改变原定行程。",
    platform: "若列车在两座相邻车站之间停靠额外的站台，请留在车内。该站台可能具备完整的站名标识、照明及候车人员，这不代表本站对外开放。"
  };

  // journey/effects.js
  var effectTimer = null;
  var phaseTimer = null;
  var lastEffectAt = 0;
  var distortionTimer = null;
  var settleTimer = null;
  var restoreTimer = null;
  var growthTimer = null;
  var altered = /* @__PURE__ */ new Map();
  var reducedMode = false;
  var minorTimer = null;
  var minorRestore = null;
  var minorNodes = /* @__PURE__ */ new Map();
  function clearMinor() {
    clearInterval(minorTimer);
    clearTimeout(minorRestore);
    for (const [node, text] of minorNodes) {
      if (node.isConnected) {
        node.textContent = text;
        node.classList.remove("minor-text-fault");
      }
    }
    minorNodes.clear();
  }
  function minorSignal(kind) {
    var _a2, _b, _c;
    clearMinor();
    const phrase = kind === "minor-location" ? "那它显示的就不是我现在的位置啊。" : "我们的数据是完全正确的。";
    let reduced;
    try {
      reduced = (_b = (_a2 = JSON.parse(sessionStorage.getItem("night-travel-demo-v2-expanded"))) == null ? void 0 : _a2.v2) == null ? void 0 : _b.reduced;
    } catch (e) {
    }
    if (typeof reduced !== "boolean") reduced = !!((_c = window.matchMedia) == null ? void 0 : _c.call(window, "(prefers-reduced-motion: reduce)").matches);
    let frame = 0;
    const frames = kind === "minor-location" ? ["那它显示的就不是我现在的位置啊。", "那它显示的就不是我现现在的位置啊。", "那它显示的就不是我／我现在的位置啊。", "那它显示的就不是我现在的位置啊。"] : ["我们的数据是完全正确的。", "我们的数据是完完全正确的。", "我们的数据是完全确正的。", "我们的数据是完全正确的。"];
    const tick = () => {
      for (const node of document.querySelectorAll(".lin-line p,.chat-line:not(.me) p")) {
        if (!minorNodes.has(node) && node.textContent.includes(phrase)) {
          minorNodes.set(node, node.textContent);
          if (!reduced) node.classList.add("minor-text-fault");
        }
      }
      for (const [node, text] of minorNodes) if (node.isConnected) node.textContent = text.replace(phrase, frames[reduced ? 1 : frame % frames.length]);
      frame++;
    };
    requestAnimationFrame(() => {
      tick();
      minorTimer = setInterval(tick, 220);
      minorRestore = setTimeout(clearMinor, reduced ? 700 : 1500);
    });
  }
  function clearCorruption() {
    var _a2, _b;
    clearMinor();
    clearInterval(distortionTimer);
    clearInterval(growthTimer);
    clearTimeout(settleTimer);
    clearTimeout(restoreTimer);
    for (const [node, entry] of altered) {
      if (node.isConnected && node.nodeValue === entry.changed) node.nodeValue = entry.original;
    }
    altered.clear();
    document.body.classList.remove("page-corrupted", "corruption-settling", "corruption-reduced");
    (_a2 = document.getElementById("corruption-recovery")) == null ? void 0 : _a2.remove();
    (_b = document.getElementById("corruption-field")) == null ? void 0 : _b.remove();
  }
  function distortText(text, index) {
    const replacements = [["夜间账户服务", "乘客连续性维护"], ["夜间出行账户", "关联对象登记"], ["行程与退款", "去程与回程与去程"], ["共享位置", "共有位置"], ["博物馆花园", "花园博物馆"], ["雷恩街", "雷恩街 / 雷恩街"], ["M. LIN", "M. L/IN"], ["已完成", "尚未发生"], ["请保持联系", "请保持保持联系"]];
    let value = text;
    for (const [a, b2] of replacements) value = value.split(a).join(b2);
    const chars = Array.from(value);
    if (chars.length > 8) {
      for (let i = 2 + index % 5; i < chars.length; i += reducedMode ? 25 : 11) {
        if (!/\s/.test(chars[i])) chars[i] = ["", chars[i] + chars[i], chars[i + 1] || "", "/"][i % 4];
      }
    }
    if (!reducedMode && index % 5 === 0 && chars.length > 12) {
      const chunk = chars.splice(3, 4);
      chars.splice(8, 0, ...chunk.reverse());
    }
    return chars.join("");
  }
  function sweep() {
    let index = 0;
    const roots = document.querySelectorAll("#workspace,.topbar,.sidebar,.correspondence,#modal-body,#location-pin,#chat-thread,.chat-header");
    for (const root of roots) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node;
      while (node = walker.nextNode()) {
        const parent = node.parentElement;
        if (!parent || parent.closest('button,a,input,textarea,select,script,style,svg,[role="status"],.sr-only,[data-no-corrupt]') || !node.nodeValue.trim() || node.nodeValue.trim().length < 3) continue;
        if (reducedMode && !parent.closest("h1,h2,h3,strong,.eyebrow,.paper")) continue;
        const old = altered.get(node);
        if (old && old.changed === node.nodeValue) continue;
        const original = node.nodeValue, changed = distortText(original, index++);
        if (original !== changed) {
          altered.set(node, { original, changed });
          node.nodeValue = changed;
        }
      }
    }
    for (const node of altered.keys()) if (!node.isConnected) altered.delete(node);
  }
  function corruptPage(reduced, kind) {
    clearCorruption();
    reducedMode = reduced;
    document.body.classList.add("page-corrupted");
    if (reduced) document.body.classList.add("corruption-reduced");
    const control = document.createElement("button");
    control.id = "corruption-recovery";
    control.type = "button";
    control.textContent = "重新同步界面";
    control.setAttribute("aria-label", "结束文字异常并恢复显示");
    control.addEventListener("click", clearCorruption);
    (document.querySelector("dialog[open]") || document.body).appendChild(control);
    if (!reduced) {
      const field = document.createElement("div");
      field.id = "corruption-field";
      field.setAttribute("popover", "manual");
      field.setAttribute("aria-hidden", "true");
      const label = kind === "arrival" ? "抵达确认已替换 / ARRIVAL REASSIGNED" : "同行对象不唯一 / ASSOCIATED PASSENGER NOT UNIQUE";
      field.innerHTML = '<div class="fracture-band band-one">'.concat(label, ' / LIM / LIM / L/IM / LIM</div><div class="fracture-band band-two">你正在核对的对象也在核对你 / THE OBJECT IS VERIFYING YOU</div><div class="dup-grid" aria-hidden="true"></div><div class="fracture-record">PASSENGER 01　LIM<br>PASSENGER 01　LIM<br>PASSENGER 01　LIM<br>PASSENGER 01　L/IM<br>存在状态：等待你的确认<br>STATUS: AWAITING YOUR CONFIRMATION</div><div class="fracture-bottom">请保持联系　/　PLEASE REMAIN CONNECTED　/　请保持联系</div>');
      document.body.appendChild(field);
      try {
        field.showPopover();
      } catch (e) {
      }
      const grid = field.querySelector(".dup-grid");
      let row = 0;
      const addRow = () => {
        if (!grid || row >= 18) return;
        const line = document.createElement("div");
        line.className = "dup-row";
        const id = String(row + 1).padStart(2, "0");
        line.textContent = "PASSENGER ".concat(id, "  /  LIM  /  LIM  /  L/IM  /  RECORD ACCEPTED");
        line.style.setProperty("--row", row);
        grid.appendChild(line);
        row++;
      };
      for (let i = 0; i < 3; i++) addRow();
      growthTimer = setInterval(addRow, 480);
    }
    sweep();
    distortionTimer = setInterval(sweep, 1100);
    settleTimer = setTimeout(() => document.body.classList.add("corruption-settling"), reduced ? 3e3 : 11e3);
    restoreTimer = setTimeout(clearCorruption, reduced ? 6500 : 21e3);
  }
  function playSignal(kind) {
    var _a2, _b, _c;
    if (kind === "minor-location" || kind === "minor-time") {
      minorSignal(kind);
      return;
    }
    const layer = document.getElementById("screen-signal");
    if (!layer) return;
    const important = ["identity", "arrival", "pressure"].includes(kind);
    if (!important && Date.now() - lastEffectAt < 1400) return;
    lastEffectAt = Date.now();
    clearTimeout(effectTimer);
    clearTimeout(phaseTimer);
    clearCorruption();
    let savedChoice;
    try {
      savedChoice = (_b = (_a2 = JSON.parse(sessionStorage.getItem("night-travel-demo-v2-expanded"))) == null ? void 0 : _a2.v2) == null ? void 0 : _b.reduced;
    } catch (e) {
    }
    const reduced = typeof savedChoice === "boolean" ? savedChoice : !!((_c = window.matchMedia) == null ? void 0 : _c.call(window, "(prefers-reduced-motion: reduce)").matches);
    const message = kind === "arrival" ? "抵达关系：无法求值 / ARRIVAL RELATIONSHIP: UNDEFINED\n对象：LIM / SUBJECT: LIM" : kind === "identity" ? "身份核对循环 / IDENTITY VERIFICATION LOOP\n请勿重复核对 / DO NOT VERIFY AGAIN" : kind === "pressure" ? "关联对象未释放 / ASSOCIATED OBJECT NOT RELEASED\n请完成 / PLEASE COMPLETE" : "位置节点未解析 / LOCATION NODE NOT RESOLVED\n路线：-- / -- / ROUTE: -- / --";
    layer.hidden = false;
    layer.className = "screen-signal " + (reduced ? "reduced-signal signal-notice" : important ? "signal-blackout signal-deep" : "signal-blackout");
    layer.textContent = reduced ? message : important ? "" : kind === "static" ? message : "";
    if (typeof layer.showPopover === "function") {
      try {
        layer.showPopover();
      } catch (e) {
      }
    }
    if (important && !reduced) phaseTimer = setTimeout(() => {
      layer.className = "screen-signal signal-blackout system-check";
      layer.innerHTML = '<span>夜间出行连续性服务 / NIGHT TRAVEL CONTINUITY SERVICE</span><span>正在检查关联乘客 / CHECKING ASSOCIATED PASSENGER</span><span>对象：LIM　　SUBJECT: LIM</span><span>当前记录：2　　EXPECTED RECORDS: 1</span><span class="system-cursor">▮</span>';
    }, 480);
    effectTimer = setTimeout(() => {
      if (typeof layer.hidePopover === "function") {
        try {
          layer.hidePopover();
        } catch (e) {
        }
      }
      layer.hidden = true;
      layer.textContent = "";
      if (important) corruptPage(reduced, kind);
    }, important && !reduced ? 1250 : reduced ? 900 : 550);
  }
  document.addEventListener("keydown", (e) => {
    var _a2;
    if (e.key === "Escape") {
      clearTimeout(phaseTimer);
      clearTimeout(effectTimer);
      const layer = document.getElementById("screen-signal");
      try {
        (_a2 = layer == null ? void 0 : layer.hidePopover) == null ? void 0 : _a2.call(layer);
      } catch (e2) {
      }
      if (layer) layer.hidden = true;
      clearCorruption();
    }
  });
  function stopSignals() {
    clearTimeout(effectTimer);
    clearTimeout(phaseTimer);
    const layer = document.getElementById("screen-signal");
    if (layer) {
      try {
        layer.hidePopover();
      } catch (e) {
      }
      layer.hidden = true;
    }
    clearCorruption();
  }

  // journey/game.js
  var $ = (id) => document.getElementById(id);
  var workspace = $("workspace");
  var dialog = $("modal");
  var SAVE = "night-travel-mobile-v1";
  var gameStarted = false;
  var hasSave = false;
  var state = createState();
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE) || sessionStorage.getItem("night-travel-demo-v2-expanded"));
    if ((saved == null ? void 0 : saved.schema) === 9 && Array.isArray(saved.chat) && Array.isArray(saved.seen) && Array.isArray(saved.asked)) {
      state = __spreadValues(__spreadValues({}, state), saved);
      hasSave = true;
    }
  } catch (e) {
  }
  state = migrateState(state);
  var lastRenderedView = "";
  var svgSource = "";
  var mapRequest = 0;
  var restoreFocus = null;
  var modalKind = "";
  var chatWindow = null;
  var notified = incomingCount(state);
  var notifiedRound = state.round;
  var mapView = { left: 0, top: 0, zoom: false };
  var drafts = { side: "", opening: "", modal: "" };
  var linTimer = null;
  var scheduledMessage = "";
  var _a;
  var lastSignal = ((_a = state.signal) == null ? void 0 : _a.id) || "";
  var button = (text, action, more = "", style = "") => '<button type="button" class="button '.concat(style, '" data-action="').concat(action, '" ').concat(more, ">").concat(text, "</button>");
  var stationName = (id) => {
    const s = stations.find((x) => x[0] === id);
    return s ? "".concat(s[1], " / ").concat(s[2]) : id;
  };
  var heading = (title, description, code = "1408 / JOURNEYS") => '<div class="page-heading"><div><span class="eyebrow">账户服务 / '.concat(state.view === "map" ? "线路查询" : state.view === "support" ? "协助中心" : "行程管理", "</span><h1>").concat(title, "</h1><p>").concat(description, '</p></div><span class="ref">').concat(code, "</span></div>");
  function tell(text) {
    $("announcement").textContent = text;
  }
  function act(type, value) {
    state = transition(state, type, value);
  }
  function persist() {
    if (!gameStarted) return;
    try {
      localStorage.setItem(SAVE, JSON.stringify(state));
      sessionStorage.setItem("night-travel-demo-v2-expanded", JSON.stringify(state));
    } catch (e) {
    }
  }
  function scheduleLin() {
    if (!gameStarted || document.hidden) return;
    const head = state.linQueue[0], key = head ? state.round + ":" + head.id : "";
    if (key === scheduledMessage) return;
    clearTimeout(linTimer);
    scheduledMessage = key;
    if (!head) return;
    const round = state.round;
    linTimer = setTimeout(() => {
      linTimer = null;
      scheduledMessage = "";
      if (!gameStarted || document.hidden || state.round !== round) return;
      act("deliver", head.id);
      refreshLive();
    }, deliveryDelay(head));
  }
  setInterval(() => {
    if (!gameStarted || document.hidden) return;
    const next = transition(state, "lin-read-receipts");
    if (next !== state) {
      state = next;
      updateChatViews();
      persist();
      publish();
    }
  }, 200);
  function runSignal() {
    if (state.signal && state.signal.id !== lastSignal) {
      lastSignal = state.signal.id;
      playSignal(state.signal.kind);
    }
  }
  function refreshLive() {
    renderV2Live();
    renderSide();
    updateChatViews();
    updateSupportOptions();
    persist();
    scheduleLin();
    runSignal();
  }
  function publish() {
  }
  function updateBadges() {
    const unread = Math.max(0, incomingCount(state) - state.linRead);
    document.querySelectorAll("[data-unread]").forEach((n) => {
      n.textContent = unread;
      n.hidden = !unread;
    });
    document.title = (unread ? "(".concat(unread, ") 林发来消息 · ") : "") + "行程与退款 · 夜间出行账户";
    if (!unread) $("lin-toast").hidden = true;
  }
  function markRead() {
    const count = incomingCount(state);
    if (state.linRead >= count) return;
    act("read", count);
    persist();
    updateBadges();
    publish();
  }
  function chatBody() {
    return "".concat(v2ChatTools(), '<div class="lin-thread" id="modal-lin-thread" role="log" aria-label="与林的消息">').concat(conversationHTML(state), '</div><div class="lin-typing" id="modal-lin-typing" role="status">').concat(typingHTML(state), '</div><div class="lin-replies" id="modal-lin-replies">').concat(repliesHTML(state), "</div>").concat(composerHTML(state, "modal", drafts.modal)).concat(state.claim ? button("查看林分享的行程附件", "plan", "", "secondary") : "");
  }
  function updateChatViews() {
    const surfaces = [["friend-messages", "side-lin-replies", "side-lin-typing"], ["opening-thread", "opening-lin-replies", "opening-lin-typing"], ["modal-lin-thread", "modal-lin-replies", "modal-lin-typing"]];
    for (const [threadId, repliesId, typingId] of surfaces) {
      const thread = $(threadId);
      if (!thread) continue;
      const nearBottom = thread.scrollHeight - thread.clientHeight - thread.scrollTop < 70;
      const content = conversationHTML(state);
      if (thread.innerHTML !== content) thread.innerHTML = content;
      if (nearBottom) thread.scrollTop = thread.scrollHeight;
      if ($(repliesId)) $(repliesId).innerHTML = repliesHTML(state);
      if ($(typingId)) $(typingId).innerHTML = typingHTML(state);
    }
    document.querySelectorAll("[data-lin-compose]").forEach((form) => {
      form.querySelector('button[type="submit"]').disabled = linBusy(state) || Boolean(state.ending && !["erasure", "replacement"].includes(state.ending));
      form.querySelector("textarea").disabled = Boolean(state.ending && !["erasure", "replacement"].includes(state.ending));
    });
    $("lin-attachment").hidden = !state.claim;
    $("friend-status").textContent = state.ending === "erasure" && !linBusy(state) ? "等待回复" : linBusy(state) ? "正在输入…" : state.ending ? "23:55 · 刚刚联系" : state.proof ? "23:54 · 刚刚联系" : "在线";
    if (state.opening < 3 || dialog.open && modalKind === "lin") markRead();
    const count = incomingCount(state);
    if (notifiedRound !== state.round) {
      notifiedRound = state.round;
      notified = count;
      $("lin-toast").hidden = true;
    }
    if (count > notified) {
      if (gameStarted) audioIncoming();
      notified = count;
      if (state.opening === 3 && !(dialog.open && modalKind === "lin")) {
        const latest = linMessages(state).filter((m) => m.who === "lin").at(-1);
        $("toast-preview").textContent = latest.text;
        $("toast-time").textContent = latest.time;
        $("lin-toast").hidden = false;
        tell("林发来消息：" + latest.text);
      }
    }
    updateBadges();
    publish();
  }
  function renderSide() {
    $("balance").textContent = state.ending === "refund" ? "£10.70" : "£4.60";
    const evidence = [];
    if (state.plan) evidence.push(["原始路线与换乘回执", "23:28 · 博物馆花园"]);
    if (state.compared) evidence.push(["两个雷恩街", "站点编号与相邻车站不同"]);
    if (state.proof) evidence.push([state.asked.includes("time") ? "已提出时间记录疑问" : "出站匹配凭证", "23:12 / 23:16"]);
    if (state.togetherAsked) evidence.push(["林说你们曾一起出站", "同行关系尚未核实"]);
    if (state.ruleCompared) evidence.push(["更正通知晚于停更时间", "23:59 / 23:30"]);
    $("evidence-count").textContent = evidence.length;
    $("evidence-list").innerHTML = evidence.length ? evidence.map(([name, sub]) => '<p class="evidence-item">'.concat(name, "<small>").concat(sub, "</small></p>")).join("") : '<p class="empty-text">查看记录后，可在这里保留核对结果。</p>';
    $("support-count").hidden = !(state.compared && !state.asked.includes("duplicate"));
    document.querySelectorAll(".nav-button").forEach((b2) => {
      b2.disabled = state.opening < 3;
      const active = b2.dataset.view === state.view || b2.dataset.view === "history" && ["claim", "resolution", "ending"].includes(state.view);
      b2.classList.toggle("active", active);
      if (active) b2.setAttribute("aria-current", "page");
      else b2.removeAttribute("aria-current");
    });
    document.body.classList.toggle("opening-mode", state.opening < 3);
  }
  function renderOpening() {
    return '<div class="opening-heading"><span class="eyebrow">23:48 / MESSAGES</span><h1>林发来了一条消息</h1><p>今天本来是很普通的一天。</p></div><section class="panel opening-conversation"><div class="panel-title"><div class="support-identity"><div class="avatar">林</div><div><h2>林</h2><span class="small-note">在线</span></div></div></div><div class="lin-thread" id="opening-thread" role="log" aria-label="与林的消息">'.concat(conversationHTML(state), '</div><div class="lin-typing" id="opening-lin-typing" role="status">').concat(typingHTML(state), '</div><div class="lin-replies" id="opening-lin-replies">').concat(repliesHTML(state), "</div>").concat(composerHTML(state, "opening", drafts.opening), '</section><p class="small-note">可以输入回复，也可以点选一句话。</p>');
  }
  function renderHistory() {
    return heading("行程与退款", "查看持卡人的近期行程及扣款记录。") + '<div class="shared-note"><strong>林与你分享了一笔行程。</strong><br>“你能不能帮我看一下。退回来请你喝东西。”</div><section class="panel"><div class="panel-title"><h2>最近行程</h2><span class="ref">SEPTEMBER 2026</span></div><div class="journey-row current"><div class="journey-date">14 SEP<br>23:16</div><div class="journey-route">惠特科姆广场 → —<small>Whitcombe Square · 未找到出站记录</small></div><div class="journey-fare">£8.90<small>Incomplete</small></div></div><div class="panel-content"><span class="badge pending">待补全行程</span><p class="small-note">如果扣款与实际行程不符，可以补充下车站后申请退款。</p><div class="actions">'.concat(button(state.claim ? "继续处理退款" : "查看行程并申请退款", "start")).concat(state.claim ? button("查看朋友的附件", "plan", "", "secondary") : "", '</div></div><div class="journey-row"><div class="journey-date">14 SEP<br>09:08</div><div class="journey-route">奥德维克 → 惠特科姆广场<small>Alderwick → Whitcombe Square<br>09:08 — 09:32 · 已完成</small></div><div class="journey-fare">£2.80</div></div><div class="journey-row"><div class="journey-date">13 SEP<br>18:41</div><div class="journey-route">博物馆花园 → 奥德维克<small>Museum Gardens → Alderwick<br>18:41 — 19:03 · 已完成</small></div><div class="journey-fare">£2.80</div></div></section><p class="small-note">只显示本次共享范围内的记录。所有时间均为伦敦当地时间。</p>');
  }
  function renderClaim() {
    return heading("补充下车站", "核对实际行程后，我们将重新计算本次费用。", "NT—008 / OPEN") + '<section class="panel"><div class="panel-title"><h2>9 月 14 日 · 夜间行程</h2><span class="badge pending">待补全</span></div><div class="panel-content"><div class="detail-grid"><div><span>已扣金额</span><strong class="amount">£8.90</strong></div><div><span>预计可退金额</span><strong class="amount">£6.10</strong></div></div><div class="timeline"><div class="timeline-item"><strong>惠特科姆广场 / Whitcombe Square</strong><span>23:16 · 进站记录有效</span></div><div class="timeline-item"><strong>博物馆花园 / Museum Gardens</strong><span>23:28 · 换乘记录有效</span></div><div class="timeline-item missing"><strong>尚未确认下车站</strong><span>等待持卡人补充</span></div></div><form id="claim-form"><label for="exit-station">您最后一次离开的车站</label><select id="exit-station" required><option value="">请选择车站</option><option value="alderwick">奥德维克 / Alderwick</option><option value="28">雷恩街 / Wren Street · 记录 A</option><option value="43">雷恩街 / Wren Street · 记录 B</option><option value="unknown">我无法确认下车站</option></select><p class="small-note">候选记录由本次行程自动匹配，尚待核对。</p>'.concat(state.formMessage ? '<p class="form-feedback" role="status">'.concat(state.formMessage, "</p>") : "", '<div class="actions"><button class="button" type="submit">核对出站记录</button>').concat(button("查看线路图", "nav", 'data-view="map"', "secondary"), '</div></form></div></section><div class="actions">').concat(button("查看原始附件", "plan", "", "quiet")).concat(button("联系在线客服", "nav", 'data-view="support"', "quiet"), "</div>");
  }
  function stationDetailBase() {
    const id = state.selected, name = stationName(id);
    if (!state.seen.includes(id)) return "<h3>车站详情</h3><p>点击地图上的站点，或选择车站查看。</p>";
    if (id === "28") return "<h3>".concat(name, "</h3><p>站点编号：CR–28</p><p>相邻车站：惠特科姆广场 ↔ 博物馆花园</p><p>Whitcombe Square ↔ Museum Gardens</p><p>所属区域：Zone 2</p><p>行程当日记录：雷恩街 / Wren Street</p>");
    if (id === "43") return "<h3>".concat(name, '</h3><p>站点编号：NT–00</p><p>相邻车站：博物馆花园 ↔ 边界路</p><p>Museum Gardens ↔ Boundary Road</p><p>所属区域：Zone 1</p><p>行程当日记录：此区间没有车站 <button class="clue-question" data-action="missing-question" aria-label="询问此区间为什么没有车站">?</button></p>').concat(state.mapVersion === "archive" ? "<p>此记录来自当前候选列表，未显示于存档线路图。</p>" : "");
    if (id === "44") return "<h3>???</h3><p>站点编号：……—0</p><p>所属线路：未标注</p><p>位置数据暂不可用。请勿重复请求定位。</p>";
    if (id === "06") return '<h3>斯蒂尔韦尔 / Stillwell</h3><p>站点编号：AL–06</p><p>相邻车站：博物馆花园 ↔ 牛津庭院</p><p>本站未包含在原定返程路线中。</p><p class="faint-record">最近查询状态：等待 · STAY STILL</p>' + button("问问林是否见过这个站", "lin-topic", 'data-topic="stillwell"', "quiet");
    const extra = id === "05" ? "皇冠线 / 阿尔德线换乘站 · 本次行程有有效换乘记录" : id === "01" ? "朋友提供的原定下车站" : id === "23" ? "本次行程的进站站点" : id === "03" ? "阿尔德线 / 沼泽线换乘站 · 图上未标注站名" : "图示车站";
    return "<h3>".concat(esc(name), "</h3><p>站点编号：ST–").concat(id, "</p><p>").concat(extra, "</p>");
  }
  function stationDetail() {
    return stationDetailBase() + (state.seen.includes(state.selected) ? stationNoteHTML(state.selected) : "");
  }
  function renderMap() {
    const both = state.seen.includes("28") && state.seen.includes("43");
    const hasCandidate = duplicateKnown(state);
    const available = stations.filter(([id]) => state.mapVersion === "current" || !["43", "44"].includes(id));
    return heading("线路查询", "点击车站查看详情，也可以核对行程当日的线路图。", "NETWORK / 1—3") + '<div class="map-controls"><div class="segmented" role="group" aria-label="线路图版本"><button data-action="version" data-version="current" aria-pressed="'.concat(state.mapVersion === "current", '" class="').concat(state.mapVersion === "current" ? "active" : "", '">当前线路图</button><button data-action="version" data-version="archive" aria-pressed="').concat(state.mapVersion === "archive", '" class="').concat(state.mapVersion === "archive" ? "active" : "", '">行程当日</button></div>').concat(button(mapView.zoom ? "适应屏幕" : "放大地图", "zoom", 'aria-pressed="'.concat(mapView.zoom, '"'), "quiet"), '</div><div id="network-map" class="map-wrapper ').concat(mapView.zoom ? "zoom" : "", '"><p style="color:#172b52;padding:20px">正在载入线路图…</p></div><div class="map-caption"><span>').concat(state.mapVersion === "archive" ? "存档 · 14 SEP / 23:10" : "当前服务版本", '</span><span>默认显示全图 · 放大后可拖动</span></div><div class="station-tools"><section class="panel"><div class="panel-content"><form id="station-form"><label for="station-select">查找车站</label><select id="station-select">').concat(available.map(([id]) => '<option value="'.concat(id, '" ').concat(state.selected === id ? "selected" : "", ">").concat(esc(stationName(id))).concat(id === "28" ? " · A" : id === "43" ? " · B" : "", "</option>")).join(""), '</select><div class="actions"><button class="button secondary" type="submit">查看站点</button></div></form>').concat(state.claim ? '<p class="small-note">退款记录中的两个候选站：</p><div class="actions">'.concat(button("雷恩街 · A", "inspect", 'data-station="28"', "quiet")).concat(button("雷恩街 · B", "inspect", 'data-station="43"', "quiet"), "</div>") : "", '</div></section><section class="panel"><div class="panel-content station-detail">').concat(stationDetail(), "</div></section></div>").concat(state.claim ? '<section class="panel"><div class="panel-title"><h2>候选站点核对</h2><span class="badge">'.concat(state.compared ? "已保留记录" : Number(state.seen.includes("28")) + Number(state.seen.includes("43")) + " / 2", '</span></div><div class="panel-content"><p class="small-note">两条候选记录使用了同一个站名。可直接询问林或客服，再核对它们的位置。</p>').concat(both ? '<div class="comparison"><div><strong>雷恩街 A · CR–28</strong><p>惠特科姆广场<br>↔ 博物馆花园</p><p>存档中已有此站</p></div><div><strong>雷恩街 B · NT–00</strong><p>博物馆花园<br>↔ 边界路</p><p>存档中没有此站</p></div></div>' : "", '<div class="actions">').concat(button("问客服：为什么有两个雷恩街？", "submit-duplicate", hasCandidate ? "" : "disabled")).concat(button("问林：你也看到两个同名站了吗？", "lin-topic", 'data-topic="duplicate" '.concat(hasCandidate ? "" : "disabled"), "secondary")).concat(button("查看朋友的路线", "plan", "", "secondary"), "</div></div></section>") : "");
  }
  async function mountMap() {
    var _a2, _b;
    const serial = ++mapRequest;
    try {
      if (!svgSource) svgSource = networkSVG;
      if (state.view !== "map" || state.ending || serial !== mapRequest) return;
      const doc = new DOMParser().parseFromString(svgSource, "image/svg+xml"), root = doc.documentElement;
      root.setAttribute("aria-label", state.mapVersion === "archive" ? "行程当日线路图" : "当前线路图");
      if (state.mapVersion === "archive") for (const id of ["43", "44"]) {
        (_a2 = root.querySelector("#station-" + id)) == null ? void 0 : _a2.remove();
        (_b = root.querySelector("#label-" + id)) == null ? void 0 : _b.remove();
      }
      for (const [id] of stations) {
        const g = root.querySelector("#station-" + id);
        if (!g) continue;
        const marker = g.firstElementChild;
        let x, y;
        if (marker.tagName === "circle") {
          x = Number(marker.getAttribute("cx"));
          y = Number(marker.getAttribute("cy"));
        } else {
          const match = marker.getAttribute("d").match(/M\s*([\d.]+)[ ,]+([\d.]+)/);
          if (!match) continue;
          x = +match[1];
          y = +match[2];
        }
        const target = doc.createElementNS("http://www.w3.org/2000/svg", "circle");
        target.setAttribute("cx", x);
        target.setAttribute("cy", y);
        target.setAttribute("r", "21");
        target.setAttribute("fill", "transparent");
        target.setAttribute("class", "station-hit");
        g.appendChild(target);
        g.setAttribute("role", "button");
        g.setAttribute("tabindex", "0");
        g.setAttribute("aria-label", stationName(id) + "，查看车站");
        g.setAttribute("data-action", "inspect");
        g.setAttribute("data-station", id);
        if (id === state.selected && state.seen.includes(id)) g.classList.add("selected");
      }
      $("network-map").replaceChildren(document.importNode(root, true));
      $("network-map").scrollLeft = mapView.left;
      $("network-map").scrollTop = mapView.top;
    } catch (e) {
      if ($("network-map")) $("network-map").innerHTML = '<p style="color:#172b52;padding:20px">线路图暂时无法载入。仍可通过下方车站查询核对记录。</p>';
    }
  }
  function addChat(question, answer, attachment = false) {
    state.chat.push({ who: "me", text: question }, { who: "agent", text: answer, attachment });
  }
  function pendingCheck() {
    if (!state.plan) return button("核对林发来的原始附件", "plan");
    if (!state.togetherAsked) return button("附件显示未出站，问问林", "lin-topic", 'data-topic="together"');
    if (!duplicateKnown(state)) return button("查看候选站点", "nav", 'data-view="map"');
    if (!state.asked.includes("duplicate")) return button("为什么有两个一模一样的站名？", "ask", 'data-question="duplicate"');
    if (!state.proof) return button("查看出站匹配凭证", "proof");
    if (!state.asked.includes("time")) return button("核对凭证时间", "proof");
    if (!state.ruleCompared) return button("查看乘客安全须知", "rules");
    if (!state.linChecked) return button("问问林现在的情况", "open-chat");
    if (!state.v2.shared || !state.v2.routeChecked) return button("对照共享位置与客服路线", "v2-location");
    if (state.v2.hotline < 2) return button("尝试夜间帮助热线", "v2-call");
    return linBusy(state) ? '<p class="small-note">林正在回复你的消息…</p>' : "";
  }
  function supportOptions() {
    if (investigation(state).rescued) return expansionEntry(state);
    if (!state.claim) return button("查看 14 日的未完成行程", "start");
    let options = v2SupportOptions() + expansionEntry(state);
    if (state.proof && state.v2.refusals < 3) options += button("仍无法确认到达，保留行程", "v2-refuse", "", "secondary");
    if (!state.asked.includes("where")) options += button("我找不到正确的下车站", "ask", 'data-question="where"');
    options += pendingCheck();
    if (duplicateKnown(state) && !state.asked.includes("duplicate")) options += button("地图上为什么有两个雷恩街？", "ask", 'data-question="duplicate"', "secondary");
    if (state.asked.includes("duplicate") && state.proof) options += button("重新查看出站凭证", "proof", "", "secondary");
    if (state.asked.includes("time")) options += button("查阅安全须知的更正说明", "rules", "", "secondary");
    if (canResolve(state)) options += '<p class="decision-label">请选择本次行程的处理方式</p>'.concat(button("保留原始行程，申请返回", "request-preserve", "", "secondary"));
    return options + '<p class="chat-note">选择一条消息继续会话。</p>';
  }
  function updateSupportOptions() {
    const options = $("support-options");
    if (options) options.innerHTML = supportOptions();
  }
  function supportText(item) {
    if (item.text.includes("请不要反复核对同一位同行人员")) return esc(item.text).replace("请不要反复核对同一位同行人员", '<button type="button" class="rule-probe-link" data-action="v2-rule-probe">请不要反复核对同一位同行人员</button>');
    if (!item.leakUntil || Date.now() >= item.leakUntil) return item.text;
    return item.text.replace("行程", '<span class="terminology"><span class="term-leak">副本</span><span class="term-normal">行程</span></span>');
  }
  function renderSupport() {
    const log = state.chat.length ? state.chat : [{ who: "agent", text: "您好，夜间账户服务为您提供协助。请问您需要处理哪笔行程？" }];
    return heading("在线客服", "与夜间账户服务核对本次行程。", "CASE / NT—008") + '<section class="panel"><div class="panel-title"><div class="support-identity"><div class="operator-avatar">N08</div><div><h2>夜间账户服务</h2><span class="small-note">正在处理你的请求</span></div></div><span class="badge">会话已连接</span></div><div class="chat-log" id="chat-log" role="log" aria-label="客服聊天记录">'.concat(log.map((item) => '<div class="chat-line '.concat(item.who === "me" ? "me" : "", '"><span class="who">').concat(item.who === "me" ? "你" : "夜间账户服务", "</span><p>").concat(supportText(item), "</p>").concat(item.attachment ? '<button class="receipt-link" data-action="proof">↳ 出站匹配凭证 · NT-008-R<br><small>查看文件</small></button>' : "", "</div>")).join(""), '</div><div class="chat-options" id="support-options">').concat(supportOptions(), "</div></section>");
  }
  function renderResolution() {
    if (investigation(state).rescued) return investigationHTML(__spreadProps(__spreadValues({}, state), { v3: __spreadProps(__spreadValues({}, investigation(state)), { panel: "aftermath" }) }));
    if (state.v2.checkpoint) return v2Checkpoint();
    return v2ReturnTools() + heading("保留原始行程", "请指定最后一次能够确认的车站。", "NT—008 / RETAINED") + '<div class="shared-note">夜间账户服务：可以保留本次行程。返回请求需要匹配一条有效刷卡记录。费用将在行程结束后重新核算。</div><section class="panel"><div class="panel-title"><h2>提交返回请求</h2><span class="badge pending">原行程尚未关闭</span></div><div class="panel-content"><p>请使用持卡人提供的原始记录。原定目的地可能尚未到达。</p><form id="return-form"><label for="return-station">最近一次已确认的车站</label><select id="return-station" required><option value="">选择车站</option><option value="alderwick">奥德维克 / Alderwick</option><option value="museum">博物馆花园 / Museum Gardens</option><option value="wren">雷恩街 / Wren Street</option><option value="whitcombe">惠特科姆广场 / Whitcombe Square</option></select>'.concat(state.formMessage ? '<p class="form-feedback" role="status">'.concat(state.formMessage, "</p>") : "", '<div class="actions"><button class="button" type="submit">保留行程并请求返回</button>').concat(button("核对原始附件", "plan", "", "secondary"), '</div></form><p class="tip">关闭原行程后，将无法使用本次进站记录申请返回。</p></div></section>');
  }
  function renderEnding() {
    return expansionEnding(state) || v2Ending();
  }
  function render() {
    document.body.dataset.view = state.view;
    if (lastRenderedView !== state.view) {
      workspace.scrollTop = 0;
      lastRenderedView = state.view;
    }
    const previousMap = $("network-map");
    if (previousMap) {
      mapView.left = previousMap.scrollLeft;
      mapView.top = previousMap.scrollTop;
    }
    renderSide();
    workspace.innerHTML = state.ending ? renderEnding() : ({ opening: renderOpening, history: renderHistory, claim: renderClaim, map: renderMap, support: renderSupport, resolution: renderResolution }[state.view] || renderHistory)();
    if (state.view === "map" && !state.ending) mountMap();
    renderV2Live();
    if (state.opening < 3) {
      const thread = $("opening-thread");
      if (thread) thread.scrollTop = thread.scrollHeight;
    }
    const chat = $("chat-log");
    if (chat) chat.scrollTop = chat.scrollHeight;
    persist();
    updateChatViews();
    scheduleLin();
    runSignal();
  }
  function modal(title, body, category = "行程档案", kind = "document") {
    restoreFocus = document.activeElement;
    modalKind = kind;
    dialog.dataset.kind = kind;
    document.body.classList.add("has-modal");
    $("modal-category").textContent = kind === "lin" ? "林 · 消息" : category;
    $("modal-body").innerHTML = "<h2>".concat(title, "</h2>").concat(body);
    $("modal-body").scrollTop = 0;
    if (!dialog.open) dialog.showModal();
  }
  function closeModal(userInitiated = false) {
    dialog.close();
    modalKind = "";
    document.body.classList.remove("has-modal");
    if (restoreFocus == null ? void 0 : restoreFocus.isConnected) restoreFocus.focus({ preventScroll: true });
  }
  function openChat() {
    act("v2-chat-open");
    refreshLive();
    modal("林", chatBody(), "MESSAGES / 23:48 — 23:55", "lin");
    markRead();
    const thread = $("modal-lin-thread");
    thread.scrollTop = thread.scrollHeight;
  }
  function openChatWindow() {
    openChat();
  }
  function showPlan() {
    if (state.ending === "reference") {
      modal("附件已同步", "<p>原始换乘回执已被一致版本覆盖。当前版本没有可用于返回的通道编号。</p>" + button("关闭", "close"), "统一记录");
      return;
    }
    if (state.opening < 3) return;
    act("plan");
    render();
    modal("林分享的行程附件", '<span class="eyebrow">01 / 出发前保存的路线 · 14 SEP 23:10</span><div class="paper"><strong>惠特科姆广场 → 奥德维克</strong><p>Whitcombe Square → Alderwick<br>约 24 分钟 · 1 次换乘</p><div class="timeline"><div class="timeline-item"><strong>惠特科姆广场 / Whitcombe Square</strong><span>皇冠线 / Crown line</span></div><div class="timeline-item"><strong>雷恩街 / Wren Street</strong><span>CR–28 · 途经站</span></div><div class="timeline-item"><strong>博物馆花园 / Museum Gardens</strong><span>换乘阿尔德线，向奥德维克方向</span></div><div class="timeline-item"><strong>奥德维克 / Alderwick</strong><span>原定下车站</span><button class="unexited-clue" data-action="lin-topic" data-topic="together">未出站 · 询问林 ↗</button></div></div><small>保存在林的手机中 · 23:10</small></div><span class="eyebrow">02 / 原始换乘回执</span><div class="paper"><strong>TRANSFER ACCEPTED / 换乘有效</strong><div class="paper-line">CARD: •••• 1408<br>14 SEP 2026 / 23:28<br>博物馆花园 / MUSEUM GARDENS<br>READER: MG-04<br>STATUS: VALID</div><p>请保留本回执至行程结束。</p></div><p class="small-note">此附件为朋友发送的副本，不会随线路查询页面更新。</p>'.concat(button("返回核对", "close")), "共享附件 / M. LIN");
    tell("原始路线和换乘回执已加入核对记录。");
  }
  function showProof() {
    if (!state.asked.includes("duplicate")) return;
    if (!state.proof) {
      act("proof");
      refreshLive();
    }
    modal("出站匹配凭证", '<p>夜间账户服务提供 · 14 SEP 2026</p><div class="paper"><strong>JOURNEY MATCH / NT-008-R</strong><table class="receipt-table"><tr><th>持卡人</th><td>M. LIN</td></tr><tr><th>卡号末位</th><td>1408</td></tr><tr><th>本次进站</th><td>14 SEP · 23:16<br>惠特科姆广场 / Whitcombe Square</td></tr><tr><th>匹配出站</th><td>14 SEP · 23:12 <button type="button" class="clue-question" data-action="time-question" aria-label="核对这个时间">?</button><br>雷恩街 / Wren Street · NT–00</td></tr><tr><th>核验依据</th><td>姓名与卡号一致</td></tr><tr><th>处理方式</th><td>确认后代入原行程</td></tr></table><p>确认后将关闭原行程。原始进站记录不再用于返回申请。</p><small>所有时间均为伦敦当地时间。</small></div><div class="actions">'.concat(button("返回会话", "close", "", "secondary"), "</div>"), "夜间账户服务 / 匹配记录");
  }
  function missingQuestion() {
    modal("此区间没有车站？", '<p>行程当日，博物馆花园与边界路之间没有可供乘客停靠的站台。当前版本却在同一区间标注了雷恩街。</p><div class="actions">'.concat(button("问林：你在那里看到了什么？", "lin-topic", 'data-topic="missing"')).concat(button("问客服：这个站哪里来的？", "ask", 'data-question="missing"', "secondary"), '</div><p class="small-note">乘客安全须知：站台具有完整的照明与候车人员，不代表它对外开放。</p>'), "站点核对");
  }
  function showRules() {
    if (!state.proof) return;
    act("rules");
    persist();
    modal("乘客安全须知", '<section class="rule-excerpt"><span class="eyebrow">原安全提示 / 夜间出行信息处</span><p>'.concat(timeGuidance.platform, '</p><p>请在进站前记录出发站、原定换乘站及预计乘车时间。请勿修改原有记录。</p></section><section class="rule-excerpt amended-rule"><span class="eyebrow">补充更正 / 乘客接返办公室 / 23:59</span><h3>').concat(timeGuidance.title, "</h3><p>").concat(timeGuidance.normal, "</p><p>").concat(timeGuidance.detail, "</p><p>").concat(timeGuidance.last, '</p></section><section class="rule-excerpt"><span class="eyebrow">页面维护记录 / 23:30</span><p>').concat(timeGuidance.maintenance, '</p></section><div class="actions">').concat(button("这条更正在停止更新之后发布", "rule-compare")).concat(button("查看其他相关规则", "v2-rules", "", "secondary")).concat(button("返回会话", "close", "", "secondary"), '</div><p class="small-note"><button class="text-button" data-action="full-rules">阅读完整安全须知</button></p>'), "NT—008 / 行程时间");
  }
  function ask(q) {
    if (state.asked.includes(q)) {
      if (dialog.open) closeModal();
      state.view = "support";
      render();
      return;
    }
    if (q === "where" && state.claim) addChat("我找不到正确的下车站。", "候选站点依据您的账户记录生成。请核对两个雷恩街 / Wren Street。姓名与卡号匹配的乘客，应当具有可以确认的终点。");
    else if (q === "duplicate" && duplicateKnown(state)) {
      addChat("为什么地图上有两个雷恩街？它们是同一个站吗？", "我们正在核对林的行程。两处名称一致，便于同一批次乘客继续识别原有目的地。站点的具体位置不影响账户结算。请查看出站凭证。", true);
      state.chat.at(-1).leakUntil = Date.now() + 850;
    } else if (q === "missing" && state.claim) addChat("行程当日这两站之间没有车站，新的雷恩街是哪里来的？", "该站尚未完成对外准备。已到达的乘客不受此状态影响。请勿要求乘客描述站台之外的环境。");
    else if (q === "time" && state.proof) addChat("出站时间是 23:12，进站是 23:16。为什么出站在进站之前？", "我们的数据是完全正确的。到达已完成，出发将按顺序补齐。请查看《乘客安全须知》中关于行程时间的更正。您无需为记忆与记录之间的差异承担额外费用。");
    else if (q === "rules" && state.ruleCompared) addChat("页面 23:30 就停止更新了，为什么有一条 23:59 的更正？", "通知的发布时间不会晚于您被确认到达的时间。如您无法确认，请以已完成的记录为准。请不要反复核对同一位同行人员。");
    else return;
    act("ask", q);
    if (dialog.open) closeModal();
    state.view = "support";
    render();
  }
  function reset() {
    clearCorruption();
    if (dialog.open) closeModal();
    clearTimeout(linTimer);
    scheduledMessage = "";
    state = createState();
    Object.assign(drafts, { side: "", opening: "", modal: "" });
    Object.assign(mapView, { left: 0, top: 0, zoom: false });
    render();
    workspace.focus();
  }
  function reply(step, text) {
    act("opening", text ? { step, text } : step);
    render();
    if (state.opening === 3 && dialog.open && modalKind === "lin") closeModal();
  }
  function checkLin() {
    act("check-lin");
    refreshLive();
  }
  function linTopic(topic2) {
    const questions = { together: "附件里奥德维克标着未出站，你到底出去了吗？", memory: "我不记得我们一起坐过。", duplicate: "地图上有两个一模一样的雷恩街，你那边也是吗？", missing: "地图上这两站之间没有车站，你那边看到了什么？", stillwell: "你今天去过斯蒂尔韦尔吗？" };
    act("lin-topic", { topic: topic2, question: questions[topic2] || topic2 });
    refreshLive();
    openChat();
  }
  function sendLinText(text) {
    text = String(text).trim().slice(0, 320);
    if (!text || state.ending && !["erasure", "replacement"].includes(state.ending) || linBusy(state)) return false;
    if (state.opening < 3) reply(state.opening, text);
    else {
      act("lin-text", text);
      refreshLive();
    }
    return true;
  }
  function onAction(b2) {
    const a = b2.dataset.action;
    if (a === "full-rules") {
      modal("乘客安全须知", safetyHTML, "NIGHT TRAVEL / 规则档案");
      return;
    }
    if (a === "mobile-evidence") {
      modal("本次核对", $("evidence-list").innerHTML, "1408 / 已保留记录");
      return;
    }
    if (a === "mobile-menu") {
      openMenu();
      return;
    }
    if (a.startsWith("v3-")) {
      handleV3(a, b2.dataset.value);
      return;
    }
    if (a.startsWith("v2-")) {
      handleV2(a, b2.dataset.value);
      return;
    }
    if (a === "nav") {
      act("nav", b2.dataset.view);
      render();
      workspace.focus();
    } else if (a === "start") {
      act("start");
      state.formMessage = "";
      render();
      workspace.focus();
    } else if (a === "plan") showPlan();
    else if (a === "close") closeModal(true);
    else if (a === "open-chat") openChat();
    else if (a === "popout") openChatWindow();
    else if (a === "lin-reply") reply(Number(b2.dataset.step));
    else if (a === "check-lin") checkLin();
    else if (a === "lin-topic") linTopic(b2.dataset.topic);
    else if (a === "missing-question") missingQuestion();
    else if (a === "rules") showRules();
    else if (a === "rule-compare") {
      act("rule-compare");
      ask("rules");
    } else if (a === "dismiss-toast") $("lin-toast").hidden = true;
    else if (a === "inspect") {
      act("inspect", b2.dataset.station);
      render();
      tell("已查看 " + stationName(b2.dataset.station) + "。");
    } else if (a === "version") {
      act("mapVersion", b2.dataset.version);
      render();
    } else if (a === "zoom") {
      mapView.zoom = !mapView.zoom;
      $("network-map").classList.toggle("zoom", mapView.zoom);
      b2.textContent = mapView.zoom ? "适应屏幕" : "放大地图";
      b2.setAttribute("aria-pressed", String(mapView.zoom));
    } else if (a === "compare") {
      act("compare");
      render();
      tell("不同站点的核对结果已保存。");
    } else if (a === "submit-duplicate") ask("duplicate");
    else if (a === "ask") ask(b2.dataset.question);
    else if (a === "proof") showProof();
    else if (a === "time-question") modal("时间记录", '<div class="paper"><p>进站记录　14 SEP · 23:16</p><p>匹配出站　14 SEP · 23:12</p><small>同一持卡人 · 伦敦当地时间</small></div><div class="actions">'.concat(button("请客服解释这两个时间", "ask", 'data-question="time"')).concat(button("再看一下凭证", "proof", "", "secondary"), "</div>"), "凭证核对");
    else if (a === "request-preserve") {
      act("preserve");
      state.formMessage = "";
      render();
      workspace.focus();
    } else if (a === "hint") hint();
    else if (a === "restart") {
      if (state.ending) reset();
      else modal("重新开始这笔行程？", '<p>将清空这次行程的核对记录，并回到林发来第一条消息的时候。</p><div class="actions">'.concat(button("重新开始", "reset-confirm")).concat(button("继续当前进度", "close", "", "secondary"), "</div>"), "行程控制");
    } else if (a === "reset-confirm") reset();
  }
  setInterval(() => {
    if (chatWindow == null ? void 0 : chatWindow.closed) {
      chatWindow = null;
      tell("独立聊天窗口已关闭，仍可在此页查看林的消息。");
    } else publish();
  }, 3e3);
  document.addEventListener("click", (e) => {
    const b2 = e.target.closest("[data-action]");
    if (b2 && !b2.disabled) {
      e.preventDefault();
      onAction(b2);
    }
  });
  document.addEventListener("keydown", (e) => {
    if (["Enter", " "].includes(e.key)) {
      const b2 = e.target.closest('[role="button"][data-action]');
      if (b2) {
        e.preventDefault();
        onAction(b2);
      }
    }
  });
  document.addEventListener("input", (e) => {
    if (e.target.dataset.linInput) drafts[e.target.dataset.linInput] = e.target.value;
  });
  document.addEventListener("keydown", (e) => {
    var _a2, _b;
    if (((_b = (_a2 = e.target).matches) == null ? void 0 : _b.call(_a2, "[data-lin-input]")) && e.key === "Enter" && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      if (!linBusy(state)) e.target.form.requestSubmit();
    }
  });
  document.addEventListener("submit", (e) => {
    e.preventDefault();
    if (e.target.dataset.linCompose) {
      const name = e.target.dataset.linCompose, input = e.target.querySelector("textarea");
      const text = input.value;
      if (sendLinText(text)) {
        drafts[name] = "";
        const current = $("lin-input-" + name);
        if (current) {
          current.value = "";
          current.focus();
        }
      }
      return;
    }
    if (e.target.id === "claim-form") {
      const station = $("exit-station").value;
      if (station === "alderwick") {
        state.formMessage = "没有找到奥德维克的有效出站记录。系统匹配到两个雷恩街；请核对线路图，或联系在线客服。";
        render();
      } else if (station === "unknown") {
        state.view = "map";
        render();
      } else if (["28", "43"].includes(station)) {
        act("inspect", station);
        state.view = "map";
        render();
        tell("请核对这条候选记录的站点位置。");
      }
    } else if (e.target.id === "station-form") {
      act("inspect", $("station-select").value);
      render();
    } else if (e.target.id === "return-form") {
      const station = $("return-station").value;
      if (station !== "museum") {
        state.formMessage = "该站不是本次行程最近一次有效换乘记录。请核对原始附件中的站名和时间。";
        render();
      } else {
        act("return", station);
        render();
        workspace.focus();
      }
    }
  });
  dialog.addEventListener("cancel", (e) => {
    e.preventDefault();
    closeModal(true);
  });
  dialog.addEventListener("close", () => {
    modalKind = "";
    document.body.classList.remove("has-modal");
  });
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeModal(true);
    }
  });
  setupV2();
  initStartScreen();
  var erasureQuietAt = 0;
  setInterval(() => {
    if (!gameStarted || state.ending !== "erasure" || linBusy(state)) {
      erasureQuietAt = 0;
      return;
    }
    if ((state.v2.erasureStep || 0) >= 12 || document.hidden) return;
    if (!erasureQuietAt) {
      erasureQuietAt = Date.now();
      return;
    }
    if (Date.now() - erasureQuietAt < 2400) return;
    act("v2-erasure-tick");
    if (state.v2.erasureStep >= 12) render();
    else refreshLive();
    publish();
  }, 90);
  function v2ChatTools() {
    if (state.ending === "erasure") return "";
    if (state.ending === "replacement") return '<p class="small-note">接返关联仍在线。</p>';
    return '<details class="chat-extra"><summary>位置、附件与更多话题</summary><div class="v2-chat-tools">'.concat(!state.ending ? button("暂时结束聊天", "v2-end-chat", "", "end-conversation") : "").concat(button("共享位置", "v2-location", "", "quiet")).concat(button("问换乘经过", "v2-topic", 'data-value="你换乘时下车了吗？"', "quiet")).concat(button("先别退款了", "v2-topic", 'data-value="先别退款了，你先出来。"', "quiet")).concat(button("发张照片看看", "v2-topic", 'data-value="发张照片看看"', "quiet")).concat(state.v2.photo ? button("查看换乘照片", "v2-photo", "", "quiet") : "").concat(button("你真的是林吗？", "v2-topic", 'data-value="你真的是林吗？"', "quiet"), "</div></details>");
  }
  function renderV2Live() {
    var _a2;
    renderLocationPin();
    if (modalKind === "investigation") {
      const field = $("v3-channel"), code = field == null ? void 0 : field.value, focused = document.activeElement === field, expanded = (_a2 = $("modal-body").querySelector("details")) == null ? void 0 : _a2.open;
      $("modal-body").innerHTML = investigationHTML(state);
      if (code && $("v3-channel")) $("v3-channel").value = code;
      if (focused && $("v3-channel")) $("v3-channel").focus();
      if (expanded && $("modal-body").querySelector("details")) $("modal-body").querySelector("details").open = true;
    }
    const side = $("v2-side-tools");
    if (side) side.innerHTML = state.claim ? "".concat(button("查看共享位置", "v2-location", "", "secondary")).concat(!state.ending ? button(state.v2.chatPaused ? "重新联系林" : "暂时结束聊天", state.v2.chatPaused ? "open-chat" : "v2-end-chat", "", "end-conversation") : "", '<p class="small-note">').concat(state.v2.shared ? "林正在与你共享位置" : "可请求林共享位置", "</p>") : "";
    if (modalKind === "location") {
      $("modal-body").innerHTML = locationHTML();
      updateLocationTelemetry();
    }
    if (modalKind === "hotline") $("modal-body").innerHTML = hotlineHTML();
    const status = $("v2-live-note");
    if (status) status.textContent = state.v2.stability < 2 ? "消息偶有缺失 · 连接保持中" : "联系保持中";
  }
  function locationHTML() {
    const v = state.v2;
    const n = v.observation;
    return '<h2>林的位置</h2><p class="small-note">接收林的位置不会共享你的位置。</p><p class="small-note">'.concat(v.shared ? "位置共享中 · 地下定位精度较低" : "等待开启位置共享", '</p><div class="location-map" aria-label="故事中的站内位置示意，不读取真实定位"><svg viewBox="0 0 640 340" role="img" aria-label="博物馆花园附近，林的位置与接返预计路线"><rect width="640" height="340" fill="#101d2a"/><g stroke="#25384a" stroke-width="25" fill="none"><path d="M0 70H270L390 190H640M100 0V340M450 0V340M0 290H640"/></g><path d="M40 210H240L310 140H540" fill="none" stroke="#55769c" stroke-width="3" stroke-dasharray="6 8"/><g fill="#bdcddd" font-size="17" font-family="sans-serif"><text x="30" y="46">博物馆花园</text><text x="430" y="118">雷恩街</text><text x="440" y="322">旧换乘通道 · MG-04</text></g><circle data-live-accuracy cx="280" cy="190" r="').concat(n ? 42 : 82, '" fill="#568fed" opacity=".12"/><circle data-live-lin cx="280" cy="190" r="14" fill="#9dc1ff" stroke="#fff" stroke-width="3"/><text data-live-label x="280" y="166" text-anchor="middle" fill="#fff" font-size="18">林</text>').concat(n >= 2 ? '<circle data-live-expected cx="'.concat(360 + (n - 2) * 110, '" cy="140" r="11" fill="#e0bb76"/><text data-live-expected-label x="').concat(360 + (n - 2) * 110, '" y="174" text-anchor="middle" fill="#e0bb76" font-size="15">接返预计位置</text>') : "").concat(v.ownLocation ? '<circle cx="306" cy="201" r="10" fill="#97d6b4"/><text x="315" y="224" fill="#97d6b4" font-size="17">你</text>' : "", '</svg></div><div class="location-meta"><span>林的设备<br><strong>').concat(n >= 2 ? "已停止移动" : "定位接收中", "</strong></span><span>最近更新<br><strong data-live-time>").concat(["尚未查询", "23:51:08", "23:51:42", "23:52:16"][n], "</strong></span><span>预计步行<br><strong>").concat(v.violations.includes("shortcut") ? "3 分钟" : "18 分钟", "</strong></span></div>").concat(n >= 2 ? '<p class="notice">黄色标记来自账户接返服务；蓝色标记来自林的设备。两者使用不同数据来源。</p>' : "", '<div class="actions">').concat(v.shared ? button(v.pinned ? "取消固定小窗" : "固定位置小窗", "v2-pin", "", "secondary") : "").concat(v.shared ? button(n >= 3 ? "查看最后一次位置" : "请求更新位置", "v2-observe", n >= 3 ? "disabled" : "") : button("请林共享位置", "v2-share")).concat(button(v.ownLocation ? "我的位置已交给接返服务" : v.ownDeclined ? "重新查看位置授权" : "共享我的位置…", "v2-own-review", v.ownLocation ? "disabled" : "", "secondary")).concat(button("换乘照片附件", "v2-photo", "", "secondary")).concat(button("回到聊天", "open-chat", "", "quiet"), "</div>").concat(v.routeChecked ? '<p class="small-note">路线服务找到更短的路径。请先核对安全提示第七条。</p>'.concat(button("查看近路与相关规则", "v2-risk", 'data-value="shortcut"', "secondary")) : "").concat(safetyLink());
  }
  function safetyLink() {
    return '<div class="actions">'.concat(button("阅读相关安全提示", "v2-rules", "", "quiet"), "</div>");
  }
  function hotlineHTML() {
    const n = state.v2.hotline;
    return '<h2>夜间帮助热线</h2><div class="hotline-card"><span class="eyebrow">NIGHT ASSISTANCE</span><strong>'.concat(n >= 3 ? "服务已结束" : n === 2 ? "102" : "103", "</strong><p>").concat(n >= 3 ? "您的排队位置将被保留。" : "您当前的排队位置", "</p><p>预计等待时间：8 小时</p><p>").concat(n >= 3 ? "我们很快就会为您服务。" : "本热线将于几分钟后结束服务。请前往出口。", '</p></div><p class="small-note">You are number ').concat(n === 2 ? "102" : "103", ' in the queue. The approximate waiting time is 8 hours. Please make your way to the exit.</p><div class="actions">').concat(n === 1 ? button("查询排队进度", "v2-hotline-next") : n === 2 ? button("继续等待接通", "v2-hotline-end") : "").concat(button("保留排队，继续查记录", "close", "", "secondary"), '</div><p class="small-note">可以离开此窗口，排队记录会保留。</p>');
  }
  function v2SupportOptions() {
    if (!state.claim) return "";
    return '<details class="support-more"><summary>其他帮助与复核</summary><div class="actions">'.concat(button("查询位置", "v2-support", 'data-value="location"', "secondary")).concat(button("报告危险", "v2-support", 'data-value="danger"', "secondary")).concat(button("只确认保持联系", "v2-support", 'data-value="identity"', "secondary")).concat(button("定位为什么在移动", "v2-support", 'data-value="records"', "secondary")).concat(button("夜间帮助热线", "v2-call", "", "secondary")).concat(button("提交／查看投诉", "v2-complaints", "", "secondary")).concat(state.proof ? button("核验同行人员", "v2-risk", 'data-value="verify"', "secondary") + button("申请住所接返", "v2-risk", 'data-value="address"', "secondary") : "", '</div><form id="v2-support-form"><label for="support-input">补充您的问题</label><input id="support-input" maxlength="200" placeholder="位置、危险、人工、暂停退款…" required><button class="button secondary">发送</button></form></details>');
  }
  function v2ReturnTools() {
    const v = state.v2;
    return '<section class="panel"><div class="panel-content"><h2>返回前核对</h2><p>请先保留争议记录，再与林确认原始通道。</p><div class="actions">'.concat(button(v.dispute ? "复核已受理" : "申请争议复核", "v2-complaints", "", "secondary")).concat(button("查看换乘照片记录", "v2-photo", "", "secondary")).concat(button(v.recovered ? "已确认 MG-04" : "请林寻找照片中的 MG-04", "v2-recover", v.dispute && v.photo && !v.recovered ? "" : "disabled"), "</div>").concat(v.recovered ? "<p>林已找到旧通道。请使用有效换乘回执申请返回。</p>" : "", "</div></section>");
  }
  function v2Checkpoint() {
    if (state.v2.checkpoint === 2) return heading("原通道已确认", "请核对随身物品和当前状态，再让林继续前进。") + '<section class="panel"><div class="panel-content"><h2>楼梯就在前面</h2><p>旧通道还在。先听听林看到了什么。</p>'.concat(button(investigation(state).rescue ? "继续协助林出站" : "沿原通道继续，保持联系", investigation(state).rescue ? "v3-open" : "v2-finish", 'data-value="rescue"'), "</div></section>");
    return heading("返回请求已受理", "请保持联系，确认乘客通过原始通道。") + '<section class="panel"><div class="panel-content"><h2>'.concat(state.v2.checkpoint === 1 ? "林走到了一个岔路" : "旧通道已确认", "</h2><p>").concat(state.v2.checkpoint === 1 ? "新出口标识向下，刚刚辨认出的 MG-04 换乘通道在身后。" : "林已退回 MG-04，可以沿刚才走过的换乘通道返回。", "</p>").concat(safetyLink(), '<div class="actions">').concat(state.v2.checkpoint === 1 ? button("跟随新的出口牌", "v2-unsafe", "", "secondary") + button("原路退回，不再参考新标识", "v2-safe") : button("沿原通道返回地面，保持联系", "v2-finish"), "</div></div></section>");
  }
  function v2Ending() {
    if (state.ending === "erasure") return heading("通信记录同步中", "请保持当前窗口开启。", "NT—008 / RECORD SYNC") + '<section class="panel end-paper"><span class="stamp">识别请求已受理</span><h2>'.concat(state.v2.erasureStep >= 12 ? "已读" : "正在同步关联对象", "</h2><p>").concat(state.v2.erasureStep >= 12 ? "服务已结束。未收到乘客回复。" : "客服：记录正在修正，无需重复提交。", "</p>").concat(button("查看林的消息", "open-chat"), '<p class="small-note">').concat(state.v2.erasureStep >= 12 ? "你发出的消息仍然保留。" : "原始聊天记录正在同步。", "</p>").concat(state.v2.erasureStep >= 12 ? button("重新体验", "restart", "", "secondary") : "", "</section>");
    return "";
  }
  function handleV2(a, value) {
    if (a === "v2-settings") {
      modal("画面设置", "".concat(button(state.v2.reduced ? "恢复标准画面效果" : "减弱惊吓与动态效果", "v2-reduced", "", "secondary"), '<p class="small-note">').concat(state.v2.reduced ? "已减弱画面效果。" : "画面包含短暂遮黑与文字异常。", "</p>").concat(button("关闭", "close")));
      return;
    }
    if (a === "v2-reduced") {
      act(a);
      persist();
      handleV2("v2-settings");
      return;
    }
    if (state.opening < 3) {
      tell("先回复林的开场消息。");
      return;
    }
    if (a === "v2-end-chat") {
      act("v2-chat-close");
      if (dialog.open && modalKind === "lin") closeModal();
      refreshLive();
      tell("聊天暂时结束。仍可重新打开与林联系。");
      return;
    }
    if (a === "v2-topic") {
      if (sendLinText(value)) openChat();
      return;
    }
    if (a === "v2-own-review") {
      act(a);
      persist();
      modal("将你的位置交给谁？", '<p>接收方：夜间乘客接返服务。林已共享自己的位置；你可以只查看，不必回传。</p><p>接返条款：所提供的位置将作为同行批次的空间参照，并用于安排接返地点。</p><blockquote>第二十条：您只需提供站名，不必提供住址。</blockquote><div class="actions">'.concat(button("不共享，只查看林的位置", "v2-own-decline")).concat(button("仍提供位置给接返服务", "v2-own", "", "secondary"), "</div>"), "位置授权");
      return;
    }
    if (a === "v2-own-decline" || a === "v2-own") {
      act(a);
      refreshLive();
      if (a === "v2-own") {
        closeModal();
        openChat();
      } else handleV2("v2-location");
      return;
    }
    if (a === "v2-location") {
      modal("共享位置", locationHTML(), "MESSAGES / LOCATION", "location");
      updateLocationTelemetry();
      return;
    }
    if (a === "v2-pin" || a === "v2-pin-collapse") {
      act(a);
      refreshLive();
      return;
    }
    if (a === "v2-rule-probe") {
      act(a);
      refreshLive();
      modal("核对请求已记录", '<p class="corrupt-record">关联人员：林 / …</p><p>同一对象的重复核验将合并处理。</p><p>林正在发来消息。</p>' + button("查看林的消息", "open-chat"), "同行记录");
      return;
    }
    if (a === "v2-rules") {
      modal("相关安全提示", '<p class="small-note">夜间出行信息处 · 请结合现场情况判断。以下为原提示节选。</p><ol class="rule-list"><li value="2">如遇行为异常的人，请不要表现出您已经注意到他们。不要注视，不要回应，并逐渐远离。</li><li value="7">若地图显示的乘车时间明显缩短，请立即关闭地图，远离其指定的乘车地点。</li><li value="10">若出口标识将您引向更深的地下，请原路返回。原路返回时，请勿再次参考出口标识。</li><li value="12">请勿通过倒影确认车厢内的人数。如您已经发现人数不符，请勿再用其他方式核对。</li><li value="19">请勿回应任何叫出您姓名的乘客。</li><li value="20">您只需提供站名，不必提供住址。</li></ol><p>以上规定的适用情境并不相同。规则文本与客服解释也可能冲突，请保留原始记录。</p><button class="text-button" data-action="full-rules">阅读完整原文</button><div class="actions">'.concat(button("回到调查", "close"), "</div>"), "安全须知 / 原文节选");
      return;
    }
    if (a === "v2-risk" && value === "verify") {
      if (linBusy(state)) {
        tell("请先等林说完。");
        return;
      }
      act("v2-reidentify-warn");
      refreshLive();
      modal("重新核验同行人员", "<p>此操作将以新的识别结果覆盖原始通信关联。旧消息及附件可能无法保留。</p><p>请先阅读林发来的消息。只确认保持联系，无需重新识别。</p>".concat(button("先看林的消息", "open-chat")).concat(button("仍要查看核验授权", "v2-reidentify-review", "", "secondary")).concat(button("撤回，保留原始联系", "close", "", "secondary")));
      return;
    }
    if (a === "v2-reidentify-review") {
      if (linBusy(state)) {
        tell("林还在发消息，请先读完。");
        return;
      }
      modal("授权覆盖原始关联？", "<p>林已经请求停止核验。继续后，旧通信关联可能失效，本轮无法撤销。</p>".concat(button("撤回，保持联系", "close")).concat(button("授权重新识别并覆盖记录", "v2-reidentify-confirm", "", "secondary")));
      return;
    }
    if (a === "v2-reidentify-confirm") {
      act(a);
      if (state.ending === "erasure") {
        clearCorruption();
        closeModal();
        render();
        openChat();
      }
      return;
    }
    if (a === "v2-risk") {
      const info = { verify: ["核验同行人员", "已发现同行人数与记忆不符。第十二条要求停止用其他方式核对。", "继续调取同行识别记录"], shortcut: ["采用更短路线", "导航将原本 18 分钟的路程缩短至 3 分钟，但林仍在原通道。请核对第七条。", "仍将近路发给林"], address: ["授权住所接返", "将向接返服务确认角色账户中保存的住所。第二十条提醒只提供站名，不必提供住址。", "确认账户中的住所"] }[value];
      modal(info[0], "<p>".concat(info[1], "</p>").concat(safetyLink(), '<div class="actions">').concat(button(info[2], "v2-" + value, "", "secondary")).concat(button("暂不操作", "close"), "</div>"), "操作核对");
      return;
    }
    if (a === "v2-call") {
      if (!state.v2.hotline) act("v2-hotline");
      modal("热线", hotlineHTML(), "夜间帮助热线", "hotline");
      refreshLive();
      return;
    }
    if (a === "v2-photo" && state.ending === "reference") {
      modal("附件已同步", "<p>原照片已被一致版本替换。旧通道参照不可用。</p>" + button("关闭", "close"));
      return;
    }
    if (a === "v2-photo") {
      act(a);
      refreshLive();
      modal("林分享的换乘照片", '<div class="photo-attachment">'.concat(photoHTML(), '</div><details class="photo-transcript"><summary>查看照片文字</summary><p>MUSEUM GARDENS · 博物馆花园<br>Crown line · 皇冠线<br>Alder line · 阿尔德线 · Platforms 1–2<br>← Alderwick · 奥德维克<br>City Centre · 市中心 →<br>通道编号：MG-04</p></details><p class="small-note">可以放大查看指示牌，并与原始换乘记录对照。</p><div class="actions">').concat(button("查看原始回执", "plan", "", "secondary")).concat(button("返回", "close"), "</div>"), "共享附件");
      return;
    }
    if (a === "v2-complaints") {
      if (!state.v2.complaint && state.proof) act("v2-complaint");
      const v = state.v2;
      modal("投诉与时间记录争议", '<p>工单 NT-008 · 当前摘要</p><div class="paper">'.concat(v.hotline >= 2 ? "乘客拒绝使用指定出口。" : "乘客无法找到出口。", "</div>").concat(v.snapshot ? '<p>你保留的原始受理回执：</p><div class="paper">乘客无法找到出口。<br>原始提交记录 · 不随结案摘要更新</div>' : "<p>原始受理回执（可下载副本）：乘客无法找到出口。</p>", '<p>服务条款：有争议的行程，在复核完成前保留原始换乘记录；关闭的行程不再支持返回申请。</p><div class="actions">').concat(button(v.snapshot ? "原始回执已保存" : "保存原始受理回执", "v2-snapshot", v.complaint && !v.snapshot ? "" : "disabled", "secondary")).concat(button(v.dispute ? "复核已受理" : "提交时间与摘要争议", "v2-dispute", state.proof && v.snapshot && state.ruleCompared && !v.dispute ? "" : "disabled")).concat(button("返回客服", "v2-to-support", "", "quiet"), '</div><p class="small-note">提交争议需：保存受理回执，指出出站时间异常，并对照安全须知的更正时间。</p>'), "复核服务");
      refreshLive();
      return;
    }
    if (a === "v2-to-support") {
      closeModal();
      state.view = "support";
      render();
      return;
    }
    if (a === "v2-snapshot" || a === "v2-dispute") {
      act(a);
      refreshLive();
      handleV2("v2-complaints");
      return;
    }
    if (a === "v2-support") {
      act(a, value);
      if (dialog.open) closeModal();
      state.view = "support";
      render();
      return;
    }
    if (a === "v2-refuse") {
      act(a);
      if (dialog.open) closeModal();
      state.view = "support";
      render();
      return;
    }
    if (a === "v2-recover") {
      act(a);
      render();
      return;
    }
    if (["v2-verify", "v2-shortcut", "v2-address"].includes(a)) {
      act(a);
      if (dialog.open) closeModal();
      refreshLive();
      openChat();
      return;
    }
    act(a, value);
    if (a === "v2-finish" && investigation(state).rescue) {
      render();
      modal("原通道接返", investigationHTML(state), "原始通道 / MG-04", "investigation");
      return;
    }
    if (["v2-safe", "v2-unsafe", "v2-finish"].includes(a)) render();
    else refreshLive();
  }
  function hint() {
    state.v2.hint++;
    persist();
    const direct = state.v2.hint % 3 === 0;
    let text;
    if (state.opening < 3) text = "先回复林。可以打字，也可以使用建议回复。";
    else if (!state.claim) text = "打开最新一笔未完成行程。";
    else if (!state.plan) text = "林提供的原始附件不会随系统更新。先查看它。";
    else if (!state.togetherAsked) text = "附件中的奥德维克标记为未出站。点它问林。";
    else if (!state.asked.includes("duplicate")) text = "查看任意一个雷恩街，向客服询问同名站。";
    else if (!state.proof) text = "客服提供了一份凭证。打开看看它依据的是哪些记录。";
    else if (!state.asked.includes("time")) text = direct ? "比较凭证里的 23:16 和 23:12，点时间旁的问号继续核对。" : "凭证里的日期、时间和字段名称，是否能对应上原来的行程？";
    else if (!state.ruleCompared) text = "更正发布时间是 23:59，页面却在 23:30 停止更新。读完须知，指出这处冲突。";
    else if (!state.linChecked) text = "林说出口不见了。问他出口在哪里，或让他先留在原地。";
    else if (!state.v2.routeChecked) text = direct ? "打开共享位置，开启共享并请求三次位置更新。比较两个来源。" : "安全提示建议不要只依赖单一来源。林停下时，客服的预计位置是否也停止了？";
    else if (state.v2.hotline < 2) text = "向客服请求人工协助，查看一次排队进度。可以随时离开排队窗口。";
    else if (investigation(state).rescued) text = "林已安全。查看尚未完成的关联，检查自己的位置，或继续追查原始交接记录。";
    else if (state.v2.checkpoint === 1) text = "第十条涉及向地下延伸的出口。照片中的 MG-04 能确认旧通道的位置；回去的方向需要结合林的记忆。";
    else if (state.v2.checkpoint === 2) text = "在原通道继续与林联系，核对内袋里的原钥匙；对照第二十条，不提供住所。到达和保持联系是不同操作。";
    else if (state.preserve && !state.v2.recovered) text = direct ? "保存投诉原回执，提交争议；查看换乘照片，再请林寻找 MG-04。" : "保留行程需要依据。客服的新摘要是否改变了你最初提交的问题？";
    else text = "保留原始行程可以请求返回；也可以保存投诉原件，追查记录复核中的关联对象和时间字段。";
    modal("一点提示", "<p>".concat(text, '</p><p class="small-note">规则有适用情境，也可能被客服误用。请对照现场描述与原始记录。查看提示不会影响行程。</p><div class="actions">').concat(button("再给一点提示", "hint", "", "secondary")).concat(button("继续调查", "close"), "</div>"), "帮助");
  }
  function setupV2() {
    let hoverTimer = null, lastActivity = Date.now(), lastTick = Date.now();
    setInterval(() => {
      if (gameStarted && !document.hidden) updateLocationTelemetry();
    }, 1e3);
    const begin = (e) => {
      var _a2, _b;
      const b2 = (_b = (_a2 = e.target).closest) == null ? void 0 : _b.call(_a2, '[data-action="offer-refund"],#refund-submit');
      if (!b2 || b2.disabled || state.ending) return;
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => {
        if (gameStarted && !document.hidden && !linBusy(state)) {
          act("v2-hover");
          refreshLive();
        }
      }, 950);
    };
    document.addEventListener("mouseover", begin);
    document.addEventListener("focusin", begin);
    document.addEventListener("mouseout", (e) => {
      var _a2, _b;
      if ((_b = (_a2 = e.target).closest) == null ? void 0 : _b.call(_a2, '[data-action="offer-refund"],#refund-submit')) clearTimeout(hoverTimer);
    });
    document.addEventListener("focusout", () => clearTimeout(hoverTimer));
    document.addEventListener("pointerdown", () => {
      lastActivity = Date.now();
    });
    document.addEventListener("keydown", () => {
      lastActivity = Date.now();
    });
    document.addEventListener("click", (e) => {
      var _a2, _b;
      const b2 = (_b = (_a2 = e.target).closest) == null ? void 0 : _b.call(_a2, "[data-action]");
      if (!b2) return;
      if (b2.dataset.action === "request-preserve") {
        act("v2-refuse");
        render();
      }
    });
    document.addEventListener("submit", (e) => {
      if (e.target.id !== "v2-support-form") return;
      e.preventDefault();
      const t = $("support-input").value;
      const k = /人工|真人|电话/.test(t) ? "human" : /不要|别退|暂停/.test(t) ? "stop" : /危险|救|安全/.test(t) ? "danger" : /定位|移动/.test(t) ? "records" : /在哪|位置|出口/.test(t) ? "location" : /联系|身份/.test(t) ? "identity" : /规则|须知|矛盾/.test(t) ? "rules" : "fallback";
      handleV2("v2-support", k);
    });
    document.addEventListener("visibilitychange", () => {
      lastTick = Date.now();
      if (!document.hidden) {
        state.v2.idleAt = Date.now();
        state.v2.idle = 0;
        lastActivity = Date.now();
      }
    });
    setInterval(() => {
      const now = Date.now();
      const gap = now - lastTick;
      lastTick = now;
      if (!gameStarted || document.hidden || state.ending || !state.claim) return;
      if (gap > 5e3) {
        state.v2.idleAt = now;
        return;
      }
      const elapsed = now - state.v2.idleAt;
      const thresholds = [9e4, 18e4, 3e5];
      if (state.v2.idle < 3 && elapsed > thresholds[state.v2.idle] && !linBusy(state) && now - lastActivity > 45e3) {
        act("v2-idle");
        refreshLive();
      }
    }, 2500);
  }
  function renderLocationPin() {
    let panel = $("location-pin");
    if (!panel) {
      panel = document.createElement("aside");
      panel.id = "location-pin";
      panel.setAttribute("aria-label", "林的共享位置小窗");
      document.body.appendChild(panel);
    }
    const v = state.v2;
    panel.hidden = !v.shared || !v.pinned;
    if (panel.hidden) return;
    const signature = [state.round, v.pinCollapsed, v.observation >= 2, v.ownLocation, state.ending].join(":");
    if (panel.dataset.signature !== signature) {
      panel.dataset.signature = signature;
      panel.innerHTML = '<div class="pin-heading"><button class="pin-title" data-action="v2-location"><span class="pin-live-dot"></span>林 · 共享位置</button><div>'.concat(button(v.pinCollapsed ? "展开" : "收起", "v2-pin-collapse", "", "quiet")).concat(button("×", "v2-pin", 'aria-label="取消固定位置小窗"', "quiet"), '</div></div><div class="pin-content" ').concat(v.pinCollapsed ? "hidden" : "", '><div class="pin-map"><svg viewBox="0 0 640 340" role="img" aria-label="林的实时共享位置示意"><rect width="640" height="340" fill="#101d2a"/><g fill="none" stroke="#263c50" stroke-width="24"><path d="M0 70H270L390 190H640M100 0V340M450 0V340M0 290H640"/></g><path d="M40 210H240L310 140H540" fill="none" stroke="#6182a8" stroke-width="3" stroke-dasharray="7 8"/><text x="32" y="45" fill="#bbccdf" font-size="24">博物馆花园</text><text x="430" y="315" fill="#bbccdf" font-size="23">MG-04</text><circle data-live-accuracy cx="260" cy="190" r="65" fill="#70a6ff" opacity=".14"/><circle data-live-lin cx="260" cy="190" r="14" fill="#9dc1ff" stroke="#fff" stroke-width="3"/><text data-live-label x="260" y="163" text-anchor="middle" fill="#fff" font-size="26">林</text>').concat(v.observation >= 2 ? '<circle data-live-expected cx="360" cy="140" r="11" fill="#e0bb76"/><text data-live-expected-label x="360" y="174" text-anchor="middle" fill="#e0bb76" font-size="22">预计</text>' : "").concat(v.ownLocation ? '<circle cx="300" cy="206" r="10" fill="#a0d9b9"/><text x="318" y="226" fill="#a0d9b9" font-size="23">你</text>' : "", '</svg></div><div class="pin-telemetry"><span data-live-status>正在接收</span><span data-live-fresh>刚刚更新</span></div><div class="pin-telemetry secondary"><span>定位精度 <b data-live-precision>±45 米</b></span><time data-live-time>23:51:08</time></div><p class="pin-note">').concat(v.observation >= 2 ? "蓝色：设备位置　黄色：接返预计位置" : "站内信号较弱，位置可能存在误差", "</p></div>");
    }
    updateLocationTelemetry();
  }
  function updateLocationTelemetry() {
    if (!state.v2.shared) return;
    let r = updateLocationTelemetry.runtime;
    const now = performance.now();
    if (!r || r.round !== state.round) {
      r = { round: state.round, last: now, elapsed: 0, lastPacket: 0, x: 260, y: 190, expected: 350, seq: 0 };
      updateLocationTelemetry.runtime = r;
    }
    const delta = Math.min((now - r.last) / 1e3, 1.5);
    r.last = now;
    if (!document.hidden && !state.ending) {
      r.elapsed += delta;
      if (state.v2.recovered) {
        r.x = Math.max(110, r.x - delta * 1.6);
        r.y = Math.min(210, r.y + delta * 0.22);
      } else if (state.v2.observation < 2 && !state.linChecked) r.x = Math.min(280, r.x + delta * 0.4);
      if (state.v2.observation >= 2) r.expected = Math.min(485, r.expected + delta * 1.8);
    }
    const unstable = state.v2.stability < 2;
    const silence = unstable && Math.floor(r.elapsed / 16) % 2 === 1;
    if (!silence && !state.ending && r.elapsed - r.lastPacket >= 4) {
      r.lastPacket = r.elapsed;
      r.seq++;
    }
    const age = Math.floor(r.elapsed - r.lastPacket);
    const seconds = 23 * 3600 + (state.proof ? 54 : 49) * 60 + Math.floor(r.lastPacket);
    const clock = [Math.floor(seconds / 3600) % 24, Math.floor(seconds / 60) % 60, seconds % 60].map((x) => String(x).padStart(2, "0")).join(":");
    const accuracy = unstable ? 88 : state.v2.observation >= 2 ? 30 + r.seq % 3 * 3 : 45 + r.seq % 4 * 4;
    document.querySelectorAll("[data-live-lin]").forEach((n) => {
      n.setAttribute("cx", r.x);
      n.setAttribute("cy", r.y);
    });
    document.querySelectorAll("[data-live-accuracy]").forEach((n) => {
      n.setAttribute("cx", r.x);
      n.setAttribute("cy", r.y);
      n.setAttribute("r", accuracy);
    });
    document.querySelectorAll("[data-live-label]").forEach((n) => {
      n.setAttribute("x", r.x);
      n.setAttribute("y", r.y - 27);
    });
    document.querySelectorAll("[data-live-expected]").forEach((n) => n.setAttribute("cx", r.expected));
    document.querySelectorAll("[data-live-expected-label]").forEach((n) => n.setAttribute("x", r.expected));
    document.querySelectorAll("[data-live-time]").forEach((n) => n.textContent = clock);
    document.querySelectorAll("[data-live-fresh]").forEach((n) => n.textContent = state.ending === "erasure" ? "位置已失联" : state.ending === "refund" ? "林已停止共享" : state.ending === "return" ? "本次共享已完成" : age < 2 ? "刚刚更新" : age + " 秒前更新");
    document.querySelectorAll("[data-live-status]").forEach((n) => n.textContent = state.ending ? "最后一次位置" : silence ? "信号暂时中断" : state.v2.recovered ? "沿旧通道移动" : state.v2.observation >= 2 || state.linChecked ? "林已停下" : "正在缓慢步行");
    document.querySelectorAll("[data-live-precision]").forEach((n) => n.textContent = "±" + accuracy + " 米");
    const pin = $("location-pin");
    if (pin) pin.classList.toggle("signal-lost", silence);
  }
  function handleV3(a, value) {
    var _a2;
    if (state.linQueue.length && a !== "v3-open") {
      tell("林正在回复，请先等他把话说完。");
      return;
    }
    if (a === "v3-index-submit") {
      value = ((_a2 = $("v3-channel")) == null ? void 0 : _a2.value) || "";
      a = "v3-index";
    }
    act(a, value);
    render();
    if (investigation(state).panel === "closed") {
      closeModal();
      return;
    }
    modal("记录复核", investigationHTML(state), "NT-008 / 原始记录", "investigation");
  }
  function openMenu() {
    modal("行程菜单", '<div class="menu-actions">'.concat(button("返回开始界面", "mobile-home")).concat(button("乘客安全须知", "full-rules", "", "secondary")).concat(button("查看核对记录", "mobile-evidence", "", "secondary")).concat(button("画面设置", "v2-settings", "", "secondary")).concat(button("需要一点提示？", "hint", "", "secondary")).concat(button("重新开始", "restart", "", "secondary"), '</div><p class="small-note">进度保存在当前设备。清理应用数据可能清除记录。</p>'), "LAST TRAIN");
  }
  function showHome() {
    if (dialog.open) closeModal();
    persist();
    gameStarted = false;
    clearTimeout(linTimer);
    scheduledMessage = "";
    audioPause();
    stopSignals();
    document.body.classList.add("at-start");
    $("start-screen").hidden = false;
    $("continue-game").hidden = !hasSave;
    $("new-game").textContent = hasSave ? "重新开始" : "开始行程";
    $("start-title").focus();
  }
  function launch(fresh) {
    if (fresh && hasSave && !window.confirm("重新开始会清除本机当前行程，确定吗？")) return;
    if (fresh) {
      state = createState();
      Object.assign(drafts, { side: "", opening: "", modal: "" });
      Object.assign(mapView, { left: 0, top: 0, zoom: false });
      notified = 0;
      notifiedRound = state.round;
      lastSignal = "";
    }
    gameStarted = true;
    hasSave = true;
    document.body.classList.remove("at-start");
    $("start-screen").hidden = true;
    audioStart();
    render();
    workspace.focus();
  }
  function initStartScreen() {
    $("new-game").addEventListener("click", () => launch(true));
    $("continue-game").addEventListener("click", () => launch(false));
    document.querySelectorAll("[data-sound-toggle]").forEach((b2) => b2.addEventListener("click", () => {
      audioToggle();
      syncSoundButtons();
    }));
    document.addEventListener("click", (e) => {
      const b2 = e.target.closest('[data-action="mobile-home"]');
      if (b2) showHome();
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        persist();
        clearTimeout(linTimer);
        scheduledMessage = "";
        audioPause();
      } else if (gameStarted) {
        audioStart();
        scheduleLin();
      }
    });
    window.addEventListener("pagehide", () => {
      persist();
      audioPause();
    });
    function viewport() {
      const v = window.visualViewport;
      document.documentElement.style.setProperty("--app-height", Math.round(v ? v.height : window.innerHeight) + "px");
    }
    viewport();
    window.addEventListener("resize", viewport);
    if (window.visualViewport) window.visualViewport.addEventListener("resize", viewport);
    syncSoundButtons();
    showHome();
  }
  function syncSoundButtons() {
    document.querySelectorAll("[data-sound-toggle]").forEach((b2) => {
      b2.textContent = audioEnabled() ? "声音：开" : "声音：关";
      b2.setAttribute("aria-pressed", String(audioEnabled()));
    });
  }
})();
