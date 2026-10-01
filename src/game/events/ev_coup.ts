import type { GameEvent } from '../content/types';


export const evCoup: GameEvent = {
    id: 'ev_coup', superEvent: true,
    condition: function (s) {
      /* The FASCIST TAKEOVER reads `subversion`, not `coup`: coming up the stairs
         of the Palazzo is Mussolini's business, not Rome's. The two pressures are
         tracked independently (see R.subversionDelta in rules.js), so a game can
         now be under siege for years without a coup — or be taken from inside
         while Rome is still negotiating. */
      return s.order.subversion >= 100 && !s.flags.coup_done &&
        (s.date.y > 1922 || (s.date.y === 1922 && s.date.m >= 3));
    },
    title: { zh: '1922 年 3 月 3 日：省督府', it: '3 marzo 1922: il Palazzo' },
    body: { zh: '凌晨，的里雅斯特的法西斯在弗朗切斯科·君塔率领下进入阜姆。他们和本地的军团兵旧部一起，在意大利第 26 步兵营默许的目光下冲向省督府。\n\n' +
        '宪兵没有开枪。他们站在街角，看着。\n\n' +
        '三年前，几乎是同一批人，用同样的方式从这道门走进来，把这座城市交给你。',
      it: 'All\'alba i fascisti triestini guidati da Francesco Giunta entrano in città. Con i vecchi legionari locali, sotto gli occhi del 26º battaglione di fanteria italiana, corrono verso il Palazzo.\n\n' +
        'I carabinieri non sparano. Restano agli angoli delle strade, a guardare.\n\n' +
        'Tre anni fa, quasi gli stessi uomini, nello stesso modo, varcarono quella porta per consegnarti questa città.' },
    options: [
      {
        id: 'resistere', text: { zh: '抵抗。让军团兵和阿迪蒂守住楼梯。', it: 'Resistere. Legionari e arditi tengono le scale.' },
        requireText: { zh: '需要军团兵力 ≥ 600', it: 'Richiede almeno 600 legionari' },
        condition: function (s) { return s.order.milizia >= 600; },
        effect: function () { return { next: 'ev_coup_fight' }; }
      },
      {
        id: 'cedere', text: { zh: '让他们进来。你还有别的地方可以打这场仗。', it: 'Lasciarli entrare. C\'è un altro posto dove combattere.' },
        effect: function () { return { next: 'ev_coup_after' }; }
      },
      {
        id: 'fuggire', text: { zh: '从屋顶走。带着还能带走的人去布卡里。', it: 'Sui tetti. Con chi resta, verso Buccari.' },
        preview: [{ zh: '军团兵力 −700', label: 'milizia −700' }, { zh: '转入流亡', label: 'esilio' }],
        effect: function () { return { order: { coup: 100, authority: -20, milizia: -700 }, flags: { coup_done: true, exile: true }, phase: 'exile', journals: ['esilio'] }; }
      }
    ]
  };
