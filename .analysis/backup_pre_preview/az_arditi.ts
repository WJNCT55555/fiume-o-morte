import type { Card } from '../content/types';

/* The Associazione Arditi d'Italia was the only part of the movement with a
     national organisation. */
export const azArditi: Card = {
    id: 'az_arditi', deck: 'azione',
    name: { zh: '阿迪蒂集会', it: 'L\'adunata degli arditi' },
    cooldown: 3,
    text: { zh: '他们从的里雅斯特、从罗马、从米兰来。带着伤疤和歌。',
            it: 'Arrivano da Trieste, da Roma, da Milano. Con cicatrici e canzoni.' },
    cost: { ap: 1 },
    options: [
      { id: 'adunata', text: { zh: '让他们列队穿过全城', it: 'Farli sfilare per la città' },
        preview: ['民众热忱 ++', '军团兵 ++', '法西斯暴力 −'],
        effect: {                   support: [['artigiani', 'LEG', 3]],
                  order: { fervour: 6, squadre: -4, milizia: 120 },
                  factions: { arditi: { inf: 2, dis: -8 } } } },
      { id: 'congresso', text: { zh: '开一场代表大会，谈组织而不是游行', it: 'Un congresso: organizzazione, non sfilate' },
        preview: ['党员 ++', '阿迪蒂 ++', '民众热忱 +'],
        effect: { militants: 260,
                  order: { fervour: 3 },
                  factions: { arditi: { inf: 4, dis: -4 }, futuristi: { dis: -6 } } } },
      { id: 'disarmare', text: { zh: '让他们把枪留在门口', it: 'Che lascino i fucili all\'ingresso' },
        preview: ['政治暴力 −−', '军团民意 +', '阿迪蒂异议 +++'],
        effect: { order: { violence: -10, squadre: -6 },
                  factions: { arditi: { dis: 20 }, sindacalisti: { dis: -8 } } } }
    ]
  };
