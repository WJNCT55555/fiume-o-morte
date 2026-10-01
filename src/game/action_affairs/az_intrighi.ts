import type { Card } from '../content/types';

/* The Legion has to drink with people it despises. Modelled on the reference
   project's `inter_party_relationships` card: an action card whose every
   substantive option costs a resource and moves how another party regards the
   movement, ending in an option to stand alone. */
export const azIntrighi: Card = {
    id: 'az_intrighi', deck: 'azione',
    name: { zh: '党派间的纠葛', it: 'Intrighi fra i partiti' },
    cooldown: 4,
    text: { zh: '尽管阜姆的许多无政府主义者与阿迪蒂老兵宁死也不愿与政客共饮一杯，但指挥官深知——要让革命的火焰在亚得里亚海畔持续燃烧，就必须在旧世界的毒酒中掺入我们自己的配方。',
            it: 'Molti anarchici e arditi preferirebbero morire che bere con un politico. Ma il Comandante sa che il fuoco va alimentato.' },
    // Every card costs 1 AP, charged the moment it is played. `funds` and
    // `arms` wait for the resource layer that corresponds to the reference
    // project's `resources`.
    cost: { ap: 1 },
    options: [
      { id: 'autonomi',
        text: { zh: '与自治党人达成临时契约？', it: 'Un patto temporaneo con gli autonomi?' },
        subtitle: { zh: '向那些守着自由港残梦的自治派伸出酒杯。', it: 'Tendere il bicchiere a chi sogna ancora il porto franco.' },
        preview: ['行动点 −', '自治党 ++', '工团派异议 −', '国民集团异议 +'],
        require: function (s) { return s.ap >= 1; },
        requireText: { zh: '需要额外的行动点', it: 'Serve un punto azione in piu' },
        effect: { ap: -1,
                  relations: [['LEG', 'AUT', 18], ['LEG', 'PAD', 10], ['LEG', 'ANI', -6]],
                  support: [['borghesia', 'LEG', 3], ['impiegati', 'LEG', 2]],
                  factions: { sindacalisti: { dis: -8 }, irredentisti: { dis: 10 } } } },
      { id: 'nazionale',
        text: { zh: '维持与意大利国民委员会的同盟。', it: 'Mantenere l\'alleanza con il blocco nazionale.' },
        subtitle: { zh: '国民委员会和意大利裔资产阶级一直是默默支持我们的盟友。', it: 'Il blocco nazionale e la borghesia italiana ci hanno sempre sostenuto in silenzio.' },
        preview: ['行动点 −', '国民集团 ++', '自治党 −', '收复主义者异议 −−'],
        require: function (s) { return s.ap >= 1; },
        requireText: { zh: '需要额外的行动点', it: 'Serve un punto azione in piu' },
        effect: { ap: -1,
                  relations: [['LEG', 'ANI', 16], ['LEG', 'AUT', -8], ['LEG', 'PCR', -6]],
                  support: [['regnicoli', 'LEG', 4], ['borghesia', 'ANI', 3]],
                  diplo: { italy: 5 },
                  factions: { irredentisti: { dis: -14 }, sindacalisti: { dis: 8 } } } },
      { id: 'mussolini',
        text: { zh: '写给远在意大利的墨索里尼的一封信。', it: 'Una lettera a Mussolini, in Italia.' },
        subtitle: { zh: '那些黑衫的年轻暴徒，究竟是同路人还是掘墓人？', it: 'Quei giovani squadristi: compagni di strada o becchini?' },
        preview: ['金库 −', '小队 ++', '法西斯派异议 −−', '工团派异议 +'],
        require: function (s) { return s.funds >= 150; },
        requireText: { zh: '需要 150 千镑的活动经费', it: 'Servono 150 per i fondi' },
        effect: function () { return { funds: -150,
                  flags: { mussolini_letter: true },
                  order: { squadre: 8, coup: 4 },
                  diplo: { italy: 4 },
                  factions: { fascisti: { dis: -18 }, sindacalisti: { dis: 12 }, futuristi: { dis: 4 } } }; } },
      /* Standing alone: no effect at all, the reference project's @spd_alone. */
      { id: 'soli',
        text: { zh: '军团不需要任何盟友。', it: 'La Legione non ha bisogno di alleati.' },
        subtitle: { zh: '将命运握在自己手中。', it: 'Il destino in mano nostra.' },
        preview: [],
        effect: {} }
    ]
  };
