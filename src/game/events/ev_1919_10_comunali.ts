import type { GameEvent } from '../content/types';


export const ev191910Comunali: GameEvent = {
    id: 'ev_1919_10_comunali', date: { y: 1919, m: 10, d: 26 },
    title: { zh: '10 月 26 日：市政选举', it: '26 ottobre: le elezioni municipali' },
    body: { zh: '国民委员会要一场选举来证明这座城市真的想要意大利。选举法给了所有二十岁以上的男女投票权——' +
        '比意大利本土还早。\n\n' +
        '摆在你面前的是一个技术问题：如果只有一份名单，投票率会低得难看，而且克罗地亚人会抵制；' +
        '如果有两份名单，你就会知道这座城里到底有多少人真的站在你这边。\n\n' +
        '扎内拉的自治党号召弃权。社会党已经组织了一个工人委员会。',
      it: 'Il Consiglio Nazionale vuole un\'elezione per dimostrare che la città vuole davvero l\'Italia. La legge elettorale dà il voto a uomini e donne sopra i vent\'anni: prima che in Italia.\n\n' +
        'C\'è un problema tecnico: con una lista sola l\'affluenza sarà misera e i croati diserteranno; con due liste saprai quanti, in questa città, stanno davvero dalla tua parte.\n\n' +
        'Il partito autonomo di Zanella invita all\'astensione. I socialisti hanno già formato un consiglio degli operai.' },
    options: [
      {
        id: 'a', text: { zh: '一份名单。让投票本身变成一次公民投票。', it: 'Una lista sola. Che il voto sia un plebiscito.' },
        preview: [{ zh: '军团民意 +', label: 'legittimità +' }, { zh: '军团兵力 +220', label: 'milizia +220' }, { zh: '自治派继续弃权', label: 'astensione' }],
        effect: function () { return { order: { authority: 6, fervour: 4, milizia: 220 }, support: [['borghesia', 'LEG', 2]], factions: { arditi: { dis: -8 }, sindacalisti: { dis: 4 } }, flags: { single_list: true, runMunicipal: true }, queueEvents: ['ev_1919_10_comunali_result'], journals: ['comune_italiana'] }; }
      },
      {
        id: 'b', text: { zh: '让自治党也提名单。用数字赢，而不是用棍子。', it: 'Lasciare che anche gli autonomi presentino una lista. Vincere con i numeri.' },
        preview: [{ zh: '有产精英对军团支持 −', label: 'borghesia − LEG' }, { zh: '国际声望 +', label: 'riconoscimento +' }, { zh: '自治派组织起来', label: 'AUT si organizza' }],
        effect: function () { return { order: { authority: 4, violence: -6 }, diplo: { uk: 5, france: 5, league: 5 }, economy: { recognition: 6 }, support: [['borghesia', 'LEG', -2]], factions: { arditi: { dis: 8 } }, flags: { free_election: true, runMunicipal: true }, queueEvents: ['ev_1919_10_comunali_result'], journals: ['comune_italiana'] }; }
      },
      {
        id: 'c', text: { zh: '不选举。把市政厅直接接管过来。', it: 'Niente elezioni. Prendere il Municipio e basta.' },
        preview: [{ zh: '摄政领袖权威 +', label: 'autorità +' }, { zh: '军团民意 −−', label: 'legittimità −−' }, { zh: '英法美 −−', label: 'UK/FR/US −−' }],
        effect: function () { return { order: { authority: 8, violence: 10, fervour: 6 }, diplo: { uk: -8, france: -8, usa: -8, italy: -4 }, support: [['artigiani', 'LEG', 2], ['borghesia', 'LEG', -4]], factions: { arditi: { inf: 2 } }, flags: { no_election: true }, runMunicipal: true, queueEvents: ['ev_1919_10_comunali_result'] }; }
      }
    ]
  };
