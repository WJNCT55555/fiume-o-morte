import type { Card } from '../content/types';

/* The Uskoks of Senj: Adriatic freebooters who preyed on Venetian shipping for
   a century and gave the Habsburgs a permanent diplomatic headache. The name
   was applied to D'Annunzio himself — in November 1919 he slipped out of Fiume
   with warships and shock troops and seized Zara.

   Mechanically this is the reference project's fundraising card: an action that
   turns into money, where the price is paid in something other than money.
   The three substantive options trade cash against arms against standing. */
export const azUscocchi: Card = {
    id: 'az_uscocchi', deck: 'azione',
    name: { zh: '乌斯科克', it: 'Gli Uscocchi' },
    cooldown: 9,
    text: { zh: '阜姆的粮仓早已见底。意大利政府封锁了所有补给通道，尼蒂的舰队在海上巡弋，饥饿正在啃噬这座孤城的骨头。于是指挥官下达了一道命令——将那些愿意为“永恒当下”而战的亡命之徒编入一支特殊的部队。他们被命名为“Uscocchi”，一个来自十六世纪的古老名字，属于那些曾令威尼斯共和国颤抖的亚得里亚海劫掠者。邓南遮正式设立了“Ufficio Colpi di Mano”（奇袭办公室），由飞行员圭多·凯勒（Guido Keller）统率这支海盗军团，专门策划针对意大利商船的劫掠行动，从穿梭于亚得里亚海的货轮上夺取食物、武器与一切阜姆所匮乏的物资。比利时诗人科赫尼茨基如此为这项事业辩护：“乌斯科奇人是海盗，但他们掠夺，只是为了喂饱饥饿者”。在阜姆，饥饿者的胃口需要被喂饱——但诗人与海盗的联盟，其本质究竟是革命，还是另一种形式的堕落？',
      it: 'Gli Uscocchi sono il vecchio nome di Segna: i disperati che per un secolo depredarono il naviglio veneziano in Adriatico. Uscivano dai frangenti sulle loro fuste e nei frangenti sparivano; la flotta veneziana li inseguì per cent\'anni senza estirparli.\n\n' +
        'Ora il Comandante ha torpediniere, motoscafi armati e un porto pieno di marinai senza lavoro. E il blocco stringe la città alla gola.\n\n' +
        'Il denaro del mare si è sempre preso, non guadagnato.' },
    // Every card costs 1 AP, charged the moment it is played.
    cost: { ap: 1 },
    options: [
      { id: 'predare',
        text: { zh: '武装快艇，劫掠亚得里亚海的商船。', it: 'Armare i motoscafi e depredare il naviglio mercantile.' },
        subtitle: { zh: '让威尼斯的保险商替我们到罗马去哭诉。', it: 'Che siano gli assicuratori veneziani a piangere a Roma.' },
        preview: ['金库 +++', '军械 +', '意大利 −−', '工团派异议 +'],
        effect: { funds: 520, arms: 20,
                  diplo: { italy: -16, yugoslavia: -14, league: -8 },
                  economy: { traffic: -6, capitalConfidence: -6 },
                  order: { violence: 8, fervour: 6 },
                  factions: { arditi: { dis: -8 }, irredentisti: { dis: -6 }, sindacalisti: { dis: 8 } } } },
      { id: 'sequestrare',
        text: { zh: '只征用，不劫掠——把封锁线上的货截下来。', it: 'Requisire soltanto: fermare i carichi del blocco.' },
        subtitle: { zh: '以战争需要为名，这样连码头工人也无话可说。', it: 'In nome delle necessità di guerra: ai dockers basta questo.' },
        preview: ['金库 ++', '意大利 −', '工团派异议 −', '港口吞吐指数 −'],
        effect: { funds: 300,
                  diplo: { italy: -8, yugoslavia: -5 },
                  economy: { traffic: -2 },
                  order: { violence: 3, fervour: 2 },
                  factions: { sindacalisti: { dis: -4 }, irredentisti: { dis: 4 } } } },
      { id: 'nave',
        text: { zh: '袭击军舰，夺军械而不是夺货。', it: 'Assalire le navi da guerra: prendere armi, non merci.' },
        subtitle: { zh: '钱少些，但枪炮能让这座城市多撑一个冬天。', it: 'Meno denaro, ma i cannoni fanno passare un inverno in più.' },
        preview: ['金库 +', '军械 +++', '意大利 −−−', '阿迪蒂异议 −−'],
        effect: { funds: 240, arms: 45,
                  diplo: { italy: -22 },
                  order: { violence: 14, fervour: 10, authority: 4 },
                  factions: { arditi: { dis: -14 }, irredentisti: { dis: -10 }, futuristi: { dis: -8 }, fascisti: { dis: 6 }, sindacalisti: { dis: 4 } } } },
      /* Staying in port: no effect at all, the reference project's @spd_alone. */
      { id: 'restare',
        text: { zh: '这个冬天不出海。', it: 'Quest\'inverno non si esce.' },
        subtitle: { zh: '海盗也得看潮汐。', it: 'Anche i pirati guardano la marea.' },
        preview: [],
        effect: {} }
    ]
  };
