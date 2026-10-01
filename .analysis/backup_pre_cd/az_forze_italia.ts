import type { Card } from '../content/types';

/* The doors out of Fiume, and the fact that they open onto different countries.
   D'Annunzio's problem in 1920 was not a shortage of allies but that his
   possible allies hated each other: the fasci were already moving right and
   wanted the Legion's rifles inside their own movement, the anarchists really
   did approach Fiume that year and then walked away, the Socialists were the
   largest party in Italy and about to tear themselves in half at Livorno, and
   the communists called the whole enterprise petit-bourgeois adventurism.

   The forces are named for movements rather than for one man each (see W.FORZE
   in world.js) because the men who speak for them change inside this very card's
   lifetime: the communists exist only from January 1921, and De Ambris is the
   PSI's own syndicalist and the Charter's drafter.

   Modelled on the reference project's `inter_party_relationships` card and on
   az_intrighi: an action card where every substantive option pays for itself,
   and the option that declines still costs something. `forze` is the map added
   by the 1920 march line; courting one force automatically pushes away whichever
   force W.FORZA_ANTAGONISM names as its rival, so the player cannot buy all
   four. */
export const azForzeItalia: Card = {
    id: 'az_forze_italia', deck: 'azione',
    name: { zh: '与意大利力量之间的关系', it: 'Rapporti con le forze d\'Italia' },
    cooldown: 5,
    text: { zh: '罗马把你围在海边，而意大利国内还有几扇门没有关死：米兰那份报纸、' +
        '《新人类》那台印刷机、社会党那台还能印出几十万份的机器、' +
        '里窝那刚刚挂出来的新牌子、科拉迪尼那间挂着三色旗的会所，' +
        '以及都灵那间借来的编辑部。' +
        '他们彼此仇恨的程度，超过他们恨焦利蒂。你不能同时走进所有的门——' +
        '你只能选一扇，然后承担其余几扇的沉默。',
        it: 'Roma ti tiene bloccato sul mare, ma in Italia alcune porte non sono ancora chiuse: ' +
        'il giornale di Milano, la tipografia di «Umanità Nova», la macchina che il Partito socialista ' +
        'manda ancora in centomila copie, l\'insegna appena affissa a Livorno, il circolo tricolore ' +
        'dei nazionalisti, e una redazione in prestito a Torino. ' +
        'Si odiano fra loro più di quanto odino Giolitti. Non puoi entrare in tutte: ' +
        'ne scegli una, e paghi il silenzio delle altre.' },
    cost: { ap: 1 },
    options: [
        { id: 'fascisti',
          text: { zh: '联络意大利法西斯。', it: 'Prendere contatto con il fascismo.' },
          subtitle: { zh: '墨索里尼在米兰的阳台上向我们致敬，但请记住——他贪婪地模仿着我们的仪式与口号，却从未为我们流过一滴血。', it: 'Mussolini ci saluta dal suo balcone di Milano. Ma ricordate: imita con avidità i nostri riti e i nostri slogan, e per noi non ha mai versato una goccia di sangue.' },
          preview: ['法西斯 ++', '共产党 −', '法西斯派影响力 +', '意大利 +'],
          effect: { forze: { fascisti: 22, comunisti: -9 },
                    diplo: { italy: 5 },
                    factions: { fascisti: { inf: 2, dis: -10 }, sindacalisti: { dis: 8 }, arditi: { dis: -4 } },
                    support: [['regnicoli', 'LEG', 2]] } },
        { id: 'anarchici',
          text: { zh: '无政府主义者可以被相信吗？', it: 'Ci si può fidare degli anarchici?' },
          subtitle: { zh: '无政府主义者愿意加入我们疯狂的阴谋中吗？', it: 'Malatesta a Fiume ci venne davvero, quell\'anno. Solo che non rimase.' },
          preview: ['无政府主义者 +++', '工团派影响力 +', '收复主义者异议 ++', '意大利 −／军官团 −'],
          effect: { forze: { anarchici: 28, forzearmate: -7 },
                    diplo: { italy: -10 },
                    factions: { sindacalisti: { inf: 2, dis: -8 }, irredentisti: { dis: 14 }, fascisti: { dis: 8 } },
                    order: { violence: -8, squadre: -5 },
                    support: [['operai', 'LEG', 2], ['portuali', 'LEG', 2]] } },
        { id: 'socialisti',
          text: { zh: '向社会党左翼最强音伸出橄榄枝。', it: 'Tendere un ramo d\'olivo alla sinistra socialista.' },
          subtitle: { zh: '邦巴奇是唯一公开为我们辩护的社会主义领袖。', it: 'È ancora il primo partito d\'Italia, e la sua sinistra è appena stata nominata da Mosca.' },
          preview: ['社会党 +++', '法西斯 −', '社会党关系 +', '工团派异议 −'],
          /* Closed once the communists break away at Livorno: after the split the
             maximalist wing that was worth courting is no longer in this party.
             The January 1921 founding event sets psi_split_from_pcdi. */
          require: function (s) { return !s.flags.psi_split_from_pcdi && !s.flags.bombacci_rebuffed; },
          requireText: { zh: '社会党已在里窝那分裂，或邦巴奇已与军团决裂', it: 'Il PSI si è già spaccato a Livorno, o Bombacci ha già rotto con la Legione' },
          effect: { forze: { socialisti: 28, fascisti: -5 },
                    relations: [['LEG', 'PSI', 12], ['LEG', 'ANI', -4]],
                    support: [['operai', 'LEG', 3], ['portuali', 'LEG', 3], ['borghesia', 'LEG', -3]],
                    factions: { sindacalisti: { inf: 2, dis: -12 }, fascisti: { dis: 10 } } } },
        { id: 'comunisti',
          text: { zh: '秘密接触布尔什维克。', it: 'Contatto segreto con i bolscevichi.' },
          subtitle: { zh: '葛兰西的理论正在阜姆的阿迪蒂中传播', it: 'La redazione di Torino non accetta denaro: accetta promesse.' },
          preview: ['共产党 ++', '苏联 ++', '法西斯 −−', '资本信心 −／意大利 −'],
          /* The door opens with the party. Before Livorno there is no communist
             party in Italy to contact, only a current inside the PSI. The
             January 1921 founding event sets comintern_door. */
          require: function (s) { return !!s.flags.comintern_door; },
          requireText: { zh: '意大利还不存在共产党——里窝那尚未分裂', it: 'In Italia non esiste ancora un Partito Comunista: Livorno non è ancora avvenuta' },
          effect: { forze: { comunisti: 26, fascisti: -12 },
                    diplo: { soviet: 16, italy: -9, league: -4 },
                    economy: { capitalConfidence: -8 },
                    flags: { soviet_contact: true },
                    relations: [['LEG', 'PSI', 8]],
                    support: [['operai', 'LEG', 3]],
                    factions: { sindacalisti: { dis: -10 }, fascisti: { dis: 12 } } } },
        /* The PSI's own man, and the one who is physically in Fiume. The
           revolutionary syndicalist wing was expelled from the party in 1907 and
           De Ambris spent 1919-20 as the Regency's chief of cabinet and drafter
           of the Carnaro Charter, so this is less a negotiation than an
           internal argument won. It buys the sindacalisti rather than the PSI
           machine, which is why it is the option for a player who wants the
           movement and not the party. */
        { id: 'deambris',
          text: { zh: '找德·安布里斯。他不是外人，他就在这栋楼里。', it: 'Andare da De Ambris. Non è un estraneo: è in questo palazzo.' },
          subtitle: { zh: '革命工团主义者正在意大利北部的工会渗透', it: 'I sindacalisti rivoluzionari furono espulsi dal PSI nel 1907. La Carta l\'ha scritta lui.' },
          preview: ['工团派影响力 ++', '工团派异议 −−', '宪章 +', '社会党 −／收复主义者异议 +'],
          require: function (s) { return s.factions.sindacalisti.inf >= 8; },
          requireText: { zh: '工团派影响力不足 8，德·安布里斯在政府里没有说话的分量', it: 'Influenza sindacalista sotto 8: De Ambris non ha peso nel governo' },
          effect: { factions: { sindacalisti: { inf: 3, dis: -16 }, irredentisti: { dis: 8 }, fascisti: { dis: 6 } },
                    laws: { lavoro: 1 },
                    relations: [['LEG', 'PSI', -6]],
                    support: [['operai', 'LEG', 3], ['portuali', 'LEG', 3]],
                    economy: { capitalConfidence: -5 } } },
        /* The fifth door, and the one that costs the army nothing: the
           Nationalists want the same Italy the officer corps wants, so courting
           Corradini does not push the officers away (W.FORZA_ANTAGONISM). It
           costs the revolutionary left instead, and it flatters Rome. */
        { id: 'corradini',
          text: { zh: '拉拢科拉迪尼的意大利民族主义协会。', it: 'Attirare l\'Associazione Nazionalista Italiana di Corradini.' },
          subtitle: { zh: '意大利民族主义者渴望着一个“最优秀者”统治的意大利，而我们正活在他的梦想中。', it: 'I nazionalisti italiani sognano un\'Italia governata dai "migliori": e noi stiamo vivendo nel loro sogno.' },
          preview: ['意大利国民委员会 ++', '社会党／共产党 −', '意大利 +', '收复主义者异议 −'],
          effect: { forze: { corradini: 26, socialisti: -4, comunisti: -4 },
                    diplo: { italy: 7 },
                    relations: [['LEG', 'ANI', 16], ['LEG', 'PSI', -6]],
                    support: [['borghesia', 'LEG', 2], ['impiegati', 'LEG', 2]],
                    factions: { irredentisti: { dis: -12 }, arditi: { dis: -4 }, sindacalisti: { dis: 6 } } } },
        /* The silence: keeping every door shut is itself a policy, and the price
           is that the movement stands still while the others move. */
        { id: 'nulla',
          text: { zh: '哪一扇都不进。让罗马去猜我们在想什么。', it: 'Non entrare in nessuna porta. Che Roma indovini cosa pensiamo.' },
          subtitle: { zh: '沉默也是一种姿态，只是它不会带来一整支纵队。', it: 'Anche il silenzio è una posizione. Non porta però una colonna intera.' },
          preview: ['民众热忱 −', '工团派异议 +', '法西斯派异议 +'],
          effect: { order: { fervour: -4 },
                    factions: { sindacalisti: { dis: 8 }, fascisti: { dis: 6 }, arditi: { dis: 4 } } } }
    ]
};
