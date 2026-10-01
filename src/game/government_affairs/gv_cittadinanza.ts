import type { Card } from '../content/types';

/* The 1919 electoral law already gave the vote to women; the citizenship law
   decided who else counted. About eight thousand regnicoli had come from the
   Kingdom of Italy after 1918 — the legionaries' social base and their burden. */
export const gvCittadinanza: Card = {
    id: 'gv_cittadinanza', deck: 'governo', ministry: 'interno',
    name: { zh: '公民身份法', it: 'Legge sulla cittadinanza' },
    text: { zh: '八千人是从意大利王国来的。他们在 1918 年之后迁进来，' +
        '占据了港务局、银行和报馆的职位；他们是军团兵的社会基础，也是他们的包袱——' +
        '因为每一次罗马收紧封锁，最先挨饿的正是这批没有本地根基的人。\n\n' +
        '对岸的村子里住着另一批人：他们的祖父葬在这里，他们的孩子在学校里' +
        '被要求用另一种语言拼写自己的名字。公民身份法要回答的问题是：' +
        '「阜姆人」到底是一个法律事实，还是一种文化认同，' +
        '或者只是一个谁先到谁后到的时间问题。',
        it: 'Ottomila sono regnicoli. Arrivarono dopo il 1918 e occupano i posti ' +
        'della Capitaneria, delle banche e delle redazioni: sono la base sociale dei legionari ' +
        'e insieme il loro fardello — perché ogni volta che Roma stringe il blocco, ' +
        'i primi a patire la fame sono proprio quelli senza radici qui.\n\n' +
        'Nei villaggi oltre il fiume vive un\'altra gente: i loro nonni sono sepolti qui, ' +
        'e ai loro figli a scuola si chiede di scrivere il proprio nome in un\'altra lingua. ' +
        'La legge sulla cittadinanza deve rispondere a una domanda: ' +
        '«fiumano» è un fatto giuridico, un\'identità culturale, ' +
        'o soltanto una questione di chi è arrivato prima?' },
    cost: { ap: 1 },
    cooldown: 6,
    require: function (s) { return s.cabinet.interno === s.playerForce; },
    requireText: { zh: '未掌握内政与司法执政官席位', it: 'Ministero dell\'Interno non controllato' },
    options: [
      { id: 'residenza',
        text: { zh: '居住三年即入籍，不问来处。', it: 'Tre anni di residenza, da qualunque parte si venga.' },
        subtitle: { zh: '把门槛定成时间——这是唯一一种不偏袒任何一方的门槛。', it: 'Fissare la soglia nel tempo: l\'unica soglia che non favorisce nessuno.' },
        preview: ['公民身份升至至少 2 级', '人口 +', '意大利 −', '人民委员会 +'],
        effect: function (s) { return { laws: { cittadinanza: Math.max(0, 2 - s.laws.cittadinanza) }, diplo: { italy: -3 },
                  support: [['contadini', 'LEG', 2], ['contadini', 'PCR', 3]],
                  economy: { population: 180 } }; } },
      { id: 'sangue',
        text: { zh: '以语言与文化为准。', it: 'Per lingua e cultura.' },
        subtitle: { zh: '用语言划一条国界，它就会正好落在教室的课桌之间。', it: 'Tracciare un confine con la lingua: finirà esattamente fra i banchi di scuola.' },
        preview: ['公民身份改为 1 级', '军团民意 +', '法西斯派 +', '人民委员会 −−'],
        effect: function (s) { return { laws: { cittadinanza: 1 - s.laws.cittadinanza },
                  support: [['contadini', 'PCR', -5]],
                  diplo: { italy: 4, yugoslavia: -6 },
                  factions: { fascisti: { dis: -10 }, sindacalisti: { dis: 10 } } }; } },
      { id: 'doppia',
        text: { zh: '允许双重国籍。', it: 'Doppia cittadinanza.' },
        subtitle: { zh: '让一个人可以同时属于两个国家——这是弱国唯一能负担得起的慷慨。', it: 'Permettere a un uomo di appartenere a due Stati: l\'unica generosità che uno Stato debole possa permettersi.' },
        preview: ['公民身份升至 3 级', '国际承认 ++', '法西斯派异议 ++'],
        effect: function (s) { return { laws: { cittadinanza: Math.max(0, 3 - s.laws.cittadinanza) }, economy: { population: 260 },
                  diplo: { yugoslavia: 8, league: 5, italy: -6 },
                  support: [['contadini', 'LEG', 4], ['impiegati', 'LEG', 3]],
                  factions: { fascisti: { dis: 14 } } }; } }
    ]
};
