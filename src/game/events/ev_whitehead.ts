import type { GameEvent } from '../content/types';


export const evWhitehead: GameEvent = {
    id: 'ev_whitehead', once: true, cooldown: 3,
    condition: function (s) { return s.monthIndex >= 3 && s.economy.traffic < 60; },
    title: { zh: 'Whitehead 的账本', it: 'I conti della Whitehead' },
    body: { zh: '世界第一家鱼雷工厂正在破产。1875 年罗伯特·怀特黑德在这里造出第一条鱼雷时，阜姆是帝国的军火库；现在维克斯-阿姆斯特朗的董事会只想把这个厂卖掉。\n\n' +
        '一千二百个工人，加上为他们供货的四百家小作坊。',
      it: 'La prima fabbrica di siluri del mondo sta fallendo. Quando Robert Whitehead costruì il primo siluro nel 1875, Fiume era l\'arsenale dell\'Impero; oggi il consiglio di Vickers-Armstrong vuole solo vendere.\n\n' +
        'Millduecento operai, più quattrocento piccole botteghe che lavorano per loro.' },
    options: [
      {
        id: 'a', text: { zh: '由摄政出面接管，转为国营兵工厂。', it: 'Requisire: trasformarla in arsenale di Stato.' },
        preview: [{ zh: '金库 −−', label: 'Tesoro −−' }, { zh: '失业率 −', label: 'disoccupazione −' }],
        effect: function () { return { funds: -420, economy: { unemployment: -4, capitalConfidence: -8, traffic: 2 }, support: [['operai', 'LEG', 5], ['portuali', 'LEG', 3], ['borghesia', 'LEG', -3]], laws: { fisco: 1 } }; }
      },
      {
        id: 'b', text: { zh: '交给工团派：让工人合作社接管。', it: 'Darla alla Falange: che la rilevi una cooperativa operaia.' },
        requireText: { zh: '需要工团派影响力 ≥ 16', it: 'Richiede Falange ≥ 16' },
        condition: function (s) { return s.factions.sindacalisti.inf >= 16; },
        preview: [{ zh: '产业工人支持 ++', label: 'operai ++' }, { zh: '资本信心 −−', label: 'fiducia −−' }],
        effect: function () { return { economy: { unemployment: -4, capitalConfidence: -14 }, support: [['operai', 'LEG', 6], ['portuali', 'LEG', 5], ['borghesia', 'LEG', -6]], order: { fervour: 8, squadre: 6 }, factions: { sindacalisti: { dis: 14 } }, flags: { worker_control: true } }; }
      },
      {
        id: 'c', text: { zh: '让它在市场上自生自灭。', it: 'Lasciarla al mercato.' },
        preview: [{ zh: '失业率 ++', label: 'disoccupazione ++' }, { zh: '资本信心 +', label: 'fiducia +' }, { zh: '人口流失', label: 'emigrazione +' }],
        effect: function () { return { economy: { unemployment: 7, capitalConfidence: 8, population: -420 }, support: [['operai', 'LEG', -6], ['portuali', 'LEG', -3], ['borghesia', 'LEG', 4]], order: { fervour: 8 } }; }
      },
      {
        id: 'd', text: { zh: '卖给一家意大利财团。', it: 'Venderla a un gruppo italiano.' },
        preview: [{ zh: '金库 +', label: 'Tesoro +' }, { zh: '罗马 +', label: 'Roma +' }],
        effect: function () { return { funds: 260, economy: { unemployment: -2, capitalConfidence: 6 }, diplo: { italy: 6 }, support: [['operai', 'LEG', -2]] }; }
      }
    ]
  };
