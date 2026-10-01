import type { GameEvent } from '../content/types';

export const evNataleAfter: GameEvent = {
    id: 'ev_natale_after', chain: true,
    title: { zh: '围攻之后', it: 'Dopo l\'assedio' },
    body: { zh: '1921 年 1 月。城里到处是弹坑和传单。军团兵开始登上军队准备的货车离开——他们中的大多数人不会回来。\n\n' +
        '自由邦成立了。一个临时政府接管了市政厅，成员全部来自兼并列的国民集团。\n\n' +
        '《拉帕洛条约》规定了一个由条约制造的国家；现在的问题是，这个国家里还有没有你的位置。',
      it: 'Gennaio 1921. La città è piena di crateri e di volantini. I legionari cominciano a partire sui vagoni predisposti dall\'esercito: la maggior parte non tornerà.\n\n' +
        'Nasce lo Stato libero. Un governo provvisorio prende il Municipio, composto interamente dal Blocco Nazionale annessionista.\n\n' +
        'Il Trattato di Rapallo ha creato uno Stato fatto di carta; la questione ora è se in quello Stato ci sia ancora un posto per te.' },
    options: [
      {
        id: 'restare', text: { zh: '留下。以一个政治运动而不是一个政府的身份。', it: 'Restare. Come movimento politico, non come governo.' },
        preview: [{ zh: '转入政治斗争', label: 'lotta politica' }, { zh: '筹备制宪议会选举', label: 'elezioni' }],
        effect: function () { return { journals: ['elezioni'], flags: { stay_political: true }, factions: { sindacalisti: { dis: -10 }, arditi: { dis: 6 } } }; }
      },
      {
        id: 'andare', text: { zh: '回加尔达湖。让这座城市自己去处理它的事。', it: 'Tornare sul Garda. Che la città si occupi delle sue cose.' },
        preview: [{ zh: '离开', label: 'partenza' }, { zh: '民众热忱 −−−', label: 'fervore −−−' }],
        effect: function () { return { order: { fervour: -26, violence: -8 }, flags: { dannunzio_left: true }, factions: { arditi: { dis: 20 } }, forceEnding: 'ending_fuga' }; }
      },
      {
        id: 'congiura', text: { zh: '转入地下。让军团兵网络变成一个政党。', it: 'Passare alla clandestinità. Trasformare la rete legionaria in un partito.' },
        preview: [{ zh: '组建选举机器', label: 'macchina elettorale' }, { zh: '手工业者支持军团 +', label: 'artigiani + LEG' }, { zh: '法西斯派影响力 +', label: 'Fascio +' }],
        effect: function () { return { order: { authority: -4, squadre: 6 }, support: [['artigiani', 'LEG', 3]], factions: { fascisti: { inf: 2, dis: -6 } }, flags: { underground: true }, journals: ['elezioni'] }; }
      }
    ]
  };
