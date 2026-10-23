import type { Advisor } from '../content/types';

export const grossich: Advisor = { id: 'grossich',  zh: '安东尼奥·格罗西奇', it: 'Antonio Grossich', faction: null,
      bio: { zh: '意大利国民委员会主席，碘酊的发明者。城里最受尊敬、也最不信任诗人的人。', it: 'Presidente del Consiglio nazionale italiano e pioniere dell’uso chirurgico della tintura di iodio. Rispettato dalla città, diffida del Poeta.' },
      require: function (s) { return s.legitimacy >= 50; },
      portrait: 'img/Portrait/Portrait_antonio_grossich.png',
      actions: [
        { id: 'patriarch', text: { zh: '请元老出面', it: 'Mobilitare il patriarca' },
          subtitle: { zh: '让国民委员会元老为政府背书，争取市民与外界的信任。', it: 'Ottenere l’appoggio del patriarca per rafforzare la fiducia cittadina e internazionale.' },
          effect: { support: [['borghesia', 'LEG', 3], ['impiegati', 'LEG', 3]], diplo: { italy: 5, uk: 3, league: 4 }, order: { authority: 4, squadre: -4 } } },
        { id: 'relief', text: { zh: '组织医界救济', it: 'Organizzare il soccorso medico' },
          subtitle: { zh: '动员医生与慈善网络照顾劳工家庭，缓和城市紧张。', it: 'Mobilitare medici e benefattori per assistere le famiglie dei lavoratori.' },
          effect: { support: [['operai', 'LEG', 2], ['portuali', 'LEG', 2], ['impiegati', 'LEG', 2]], order: { violence: -6 }, economy: { strike: -5 } } }
      ] };
