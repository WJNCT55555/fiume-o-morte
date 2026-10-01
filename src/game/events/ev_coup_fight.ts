import type { GameEvent } from '../content/types';

export const evCoupFight: GameEvent = {
    id: 'ev_coup_fight', chain: true,
    title: { zh: '楼梯上的三个小时', it: 'Tre ore sulle scale' },
    body: { zh: '战斗持续了三个小时。你的人守住了楼梯和前厅，但对方有人数、有手榴弹、有不愿意介入的宪兵。\n\n' +
        '外面，意大利驻军的指挥官派人来问：需要"恢复秩序"吗？这句话可以有两个意思。',
      it: 'Lo scontro dura tre ore. I tuoi tengono le scale e l\'atrio, ma loro hanno uomini, bombe a mano e carabinieri che non vogliono intervenire.\n\n' +
        'Fuori, il comandante del presidio italiano manda a chiedere se "occorre ristabilire l\'ordine". La frase ha due significati.' },
    options: [
      {
        id: 'a', text: { zh: '接受驻军干预——但要求同时解除法西斯武装。', it: 'Accettare l\'intervento — ma chiedendo il disarmo dei fascisti.' },
        preview: [{ zh: '政治暴力 −−', label: 'violenza −−' }, { zh: '摄政领袖权威 −', label: 'autorità −' }, { zh: '驻军 +', label: 'presidio +' }],
        effect: function () { return { order: { violence: -20, authority: -8, garrison: 10, squadre: -12, coup: -25 }, flags: { coup_done: true, italian_occupation: true }, diplo: { italy: 6, league: -4 } }; }
      },
      {
        id: 'b', text: { zh: '拒绝。守到天亮。', it: 'Rifiutare. Resistere fino all\'alba.' },
        preview: [{ zh: '政治暴力 ++', label: 'violenza ++' }, { zh: '军团民意 ++', label: 'legittimità ++' }, { zh: '进入内战边缘', label: 'guerra civile' }],
        effect: function () { return { order: { violence: 15, authority: 4, squadre: -6, coup: -30, fervour: 8 }, support: [['operai', 'LEG', 4], ['portuali', 'LEG', 4]], flags: { coup_done: true, civic_resistance: true } }; }
      },
      {
        id: 'c', text: { zh: '谈判：让他们进入政府，换取这座城市不被吞并。', it: 'Negoziare: farli entrare nel governo in cambio della città.' },
        preview: [{ zh: '联合政府', label: 'coalizione' }, { zh: '军团兵主导权 −', label: 'egemonia LEG −' }],
        effect: function () { return { order: { violence: -12, coup: -50, squadre: -6 }, coalitionMerge: { }, flags: { coup_done: true, grand_coalition: true } }; }
      }
    ]
  };
