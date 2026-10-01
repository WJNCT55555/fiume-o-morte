import type { Card } from '../content/types';

/* The Baross arbitration over the Danube–Adriatic delta: Belgrade wanted the
   whole river bed, and Fiume's timber trade needed it just as badly. Whoever
   held the delta held the only route by which inland Croatia could reach a
   deep-water port. */
export const gvDoganaYu: Card = {
    id: 'gv_dogana_yu', deck: 'governo', ministry: 'economia',
    name: { zh: '与贝尔格莱德的转口协定', it: 'Accordo di transito con Belgrado' },
    text: { zh: '从贝尔格莱德来了一名中校，制服熨得很平，公文包里的条件只有一条：' +
        '整个河床。德尔塔、航道、木材堆场，全部归南斯拉夫王国，作为交换，' +
        '阜姆的货物可以免税过境，克罗地亚的木材可以合法地推进你的仓库。\n\n' +
        '这是一个不好看但很实在的交易：河对岸的腹地比海上的封锁更值钱，' +
        '而这座城市已经三个月没有听到过一列满载的货运列车了。' +
        '只是每一次在文件上签字，都会有人在广场上喊你卖国——喊得最响的那个，' +
        '大概正是当年把诗人迎进城的那批人。',
        it: 'Da Belgrado arriva un tenente colonnello, uniforme stirata e una sola condizione nella cartella: ' +
        'tutto l\'alveo. Il delta, il canale, i depositi di legname: al Regno di Jugoslavia. In cambio, ' +
        'le merci di Fiume transitano in franchigia e il legname croato entra legalmente nei tuoi magazzini.\n\n' +
        'È uno scambio brutto ma sostanzioso: l\'entroterra oltre il fiume vale più del blocco sul mare, ' +
        'e questa città non sente un treno merci a pieno carico da tre mesi. ' +
        'Solo che ogni firma su quel documento farà gridare al tradimento in piazza — ' +
        'e chi griderà più forte sarà probabilmente lo stesso che accolse il Poeta dentro le mura.' },
    cost: { ap: 1 },
    cooldown: 6,
    require: function (s) { return s.cabinet.economia === s.playerForce; },
    requireText: { zh: '未掌握公共经济执政官席位', it: 'Ministero dell\'Economia non controllato' },
    options: [
      { id: 'accordo',
        text: { zh: '接受：河床换转口权。', it: 'Accettare: l\'alveo in cambio del transito.' },
        subtitle: { zh: '把一条河卖给邻国，换回一整片能养活这座城的腹地。', it: 'Vendere un fiume al vicino per riavere un entroterra capace di nutrire la città.' },
        preview: ['腹地 ++', '港口吞吐指数 +', '关税法 +2', '法西斯派异议 ++'],
        effect: { laws: { dogana: 2 },
                  economy: { hinterland: 16, traffic: 7, delta: 4 },
                  diplo: { yugoslavia: 12, italy: -8 },
                  support: [['contadini', 'LEG', 3], ['borghesia', 'LEG', 3], ],
                  factions: { sindacalisti: { inf: 3, dis: -8 }, fascisti: { dis: 12 } } } },
      { id: 'parziale',
        text: { zh: '只谈木材堆场的使用权，不谈主权。', it: 'Trattare solo l\'uso dei depositi di legname, non la sovranità.' },
        subtitle: { zh: '把主权的字眼从文本里一个个挑出去，剩下的就是一份纯粹的生意。', it: 'Togliere dal testo, una per una, tutte le parole di sovranità: quel che resta è puro commercio.' },
        preview: ['腹地 +', '南斯拉夫 +', '意大利 +', '国联 +'],
        effect: { laws: { dogana: 1 },
                  economy: { hinterland: 7, traffic: 3, delta: 1 },
                  diplo: { yugoslavia: 6, italy: 3, league: 3 },
                  support: [['contadini', 'LEG', 2], ['borghesia', 'LEG', 2]] } },
      { id: 'rifiuto',
        text: { zh: '拒绝。河床是我们的。', it: 'Rifiutare. L\'alveo è nostro.' },
        subtitle: { zh: '有些东西一旦在纸上让出去，就再也换不回一句口号。', it: 'Certe cose, una volta cedute sulla carta, non tornano più nemmeno con uno slogan.' },
        preview: ['民众热忱 ++', '南斯拉夫关系 −', '事态累积 ++', '腹地 −−'],
        effect: { order: { fervour: 8, coup: 8 },
                  economy: { hinterland: -8, traffic: -3 },
                  diplo: { yugoslavia: -10, italy: 4 },
                  factions: { fascisti: { inf: 2, dis: -10 } } } }
    ]
};
