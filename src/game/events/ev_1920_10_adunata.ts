import type { GameEvent } from '../content/types';

/* The Legionary assembly. Not a military parade — a liturgy. The Comandante on
   the balcony, the "spirito legionario" gathered below the railing, the banners
   doing the real work: they tie one man's longing to a national myth, a heroic
   past to a legionary present to a revolutionary future. Ten thousand arms go up
   in the Roman salute and the square rings with "Eia! Eia! Alala!"

   The event is the choice of what the rite is FOR. Every substantive option
   costs 1 K£ — a rally is cheap to hold but never free — and the thematic
   pairing is deliberate: the two options that are good for the movement are the
   ones that cost money, and the two that damage it are the ones that do not.

   Option 4 is the balcony declaration of the march on Rome. It does NOT touch
   marcia_1920's thresholds (10 000 men, officer corps 60, three forces at 80):
   lowering a completion condition from inside an event would quietly rewrite
   the line's difficulty. What it does is real preparation — it raises fervour,
   pushes the four Italian forces' attitude up through the same `forze` axis the
   journal reads, and records the declaration so the run can be recognised. */
export const ev192010Adunata: GameEvent = {
    id: 'ev_1920_10_adunata', date: { y: 1920, m: 10, d: 12 },
    title: { zh: '军团集会', it: 'L\'adunata legionaria' },
    body: { zh: '军团集会是一场精心编排的宣传式政治仪式。「军团精神」聚集在栏杆之下，' +
        '邓南遮站在阳台上俯瞰他们，如同祭司俯瞰他的信徒。\n\n' +
        '旗帜是集会的核心象征——它连接个体的渴望与民族的神话，' +
        '承载着一个英雄的过去、一个军团的现在和一个革命的未来。' +
        '千万个沉醉在领袖麾下的战士高举罗马礼、口中回荡着「Eia! Eia! Alala!」的战吼……\n\n' +
        '如今，是时候召集军团集会了——这次集会的主题是？',
        it: 'L\'adunata legionaria è un rito politico messo in scena con cura. Lo «spirito legionario» ' +
        'si raccoglie sotto la ringhiera, e D\'Annunzio lo guarda dal balcone come un sacerdote i suoi fedeli.\n\n' +
        'Le bandiere sono il cuore della cerimonia: legano il desiderio di un uomo al mito di una nazione, ' +
        'portano un passato eroico, un presente legionario e un futuro rivoluzionario. ' +
        'Migliaia di uomini ebbri del Capo levano il saluto romano e la piazza rimbomba di «Eia! Eia! Alala!»...\n\n' +
        'Ora è tempo di convocare l\'adunata. Il tema di questa volta è?' },
    options: [
        {
            id: 'disciplina',
            text: { zh: '严肃地整顿军团的纪律。', it: 'Rimettere seriamente in riga la disciplina della Legione.' },
            subtitle: { zh: '唯有纪律的严明，才能奔向如痴如醉的胜利。', it: 'Solo una disciplina severa porta alla vittoria estatica.' },
            preview: ['金库 −1', '法西斯派影响力 +3', '收复主义者影响力 +5', '工团派异议 +3', '未来主义派异议 +5'],
            /* Order imposed on a movement that was built out of the absence of it:
               the two factions that want an army gain, the two that want a
               revolution resent it. */
            effect: { funds: -1,
                      factions: { fascisti: { inf: 3 }, irredentisti: { inf: 5 },
                                  sindacalisti: { dis: 3 }, futuristi: { dis: 5 } },
                      order: { authority: 4 } }
        },
        {
            id: 'discorso',
            text: { zh: '用一场震撼人心的演说鼓舞军队的士气。', it: 'Rinfrancare la truppa con un discorso che la scuota.' },
            subtitle: { zh: '理想本身就是每一个军团士兵在饥肠辘辘时仍愿为之赴死的理由。', it: 'L\'ideale è la ragione per cui un legionario affamato accetta ancora di morire.' },
            preview: ['金库 −1', '所有派系异议 −4', '民众热忱 +6', '摄政权威 +3'],
            effect: { funds: -1,
                      factions: { arditi: { dis: -4 }, sindacalisti: { dis: -4 },
                                  futuristi: { dis: -4 }, fascisti: { dis: -4 }, irredentisti: { dis: -4 } },
                      order: { fervour: 6, authority: 3 } }
        },
        {
            id: 'eccidio',
            text: { zh: '集会演变成一场屠杀罢工工人的暴行。', it: 'L\'adunata degenera in un eccidio di operai in sciopero.' },
            subtitle: { zh: '这没什么可称赞的。', it: 'Non c\'è nulla da lodare.' },
            preview: ['金库 −1', '码头劳工 −5', '产业工人 −3', '工团派异议 +12', '政治暴力 +8', '党内事态 +6'],
            /* The worst night of the Regency's internal history, and it is not
               free either: the men who did it have to be paid, and the movement
               pays for it in the only currency that matters, the docks. */
            effect: { funds: -1,
                      support: [['portuali', 'LEG', -5], ['operai', 'LEG', -3]],
                      factions: { sindacalisti: { dis: 12 }, futuristi: { dis: 6 } },
                      order: { violence: 8, subversion: 6, fervour: -4 } }
        },
        {
            id: 'annuncio_marcia',
            text: { zh: '利用集会正式宣布「向罗马进军」的计划，将阳台变为那场未遂政变的预演。', it: 'Annunciare dall\'adunata il piano della marcia su Roma: il balcone diventa la prova generale.' },
            subtitle: { zh: '科拉迪尼曾在集会上向指挥官耳语「向罗马进军」，如今让阳台成为那场历史性进军的排练场。军团在广场上列队，枪口尚未对准罗马，但意志已经出发。', it: 'Corradini, a un\'adunata, sussurrò al Comandante: «marciare su Roma». Ora il balcone diventa il teatro delle prove di quella marcia. La Legione si schiera nella piazza: i fucili non sono ancora puntati su Roma, ma la volontà è già partita.' },
            preview: ['金库 −1', '民众热忱 +10（上限 100）', '摄政权威 +4', '四股意大利力量态度 +8', '事态 +8', '登记「阳台宣言」'],
            /* Real preparation: the same `forze` axis marcia_1920 reads, nudged
               toward the three-of-four threshold. Not a shortcut past it.
               Requested as +8 because W.FORZA_ANTAGONISM scales each force's gain
               by the size of its own antagonist set, so this lands between +4
               (the fascists, who antagonise two others) and +8 (the socialists,
               who antagonise one). Courting all four at once is meant to be less
               efficient than courting one — that is the whole design of the axis. */
            effect: { funds: -1,
                      order: { fervour: 10, authority: 4, coup: 8 },
                      forze: { fascisti: 8, socialisti: 8, anarchici: 8, comunisti: 8 },
                      factions: { arditi: { dis: -8 }, futuristi: { dis: -6 }, irredentisti: { dis: -6 } },
                      flags: { balcony_declaration: true } }
        },
        {
            id: 'nudo',
            text: { zh: '集会演变成一场淫乱的天体派对。', it: 'L\'adunata degenera in una festa nuda e licenziosa.' },
            subtitle: { zh: '西风在她发间泛起白沫。无垠的赤裸显现了，无垠的赤裸。', it: 'Il vento di ponente spuma fra i suoi capelli. Appare la nudità infinita, la nudità infinita.' },
            preview: ['金库 −1', '民众热忱 ++', '摄政权威 −−', '有产精英支持 −−', '资本信心 −−', '事态 +', '收复主义者异议 ++'],
            /* Scaled from the same rite at the Golden Stag (az_cervo_doro, option
               3): a balcony is a bigger stage than a tavern, so everything is a
               little louder. */
            effect: { funds: -1,
                      order: { fervour: 12, authority: -7, coup: 7, violence: 3 },
                      support: [['artigiani', 'LEG', 3], ['regnicoli', 'LEG', 2], ['borghesia', 'LEG', -7]],
                      economy: { capitalConfidence: -11 },
                      diplo: { italy: -5, league: -3 },
                      factions: { futuristi: { dis: -12 }, arditi: { dis: -7 }, irredentisti: { dis: 12 } },
                      flags: { adunata_scandal: true } }
        },
        /* The decline: cancelling costs nothing and does nothing. */
        {
            id: 'annullare',
            text: { zh: '取消集会。', it: 'Annullare l\'adunata.' },
            subtitle: { zh: '让广场恢复空旷，有时候，沉默比任何战吼都更接近真实。', it: 'Lasciare la piazza vuota: a volte il silenzio è più vicino al vero di qualsiasi grido di guerra.' },
            preview: ['无效果', '无花费'],
            effect: {}
        }
    ]
};
