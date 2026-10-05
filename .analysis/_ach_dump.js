'use strict';
const fs = require('fs');
const H = require('./ending_harness.js');
const src = fs.readFileSync('src/game/engine/rules.js', 'utf8').split(/\r?\n/);
const needle = id => "grant('" + id + "')";
H.Meta.ACHIEVEMENTS.forEach(a => {
  let idx = -1;
  for (let i = 0; i < src.length; i++) if (src[i].indexOf(needle(a.id)) >= 0) idx = i;
  if (idx < 0) { console.log('  ' + a.zh.padEnd(16) + ' ← 非 rules.js 授予（日志 onComplete）'); return; }
  let pre = '';
  for (let i = Math.max(0, idx - 6); i <= idx; i++) pre += ' ' + src[i].trim();
  pre = pre.replace(/\s+/g, ' ');
  const m = pre.match(/if \(([^]*?)\)\s*grant\($/);
  console.log('  ' + a.zh.padEnd(16) + ' ← ' + (m ? m[1] : pre.slice(-110)));
});
