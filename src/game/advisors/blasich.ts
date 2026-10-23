import type { Advisor } from '../content/types';

export const blasich: Advisor = { id: 'blasich',   zh: '马里奥·布拉西奇', it: 'Mario Blasich', faction: null,
      bio: { zh: '自治派议员、医生。1920 年 4 月他和社会党一起发动总罢工反对摄政。招揽他是政治赌博。', it: 'Deputato autonomista e medico. Nell’aprile 1920 promosse con i socialisti uno sciopero generale contro la Reggenza. Reclutarlo è una scommessa politica.' },
      require: function (s) { return s.legitimacy >= 55 && s.flags.blasich_contact; },
      /* The only photograph of Blasich on file: a formal shot he shares with
         Riccardo Zanella (200×302, so the avatar crop shows both men). It is a
         stand-in until a portrait of Blasich alone turns up — recorded as such
         in PORTRAIT_ART_DIRECTION.md rather than passed off as a solo likeness. */
      portrait: 'img/Portrait/Portrait_riccardo_zanella_mario_blasich.png',
      actions: [
        { id: 'reconciliation', text: { zh: '与自治派和解', it: 'Conciliazione con gli autonomi' },
          subtitle: { zh: '向自治派伸出橄榄枝，换取城市各阶层支持，同时惹恼阿迪蒂。', it: 'Offrire una conciliazione agli autonomisti per ottenere consenso, irritando gli Arditi.' },
          effect: { support: [['portuali', 'LEG', 3], ['operai', 'LEG', 3], ['borghesia', 'LEG', 3], ['contadini', 'LEG', 3]], order: { violence: -8, coup: -8 }, factions: { arditi: { dis: 10 } } } }
      ] };
