import type { Card } from '../content/types';

/* Propaganda. The one resource Fiume never runs out of is words: D'Annunzio's
   daily proclamations, dropped from an aeroplane over the city; the press office
   in Rome; Mario Carli's «Testa di Ferro» in Milan. This is a card about spending
   ink instead of men — cheap in money, and it buys enthusiasm rather than rifles.

   Two of the six options hand over to another card's menu instead of resolving
   themselves: the private network opens 与意大利力量之间的关系, and the diplomatic
   pouch opens 阜姆联盟. That is the `openCard` effect key on the engine side —
   it bypasses the target's cooldown and AP cost (the choice is already paid for)
   but not its own option requirements.

   Each substantive option costs 1 K£. The decline costs nothing, because there is
   nothing to print. */
export const azPropaganda: Card = {
    id: 'az_propaganda', deck: 'azione',
    name: { zh: '宣传攻势', it: 'Offensiva propagandistica' },
    cooldown: 5,
    text: { zh: '在阜姆，宣传不是附属品，而是与刺刀同等重要的武器。' +
        '对于亚得里亚海孤城中的天才们来说，唯一无限的资源就是文字与意象。\n\n' +
        '邓南遮几乎每天都会发布宣言、公告和传单，并常常用飞机将这些文字从空中洒向城市。' +
        '在罗马的阜姆代表处，一个宣传办公室每天都在向意大利各地发布新闻公报。' +
        '而马里奥·卡利在米兰创办的《铁头》报，则是军团的喉舌，' +
        '将未来主义的暴烈与阿迪蒂的呐喊汇聚成油墨的浪潮。\n\n' +
        '这是一台用纸张、油墨、电波和诗歌驱动的战争机器。',
        it: 'A Fiume la propaganda non è un accessorio: è un\'arma pari alla baionetta. ' +
        'Per i geni rinchiusi in questa città sull\'Adriatico l\'unica risorsa infinita sono le parole e le immagini.\n\n' +
        'D\'Annunzio pubblica proclami, bandi e volantini quasi ogni giorno, e spesso li fa piovere ' +
        'sulla città da un aeroplano. A Roma, l\'ufficio stampa della Reggenza diffonde bollettini ' +
        'in tutta Italia. E «Testa di Ferro», che Mario Carli fonda a Milano, è la voce della Legione: ' +
        'la violenza futurista e il grido degli arditi diventano un\'onda d\'inchiostro.\n\n' +
        'È una macchina da guerra mossa da carta, inchiostro, onde radio e poesia.' },
    // 1 AP to start the presses; the ink is charged per option (1 K£), the same
    // shape as 军团招募.
    cost: { ap: 1 },
    options: [
        { id: 'rete_privata',
          text: { zh: '借助领袖的私人外交网络，联络在意大利的各派政界人士。', it: 'Servirsi della rete privata del Comandante per contattare i politici italiani.' },
          subtitle: { zh: '通过邓南遮错综复杂的私人关系，获取我们所需要的力量。', it: 'Attraverso le intricate relazioni private di D\'Annunzio, ottenere la forza che ci serve.' },
          preview: ['金库 −1', '→ 打开「与意大利力量之间的关系」', '无视该卡冷却'],
          /* The jump. No effect of its own beyond the handover: the choice was
             which door to knock on, and the door is the other card. The target's
             options keep their own gates (the communist door still needs
             Livorno to have happened). */
          effect: { funds: -1, openCard: 'az_forze_italia' } },
        { id: 'volantinaggio',
          text: { zh: '发动更大规模的空投宣传行动，将指挥官的宣言从亚得里亚海上空洒向达尔马提亚与意大利本土。', it: 'Una campagna di volantinaggio su larga scala: i proclami del Comandante sulla Dalmazia e sull\'Italia.' },
          subtitle: { zh: '让战鹰再次升空，将传单化作雪花般的宣言，飘落在意大利的屋顶上。', it: 'Che l\'aquila di guerra torni a salire: volantini come neve sui tetti d\'Italia.' },
          preview: ['金库 −1', '民众热忱 +6', '摄政权威 +3', '事态 +'],
          effect: { funds: -1,
                    order: { fervour: 6, authority: 3, coup: 3 },
                    factions: { futuristi: { dis: -6 }, arditi: { dis: -4 } } } },
        { id: 'testa_di_ferro',
          text: { zh: '为马里奥·卡利的《铁头》报注入新的资金与纸张。', it: 'Nuovi fondi e nuova carta per «Testa di Ferro» di Mario Carli.' },
          subtitle: { zh: '让这份米兰的军团喉舌继续以未来主义的暴烈与阿迪蒂的呐喊。', it: 'Che il portavoce milanese della Legione continui con la violenza futurista e il grido degli arditi.' },
          preview: ['金库 −1', '未来主义派影响力 +5', '阿迪蒂派影响力 +3', '民众热忱 +3'],
          effect: { funds: -1,
                    order: { fervour: 3 },
                    factions: { futuristi: { inf: 5, dis: -8 }, arditi: { inf: 3, dis: -6 } } } },
        { id: 'canali_diplomatici',
          text: { zh: '利用外交渠道，向各国使馆递交阜姆的宣传文件。', it: 'Servirsi dei canali diplomatici: consegnare i documenti di Fiume alle ambasciate.' },
          subtitle: { zh: '满怀控诉与激情的外交文件本身便是对旧世界的优雅嘲弄。', it: 'Un documento diplomatico pieno di accuse e passione è già di per sé una beffa elegante al vecchio mondo.' },
          preview: ['金库 −1', '→ 打开「阜姆联盟」', '无视该卡冷却'],
          effect: { funds: -1, openCard: 'az_fiume_league' } },
        { id: 'reclutamento',
          text: { zh: '发动一场征兵宣传。', it: 'Lanciare una campagna di reclutamento.' },
          subtitle: { zh: '用诗人华丽的辞藻，向新世界庄严宣告军团的到来。', it: 'Con la prosa sontuosa del Poeta, annunciare al mondo nuovo l\'arrivo della Legione.' },
          preview: ['金库 −1', '法西斯派影响力 +3', '军团兵力 +450', '民众热忱 +3', '法西斯派异议 −5'],
          effect: { funds: -1,
                    order: { milizia: 450, fervour: 3 },
                    factions: { fascisti: { inf: 3, dis: -5 } } } },
        /* The decline: no ink, no money, no effect — and therefore no cost. */
        { id: 'chiudere',
          text: { zh: '关闭宣传机器。', it: 'Spegnere la macchina della propaganda.' },
          subtitle: { zh: '墨水无法喂饱饥饿的军团。', it: 'L\'inchiostro non sfama una Legione affamata.' },
          preview: ['无效果', '无花费'],
          effect: {} }
    ]
};
