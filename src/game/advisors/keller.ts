import type { Advisor } from '../content/types';

export const keller: Advisor = { id: 'keller',    zh: '圭多·凯勒', it: 'Guido Keller', faction: 'arditi',
      bio: { zh: '"红心 A"。飞行员、瑜伽士、裸泳者、把一架飞机停在花园里的疯子。他相信革命首先是诗。', it: 'L’«Asso di cuori»: aviatore, yogi, nuotatore senza costume, capace di parcheggiare un aereo in giardino. Per lui la rivoluzione è anzitutto poesia.' },
      portrait: 'img/Portrait/Portrait_guido_keller.png',
      actions: [
        { id: 'leaflets', text: { zh: '空中撒传单', it: 'Volantinaggio aereo' },
          subtitle: { zh: '用大胆的空中宣传扩大阜姆的声望。', it: 'Far conoscere Fiume con una spettacolare iniziativa aerea.' },
          effect: { order: { fervour: 9, squadre: -3 }, diplo: { uk: 3, france: 3, league: 3 }, support: [['artigiani', 'LEG', 2]], economy: { recognition: 4 } } },
        { id: 'reconnaissance', text: { zh: '侦察封锁线', it: 'Ricognizione del blocco' },
          subtitle: { zh: '观察沿岸部署，为守军寻找防御与运输的空隙。', it: 'Osservare le posizioni costiere e cercare varchi per difesa e rifornimenti.' },
          effect: { order: { milizia: 140, coup: -4 }, economy: { traffic: 4 }, diplo: { italy: -3 } } },
        { id: 'yoga', text: { zh: '召集瑜伽社同人', it: 'Riunire il gruppo Yoga' },
          subtitle: { zh: '让激进青年围绕文化活动重新集结，代价是温和派的不满。', it: 'Mobilitare i giovani radicali con iniziative culturali, irritando i moderati.' },
          effect: { order: { fervour: 6 }, factions: { arditi: { inf: 3, dis: -10 }, irredentisti: { dis: 5 } }, support: [['impiegati', 'LEG', 2]] } }
      ] };
