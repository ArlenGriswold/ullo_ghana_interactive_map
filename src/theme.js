// ─── Ullo Explorer design system ─────────────────────────────────────────────
// Dark analytics-console look: slate panels, 1px hairlines, square corners,
// small-caps labels, monospace numerics. Every screen pulls from here.

export const T = {
  app: "#111418",
  panel: "#1C2127",
  panel2: "#252A31",
  head: "#2F343C",
  line: "#383E47",
  line2: "#2F343C",
  text: "#F6F7F9",
  muted: "#ABB3BF",
  dim: "#738091",
  faint: "#5F6B7C",
  blue: "#2D72D2",
  blueHi: "#4C90F0",
  blueText: "#8ABBFF",
  green: "#72CA9B",
  red: "#E76A6E",
  orange: "#FBB360",
  sans: 'Inter,-apple-system,"Segoe UI",Roboto,sans-serif',
  mono: '"JetBrains Mono","SF Mono",Menlo,Consolas,"Liberation Mono",monospace',
};

// Shared colour object used throughout the components (kept as `C` for
// compatibility with existing code).
export const C = {
  blue: T.blue, blueLight: T.blueText, lime: T.green, brown: T.panel2,
  orange: T.orange, gold: T.orange,
  bg: T.app, bgCard: "rgba(28,33,39,0.97)", bgPanel: T.panel2,
  surface: T.panel2, border: T.line, borderSubtle: T.line2,
  text: T.text, textMuted: T.muted, textDim: T.dim, error: T.red,
};

export const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
:root{--app:${T.app};--panel:${T.panel};--panel2:${T.panel2};--head:${T.head};--line:${T.line};--line2:${T.line2};--tx:${T.text};--mut:${T.muted};--dim:${T.dim};--faint:${T.faint};--blue:${T.blue};--blueHi:${T.blueHi};--blueTx:${T.blueText};--green:${T.green};--red:${T.red};--orange:${T.orange};--sans:${T.sans};--mono:${T.mono}}
body{background:var(--app);color:var(--tx);font-family:var(--sans);-webkit-font-smoothing:antialiased}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pxIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes pxInCenter{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%)}}

.px{font-family:var(--sans);color:var(--tx);font-feature-settings:"tnum"}
.px-mono{font-family:var(--mono)}
.px-label{font-size:9.5px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--dim)}
.px-muted{color:var(--mut)} .px-dim{color:var(--dim)}

.px-panel{background:rgba(28,33,39,.96);border:1px solid var(--line);border-radius:2px;box-shadow:0 0 0 1px rgba(0,0,0,.35),0 10px 28px rgba(0,0,0,.45)}
.px-bar{display:flex;align-items:center;gap:8px;min-height:34px;padding:0 10px;background:var(--head);border-bottom:1px solid var(--line)}
.px-title{font-size:11px;font-weight:600;letter-spacing:.8px;text-transform:uppercase;color:var(--tx)}
.px-glyph{flex-shrink:0;width:18px;height:18px;border-radius:2px;display:flex;align-items:center;justify-content:center;font:600 9px var(--mono);color:var(--blueTx);background:rgba(76,144,240,.16);border:1px solid rgba(76,144,240,.5)}
.px-sq{display:inline-block;width:8px;height:8px;border-radius:1px;flex-shrink:0}

