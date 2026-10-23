import type { Advisor } from '../content/types';

export const micheletti: Advisor = { id: 'micheletti', zh: '彼得罗·米凯莱蒂', it: 'Pietro Micheletti', faction: 'arditi',
      bio: { zh: '阿迪蒂军官，1920 年 12 月被派去和诗人谈投降条件的那个人。', it: 'Ufficiale degli Arditi, inviato nel dicembre 1920 a discutere con il Poeta le condizioni della resa.' },
      /* No portrait. He used to be shown D'Annunzio's photograph — the man he
         was sent to negotiate with. See PORTRAIT_ART_DIRECTION.md. */
      actions: [
        { id: 'discipline', text: { zh: '整训军团', it: 'Inquadrare la Legione' },
          subtitle: { zh: '使用 6 点军备加强军团训练与治安制度，牺牲少量革命热情。', it: 'Impiegare 6 armi per rafforzare addestramento e ordine, riducendo il fervore.' },
          require: s => s.arms >= 6, requireText: { zh: '需要至少 6 点军备。', it: 'Servono almeno 6 armi.' },
          effect: { order: { milizia: 320, authority: 4, fervour: -2 }, arms: -6, laws: { ordine: 1 }, factions: { arditi: { inf: 2, dis: -10 } } } },
        { id: 'officers', text: { zh: '召集军官协调防务', it: 'Coordinare gli ufficiali' },
          subtitle: { zh: '理顺指挥关系，缓和军官之间的猜忌。', it: 'Chiarire la catena di comando e attenuare le rivalità tra ufficiali.' },
          effect: { order: { authority: 5, coup: -7 }, factions: { arditi: { dis: -8 }, irredentisti: { dis: -4 } } } }
      ] };
