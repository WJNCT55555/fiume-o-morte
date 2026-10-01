import type { GameEvent } from '../content/types';


export const evNatale: GameEvent = {
    id: 'ev_natale', superEvent: true,
    condition: function (s) {
      /* Bloody Christmas reads `coup` — the SIEGE. Caviglia's guns are Rome's
         answer to the blockade and the treaty, not to street violence, which is
         what `subversion` tracks. The two axes are independent; see
         R.subversionDelta in rules.js. */
      if (s.flags.natale_done || s.order.coup < 100) return false;
      // Only possible between late 1920 and early 1921
      // A half-month turn cannot be relied on to land on the 24th, so December as a
// whole is the window. The chain that follows needs three turns, which is why
// the coup has to cross 100 before the month is out.
    return (s.date.y === 1920 && s.date.m === 12) || (s.date.y === 1921 && s.date.m <= 2);
    },
    title: { zh: '1920 年 12 月 24 日：血腥圣诞', it: '24 dicembre 1920: il Natale di sangue' },
    body: { zh: '卡维利亚将军把城围了三圈。他的最后通牒很简单：撤出城市，撤出岛屿，接受条约。\n\n' +
        '你拒绝了。你又给了他四十八小时去疏散平民。\n\n' +
        '圣诞前夜的下午，皇家陆军开始推进。军团兵在城郊挖了战壕，在街口架起机枪。然后海军开了火——战列舰 *Andrea Doria* 和 *Duilio* 把炮弹打进城里，其中一发落在省督府，你的指挥部。\n\n' +
        '炮击持续到 12 月 29 日。',
      it: 'Il generale Caviglia ha chiuso la città su tre lati. Il suo ultimatum è semplice: sgomberare la città, sgomberare le isole, accettare il trattato.\n\n' +
        'Hai rifiutato. Hai concesso altre quarantotto ore per evacuare i civili.\n\n' +
        'Nel pomeriggio della vigilia l\'esercito comincia ad avanzare. I legionari hanno trincee in periferia e mitragliatrici agli angoli delle strade. Poi entra in azione la Marina: le corazzate *Andrea Doria* e *Duilio* sparano dentro la città, e una granata cade sul Palazzo del Governo, sul tuo comando.\n\n' +
        'Il bombardamento continua fino al 29 dicembre.' },
    options: [
      {
        id: 'resistere', text: { zh: '逐街抵抗。让全世界看见谁先开的炮。', it: 'Resistere strada per strada. Che il mondo veda chi ha sparato per primo.' },
        preview: [{ zh: '进入武装抵抗决策', label: 'decisione: resistenza armata' }],
        effect: function () { return { next: 'ev_natale_fight' }; }
      },
      {
        id: 'trattare', text: { zh: '谈判：用投降换取政治条款', it: 'Negoziare: la resa in cambio di condizioni politiche' },
        preview: [{ zh: '进入谈判链', label: 'negoziato' }],
        effect: function () { return { next: 'ev_natale_deal' }; }
      },
      {
        id: 'partire', text: { zh: '让军团兵撤出。你自己留在城里。', it: 'Far uscire i legionari. Tu resti in città.' },
        preview: [{ zh: '军团兵力归零', label: 'milizia → 0' }, { zh: '民众热忱 −−', label: 'fervore −−' }, { zh: '英法关系 +', label: 'UK/FR +' }],
        effect: function () { return { order: { coup: -100, violence: -14, milizia: -9999, fervour: -18, authority: 6 }, diplo: { league: 6, uk: 4, france: 4 }, counters: { graceUntil: 0 }, flags: { natale_done: true, rest_in_city: true }, journals: ['resistenza'], next: 'ev_natale_after' }; }
      }
    ]
  };