.px-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;height:28px;padding:0 11px;border-radius:2px;border:1px solid var(--line);background:#383E47;color:var(--tx);font:500 11.5px var(--sans);letter-spacing:.2px;cursor:pointer;text-decoration:none;white-space:nowrap;transition:background .12s,border-color .12s}
.px-btn:hover{background:#404854}
.px-btn:disabled{opacity:.5;cursor:not-allowed}
.px-btn .i{font-family:var(--mono);font-size:11px;opacity:.85}
.px-btn.pri{background:var(--blue);border-color:var(--blue);color:#fff} .px-btn.pri:hover{background:#215DB0}
.px-btn.min{background:transparent;border-color:transparent;color:var(--mut)} .px-btn.min:hover{background:rgba(143,153,168,.15);color:var(--tx)}
.px-btn.out{background:transparent;color:var(--mut)} .px-btn.out:hover{background:rgba(143,153,168,.12);color:var(--tx)}
.px-btn.warn{background:rgba(251,179,96,.1);border-color:rgba(251,179,96,.4);color:var(--orange)} .px-btn.warn:hover{background:rgba(251,179,96,.18)}
.px-btn.danger{background:rgba(231,106,110,.1);border-color:rgba(231,106,110,.45);color:var(--red)} .px-btn.danger:hover{background:rgba(231,106,110,.18)}
.px-btn.ok{background:rgba(114,202,155,.1);border-color:rgba(114,202,155,.4);color:var(--green)} .px-btn.ok:hover{background:rgba(114,202,155,.18)}
.px-btn.lg{height:34px;padding:0 16px;font-size:12.5px}
.px-btn.icon{width:28px;padding:0}
.px-btn.sm{height:22px;padding:0 8px;font-size:10.5px}

.px-tag{display:inline-flex;align-items:center;gap:5px;height:18px;padding:0 6px;border-radius:2px;border:1px solid var(--line);background:var(--panel2);font:500 9.5px var(--mono);letter-spacing:.4px;color:var(--mut);white-space:nowrap}
.px-tag.blue{color:var(--blueTx);border-color:rgba(76,144,240,.45);background:rgba(76,144,240,.1)}
.px-tag.green{color:var(--green);border-color:rgba(114,202,155,.4);background:rgba(114,202,155,.08)}
.px-tag.red{color:var(--red);border-color:rgba(231,106,110,.45);background:rgba(231,106,110,.08)}
.px-tag.orange{color:var(--orange);border-color:rgba(251,179,96,.4);background:rgba(251,179,96,.08)}

.px-nav{position:absolute;top:0;left:0;right:0;height:42px;display:flex;align-items:center;padding:0 12px;background:var(--panel);border-bottom:1px solid var(--line);box-shadow:0 1px 0 rgba(0,0,0,.4)}
.px-tab{position:relative;height:100%;padding:0 14px;border:none;background:transparent;color:var(--dim);font:600 10.5px var(--sans);letter-spacing:.9px;text-transform:uppercase;cursor:pointer;display:flex;align-items:center;gap:7px;white-space:nowrap;outline:none}
.px-tab:hover{color:var(--tx);background:rgba(143,153,168,.08)}
.px-tab.on{color:var(--tx);background:rgba(76,144,240,.08)}
.px-tab.on::after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:2px;background:var(--blueHi)}

.px-side{position:absolute;top:0;left:0;bottom:0;z-index:102;flex-direction:column;background:var(--panel);border-right:1px solid var(--line);box-shadow:1px 0 0 rgba(0,0,0,.4),4px 0 18px rgba(0,0,0,.35);transition:width .18s ease;overflow:hidden;pointer-events:auto}
.px-cat{display:flex;align-items:center;gap:9px;width:100%;height:34px;padding:0 12px;border:none;border-bottom:1px solid var(--line2);background:transparent;color:var(--mut);font:600 10.5px var(--sans);letter-spacing:.9px;text-transform:uppercase;cursor:pointer}
.px-cat:hover{background:rgba(143,153,168,.08);color:var(--tx)}
.px-cat.on{color:var(--tx);background:rgba(76,144,240,.08);box-shadow:inset 2px 0 0 var(--blueHi)}
.px-btn.railon{background:rgba(76,144,240,.16);box-shadow:inset 2px 0 0 var(--blueHi)}
.px-item{display:flex;align-items:center;gap:10px;width:100%;height:32px;padding:0 10px 0 12px;border:none;border-left:2px solid transparent;background:transparent;color:var(--mut);font:400 12px var(--sans);text-align:left;cursor:pointer}
.px-item:hover{background:rgba(143,153,168,.1);color:var(--tx)}
.px-item.on{background:rgba(76,144,240,.12);border-left-color:var(--blueHi);color:var(--tx);font-weight:500}
.px-item .n{font:500 10px var(--mono);color:var(--faint);width:18px;flex-shrink:0}
.px-item.on .n{color:var(--blueTx)}

.px-input{width:100%;height:32px;padding:0 10px;border-radius:2px;border:1px solid var(--line);background:var(--app);color:var(--tx);font:13px var(--sans);outline:none;box-shadow:inset 0 1px 1px rgba(0,0,0,.3)}
.px-input:focus{border-color:var(--blueHi);box-shadow:0 0 0 1px var(--blueHi)}
textarea.px-input{height:auto;padding:8px 10px;line-height:1.6;resize:vertical}

.px-callout{display:flex;gap:8px;align-items:flex-start;padding:8px 10px;border-radius:2px;border:1px solid var(--line);border-left-width:3px;font-size:12px;line-height:1.5;background:var(--panel2);color:var(--mut)}
.px-callout.ok{border-left-color:var(--green);color:#B3E3C8} .px-callout.err{border-left-color:var(--red);color:#F5B8BA} .px-callout.info{border-left-color:var(--blueHi);color:var(--blueTx)}

.px-kv{display:grid;grid-template-columns:auto 1fr;border:1px solid var(--line);border-radius:2px;background:var(--panel)}
.px-kv>div{padding:6px 10px;border-bottom:1px solid var(--line2);font-size:11.5px}
.px-kv>div:nth-child(odd){color:var(--dim);font-size:9.5px;font-weight:600;letter-spacing:.9px;text-transform:uppercase;display:flex;align-items:center;border-right:1px solid var(--line2);background:var(--panel2)}
.px-kv>div:nth-child(even){font-family:var(--mono);color:var(--tx)}
.px-kv>div:nth-last-child(-n+2){border-bottom:none}

.px-seg{display:inline-flex;border:1px solid var(--line);border-radius:2px;overflow:hidden}
.px-seg button{height:26px;padding:0 12px;border:none;border-right:1px solid var(--line);background:var(--panel2);color:var(--dim);font:600 10.5px var(--sans);letter-spacing:.8px;text-transform:uppercase;cursor:pointer}
.px-seg button:last-child{border-right:none}
.px-seg button:hover{color:var(--tx)}
.px-seg button.on{background:rgba(76,144,240,.16);color:var(--blueTx)}

.px-frame{position:relative;width:100%;border:1px solid var(--line);border-radius:2px;overflow:hidden;background:#000}
.px-hud{position:absolute;z-index:1000;display:flex;align-items:center;gap:8px;padding:0 8px;height:26px;background:rgba(17,20,24,.82);border:1px solid var(--line);border-radius:2px;font:10.5px var(--mono);color:var(--mut);pointer-events:auto}
.px-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;background:var(--panel);border:1px dashed var(--line);border-radius:2px;color:var(--dim);font:11px var(--mono);letter-spacing:.5px;text-transform:uppercase}

.px-frame .pnlm-load-box,.px-frame .pnlm-error-msg{display:none!important}
.px-frame .pnlm-container{background:#000!important}
.px-indet{position:relative;height:4px;background:var(--line);border-radius:2px;overflow:hidden}
.px-indet>div{position:absolute;top:0;bottom:0;width:35%;background:var(--blueHi);border-radius:2px;animation:pxIndet 1.2s ease-in-out infinite}
@keyframes pxIndet{0%{left:-35%}100%{left:100%}}
.px-spin{width:28px;height:28px;border:2px solid rgba(76,144,240,.2);border-top-color:var(--blueHi);border-radius:50%;animation:spin .9s linear infinite}
.px-scroll::-webkit-scrollbar{width:8px;height:8px}.px-scroll::-webkit-scrollbar-track{background:transparent}.px-scroll::-webkit-scrollbar-thumb{background:#404854;border:2px solid var(--panel);border-radius:4px}
`;
