import type { GameEvent } from '../content/types';


export const evBlockade: GameEvent = {
    id: 'ev_blockade', once: true, cooldown: 5,
    condition: function (s) { return s.diplo.italy < 26 && s.diplo.yugoslavia < 26 && s.monthIndex >= 3; },
    title: { zh: '两边都不喜欢我们', it: 'Nessuno dei due ci ama' },
    body: { zh: '罗马提高了海上检查，贝尔格莱德把苏沙克的过境费提高了三成。两边都没有宣布局部封锁——那样太明显了。\n\n' +
        '结果是一样的：货进不来，也出不去。',
      it: 'Roma intensifica i controlli in mare, Belgrado aumenta del trenta per cento le tariffe di transito a Sussak. Nessuno dei due parla di blocco: sarebbe troppo evidente.\n\n' +
        'Il risultato è identico: le merci non entrano e non escono.' },
    options: [
      {
        id: 'a', text: { zh: '紧急谈判，向两边各让一步。', it: 'Negoziato d\'emergenza: una concessione a testa.' },
        preview: [{ zh: '金库 −', label: 'Tesoro −' }, { zh: '两国关系 +', label: 'entrambi +' }],
        effect: function () { return { funds: -140, diplo: { italy: 8, yugoslavia: 8 }, economy: { hinterland: 6, traffic: 2 } }; }
      },
      {
        id: 'b', text: { zh: '转向西部边境的走私路线。', it: 'Passare al contrabbando sulla frontiera occidentale.' },
        preview: [{ zh: '金库 ++', label: 'Tesoro ++' }, { zh: '合法性 −−', label: 'legittimità −−' }, { zh: '暴力 +', label: 'violenza +' }],
        effect: function () { return { funds: 240, economy: { capitalConfidence: -5, traffic: 4 }, order: { violence: 6, squadre: 4 }, support: [['portuali', 'LEG', 3]], flags: { smuggle: true } }; }
      },
      {
        id: 'c', text: { zh: '向国联控诉事实上的封锁。', it: 'Denunciare alla Società il blocco di fatto.' },
        preview: [{ zh: '国联 ++', label: 'SDN ++' }, { zh: '两国 −', label: 'entrambi −' }],
        effect: function () { return { diplo: { league: 12, uk: 6, france: 6, italy: -4, yugoslavia: -4 }, economy: { recognition: 6 }, journals: ['garanzia'] }; }
      }
    ]
  };
