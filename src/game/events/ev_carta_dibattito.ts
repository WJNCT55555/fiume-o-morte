import type { GameEvent } from '../content/types';


export const evCartaDibattito: GameEvent = {
    id: 'ev_carta_dibattito', repeatable: true, cooldown: 6,
    condition: function (s) { return s.laws.statuto >= 1 && s.laws.statuto < 3 && s.factions.sindacalisti.inf >= 14; },
    title: { zh: '法团院要不要真的开起来', it: 'Il Consiglio dei Provvisori deve davvero riunirsi?' },
    body: { zh: '德·安布里斯把一份日程表放在你桌上：法团院由各行各业的代表组成，负责经济立法；最优者议会负责政治立法；两者在必要时合为阿伦戈。\n\n' +
        '"要么它是一部宪法，"他说，"要么它是一首诗。您必须选一个。"',
      it: 'De Ambris mette una tabella di marcia sulla tua scrivania: il Consiglio dei Provvisori, formato dai rappresentanti dei mestieri, legifera sull\'economia; il Consiglio degli Ottimi legifera sulla politica; insieme formano l\'Arengo.\n\n' +
        '"O è una costituzione," dice, "o è una poesia. Bisogna scegliere."' },
    options: [
      {
        id: 'a', text: { zh: '开。让各行各业真的派代表来。', it: 'Convocarlo. Che i mestieri mandino davvero i loro rappresentanti.' },
        preview: [{ zh: '宪章 +1', label: 'Carta +1' }, { zh: '劳动法 +1', label: 'Lavoro +1' }, { zh: '工人支持 ++', label: 'operai ++' }, { zh: '商业派异议 ++', label: 'Fiumani ++' }],
        effect: function () { return { laws: { statuto: 1, lavoro: 1 }, support: [['operai', 'LEG', 5], ['portuali', 'LEG', 4], ['artigiani', 'LEG', 2]], economy: { capitalConfidence: -8 }, order: { fervour: 6, squadre: -4 }, factions: { sindacalisti: { dis: 10 }, fascisti: { dis: 8 } }, journals: ['carta'] }; }
      },
      {
        id: 'b', text: { zh: '只开政治那一院。经济留在摄政手里。', it: 'Convocare solo il consiglio politico. L\'economia resta alla Reggenza.' },
        preview: [{ zh: '宪章 +1', label: 'Carta +1' }, { zh: '合法性 +', label: 'legittimità +' }, { zh: '工团派异议 +', label: 'Falange +' }],
        effect: function () { return { laws: { statuto: 1 }, order: { authority: 3 }, factions: { sindacalisti: { dis: 12 } } }; }
      },
      {
        id: 'c', text: { zh: '再等等。先解决封锁。', it: 'Rimandare. Prima il blocco.' },
        preview: [{ zh: '工团派异议 ++', label: 'Falange ++' }, { zh: '领袖权威 +', label: 'autorità +' }],
        effect: function () { return { order: { authority: 3 }, factions: { arditi: { dis: -6 } } }; }
      }
    ]
  };
