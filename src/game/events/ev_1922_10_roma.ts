import type { GameEvent } from '../content/types';


export const ev192210Roma: GameEvent = {
    id: 'ev_1922_10_roma', date: { y: 1922, m: 10 },
    title: { zh: '向罗马进军', it: 'La Marcia su Roma' },
    body: { zh: '10 月 28 日，法西斯小队向罗马集中。10 月 30 日，维托里奥·埃马努埃莱三世任命墨索里尼为总理。\n\n' +
        '三年前有人请你带着军团兵向罗马进军。你拒绝了。\n\n' +
        '11 月 3 日，小队不经交战占领了阜姆。',
      it: 'Il 28 ottobre le squadre convergono su Roma. Il 30, Vittorio Emanuele III nomina Mussolini presidente del Consiglio.\n\n' +
        'Tre anni fa qualcuno ti propose di marciare su Roma con i legionari. Rifiutasti.\n\n' +
        'Il 3 novembre le squadre occupano Fiume senza incontrare resistenza.' },
    options: [
      {
        id: 'a', text: { zh: '立刻向新政府发出祝贺电报，争取时间。', it: 'Inviare subito un telegramma di congratulazioni.' },
        preview: [{ zh: '意大利 +', label: 'Italia +' }, { zh: '合法性 −', label: 'legittimità −' }, { zh: '事态 +', label: 'assedio +' }],
        effect: function () { return { diplo: { italy: 10, uk: -3, france: -3 }, order: { garrison: 5, squadre: 6, coup: 10 }, support: [['operai', 'LEG', -3]] }; }
      },
      {
        id: 'b', text: { zh: '公开拒绝承认以暴力取得的政权。', it: 'Rifiutare pubblicamente un governo nato dalla violenza.' },
        preview: [{ zh: '合法性 ++', label: 'legittimità ++' }, { zh: '意大利 −−', label: 'Italia −−' }, { zh: '事态 ++', label: 'assedio ++' }],
        effect: function () { return { diplo: { italy: -14, league: 8, uk: 5, france: 5 }, order: { coup: 22, squadre: 10, fervour: 6 }, support: [['operai', 'LEG', 4], ['contadini', 'LEG', 3]] }; }
      },
      {
        id: 'c', text: { zh: '现在向罗马进军。这是最后的机会。', it: 'Marciare su Roma adesso. È l\'ultima occasione.' },
        requireText: { zh: '需要军团兵力 ≥ 1200 且热忱 ≥ 70', it: 'Richiede Milizia ≥ 1200 e Fervore ≥ 70' },
        condition: function (s) { return s.order.milizia >= 1200 && s.order.fervour >= 70; },
        preview: [{ zh: '开启极端架空线', label: 'linea estrema' }, { zh: '内战胜负', label: 'esito incerto' }],
        effect: function () { return { next: 'ev_marcia' }; }
      },
      {
        id: 'd', text: { zh: '把这一时刻变成国际呼吁：小国需要国联。', it: 'Trasformarlo in un appello internazionale.' },
        preview: [{ zh: '国联 ++', label: 'SDN ++' }, { zh: '意大利 −', label: 'Italia −' }],
        effect: function () { return { diplo: { league: 12, uk: 6, france: 6, usa: 5, italy: -6 }, order: { coup: 14, squadre: 6 }, economy: { recognition: 6 }, journals: ['garanzia'] }; }
      }
    ]
  };
