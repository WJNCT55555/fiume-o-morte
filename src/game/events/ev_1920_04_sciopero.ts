import type { GameEvent } from '../content/types';


export const ev192004Sciopero: GameEvent = {
    id: 'ev_1920_04_sciopero', date: { y: 1920, m: 4 },
    title: { zh: '4 月 20 日：总罢工', it: '20 aprile: lo sciopero generale' },
    body: { zh: '自治党和社会党联合起来，号召全城总罢工。码头停了，电车停了，印刷厂停了。\n\n' +
        '他们的口号不是"打倒邓南遮"，而是"我们要一个能发工资的政府"。\n\n' +
        '扎内拉在一次集会上说：这座城市不需要诗人，需要会计。' +
        '广场上有人笑了，也有人没有笑。',
      it: 'Il partito autonomo e i socialisti proclamano lo sciopero generale. Il porto si ferma, i tram si fermano, le tipografie si fermano.\n\n' +
        'Lo slogan non è "abbasso D\'Annunzio": è "vogliamo un governo che paghi gli stipendi".\n\n' +
        'A un comizio Zanella dice che questa città non ha bisogno di un poeta, ma di un ragioniere. In piazza qualcuno ride. Qualcuno no.' },
    options: [
      {
        id: 'a', text: { zh: '让军团兵去码头顶班。看看诗能不能卸货。', it: 'Mandare i legionari al molo. Vediamo se un poeta sa scaricare.' },
        preview: [{ zh: '摄政领袖权威 +', label: 'autorità +' }, { zh: '产业工人支持 −−', label: 'operai −−' }, { zh: '罢工强度 ++', label: 'scioperi ++' }],
        effect: function () { return { order: { authority: 6, violence: 12, squadre: 4 }, economy: { strike: 16, traffic: -4 }, support: [['operai', 'LEG', -6], ['portuali', 'LEG', -7], ['borghesia', 'LEG', 2]], factions: { sindacalisti: { dis: 16 }, arditi: { dis: -4 }, fascisti: { dis: -6 } } }; }
      },
      {
        id: 'b', text: { zh: '亲自去码头，不带卫兵，跟他们谈工时', it: 'Andare al molo di persona, senza scorta, a parlare di orari' },
        preview: [{ zh: '产业工人支持 ++', label: 'operai ++' }, { zh: '军团民意 ++', label: 'legittimità ++' }, { zh: '资本信心 −', label: 'fiducia −' }],
        effect: function () { return { order: { fervour: 6, violence: -8 }, support: [['operai', 'LEG', 5], ['portuali', 'LEG', 5], ['borghesia', 'LEG', -3]], economy: { strike: -16, capitalConfidence: -6 }, laws: { orario: 1 }, factions: { sindacalisti: { dis: 10 } } }; }
      },
      {
        id: 'c', text: { zh: '把罢工变成谈判：请自治派进市政厅，一起管这座城', it: 'Trasformare lo sciopero in trattativa: chiamare gli autonomi al Municipio' },
        preview: [{ zh: '军团民意 +++', label: 'legittimità +++' }, { zh: '国际声望 +', label: 'riconoscimento +' }, { zh: '阿迪蒂/法西斯派异议 ++', label: 'Arditi/Fascio ++' }],
        effect: function () { return { order: { violence: -12, authority: 4, fervour: -6 }, support: [['borghesia', 'LEG', 4], ['impiegati', 'LEG', 4], ['portuali', 'LEG', 3], ['contadini', 'LEG', 3]], economy: { strike: -12, capitalConfidence: 6 }, diplo: { uk: 5, france: 5, league: 6 }, factions: { arditi: { dis: 16 }, fascisti: { dis: 12 } }, flags: { blasich_contact: true }, journals: ['riconciliazione'] }; }
      },
      {
        id: 'd', text: { zh: '什么都不做。罢工自己会结束。', it: 'Non fare nulla. Lo sciopero finirà da solo.' },
        preview: [{ zh: '罢工强度 +', label: 'scioperi +' }, { zh: '港口 −', label: 'porto −' }, { zh: '摄政领袖权威 −', label: 'autorità −' }],
        effect: function () { return { order: { authority: -6 }, economy: { strike: 10, traffic: -6, population: -220 }, support: [['borghesia', 'LEG', -3]] }; }
      }
    ]
  };
