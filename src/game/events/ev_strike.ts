import type { GameEvent } from '../content/types';


export const evStrike: GameEvent = {
    id: 'ev_strike', repeatable: true, cooldown: 8,
    /* Fires only while the labour situation is live but not yet out of hand.
       `strike` has NO upward monthly drift — the only term in R.lawMonthly is
       `-(orario * 0.5) - lavoro * 1.1` — so it falls to zero as soon as labour
       law is passed and stays there, and it only climbs when the player chooses
       repression (ev_strike:c +18, ev_1920_04_sciopero:a +16, gv_tutele:sospensione
       +9, gv_orario:deroga +8). The band therefore reads as: below 20 the unions
       have nothing to threaten with, above 40 the strike is already on the street
       and this is no longer an ultimatum. Note `counters.strikes` starts ticking at
       > 40, so the top of the band is the last point at which negotiating still
       works. */
    condition: function (s) { return s.economy.strike >= 20 && s.economy.strike <= 40 && s.monthIndex >= 2; },
    title: { zh: '联合工位的最后通牒', it: 'L\'ultimatum delle Sedi Riunite' },
    body: { zh: '码头工人委员会派人来：如果摄政不在一个月内承认八小时工作制与港口劳动局，联合工位就发动总罢工。\n\n' +
        '"我们知道您的宪法里写了什么，"来的人说，"劳动不是商品。我们只是想知道它是不是也包括我们。"',
      it: 'Il comitato dei portuali manda a dire: se entro un mese la Reggenza non riconosce le otto ore e l\'Ufficio del lavoro portuale, le Sedi Riunite proclamano lo sciopero generale.\n\n' +
        '"Sappiamo cosa c\'è scritto nella vostra Carta," dice l\'inviato. "Il lavoro non è merce. Vorremmo solo sapere se vale anche per noi."' },
    options: [
      {
        id: 'a', text: { zh: '答应。在阿伦戈推八小时工作制。', it: 'Accettare. Portare le otto ore all\'Arengo.' },
        preview: [{ zh: '劳动时间 +1', label: 'Orario +1' }, { zh: '产业工人支持 ++', label: 'operai ++' }, { zh: '资本信心 −', label: 'fiducia −' }],
        effect: function () { return { laws: { orario: 1 }, support: [['operai', 'LEG', 5], ['portuali', 'LEG', 5]], economy: { strike: -12, capitalConfidence: -6 }, factions: { sindacalisti: { dis: 10 } } }; }
      },
      {
        id: 'b', text: { zh: '先成立港口劳动局，工资问题留给明年。', it: 'Istituire l\'Ufficio del lavoro, rinviare i salari.' },
        preview: [{ zh: '劳动保障 +1', label: 'Tutele +1' }, { zh: '罢工强度 −', label: 'scioperi −' }],
        effect: function () { return { laws: { lavoro: 1 }, economy: { strike: -6, capitalConfidence: -2 }, support: [['portuali', 'LEG', 2]] }; }
      },
      {
        id: 'c', text: { zh: '拒绝。让军团兵去码头。', it: 'Rifiutare. I legionari vanno al molo.' },
        preview: [{ zh: '罢工强度 ++', label: 'scioperi ++' }, { zh: '港口吞吐指数 −', label: 'traffico −' }, { zh: '政治暴力 +', label: 'violenza +' }, { zh: '产业工人支持 −−', label: 'operai −−' }],
        effect: function () { return { economy: { strike: 18, capitalConfidence: 5 }, support: [['operai', 'LEG', -6], ['portuali', 'LEG', -6], ['borghesia', 'LEG', 4]], order: { fervour: 8, violence: 8, squadre: 4 }, factions: { sindacalisti: { dis: 18 }, arditi: { dis: -6 }, fascisti: { dis: -4 } } }; }
      }
    ]
  };
