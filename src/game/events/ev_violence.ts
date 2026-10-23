import type { GameEvent } from '../content/types';


export const evViolence: GameEvent = {
    id: 'ev_violence', repeatable: true, cooldown: 4,
    crisis: { axis: 'subversion', at: 50 },
    condition: function (s) {
      /* 史实 keeps the street-condition trigger; non-historical modes tie the
         recurring street violence to the plot gauge's 50 milestone instead. */
      if (s.difficulty !== 'historical') return s.order.subversion >= 50;
      return s.order.squadre > 42 && s.order.violence < 85;
    },
    title: { zh: '街头的枪声', it: 'Sparì in strada' },
    body: { zh: '一个自治党的党部门口被砸了。玻璃、传单、一瓶燃烧的汽油。\n\n' +
        '市警在两条街之外。宪兵在三条街之外。',
      it: 'La sezione dell\'Autonomia è stata devastata. Vetri, volantini, una bottiglia incendiaria.\n\n' +
        'La polizia municipale era due strade più in là. I carabinieri, tre.' },
    options: [
      {
        id: 'a', text: { zh: '调查，并把这件事提交阿伦戈。', it: 'Inchiesta pubblica davanti all\'Arengo.' },
        preview: [{ zh: '军团民意 +', label: 'legittimità +' }, { zh: '政治暴力 +', label: 'violenza +' }],
        effect: function () { return { order: { violence: 4, authority: 3, squadre: 2 }, support: [['impiegati', 'LEG', 2]] }; }
      },
      {
        id: 'b', text: { zh: '派阿迪蒂守住党部。以牙还牙。', it: 'Mettere gli arditi a guardia delle sezioni.' },
        preview: [{ zh: '法西斯暴力 −', label: 'squadre −' }, { zh: '政治暴力 +', label: 'violenza +' }, { zh: '民众热忱 +', label: 'fervore +' }],
        effect: function () { return { order: { squadre: -6, violence: 8, fervour: 6, authority: 2 }, support: [['artigiani', 'LEG', 2]], arms: -3, factions: { arditi: { inf: 2, dis: -12 }, sindacalisti: { dis: 10 } } }; }
      },
      {
        id: 'c', text: { zh: '不回应。让这座城自己看清楚谁在砸玻璃。', it: 'Non reagire. Che la città veda chi rompe i vetri.' },
        preview: [{ zh: '军团民意 ++', label: 'legittimità ++' }, { zh: '法西斯暴力 +', label: 'squadre +' }],
        effect: function () { return { diplo: { league: 5, uk: 3 }, order: { squadre: 8, violence: 3 }, support: [['artigiani', 'LEG', 3], ] }; }
      }
    ]
  };
