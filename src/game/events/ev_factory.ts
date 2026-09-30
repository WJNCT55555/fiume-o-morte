import type { GameEvent } from '../content/types';


export const evFactory: GameEvent = {
    id: 'ev_factory', once: true, cooldown: 4,
    condition: function (s) { return s.factions.sindacalisti.inf >= 15 && s.economy.unemployment > 24 && s.monthIndex >= 3; },
    title: { zh: '他们接管了车间', it: 'Hanno occupato i reparti' },
    body: { zh: '普拉塞的工人委员会在早班开始时锁上了工厂大门，把经理请了出去，自己开了生产会议。炼油厂、船厂的一部分车间加入了。\n\n' +
        '他们举着的旗子有三种：联合工位的红旗、卡尔纳罗的黑色拉巴鲁姆、还有一面从 1919 年留到现在的阿迪蒂旗。',
      it: 'Il comitato operai di Plase chiude i cancelli all\'inizio del turno, accompagna fuori i dirigenti e apre l\'assemblea di produzione. La raffineria e una parte dei reparti del cantiere si uniscono.\n\n' +
        'Le bandiere sono tre: rossa delle Sedi Riunite, il labaro nero del Carnaro, e un gagliardetto degli arditi rimasto dal 1919.' },
    options: [
      {
        id: 'a', text: { zh: '承认工人委员会。宪章第七条就是这么写的。', it: 'Riconoscere i comitati. L\'articolo della Carta dice questo.' },
        preview: [{ zh: '工人支持 ++', label: 'operai ++' }, { zh: '资本信心 −−', label: 'fiducia −−' }, { zh: '商业派异议 ++', label: 'Fiumani ++' }],
        effect: function () { return { economy: { capitalConfidence: -16, unemployment: -4 }, support: [['operai', 'LEG', 6], ['portuali', 'LEG', 5], ['borghesia', 'LEG', -8]], laws: { lavoro: 1 }, order: { fervour: 8, squadre: 8 }, factions: { sindacalisti: { dis: 18 } }, flags: { worker_control: true }, journals: ['carta'] }; }
      },
      {
        id: 'b', text: { zh: '调解：工人进监事会，产权不动。', it: 'Mediazione: i comitati entrano nei consigli di sorveglianza.' },
        preview: [{ zh: '劳动法 +', label: 'Lavoro +' }, { zh: '工人支持 +', label: 'operai +' }, { zh: '罢工 −', label: 'scioperi −' }],
        effect: function () { return { laws: { lavoro: 2 }, economy: { capitalConfidence: -4, strike: -14, unemployment: -2 }, support: [['operai', 'LEG', 4], ['portuali', 'LEG', 3], ['borghesia', 'LEG', -2]], }; }
      },
      {
        id: 'c', text: { zh: '派军团兵清场。法律就是法律。', it: 'Sgomberare con i legionari. La legge è la legge.' },
        preview: [{ zh: '工人支持 −−', label: 'operai −−' }, { zh: '领袖权威 +', label: 'autorità +' }, { zh: '资本信心 +', label: 'fiducia +' }],
        effect: function () { return { order: { authority: 6, fervour: 10, violence: 8, squadre: 6 }, economy: { capitalConfidence: 10, strike: 8 }, support: [['operai', 'LEG', -8], ['portuali', 'LEG', -6], ['borghesia', 'LEG', 7]], factions: { sindacalisti: { dis: 18 }, fascisti: { dis: -8 }, arditi: { dis: -4 } } }; }
      }
    ]
  };
