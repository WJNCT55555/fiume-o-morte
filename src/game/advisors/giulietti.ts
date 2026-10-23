import type { Advisor } from '../content/types';

/* Giuseppe Giulietti, leader of the Federazione della gente di mare. He took
   the Persia out of the Strait of Messina and brought her to Fiume, and with
   her the sympathy of the seamen's federation — the one organisation that can
   make a blockade leak.

   Unlocked by ev_1919_10_persia; refusing the cargo leaves him out of reach. */
export const giulietti: Advisor = { id: 'giulietti', zh: '朱塞佩·朱列蒂', it: 'Giuseppe Giulietti',
      faction: 'sindacalisti',
      require: function (s) { return !!s.flags.persia; },
      bio: { zh: '海事工人联合会领袖，把波斯号从墨西拿海峡开进阜姆的人。他手上没有兵，只有海员——而封锁线是由海员值守的。', it: 'Capo della Federazione della gente di mare, portò la Persia a Fiume dallo Stretto di Messina. Non dispone di soldati, ma di marinai: gli stessi che sorvegliano il blocco.' },
      portrait: 'img/Portrait/Portrait_giuseppe_giulietti.png',
      actions: [
        { id: 'open_blockade', text: { zh: '让海事工人放行', it: 'Far aprire il blocco dalla gente di mare' },
          subtitle: { zh: '利用海员工会打通封锁，承担与意大利进一步交恶的风险。', it: 'Aprire varchi nel blocco grazie ai marinai, aggravando i rapporti con l’Italia.' },
          effect: { economy: { traffic: 9, strike: -10, capitalConfidence: 4 },
                diplo: { italy: -9, yugoslavia: 3 },
                support: [['portuali', 'LEG', 4], ['operai', 'LEG', 2]],
                relations: [['LEG', 'PSI', 8]],
                order: { violence: -4 },
                factions: { sindacalisti: { dis: -12 }, fascisti: { dis: 8 } },
                flags: { smuggle: true } } },
        { id: 'dock_agreement', text: { zh: '协调码头复工', it: 'Concordare la ripresa nei moli' },
          subtitle: { zh: '协调海员与码头工人复工，恢复港口运输。', it: 'Accordare marinai e portuali per riprendere il lavoro e i traffici.' },
          effect: { economy: { strike: -12, traffic: 5 }, support: [['portuali', 'LEG', 3]], factions: { sindacalisti: { dis: -8 } }, relations: [['LEG', 'PSI', 4]] } }
      ] };
