import type { Card } from '../content/types';

/* Guido Keller's aeroplane, and the leaflet drop that made the blockade look
     ridiculous. */
export const azVolantini: Card = {
    id: 'az_volantini', deck: 'azione',
    name: { zh: '飞越亚得里亚海', it: 'Volare sull\'Adriatico' },
    subtitle: { zh: '机翼底下的传单。', it: 'Volantini sotto le ali.' },
    cooldown: 4,
    text: { zh: '凯勒的飞机还能飞。传单比炮弹便宜。',
            it: 'L\'aereo di Keller vola ancora. I volantini costano meno delle granate.' },
    cost: { ap: 1 },
    options: [
      { id: 'milano', text: { zh: '飞到米兰和罗马撒传单', it: 'Volare su Milano e Roma' },
        preview: ['热度 ++', '意大利 −−', '合法性 +', '阿迪蒂 ++'],
        effect: { order: { fervour: 8, squadre: -3 },
                  diplo: { italy: -5, uk: 3, france: 3, league: 3 },
                  economy: { recognition: 4 }, factions: { arditi: { inf: 2, dis: -10 } } } },
      { id: 'trieste', text: { zh: '只飞到的里雅斯特，给工人撒', it: 'Solo su Trieste, per gli operai' },
        preview: ['工人 ++', '工团派 +', '意大利 −'],
        effect: { support: [['operai', 'LEG', 5], ['portuali', 'LEG', 4]],
                  order: { fervour: 5 }, diplo: { italy: -6, yugoslavia: -3 },
                  factions: { sindacalisti: { inf: 3, dis: -8 } } } },
      { id: 'terra', text: { zh: '把飞机留给侦察用', it: 'Tenere l\'aereo per la ricognizione' },
        preview: ['军团兵 +', '边境控制 +', '热度 −'],
        effect: { order: { milizia: 120, authority: 3, fervour: -3 },
                  districts: { srdoci: { control: 5 }, ronchi: { control: 4 } } } }
    ]
  };
