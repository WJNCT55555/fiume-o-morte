import type { GameEvent } from '../content/types';

/* The siege was lost. This is the FAILURE arm of the siege chain — calculated,
   not chosen — and it carries the ending that used to be `ending_historical`:
   what happens is an ARMED EVICTION (「武装驱离」), not the 1924 treaty. The
   Royal Army clears the streets and the Regency's authority goes with them.

   No armistice is applied here on purpose. The guarantee journal, the diplomatic
   gains and the population loss in the old `ev_natale_fight: a` were the *terms
   of a ceasefire*; a city that lost the streets gets none of them. */
export const evNataleLose: GameEvent = {
  id: 'ev_natale_lose', chain: true,
  title: { zh: '圣诞节的第 29 天', it: 'Il 29º giorno di Natale' },
  body: { zh: '街垒在凌晨被逐个拔掉。机枪阵地换了主人，省督府的楼梯在中午之前就丢了。\n\n' +
      '军团兵没有投降——他们是被打散的：一部分退回老城，一部分脱下制服混进人群，' +
      '一部分在码头上等着被运走。二十二名死者留在了街上，而皇家陆军把炮口转向了下一条街。\n\n' +
      '《卡尔纳罗宪章》从阳台上被念过一次，从此再没有生效过。',
    it: 'All\'alba i sacchi di sabbia vengono tolti uno per uno. Le mitragliatrici cambiano padrone, e le scale del Palazzo sono perdute prima di mezzogiorno.\n\n' +
      'I legionari non si arrendono: vengono dispersi. Una parte ripiega sulla città vecchia, una parte si toglie la divisa e si mescola alla folla, ' +
      'una parte aspetta al molo di essere imbarcata. Ventidue morti restano per strada, e il Regio Esercito gira i pezzi verso la via successiva.\n\n' +
      'La Carta del Carnaro è stata letta dal balcone una volta sola, e da allora non è mai entrata in vigore.' },
  options: [
    {
      id: 'constatare', text: { zh: '承认：摄政结束在 1920 年 12 月。', it: 'Prendere atto: la Reggenza finisce nel dicembre 1920.' },
      subtitle: { zh: '设定驱离标记，并立即结算为「武装驱离」。', it: 'Segna lo sfratto e chiude subito con «Lo sfratto armato».' },
      preview: [{ zh: '结局：武装驱离', label: 'finale: lo sfratto armato' }],
      effect: function () { return { flags: { bloody_history: true }, forceEnding: 'ending_eviction' }; }
    }
  ]
};
