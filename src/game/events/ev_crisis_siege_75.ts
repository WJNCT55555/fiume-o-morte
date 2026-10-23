import type { GameEvent } from '../content/types';

/* The pre-1920-09 siege set's 75 milestone: the autonomists stop meeting in
   back rooms and organize openly in the city. It is not a general strike —
   it is a rival authority with an office, a newspaper and a membership roll,
   and every member is someone who has left the Regency's square. The post-1920
   set uses Rapallo for the same 75 tick; this event only runs in the earlier
   phase and only in non-historical modes. */
export const evCrisisSiege75: GameEvent = {
  id: 'ev_crisis_siege_75',
  once: true,
  crisis: { axis: 'coup', at: 75 },
  condition: function (s) {
    var ym = s.date.y * 12 + s.date.m;
    return s.difficulty !== 'historical' && ym < 1920 * 12 + 9 && s.order.coup >= 75;
  },
  title: { zh: '自治派公开组织', it: 'Gli autonomi si organizzano alla luce del sole' },
  body: { zh: '扎内拉的人不再躲在地下室里。他们在城中心租了一间办公室，挂上「阜姆自治党」的牌子，开始每日出报、公开集会、挨家挨户收会费。\n\n' +
      '他们不喊「打倒邓南遮」。他们说：我们只是要求一个能发工资、能同罗马谈判的市政府。\n\n' +
      '但每一个加入他们的人，都是从你的广场上走开的。',
    it: 'Il partito autonomo non si nasconde più. Affitta un ufficio in centro, appende la targa «Partito Autonomo di Fiume», comincia a stampare un giornale quotidiano, a tenere comizi aperti, a raccogliere quote porta a porta.\n\n' +
      'Non gridano «abbasso D\'Annunzio». Dicono: vogliamo solo un Municipio che paghi gli stipendi e sappia trattare con Roma.\n\n' +
      'Ma ogni persona che entra da loro è una persona che ha lasciato la tua piazza.' },
  options: [
    {
      id: 'lasciare',
      text: { zh: '允许他们公开活动。让城市看见两个政府。', it: 'Lasciarli agire. Che la città veda due governi.' },
      preview: [{ zh: '自治派支持 +', label: 'Autonomia +' }, { zh: '摄政领袖权威 −', label: 'autorità −' },
        { zh: '法西斯派异议 +', label: 'Fascio diss. +' }, { zh: '政治暴力 −', label: 'violenza −' }],
      effect: function () {
        return {
          order: { authority: -4, violence: -4, fervour: -4 },
          support: [['borghesia', 'AUT', 3], ['impiegati', 'AUT', 2]],
          factions: { fascisti: { dis: 10 }, sindacalisti: { dis: -6 }, arditi: { dis: 4 } }
        };
      }
    },
    {
      id: 'vietare',
      text: { zh: '禁止集会，封掉他们的报纸。', it: 'Vietare i comizi, chiudere il loro giornale.' },
      preview: [{ zh: '摄政领袖权威 +', label: 'autorità +' }, { zh: '政治暴力 +', label: 'violenza +' },
        { zh: '法西斯暴力 +', label: 'squadre +' }, { zh: '自治派支持 −', label: 'Autonomia −' }],
      effect: function () {
        return {
          order: { authority: 5, violence: 6, squadre: 3, fervour: 2 },
          support: [['borghesia', 'AUT', -4], ['impiegati', 'AUT', -3]],
          diplo: { italy: -2 },
          factions: { fascisti: { dis: -6 }, sindacalisti: { dis: 8 }, arditi: { dis: -4 } }
        };
      }
    },
    {
      id: 'cooptare',
      text: { zh: '把他们请进市政厅，给一个委员会席位。', it: 'Chiamarli in Municipio, offrire un seggio in consiglio.' },
      preview: [{ zh: '军团民意 +', label: 'legittimità +' }, { zh: '自治派支持 −', label: 'Autonomia −' },
        { zh: '法西斯派异议 ++', label: 'Fascio diss. ++' }, { zh: '政治暴力 −', label: 'violenza −' }],
      effect: function () {
        return {
          order: { authority: -2, violence: -6, fervour: -6, garrison: 2 },
          support: [['borghesia', 'LEG', 2], ['impiegati', 'LEG', 2]],
          diplo: { italy: 4, league: 3 },
          factions: { arditi: { dis: 12 }, fascisti: { dis: 10 }, sindacalisti: { dis: -10 } }
        };
      }
    }
  ]
};
