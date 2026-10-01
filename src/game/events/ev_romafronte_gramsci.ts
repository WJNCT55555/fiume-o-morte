import type { GameEvent } from '../content/types';

/* Gramsci, 1920. The hardest of the four and the most expensive, which is the
   point: Ordine Nuovo treated the whole Fiume enterprise as a petit-bourgeois
   adventure, and the terms he would set are exactly the ones the Legion's own
   base cannot pay. He asks about the charter and about the Slav workers, which
   is where D'Annunzio's movement has least room to move.

   Note on sourcing: the three demands here are a design inference, not a
   documented programme. See docs/历史考据.md — the Gramsci line rests on the
   thinnest evidence of the four and is labelled as inference. */
export const evRomafronteGramsci: GameEvent = {
  id: 'ev_romafronte_gramsci',
  once: true,
  condition: function (s) {
    /* Last, in January 1921: the Livorno split is imminent, and he has the least
       reason of the four to spend anything on a legionary column. */
    const world = (globalThis as any).Fiume?.World;
    return !!(s.journals.marcia_1920 && s.journals.marcia_1920.active
      && world && world.forzaWindowOpen(s, 'comunisti'));
  },
  title: { zh: '都灵：《新秩序报》', it: 'Torino: «L\'Ordine Nuovo»' },
  body: { zh: '他在一间借来的编辑部里见你，屋里有四个工人，谁也不站起来。\n\n' +
      '「我不问你为什么去罗马，」他说，「我问你去了以后，阜姆会变成什么。」\n\n' +
      '「你的宪章写得比社会党的纲领好。法团院、最优者议会、音乐作为国家制度——' +
      '如果你真的把它实施，那阜姆就不是一次冒险，是一个先例。' +
      '如果你把它挂在阳台上，那你就是一八九八年那个在街上喊口号的诗人，' +
      '两年之后会有别人用你的口号上台，而且他不会念诗。」\n\n' +
      '他把一张纸推过来，上面写着三行：实施宪章。土地归耕者。' +
      '克罗地亚工人进入法团院。\n\n' +
      '「签这三条，都灵的工厂就跟你走。不签，我们就在工厂里等你的消息——' +
      '不管是什么消息。」',
    it: 'Ti riceve in una redazione in prestito, con quattro operai nella stanza che non si alzano in piedi.\n\n' +
      '"Non ti chiedo perché vai a Roma," dice. "Ti chiedo cosa diventerà Fiume dopo."\n\n' +
      '"La tua Carta è scritta meglio del programma socialista. Consiglio dei Provvisori, Consiglio degli ' +
      'Ottimi, la musica come istituzione dello Stato: se la applichi davvero, Fiume non è un\'avventura, ' +
      'è un precedente. Se la lasci sul balcone, sei il poeta che gridava slogan nel \'98, e fra due anni ' +
      'qualcun altro salirà sulle tue parole — e non reciterà versi."\n\n' +
      'Spinge verso di te un foglio con tre righe: applicare la Carta. La terra a chi la lavora. ' +
      'Gli operai croati nel Consiglio dei Provvisori.\n\n' +
      '"Firma queste tre, e le fabbriche di Torino vengono con te. Non firmare, e aspettiamo in fabbrica ' +
      'tue notizie. Qualunque notizia sia."' },
  options: [
    {
      id: 'firma', text: { zh: '签。宪章真的实施，土地归耕者，克罗地亚工人进法团院。', it: 'Firmare. La Carta si applica davvero, la terra a chi la lavora, gli operai croati nei Provvisori.' },
      subtitle: { zh: '三行字，代价是民族阵营。这是四股里最贵的一条。', it: 'Tre righe, al prezzo del campo nazionale. È la più cara delle quattro.' },
      preview: [{ zh: '葛兰西 ++++', label: 'Gramsci ++++' }, { zh: '语言与劳动保障 +', label: 'lingua e tutele +' }, { zh: '国民委员会 −−−／收复主义者异议 ++', label: 'CNI −−− / irredentisti ++' }, { zh: '军官团 −−', label: 'corpo ufficiale −−' }],
      effect: function () {
        return {
          forze: { comunisti: 28 },
          laws: { lingua: 1, lavoro: 1 },
          relations: [['LEG', 'ANI', -20], ['LEG', 'PSI', 16], ['LEG', 'PCR', 18]],
          support: [['operai', 'LEG', 4], ['contadini', 'LEG', 6], ['borghesia', 'LEG', -4]],
          economy: { capitalConfidence: -10 },
          factions: { irredentisti: { dis: 24 }, sindacalisti: { dis: -16 }, fascisti: { dis: 14 } },
          flags: { gramsci_front: true, worker_control: true }
        };
      }
    },
    {
      id: 'due', text: { zh: '只签前两条。克罗地亚人的席位留到停战之后。', it: 'Firmare solo le prime due. I seggi croati dopo la marcia.' },
      subtitle: { zh: '他会看出来你在拖。他会来，但他会带着他自己的报纸来。', it: 'Capirà che stai rimandando. Verrà, ma con il suo giornale.' },
      preview: [{ zh: '葛兰西 ++', label: 'Gramsci ++' }, { zh: '劳动保障 +1', label: 'tutele +1' }, { zh: '国民委员会 −', label: 'CNI −' }, { zh: '军官团 −', label: 'corpo ufficiale −' }],
      effect: function () {
        return {
          forze: { comunisti: 16 },
          laws: { lavoro: 1 },
          relations: [['LEG', 'ANI', -8], ['LEG', 'PSI', 8]],
          support: [['operai', 'LEG', 2], ['contadini', 'LEG', 3]],
          factions: { irredentisti: { dis: 10 }, sindacalisti: { dis: -8 } }
        };
      }
    },
    {
      id: 'no', text: { zh: '不签。这支纵队不是给都灵办的。', it: 'Non firmare. Questa colonna non la fa Torino.' },
      subtitle: { zh: '民族阵营会松一口气。都灵的工厂会关上门。', it: 'Il campo nazionale tira un sospiro. Le fabbriche di Torino chiudono la porta.' },
      preview: [{ zh: '葛兰西 −−−', label: 'Gramsci −−−' }, { zh: '国民委员会 +／收复主义者异议 −−', label: 'CNI + / irredentisti −−' }, { zh: '工人支持 −', label: 'operai −' }],
      effect: function () {
        return {
          forze: { comunisti: -26 },
          relations: [['LEG', 'ANI', 12], ['LEG', 'PSI', -14]],
          support: [['operai', 'LEG', -4], ['portuali', 'LEG', -3]],
          factions: { irredentisti: { dis: -18 }, fascisti: { dis: -10 }, sindacalisti: { dis: 14 } }
        };
      }
    }
  ]
};
