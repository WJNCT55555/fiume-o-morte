import type { GameEvent } from '../content/types';

export const evNataleDeal: GameEvent = {
    id: 'ev_natale_deal', chain: true,
    title: { zh: '斯皮诺拉别墅的条款', it: 'Le condizioni di Villa Spinola' },
    body: { zh: '谈判在城外的别墅里进行。罗马的底线是：军团兵必须撤出，摄政必须解散，条约必须被接受。\n\n' +
        '但乔利蒂的政府并不想制造殉道者。他们愿意谈的是别的东西：阜姆可以成为一个自由邦，由本城人自己管理；军团兵可以"以个人身份"留下来；你可以走，也可以留。',
      it: 'Si negozia in una villa fuori città. Il limite di Roma è chiaro: i legionari devono uscire, la Reggenza deve sciogliersi, il trattato va accettato.\n\n' +
        'Ma il governo Giolitti non vuole fare martiri. Su altro si può trattare: Fiume può diventare uno Stato libero amministrato dai fiumani; i legionari possono restare "a titolo individuale"; tu puoi andartene o restare.' },
    options: [
      {
        id: 'a', text: { zh: '接受。把摄政交给一个临时政府，自己退到幕后。', it: 'Accettare. Lasciare la Reggenza a un governo provvisorio e ritirarti.' },
        preview: [{ zh: '转向自由邦', label: 'Stato libero' }, { zh: '军团兵离城', label: 'legionari via' }, { zh: '保留影响力', label: 'influenza' }],
        effect: function () { return { order: { coup: -100, milizia: -1600, violence: -14, fervour: -12 }, laws: { statuto: 1, elettorale: 1 }, diplo: { italy: 10, league: 6 }, support: [['borghesia', 'LEG', 4], ['impiegati', 'LEG', 4]], factions: { arditi: { dis: 18 } }, flags: { natale_done: true, behind_scenes: true }, journals: ['statuto'], next: 'ev_natale_after' }; }
      },
      {
        id: 'b', text: { zh: '拒绝解散。只接受停火与撤出岛屿。', it: 'Rifiutare lo scioglimento. Accettare solo il cessate il fuoco e lo sgombero delle isole.' },
        preview: [{ zh: '事态 −', label: 'assedio −' }, { zh: '主权保留', label: 'sovranità' }, { zh: '罗马 −', label: 'Roma −' }],
        effect: function () { return { order: { coup: -60, violence: -10, garrison: -6, fervour: -6 }, diplo: { italy: -8, league: 4 }, flags: { natale_done: true, partial_deal: true }, next: 'ev_natale_after' }; }
      },
      {
        id: 'c', text: { zh: '把谈判拖到圣诞节之后。时间在你这边。', it: 'Tirare il negoziato oltre Natale. Il tempo è dalla tua parte.' },
        preview: [{ zh: '事态 +', label: 'assedio +' }, { zh: '回到抵抗链', label: 'resistenza' }],
        effect: function () { return { order: { coup: 14, fervour: -4 }, next: 'ev_natale' }; }
      }
    ]
  };
