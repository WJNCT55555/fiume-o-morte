import type { GameEvent } from '../content/types';

export const evNataleFight: GameEvent = {
    id: 'ev_natale_fight', chain: true,
    title: { zh: '五天的巷战', it: 'Cinque giorni di strada' },
    body: { zh: '死的人不多——二十二名军团兵、十七名意大利士兵、五名平民——但每一具尸体都属于这座城市。\n\n' +
        '弹药在减少。医院在地下室里。12 月 28 日，你召集了摄政委员会。\n\n' +
        '你可以继续打下去，打到皇家陆军不得不屠城；也可以现在停手，把这场屠杀变成一份永远有效的政治文件。',
      it: 'I morti non sono molti — ventidue legionari, diciassette soldati italiani, cinque civili — ma ogni cadavere appartiene a questa città.\n\n' +
        'Le munizioni calano. Gli ospedali sono nelle cantine. Il 28 dicembre riunisci il Consiglio della Reggenza.\n\n' +
        'Puoi continuare fino a costringere il Regio Esercito a massacrare la città; oppure fermarti ora e trasformare il massacro in un documento politico che non scade.' },
    options: [
      {
        id: 'a', text: { zh: '停火，但要求一份写入条约的保证', it: 'Cessate il fuoco, ma con una garanzia scritta nel trattato' },
        preview: [{ zh: '结束围城', label: 'fine dell\'assedio' }, { zh: '合法性 ++', label: 'legittimità ++' }, { zh: '军力大损', label: 'Milizia −' }],
        effect: function () { return { order: { coup: -100, violence: -20, milizia: -900, fervour: -12, authority: -6 }, diplo: { uk: 8, france: 7, usa: 6, league: 10, italy: -6 }, laws: { statuto: 1 }, flags: { natale_done: true, blood_christmas: true }, journals: ['garanzia'], next: 'ev_natale_after' }; }
      },
      {
        id: 'b', text: { zh: '打到底。让罗马在全世界面前完成这场屠杀。', it: 'Resistere fino in fondo. Che Roma completi il massacro davanti al mondo.' },
        preview: [{ zh: '合法性 +++', label: 'legittimità +++' }, { zh: '暴力 ++', label: 'violenza ++' }, { zh: '军力 −−−', label: 'Milizia −−−' }, { zh: '英法美关系 −−', label: 'UK/FR/US −−' }],
        effect: function () { return { order: { coup: -100, violence: 26, milizia: -1800, fervour: 10 }, economy: { population: -600, capitalConfidence: -18 }, diplo: { italy: -18, uk: -6, france: -6, league: 4 }, flags: { natale_done: true, blood_christmas: true, martyred: true }, journals: ['resistenza'], next: 'ev_natale_after' }; }
      },
      {
        id: 'c', text: { zh: '投降。签字，走人，去威尼斯写回忆录。', it: 'Arrendersi. Firmare, andarsene, scrivere le memorie a Venezia.' },
        preview: [{ zh: '历史线', label: 'linea storica' }, { zh: '摄政终结', label: 'fine della Reggenza' }],
        effect: function () { return { order: { coup: -100, milizia: -2400, fervour: -30, violence: -18 }, flags: { natale_done: true, dannunzio_left: true }, forceEnding: 'ending_fuga' }; }
      }
    ]
  };
