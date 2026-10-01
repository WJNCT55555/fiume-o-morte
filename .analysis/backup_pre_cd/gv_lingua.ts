import type { Card } from '../content/types';

/* Three languages, one city, and a school system that had been Habsburg
   until the week before. The Croat-majority suburbs were Drenova, Srdoci
   and Plase. */
export const gvLingua: Card = {
    id: 'gv_lingua', deck: 'governo', ministry: 'istruzione',
    name: { zh: '双语条例', it: 'Ordinamento bilingue' },
    text: { zh: '城里说意大利语、克罗地亚语、匈牙利语，公文只承认一种。' +
        '而学校是哈布斯堡留下的：教师、课本、课表都还在，' +
        '只是黑板上的国徽在上个星期被刮掉了，留下一块颜色较浅的木头。\n\n' +
        '教育执政官要决定的是：德尔塔对岸那些村子里的孩子，' +
        '明天早上该用哪一种语言学字母表。' +
        '选择双语，你会得到一群不再害怕警察的农民，和一个在罗马被称作叛徒的下午。' +
        '选择只承认意大利语，你会得到一条更容易管理的省，' +
        '和一代在课堂上学会憎恨你的人。',
        it: 'In città si parla italiano, croato, ungherese; gli atti ufficiali ne riconoscono uno. ' +
        'E la scuola è quella lasciata dagli Asburgo: maestri, libri di testo e orari sono ancora lì, ' +
        'solo che la settimana scorsa qualcuno ha raschiato lo stemma imperiale dalla lavagna, ' +
        'lasciando un rettangolo di legno più chiaro.\n\n' +
        'Il Rettore all\'Istruzione deve decidere in quale lingua impareranno l\'alfabeto, ' +
        'domani mattina, i bambini dei villaggi oltre il delta. Scegliere il bilinguismo ' +
        'ti darà contadini che non hanno più paura dei carabinieri e un pomeriggio ' +
        'in cui a Roma ti chiameranno traditore. Scegliere il solo italiano ' +
        'ti darà una provincia più facile da amministrare e una generazione ' +
        'che imparerà a odiarti sui banchi di scuola.' },
    cost: { ap: 1 },
    cooldown: 6,
    require: function (s) { return s.cabinet.istruzione === s.playerForce; },
    requireText: { zh: '未掌握教育执政官席位', it: 'Ministero dell\'Istruzione non controllato' },
    options: [
      { id: 'bilingue',
        text: { zh: '公文与学校一律双语。', it: 'Bilingue negli atti e nelle scuole.' },
        subtitle: { zh: '让两种语言在同一间教室里长大，是这座城唯一不需要翻译的未来。', it: 'Far crescere due lingue nella stessa aula è l\'unico futuro di questa città che non abbia bisogno di un traduttore.' },
        preview: ['语言法 +1', '学校 +1', '农民 +', '法西斯派异议 ++'],
        effect: { laws: { lingua: 1, scuola: 1 },
                  support: [['contadini', 'LEG', 5], ['operai', 'LEG', 2], ],
                  diplo: { yugoslavia: 8, italy: -5 },
                  districts: { drenova: { agitation: -8, control: 8 }, srdoci: { agitation: -8, control: 6 }, plase: { agitation: -5 } },
                  factions: { sindacalisti: { inf: 3, dis: -12 }, fascisti: { dis: 12 } } } },
      { id: 'tolleranza',
        text: { zh: '只在子市镇允许克罗地亚语。', it: 'Il croato solo nei sottocomuni.' },
        subtitle: { zh: '在城里说意大利语，在乡下说克罗地亚语——把一座城劈成两半，然后声称它完整。', it: 'Italiano in città, croato in campagna: dividere in due una città e dichiararla intera.' },
        preview: ['学校 +1', '农民 +', '意大利 +', '人民委员会 −'],
        effect: { laws: { scuola: 1 },
                  support: [['contadini', 'LEG', 3], ],
                  diplo: { yugoslavia: 3, italy: 3 },
                  districts: { drenova: { agitation: -4, control: 4 } } } },
      { id: 'solo_italiano',
        text: { zh: '只承认意大利语。', it: 'Solo l\'italiano.' },
        subtitle: { zh: '一个国家的语言越少，它需要派去村子里的宪兵就越多。', it: 'Meno lingue ha uno Stato, più carabinieri deve mandare nei villaggi.' },
        preview: ['法西斯派 ++', '人民委员会 −−−', '动荡 ++'],
        effect: { order: { authority: 6, violence: 6 },
                  support: [['contadini', 'LEG', -8], ['contadini', 'PCR', 6]],
                  diplo: { italy: 6, yugoslavia: -10 },
                  districts: { drenova: { agitation: 12, control: -5 }, srdoci: { agitation: 10, control: -4 } },
                  factions: { fascisti: { dis: -14, inf: 2 }, sindacalisti: { dis: 16 } } } }
    ]
};
