import type { Card } from '../content/types';

/* The docks were the only place where the legionaries and the Sedi Riunite
     met face to face. */
export const azMolo: Card = {
    id: 'az_molo', deck: 'azione',
    name: { zh: '到码头上去', it: 'Scendere al molo' },
    subtitle: { zh: '联合工位的地盘，得走进去。', it: 'Il territorio delle Sedi Riunite: bisogna entrarci.' },
    cooldown: 2,
        text: { zh: '码头工人不读诗。他们读工时表和工资单。',
            it: 'I portuali non leggono poesie. Leggono orari e buste paga.' },
    cost: { ap: 1 },
    options: [
      { id: 'turno', text: { zh: '跟他们上一个班次', it: 'Fare un turno con loro' },
        preview: ['港口工人 ++', '罢工 −', '合作社 +'],
        effect: { support: [['portuali', 'LEG', 4], ['operai', 'LEG', 3]],
                  economy: { strike: -8 },
                  districts: { porto: { control: 5, agitation: -4 } } } },
      { id: 'denaro', text: { zh: '带钱去，不带人去', it: 'Portare denaro, non presenza' },
        preview: ['罢工 −−', '金库 −−', '工团派异议 +'],
        effect: { funds: -220, economy: { strike: -12, capitalConfidence: -2 },
                  support: [['portuali', 'LEG', 2]],
                  factions: { sindacalisti: { dis: 12 } } } },
      { id: 'comizio', text: { zh: '在码头门口开一场会', it: 'Un comizio davanti alla dogana' },
        preview: ['热度 +', '工人 ++', '罢工 +'],
        effect: { order: { fervour: 5 }, economy: { strike: 6 },
                  support: [['portuali', 'LEG', 3], ['operai', 'LEG', 4]],
                  factions: { sindacalisti: { inf: 2, dis: -6 } } } }
    ]
  };
