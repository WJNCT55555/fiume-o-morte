import type { Card } from '../content/types';

/* The Guardia Civica was the attempt to have an armed force that was neither
     the legionaries nor the fascists. */
export const gvGuardia: Card = {
    id: 'gv_guardia', deck: 'governo', ministry: 'interno',
    name: { zh: '公民卫队编制', it: 'Ordinamento della Guardia Civica' },
    subtitle: { zh: '把市民武装起来，然后指望他们听话。', it: 'Armare i cittadini, poi sperare che obbediscano.' },
    cooldown: 6,
        text: { zh: '城里需要一支既不是军团兵、也不是法西斯的武装。',
            it: 'Serve una forza armata che non sia né i legionari né i fascisti.' },
    cost: { ap: 1 },
    require: function (s) { return s.cabinet.interno === s.playerForce; },
    requireText: { zh: '未掌握内政与司法执政官席位', it: 'Ministero dell\'Interno non controllato' },
    options: [
      { id: 'comunale', text: { zh: '由市政厅招募，听市长的', it: 'Reclutata dal Municipio, agli ordini del podestà' },
        preview: ['公共秩序 +2', '领袖权威 +', '法西斯暴力 −−', '阿迪蒂异议 +', '卫队日志'],
        effect: { laws: { ordine: 2 }, organizations: ['guardia'], journals: ['guardia'],
                  order: { authority: 6, squadre: -8, civicGuard: 420 },
                  support: [['borghesia', 'LEG', 3], ['artigiani', 'LEG', 2]],
                  factions: { sindacalisti: { dis: -10 }, arditi: { dis: 8 } } } },
      { id: 'legione', text: { zh: '从军团兵里抽调，听你的', it: 'Tratta dai legionari, agli ordini tuoi' },
        preview: ['军团兵 −', '领袖权威 ++', '阿迪蒂 +', '工团派异议 +'],
        effect: { laws: { ordine: 1 }, organizations: ['guardia'],
                  order: { authority: 9, civicGuard: 320, milizia: -260, violence: 3 },
                  factions: { arditi: { inf: 3, dis: -10 }, sindacalisti: { dis: 12 } } } },
      { id: 'rinunciare', text: { zh: '不编制。军团兵够了。', it: 'Nessuna guardia. Bastano i legionari' },
        preview: ['法西斯暴力 +', '领袖权威 −', '阿迪蒂异议 −'],
        effect: { order: { authority: -4, squadre: 8 },
                  support: [['borghesia', 'LEG', -3]],
                  factions: { arditi: { dis: -8 } } } }
    ]
  };
