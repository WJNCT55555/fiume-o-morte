import type { Advisor } from '../content/types';

/* Giuseppe Giulietti, leader of the Federazione della gente di mare. He took
   the Persia out of the Strait of Messina and brought her to Fiume, and with
   her the sympathy of the seamen's federation — the one organisation that can
   make a blockade leak.

   Unlocked by ev_1919_10_persia; refusing the cargo leaves him out of reach. */
export const giulietti: Advisor = { id: 'giulietti', zh: '朱塞佩·朱列蒂', it: 'Giuseppe Giulietti',
      faction: 'sindacalisti',
      require: function (s) { return !!s.flags.persia; },
      bio: '海事工人联合会领袖，把波斯号从墨西拿海峡开进阜姆的人。他手上没有兵，只有海员——而封锁线是由海员值守的。',
      action: { zh: '让海事工人放行', it: 'Far aprire il blocco dalla gente di mare' },
      effect: { economy: { traffic: 9, strike: -10, capitalConfidence: 4 },
                diplo: { italy: -9, yugoslavia: 3 },
                support: [['portuali', 'LEG', 4], ['operai', 'LEG', 2]],
                relations: [['LEG', 'PSI', 8]],
                order: { violence: -4 },
                factions: { sindacalisti: { dis: -12 }, fascisti: { dis: 8 } },
                flags: { smuggle: true } } };
