import type { Advisor } from '../content/types';

export const deambris: Advisor = { id: 'deambris',  zh: '阿尔切斯特·德·安布里斯', it: 'Alceste De Ambris', faction: 'sindacalisti',
      bio: { zh: '革命工团主义者，摄政政府的内阁首脑，《卡尔纳罗宪章》的实际起草人。他要的是把那份文件真的实施出来。', it: 'Sindacalista rivoluzionario, capo di gabinetto della Reggenza e autore della Carta del Carnaro. Vuole trasformare il testo in istituzioni concrete.' },
      portrait: 'img/Portrait/Portrait_alceste_de_ambris.png',
      /* He has to be in the Palazzo before he can be offered a seat in it: the
         January 1920 event sets deambris_arrived. Before that the roster shows
         him locked with the reason below rather than offering a hire button.
         The chained programme event starts the `carta` journal after his arrival.
         His action advances its labor requirement once it is open. */
      require: function (s) { return !!s.flags.deambris_arrived; },
      actions: [
        { id: 'corporations', text: { zh: '召开法团院', it: 'Convocare il Consiglio dei Provvisori' },
          subtitle: { zh: '推动劳动立法，让工人与港口代表进入制度。', it: 'Promuovere le leggi sul lavoro e dare voce ai lavoratori e al porto.' },
          effect: { laws: { lavoro: 1 }, support: [['operai', 'LEG', 4], ['portuali', 'LEG', 3]], economy: { capitalConfidence: -6 }, order: { fervour: 6, squadre: -4 }, factions: { fascisti: { dis: 10 } } } },
        { id: 'mediation', text: { zh: '主持劳资调解', it: 'Mediare tra capitale e lavoro' },
          subtitle: { zh: '召集工会与厂主谈判，缓和罢工和街头冲突。', it: 'Riunire sindacati e industriali per attenuare scioperi e scontri.' },
          effect: { economy: { strike: -12, capitalConfidence: 3 }, order: { violence: -5 }, factions: { sindacalisti: { dis: -8 } } } },
        { id: 'union_network', text: { zh: '联络革命工团', it: 'Collegare i sindacati rivoluzionari' },
          subtitle: { zh: '组织工人与海员的互助网络，巩固工团派的力量。', it: 'Organizzare la solidarietà tra operai e marinai e rafforzare i sindacalisti.' },
          effect: { support: [['operai', 'LEG', 3], ['portuali', 'LEG', 2]], relations: [['LEG', 'PSI', 6]], factions: { sindacalisti: { inf: 3, dis: -5 } }, order: { fervour: 3 } } }
      ] };
