import type { Card } from '../content/types';

/* Three languages, one city, and a school system that had been Habsburg
     until the week before. */
export const gvLingua: Card = {
    id: 'gv_lingua', deck: 'governo', ministry: 'istruzione',
    name: { zh: '双语条例', it: 'Ordinamento bilingue' },
    subtitle: { zh: '市政厅里说两种话。', it: 'Due lingue nel Palazzo del Comune.' },
    cooldown: 6,
        text: { zh: '城里说意大利语、克罗地亚语、匈牙利语。公文只承认一种。',
            it: 'In città si parla italiano, croato, ungherese. Gli atti ufficiali ne riconoscono uno.' },
    cost: { ap: 1 },
    require: function (s) { return s.cabinet.istruzione === s.playerForce; },
    requireText: { zh: '未掌握教育执政官席位', it: 'Ministero dell\'Istruzione non controllato' },
    options: [
      { id: 'bilingue', text: { zh: '公文与学校一律双语', it: 'Bilingue negli atti e nelle scuole' },
        preview: ['语言法 +1', '学校 +1', '农民 +', '民族派异议 ++'],
        effect: { laws: { lingua: 1, scuola: 1 },
                  support: [['contadini', 'LEG', 5], ['operai', 'LEG', 2], ],
                  diplo: { yugoslavia: 8, italy: -5 },
                  districts: { drenova: { agitation: -8, control: 8 }, srdoci: { agitation: -8, control: 6 }, plase: { agitation: -5 } },
                  factions: { sindacalisti: { inf: 3, dis: -12 }, fascisti: { dis: 12 } } } },
      { id: 'tolleranza', text: { zh: '只在子市镇允许克罗地亚语', it: 'Il croato solo nei sottocomuni' },
        preview: ['学校 +1', '农民 +', '意大利 +', '克罗地亚党 −'],
        effect: { laws: { scuola: 1 },
                  support: [['contadini', 'LEG', 3], ],
                  diplo: { yugoslavia: 3, italy: 3 },
                  districts: { drenova: { agitation: -4, control: 4 } } } },
      { id: 'solo_italiano', text: { zh: '只承认意大利语', it: 'Solo l\'italiano' },
        preview: ['民族派 ++', '克罗地亚党 −−−', '动荡 ++'],
        effect: { order: { authority: 6, violence: 6 },
                  support: [['contadini', 'LEG', -8], ['contadini', 'PCR', 6]],
                  diplo: { italy: 6, yugoslavia: -10 },
                  districts: { drenova: { agitation: 12, control: -5 }, srdoci: { agitation: 10, control: -4 } },
                  factions: { fascisti: { dis: -14, inf: 2 }, sindacalisti: { dis: 16 } } } }
    ]
  };
