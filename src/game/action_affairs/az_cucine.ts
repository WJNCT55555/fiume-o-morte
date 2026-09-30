import type { Card } from '../content/types';

/* The legionary field kitchens fed the city. It was the cheapest legitimacy
     the Regency ever bought. */
export const azCucine: Card = {
    id: 'az_cucine', deck: 'azione',
    name: { zh: '军团的伙房', it: 'Le cucine della Legione' },
    subtitle: { zh: '一锅汤比一篇宣言管用。', it: 'Una pentola di minestra vale piu di un proclama.' },
    cooldown: 2,
        text: { zh: '军团兵吃的东西，城里的穷人也能排一份。',
            it: 'Quello che mangiano i legionari lo mangiano anche i poveri della città.' },
    cost: { ap: 1 },
    options: [
      { id: 'aprire', text: { zh: '对全城开放', it: 'Aprire a tutta la città' },
        preview: ['人口 +', '失业 −', '热度 +', '合法性 +'],
        effect: { order: { fervour: 4, violence: -5 },
                  support: [['portuali', 'LEG', 3], ['operai', 'LEG', 3], ['contadini', 'LEG', 2]],
                  economy: { unemployment: -3, population: 160 },
                  factions: { arditi: { dis: -6 } } } },
      { id: 'razionare', text: { zh: '只发给军团兵和他们的家属', it: 'Solo ai legionari e alle loro famiglie' },
        preview: ['军团兵 ++', '金库 +', '本地人 −'],
        effect: { funds: 160, order: { milizia: 200, fervour: -3 },
                  support: [['borghesia', 'LEG', -4], ['portuali', 'LEG', -3]],
                  factions: { arditi: { dis: -12 }, sindacalisti: { dis: 10 } } } },
      { id: 'vendere', text: { zh: '开成一家公营食堂，收成本价', it: 'Una mensa pubblica a prezzo di costo' },
        preview: ['金库 −', '失业 −−', '资本信心 +'],
        effect: { funds: -200,
                  support: [['operai', 'LEG', 4], ['artigiani', 'LEG', 3]],
                  economy: { unemployment: -6, capitalConfidence: 4, population: 120 } } }
    ]
  };
