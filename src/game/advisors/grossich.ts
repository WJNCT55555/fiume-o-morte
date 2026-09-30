import type { Advisor } from '../content/types';

export const grossich: Advisor = { id: 'grossich',  zh: '安东尼奥·格罗西奇', it: 'Antonio Grossich', faction: null,
      bio: '意大利国民委员会主席，碘酊的发明者。城里最受尊敬、也最不信任诗人的人。',
      require: function (s) { return s.legitimacy >= 50; },
      action: { zh: '请元老出面', it: 'Mobilitare il patriarca' },
      effect: { support: [['borghesia', 'LEG', 3], ['impiegati', 'LEG', 3], ], diplo: { italy: 5, uk: 3, league: 4 }, order: { authority: 4, squadre: -4 } } };
