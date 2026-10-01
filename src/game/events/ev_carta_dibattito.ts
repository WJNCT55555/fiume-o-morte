import type { GameEvent } from '../content/types';


export const evCartaDibattito: GameEvent = {
    id: 'ev_carta_dibattito', repeatable: true, cooldown: 6,
    /* The Arengo debate can be postponed and return after cooldown. Only the
       full joint assembly fulfils that milestone of the Carta journal. */
    condition: function (s) {
      return !!s.flags.charter_promulgated && !s.flags.charter_debate_resolved
        && s.factions.sindacalisti.inf >= 14;
    },
    title: { zh: '法团院要不要真的开起来', it: 'Il Consiglio dei Provvisori deve davvero riunirsi?' },
    body: { zh: '德·安布里斯把一份日程表放在你桌上：法团院由各行各业的代表组成，负责经济立法；最优者议会负责政治立法；两者在必要时合为阿伦戈。\n\n' +
        '"要么它是一部宪法，"他说，"要么它是一首诗。您必须选一个。"',
      it: 'De Ambris mette una tabella di marcia sulla tua scrivania: il Consiglio dei Provvisori, formato dai rappresentanti dei mestieri, legifera sull\'economia; il Consiglio degli Ottimi legifera sulla politica; insieme formano l\'Arengo.\n\n' +
        '"O è una costituzione," dice, "o è una poesia. Bisogna scegliere."' },
    options: [
      {
        id: 'a', text: { zh: '开。让各行各业真的派代表来。', it: 'Convocarlo. Che i mestieri mandino davvero i loro rappresentanti.' },
        preview: [{ zh: '阿伦戈召开', label: 'Arengo convocato' }, { zh: '选举法、劳动保障 +1', label: 'voto e tutele +1' }, { zh: '产业工人支持 ++', label: 'operai ++' }, { zh: '资本信心 −−', label: 'fiducia −−' }],
        effect: function () { return { laws: { elettorale: 1, lavoro: 1 }, flags: { charter_debate_resolved: true }, support: [['operai', 'LEG', 5], ['portuali', 'LEG', 4], ['artigiani', 'LEG', 2]], economy: { capitalConfidence: -8 }, order: { fervour: 6, squadre: -4 }, factions: { sindacalisti: { dis: 10 }, fascisti: { dis: 8 } } }; }
      },
      {
        id: 'b', text: { zh: '只开政治那一院。经济留在摄政手里。', it: 'Convocare solo il consiglio politico. L\'economia resta alla Reggenza.' },
        preview: [{ zh: '只开政治议会', label: 'solo gli Ottimi' }, { zh: '选举法 +1', label: 'voto +1' }, { zh: '摄政领袖权威 +', label: 'autorità +' }, { zh: '工团派异议 +', label: 'Falange +' }],
        effect: function () { return { laws: { elettorale: 1 }, order: { authority: 3 }, factions: { sindacalisti: { dis: 12 } } }; }
      },
      {
        id: 'c', text: { zh: '再等等。先解决封锁。', it: 'Rimandare. Prima il blocco.' },
        preview: [{ zh: '工团派异议 ++', label: 'Falange ++' }, { zh: '摄政领袖权威 +', label: 'autorità +' }],
        effect: function () { return { order: { authority: 3 }, factions: { arditi: { dis: -6 } } }; }
      }
    ]
  };
