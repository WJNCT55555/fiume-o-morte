import type { GameEvent } from '../content/types';


export const evFascioSplit: GameEvent = {
    id: 'ev_fascio_split', once: true, cooldown: 4,
    condition: function (s) { return s.monthIndex >= 2 && s.factions.fascisti.dis >= 40 && s.factions.fascisti.inf >= 8; },
    title: { zh: 'Hotel Bonavia 的人', it: 'La gente dell\'Hotel Bonavia' },
    body: { zh: '霍斯特-文图里来见你。他没有绕弯子：军团兵的时代结束了，阜姆要么并入意大利，要么被南斯拉夫吃掉。"您是一位诗人，"他说，"诗人不该管账本和枪。"\n\n' +
        '他身后站着君塔的人——的里雅斯特来的小队，他们在城里已经有自己的总部、自己的报纸、自己的钱。',
      it: 'Host-Venturi viene a trovarti. Non gira intorno: l\'epoca dei legionari è finita, Fiume o va all\'Italia o se la mangia la Jugoslavia. "Voi siete un poeta," dice, "i poeti non dovrebbero occuparsi di bilanci e di fucili."\n\n' +
        'Dietro di lui ci sono gli uomini di Giunta: squadristi triestini, con sede propria, giornale proprio, denaro proprio.' },
    options: [
      {
        id: 'assorbire', text: { zh: '把他们吸收进来。给他们在政府里的位置。', it: 'Assorbirli. Dargli un posto nel governo.' },
        preview: [{ zh: '法西斯影响力 +++', label: 'Fascio +++' }, { zh: '内部分裂风险', label: 'rischio' }, { zh: '街头暴力 −', label: 'squadre −' }],
        effect: function () { return { factions: { arditi: { dis: 8 }, sindacalisti: { dis: 14 } }, order: { squadre: -8, violence: -4 }, cabinet: { difesa: 'ANI' },  }; }
      },
      {
        id: 'respingere', text: { zh: '拒绝。军团兵不是任何人的前厅。', it: 'Rifiutare. I legionari non sono l\'anticamera di nessuno.' },
        preview: [{ zh: '法西斯转为敌对', label: 'Fascio ostile' }, { zh: '阿迪蒂/工团派支持', label: 'Arditi/Falange +' }, { zh: '暴力 ++', label: 'violenza ++' }],
        effect: function () { return { factions: { arditi: { dis: -20 }, sindacalisti: { dis: -12 } }, order: { squadre: 12, violence: 8, fervour: 4 }, flags: { fascio_enemy: true }, parties: { } }; }
      },
      {
        id: 'usarli', text: { zh: '让小队去对付自治派的党部。', it: 'Usarli contro le sezioni degli autonomi.' },
        preview: [{ zh: '自治派支持 −−', label: 'AUT −−' }, { zh: '暴力 ++', label: 'violenza ++' }, { zh: '合法性 −−', label: 'legittimità −−' }],
        effect: function () { return { support: [['borghesia', 'AUT', -6], ['impiegati', 'AUT', -4], ['artigiani', 'AUT', -3]], order: { violence: 16, squadre: 10, authority: -4 }, factions: { sindacalisti: { dis: 18 } }, diplo: { league: -8, uk: -5, france: -5 } }; }
      }
    ]
  };
