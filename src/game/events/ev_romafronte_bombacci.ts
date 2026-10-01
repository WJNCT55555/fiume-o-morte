import type { GameEvent } from '../content/types';

/* Bombacci, 1920. A founder of the fasci who broke with Mussolini over the turn
   to the right and was moving toward the Comintern. The one force genuinely
   suspended between the two halves of the front, which makes him the hinge:
   he can be courted from either side and is the cheapest third ally. */
export const evRomafronteBombacci: GameEvent = {
  id: 'ev_romafronte_bombacci',
  once: true,
  condition: function (s) {
    /* October 1920: after the factory occupations were settled, when the left
       is arguing about what to do with the defeat. */
    const world = (globalThis as any).Fiume?.World;
    return !!(s.journals.marcia_1920 && s.journals.marcia_1920.active
      && world && world.forzaWindowOpen(s, 'socialisti'));
  },
  title: { zh: '罗马：邦巴奇', it: 'Roma: Bombacci' },
  body: { zh: '他在众议院的走廊里等你，腋下夹着一叠工会决议。三个月前他刚辞掉法西斯中央委员会的职务，' +
      '现在两边都不信任他。\n\n' +
      '「墨索里尼跟你说了什么我都知道，」他说，「我也知道他明天会说什么。' +
      '他要的是秩序，他自己的那种秩序。」\n\n' +
      '他把那叠纸拍在你胸口：「但码头工人和铁路工人不关心罗马，他们关心八小时、关心工资、' +
      '关心工厂归谁。你那份宪章里写了劳动是第一条——写得很漂亮。' +
      '你要是敢把它变成法，我就把社会党里一半的人拉出来跟你走。」\n\n' +
      '「你要是只把它当诗念，那我就是最后一次见你。」',
    it: 'Ti aspetta in un corridoio di Montecitorio con una cartella di delibere sindacali sotto il braccio. ' +
      'Tre mesi fa ha lasciato la direzione dei Fasci e adesso nessuno dei due campi si fida di lui.\n\n' +
      '"So cosa ti ha detto Mussolini," dice, "e so cosa dirà domani. Vuole l\'ordine. Il suo."\n\n' +
      'Ti batte la cartella sul petto: "Ma ai portuali e ai ferrovieri di Roma non importa niente. ' +
      'A loro importano le otto ore, la paga, e di chi sono le fabbriche. La tua Carta dice che il lavoro ' +
      'è l\'articolo primo: è scritto bene. Se hai il coraggio di farne una legge, ' +
      'ti porto via metà del Partito socialista."\n\n' +
      '"Se invece la leggi come una poesia, questa è l\'ultima volta che ci vediamo."' },
  options: [
    {
      id: 'legge', text: { zh: '立法。宪章不只是宣言：劳动法、港口集体合同、累进税。', it: 'Legiferare. La Carta non è un manifesto: legge sul lavoro, contratti di porto, imposta progressiva.' },
      subtitle: { zh: '他要的是能拿回都灵的东西，不是第二个阳台演说。', it: 'Vuole qualcosa da portare a Torino, non un altro discorso dal balcone.' },
      preview: [{ zh: '邦巴奇 +++', label: 'Bombacci +++' }, { zh: '劳动／财政法 ++', label: 'lavoro/fisco ++' }, { zh: '资本信心／有产精英 −', label: 'fiducia / possidenti −' }, { zh: '墨索里尼 −', label: 'Mussolini −' }],
      effect: function () {
        return {
          forze: { socialisti: 28 },
          laws: { lavoro: 1, fisco: 1 },
          economy: { capitalConfidence: -12, strike: -8 },
          support: [['operai', 'LEG', 5], ['portuali', 'LEG', 5], ['borghesia', 'LEG', -4]],
          relations: [['LEG', 'PSI', 14]],
          factions: { sindacalisti: { inf: 3, dis: -14 }, fascisti: { dis: 10 } },
          flags: { bombacci_front: true }
        };
      }
    },
    {
      id: 'promessa', text: { zh: '先承诺，立法留到罗马之后。', it: 'Promettere, e legiferare dopo Roma.' },
      subtitle: { zh: '他会同意——因为他没有别的地方可去。', it: 'Accetterà: non ha altri posti dove andare.' },
      preview: [{ zh: '邦巴奇 +', label: 'Bombacci +' }, { zh: '工人支持 +', label: 'operai +' }, { zh: '工团派异议 −', label: 'Falange −' }],
      effect: function () {
        return {
          forze: { socialisti: 14 },
          laws: { lavoro: 1 },
          economy: { strike: -4 },
          support: [['operai', 'LEG', 3], ['portuali', 'LEG', 3]],
          relations: [['LEG', 'PSI', 6]],
          factions: { sindacalisti: { dis: -6 } }
        };
      }
    },
    {
      id: 'congedare', text: { zh: '让他走。一个被两边都怀疑的人带不来一支纵队。', it: 'Congedarlo. Un uomo sospetto a entrambi i campi non porta una colonna.' },
      preview: [{ zh: '邦巴奇 −−−', label: 'Bombacci −−−' }, { zh: '社会党关系 −', label: 'PSI −' }, { zh: '法西斯派异议 −', label: 'Fascio −' }],
      effect: function () {
        return {
          forze: { socialisti: -24 },
          relations: [['LEG', 'PSI', -10]],
          /* Rebuffed by the Legion, he goes back to the party. The action card
             az_forze_italia reads this flag: once he has chosen the PSI over the
             movement, there is no olive branch left to hand him. Distinct from
             psi_split_from_pcdi, which closes the same option for everyone in
             January 1921. */
          flags: { bombacci_rebuffed: true },
          factions: { sindacalisti: { dis: 12 }, fascisti: { dis: -6 } }
        };
      }
    }
  ]
};
