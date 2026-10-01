import type { Card } from '../content/types';

/* The Financial Legion: the Regency's other army. Fiume never had enough money,
   and D'Annunzio knew it — "l'esercito del denaro" is what kept the legionaries
   fed while the printing press ran day and night. Trieste industrialists and
   Italian bankers really did subscribe to his cause, and the Comandante's
   signature on a bond was worth more abroad than anything his cabinet could
   collect at home.

   Every substantive option raises cash and charges for it in a different
   currency — sovereignty, the workers, the movement's own politics. The card
   is deliberately NOT a pure money printer: no option is free and none is
   strictly best.

   Notes on the mechanics used here:
   - Port revenue boosts compound with throughput and the confidence multiplier;
     other tax-channel boosts are supported by the same settlement formula.
   - The Milan loan is gated on `laws.portofranco >= 1`: the port concession is
     what it is secured against, and that law is what the player has to have
     passed first.
   - The fascist subscription moves `forze.fascisti` (the movement-attitude axis
     the 1920 march line reads), so taking Mussolini's money genuinely strengthens
     his hand inside the movement. */
export const azLegioneFinanziaria: Card = {
    id: 'az_legione_finanziaria', deck: 'azione',
    name: { zh: '金融军团', it: 'La Legione finanziaria' },
    cooldown: 9,
    text: { zh: '金融与经济问题是阜姆那根永远绷紧、随时可能断裂的血管。' +
        '指挥官深知，一支军队需要真金白银灌溉。\n\n' +
        '幸而邓南遮收到了的里雅斯特的实业家和意大利的银行家愿意为他的事业慷慨解囊。' +
        '如今金库已经见底，印刷机却还在日夜轰鸣。' +
        '金融军团必须再次走上战场——而这一次，他们的武器是债券、赎金，' +
        '与那些愿意为一场「永恒当下」买单的意大利工业家的签名。',
        it: 'Il denaro è il vaso sanguigno di Fiume: sempre teso, sempre sul punto di spezzarsi. ' +
        'Il Comandante lo sa bene — un esercito si irriga con oro vero, non con proclami.\n\n' +
        'Per fortuna gli industriali di Trieste e i banchieri d\'Italia si sono detti disposti ' +
        'a sovvenzionare la sua causa. Ora però la cassa è vuota e il torchio continua a girare ' +
        'giorno e notte. La Legione finanziaria deve tornare in campo: e questa volta le sue armi ' +
        'sono obbligazioni, riscatti e le firme di quegli industriali italiani disposti a pagare ' +
        'per un «eterno presente».' },
    /* 1 AP to put the Financial Legion in the field, plus the 1 K£ it costs to
       actually open the subscription. The fee is paid on PLAY_CARD, so the
       options' gains are net of it. */
    cost: { ap: 1, funds: 1 },
    options: [
      { id: 'obbligazioni',
        text: { zh: '发行「卡纳罗债券」。', it: 'Emettere i «prestiti del Carnaro».' },
        subtitle: { zh: '以新国家的未来税收为担保，向意大利工业界筹集资金。', it: 'Garantire con le imposte future del nuovo Stato e raccogliere capitali presso l\'industria italiana.' },
        preview: ['金库 +++', '财政法 +1', '月度收入 +', '债务 ++', '通胀率 +', '意大利 −', '工人 −'],
        effect: { funds: 700,
                  laws: { fisco: 1 },
                  revenueBoost: { porto: 0.10 },
                  economy: { debt: 320, inflation: 3, capitalConfidence: 5 },
                  support: [['borghesia', 'LEG', 4], ['operai', 'LEG', -3], ['impiegati', 'LEG', -2]],
                  diplo: { italy: -7 },
                  factions: { sindacalisti: { dis: 10 }, futuristi: { dis: -4 } },
                  flags: { carnaro_bonds: true } } },
      { id: 'milano',
        text: { zh: '重启与米兰金融界的谈判。', it: 'Riaprire il negoziato con la finanza milanese.' },
        subtitle: { zh: '以港口特许权与未来税收为筹码，换取一笔足以维持军团数月的贷款。', it: 'Mettere sul tavolo la concessione portuale e le imposte future, in cambio di un prestito che mantenga la Legione per mesi.' },
        preview: ['金库 +++', '债务 +++', '资本信心 +', '有产精英 −', '意大利 −'],
        /* Secured on the free port, and the port starts at level 1 (max 3): the
           gate is set at 2 so it actually means "the player has deepened the
           concession", not "the game began". Without a real pledge there is
           nothing for Milan to lend against. */
        require: function (s) { return s.laws.portofranco >= 2; },
        requireText: { zh: '需要自由港法令至少 2 级——1 级是开局的既成事实，米兰要的是更深的特许权', it: 'Serve Porto Franco ≥ 2: il livello 1 è la situazione di partenza, Milano vuole una concessione più ampia' },
        effect: { funds: 820,
                  economy: { debt: 520, capitalConfidence: 6 },
                  support: [['borghesia', 'LEG', -5], ['impiegati', 'LEG', 3]],
                  diplo: { italy: -6, league: 3 },
                  factions: { sindacalisti: { dis: 8 }, arditi: { dis: -6 } },
                  flags: { milan_loan: true } } },
      { id: 'riscatto',
        text: { zh: '扣押一艘新的商船，以货物为筹码向意大利托运人与保险公司索要赎金。', it: 'Sequestrare un altro mercantile e chiedere un riscatto a spedizionieri e assicuratori italiani.' },
        subtitle: { zh: '海面上那艘被拦截的货轮就是一张尚未兑现的支票。每一次成功的「奇袭」，都在金库里敲出一串清脆的硬币。', it: 'Il mercantile fermato in mare è un assegno non ancora incassato: ogni «colpo di mano» riuscito fa tintinnare una manciata di monete nella cassa.' },
        preview: ['金库 ++', '军械 +', '意大利 −−', '国联 −', '资本信心 −', '政治暴力 +', '工团派异议 +'],
        effect: { funds: 380, arms: 12,
                  diplo: { italy: -15, yugoslavia: -8, league: -6 },
                  economy: { traffic: -4, capitalConfidence: -7 },
                  order: { violence: 6, fervour: 4 },
                  factions: { arditi: { dis: -8 }, irredentisti: { dis: -6 },
                              sindacalisti: { dis: 8 }, fascisti: { dis: 4 } } } },
      { id: 'affitto',
        text: { zh: '租赁阜姆的工厂，向工业家们敞开大门。', it: 'Affittare le fabbriche di Fiume e aprire le porte agli industriali.' },
        subtitle: { zh: '让生锈的机器重新转动——代价是承认它转动的理由不再是我们自己的。', it: 'Rimettere in moto i macchinari arrugginiti: il prezzo è ammettere che non girano più per la nostra ragione.' },
        preview: ['金库 ++', '财政法 +1', '月度收入 ++', '资本信心 ++', '失业率 −', '工人 −−', '工团派异议 ++'],
        effect: { funds: 340,
                  laws: { fisco: 1 },
                  revenueBoost: { porto: 0.14 },
                  economy: { capitalConfidence: 12, unemployment: -4, works: 4 },
                  support: [['borghesia', 'LEG', 4], ['operai', 'LEG', -6], ['portuali', 'LEG', -3]],
                  factions: { sindacalisti: { dis: 16 }, futuristi: { dis: -6 }, fascisti: { dis: -8 } },
                  flags: { factories_leased: true } } },
      { id: 'fascisti',
        text: { zh: '向意大利法西斯战斗团请求财政援助。', it: 'Chiedere aiuto finanziario ai Fasci di combattimento.' },
        subtitle: { zh: '利用墨索里尼在《意大利人民报》上发起的全国募捐。', it: 'Servirsi della sottoscrizione nazionale che Mussolini ha lanciato dal «Popolo d\'Italia».' },
        preview: ['金库 ++', '法西斯派影响力 +', '法西斯派异议 −−', '意大利 +', '工人 −', '工团派异议 ++'],
        /* Their money is not a gift: it buys a seat at the movement's table, so
           this is the one option that shifts `forze.fascisti` upward. */
        effect: { funds: 300,
                  forze: { fascisti: 8 },
                  economy: { capitalConfidence: 4 },
                  support: [['operai', 'LEG', -3], ['borghesia', 'LEG', 2], ['regnicoli', 'LEG', 3]],
                  diplo: { italy: 5 },
                  factions: { fascisti: { inf: 6, dis: -18 }, sindacalisti: { dis: 14 }, arditi: { dis: 4 } },
                  flags: { fascist_money: true } } },
      /* The decline: no money, no cost — and the press keeps running. */
      { id: 'nulla',
        text: { zh: '暂时不使用金融军团。', it: 'Per ora non ricorrere alla Legione finanziaria.' },
        subtitle: { zh: '指挥官在金库的空柜前沉默良久。', it: 'Il Comandante resta a lungo in silenzio davanti agli scaffali vuoti della cassa.' },
        preview: [],
        effect: {} }
    ]
};
