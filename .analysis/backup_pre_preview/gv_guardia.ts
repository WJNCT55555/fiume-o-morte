import type { Card } from '../content/types';

/* The Guardia Civica was the attempt to have an armed force that was neither
   the legionaries nor the fascists — recruited by the Municipio and sworn to
   the city rather than to a faction. */
export const gvGuardia: Card = {
    id: 'gv_guardia', deck: 'governo', ministry: 'interno',
    name: { zh: '公民卫队编制', it: 'Ordinamento della Guardia Civica' },
    text: { zh: '这座城市需要一支既不是军团兵、也不是法西斯的武装。' +
        '军团兵的忠诚属于诗人，法西斯的忠诚属于米兰，而市政厅需要一批' +
        '拿着枪、却只对这座城市本身负责的人。\n\n' +
        '编制方案摊在桌上，麻烦不在人数，而在誓词。让他们向市长宣誓，' +
        '他们就变成一支市政警察：合法的、可被罗马承认的，也是可以被解散的。' +
        '从军团兵里抽调，他们就听你的，但也就成了你的私兵，' +
        '而阿迪蒂会把这看作对他们荣誉的侮辱。' +
        '第三条路最容易：什么都不做，让街上继续只有两种人拿枪。',
        it: 'Questa città ha bisogno di una forza armata che non sia né i legionari né i fascisti. ' +
        'La fedeltà dei legionari appartiene al Poeta, quella dei fascisti a Milano; ' +
        'il Municipio ha bisogno di uomini armati che rispondano soltanto alla città.\n\n' +
        'Lo schema è sul tavolo, e il problema non è il numero ma il giuramento. ' +
        'Se giurano al podestà diventano una polizia municipale: legittima, riconoscibile da Roma, ' +
        'e per questo anche scioglibile. Se li prendi dai legionari obbediranno a te, ' +
        'ma saranno la tua guardia personale — e gli arditi lo leggeranno come un insulto al loro onore. ' +
        'La terza strada è la più facile: non fare nulla, e lasciare che per strada ' +
        'continuino a portare armi soltanto due specie di uomini.' },
    cost: { ap: 1 },
    cooldown: 6,
    require: function (s) { return s.cabinet.interno === s.playerForce; },
    requireText: { zh: '未掌握内政与司法执政官席位', it: 'Ministero dell\'Interno non controllato' },
    options: [
      { id: 'comunale',
        text: { zh: '由市政厅招募，向市长宣誓。', it: 'Reclutarla dal Municipio, con giuramento al podestà.' },
        subtitle: { zh: '一支对城市本身宣誓的武装，是这座城市唯一能自己签字的东西。', it: 'Una forza che giura alla città è l\'unica cosa che questa città possa firmare da sola.' },
        preview: ['公共秩序 +2', '领袖权威 +', '法西斯暴力 −−', '阿迪蒂异议 +', '卫队日志'],
        effect: { laws: { ordine: 2 }, organizations: ['guardia'], journals: ['guardia'],
                  order: { authority: 6, squadre: -8, civicGuard: 420 },
                  support: [['borghesia', 'LEG', 3], ['artigiani', 'LEG', 2]],
                  factions: { sindacalisti: { dis: -10 }, arditi: { dis: 8 } } } },
      { id: 'legione',
        text: { zh: '从军团兵里抽调，向你本人负责。', it: 'Trarla dai legionari, agli ordini tuoi.' },
        subtitle: { zh: '一支只听一个人的卫队，护得住那个人，护不住那个人不在的夜晚。', it: 'Una guardia che obbedisce a un solo uomo protegge quell\'uomo, non le notti in cui quell\'uomo non c\'è.' },
        preview: ['军团兵 −', '领袖权威 ++', '阿迪蒂 +', '工团派异议 +'],
        effect: { laws: { ordine: 1 }, organizations: ['guardia'],
                  order: { authority: 9, civicGuard: 320, milizia: -260, violence: 3 },
                  factions: { arditi: { inf: 3, dis: -10 }, sindacalisti: { dis: 12 } } } },
      { id: 'rinunciare',
        text: { zh: '不编制。军团兵就够了。', it: 'Nessuna guardia. Bastano i legionari.' },
        subtitle: { zh: '省下一支卫队的钱，也省下了一个本可以站在中间的人。', it: 'Si risparmia il costo di una guardia, e anche l\'uomo che avrebbe potuto mettersi nel mezzo.' },
        preview: ['法西斯暴力 +', '领袖权威 −', '阿迪蒂异议 −'],
        effect: { order: { authority: -4, squadre: 8 },
                  support: [['borghesia', 'LEG', -3]],
                  factions: { arditi: { dis: -8 } } } }
    ]
};
