import type { Card } from '../content/types';

/* The Golden Stag — Al Cervo d'Oro — which the legionaries renamed
   L'Ornitorinco, the platypus, during one of the long nights. A port tavern with
   smoke-blackened walls and borrowed chairs, and the informal headquarters of
   the most radical, most Futurist, most seditious of the Comandante's own young
   men: adventurers, anarchists, thugs, rank-and-file soldiers, ladies, addicts.
   D'Annunzio himself turns up to drink Sangue Morlacco.

   Modelled on az_intrighi and az_forze_italia: an action card where every
   substantive option pays for itself, and the option that declines still costs
   something. Two of the options are gated, so the card reads differently at
   different points of a game — but three of them are always open, so no state
   can leave the player with only the refusal. */
export const azCervoDoro: Card = {
    id: 'az_cervo_doro', deck: 'azione',
    name: { zh: '金鹿酒馆', it: 'Al Cervo d\'Oro' },
    cooldown: 4,
    text: { zh: '军团兵们在一场狂宴里把它改名叫「鸭嘴兽」。墙被烟熏得漆黑，家具简陋，' +
        '但这里是阜姆最桀骜不驯的那批灵魂每晚聚集的地方——冒险家、无政府主义者、流氓、' +
        '下层士兵、贵妇人、瘾君子，混在一堂。指挥官本人也时常现身，喝卢萨尔多酒厂的' +
        '「莫尔拉科之血」。\n\n' +
        '这不只是寻欢作乐的地方。阴谋在这里策划，思想在这里发酵。' +
        '在这个「没有过去与未来的永恒当下」里，每一杯烈酒都可能是下一场奇袭的序曲，' +
        '每一段醉后的狂言都可能成为新法令的草稿。',
        it: 'I legionari l\'hanno ribattezzata L\'Ornitorinco in una notte di baldoria. Muri neri di fumo, ' +
        'mobili di fortuna: ma è qui che ogni sera si radunano le anime più indomite di Fiume — avventurieri, ' +
        'anarchici, teppisti, soldati di truppa, signore, tossici. Il Comandante stesso compare a bere ' +
        'il Sangue Morlacco.\n\n' +
        'Non è solo un luogo di piacere. Qui si complotta e qui fermentano le idee. ' +
        'In questo "eterno presente senza passato né futuro", ogni bicchiere può essere il preludio ' +
        'della prossima incursione, e ogni farneticazione ubriaca la bozza del prossimo decreto.' },
    cost: { ap: 1 },
    options: [
        { id: 'bohemienne',
          text: { zh: '举办一场无拘无束的波希米亚式聚会。', it: 'Dare una festa bohémienne senza freni.' },
          subtitle: { zh: '让未来主义者的速度崇拜与无政府主义者的自由宣言在烟雾中碰撞。', it: 'Che il culto futurista della velocità e il manifesto anarchico si scontrino nel fumo.' },
          preview: ['阿迪蒂影响力 −', '未来主义派异议 −', '工团派异议 −', '资本信心 −'],
          effect: { factions: { arditi: { inf: -3, dis: -6 }, futuristi: { dis: -1 }, sindacalisti: { dis: -2 } },
                    order: { fervour: 6, violence: 4 },
                    economy: { capitalConfidence: -6 },
                    support: [['artigiani', 'LEG', 2], ['impiegati', 'LEG', -2]] } },
        { id: 'discorso',
          text: { zh: '指挥官公开现身酒馆，在军团的仰慕者面前发表一场私密而煽动性的演讲。', it: 'Il Comandante compare in pubblico e parla ai suoi ammiratori.' },
          subtitle: { zh: '诗人走进酒馆的烟尘与酒气中，沐浴在军团士兵的欢呼中。', it: 'Il Poeta entra nel fumo e nel vino, sotto gli evviva dei legionari.' },
          preview: ['摄政领袖权威 +3', '意大利侨民支持 +3', '民众热忱 +', '事态累积 +'],
          effect: { order: { authority: 3, fervour: 5, coup: 3 },
                    support: [['regnicoli', 'LEG', 3]],
                    factions: { arditi: { dis: -8 }, futuristi: { dis: -4 } } } },
        { id: 'nudo',
          text: { zh: '举办一场淫乱的天体派对。', it: 'Tenere una festa nuda e licenziosa.' },
          subtitle: { zh: '西风在她发间泛起白沫。无垠的赤裸显现了，无垠的赤裸。', it: 'Il vento di ponente spuma fra i suoi capelli. Appare la nudità infinita, la nudità infinita.' },
          preview: ['民众热忱 ++', '摄政领袖权威 −−', '有产精英支持 −−', '资本信心 −−', '事态累积 +'],
          effect: { order: { fervour: 10, authority: -6, coup: 5, violence: 3 },
                    support: [['artigiani', 'LEG', 3], ['regnicoli', 'LEG', 2], ['borghesia', 'LEG', -6]],
                    economy: { capitalConfidence: -10 },
                    diplo: { italy: -4, league: -3 },
                    factions: { futuristi: { dis: -10 }, arditi: { dis: -6 }, irredentisti: { dis: 10 } },
                    flags: { cervo_scandal: true } } },
        { id: 'amante',
          text: { zh: '我认出了你两腿之间伏击的燃烧的桃金娘丛，你腰间的鸢尾……', it: 'Riconobbi il mirto ardente in agguato fra le tue gambe, l\'iris ai tuoi fianchi...' },
          subtitle: { zh: '唯有情人的怀抱能给我慰藉。', it: 'Solo il grembo dell\'amante mi dà conforto.' },
          /* Gated: intimacy as a political act only reads as such once the
             Comandante's authority is established. */
          require: function (s) { return s.order.authority > 50; },
          requireText: { zh: '摄政权威需大于 50——威望不足时，这一夜只是私事', it: 'Serve autorità > 50: senza prestigio, questa notte resta un fatto privato' },
          preview: ['摄政领袖权威 ++', '民众热忱 −', '事态累积 −', '未来主义派异议 −'],
          /* No `legitimacy` here on purpose: 军团民意 is derived from class
             support × population weight and applyEffect refuses to write it
             (rules.js, and check_doc_claims.js asserts it). Authority and the
             support row are the writable levers. */
          effect: { order: { authority: 6, fervour: -4, coup: -4 },
                    factions: { futuristi: { dis: -8 }, arditi: { dis: -4 } },
                    support: [['borghesia', 'LEG', 2], ['impiegati', 'LEG', 2]] } },
        { id: 'carne',
          text: { zh: '推行肉雕（Sculpted meat）作为军团饮食。', it: 'Adottare la "carne scolpita" come dieta dei legionari.' },
          subtitle: { zh: '炮打意大利面——未来主义者的食谱。', it: 'Contro la pastasciutta: la cucina dei futuristi.' },
          /* Gated: the Futurists have to be a real force in the movement before
             their cookbook can become the movement's cookbook. Starts at 18, so
             this needs deliberate cultivation. */
          require: function (s) { return s.factions.futuristi.inf > 35; },
          requireText: { zh: '未来主义派影响力需大于 35——食谱要变成法令，先得有分量', it: 'Serve influenza futurista > 35: un ricettario diventa decreto solo se pesa' },
          preview: ['未来主义派影响力 ++／异议 −−', '阿迪蒂异议 ++', '有产精英支持 −', '资本信心 −'],
          effect: { factions: { futuristi: { inf: 3, dis: -14 }, arditi: { dis: 10 }, irredentisti: { dis: 6 } },
                    support: [['operai', 'LEG', -3], ['artigiani', 'LEG', -2], ['borghesia', 'LEG', -2]],
                    economy: { capitalConfidence: -5 },
                    order: { authority: 2, fervour: 4 },
                    flags: { carne_scolpita: true } } },
        /* The decline: a quiet night is also a decision, and its price is that
           the movement reads the silence as withdrawal. */
        { id: 'silenzio',
          text: { zh: '领袖仅打算再次度过一个安静的夜晚。', it: 'Il Comandante vuole solo un\'altra notte tranquilla.' },
          subtitle: { zh: '诗人不希望被任何人打扰，至少是今晚。', it: 'Il Poeta non vuole essere disturbato. Almeno stanotte.' },
          preview: ['民众热忱 −', '摄政领袖权威 −', '阿迪蒂／未来主义派异议 +'],
          effect: { order: { fervour: -4, authority: -2 },
                    factions: { arditi: { dis: 8 }, futuristi: { dis: 6 }, sindacalisti: { dis: 4 } } } }
    ]
};
