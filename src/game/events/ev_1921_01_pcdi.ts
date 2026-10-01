import type { GameEvent } from '../content/types';

/* Livorno, 21 January 1921. The PSI's maximalist majority refuses Moscow's
   twenty-one conditions and the communist minority walks out to found the
   Partito Comunista d'Italia. It is the single most consequential thing to
   happen to the Italian left while the Regency exists, and it happens to Fiume
   as much as to anyone: the socialist party that was worth courting is now two
   parties, and only one of them is reachable from the Palazzo.

   There is one option on purpose. This is not a decision the Comandante gets to
   make — it is a door opening and another one closing, and the card reads the
   flags afterwards.

   The event fires for every player force: it is Italian history, not Fiume's. */
export const ev192101Pcdi: GameEvent = {
    id: 'ev_1921_01_pcdi', date: { y: 1921, m: 1 },
    title: { zh: '1921 年 1 月 21 日：里窝那', it: '21 gennaio 1921: Livorno' },
    body: { zh: '社会党在里窝那开代表大会。莫斯科送来二十一条，要求他们把改良派全部开除。' +
        '多数派投票拒绝了——不是拒绝革命，是拒绝听命于别人。\n\n' +
        '于是少数派站起来，走出会场，在隔壁的一间屋子里宣布成立**意大利共产党**。' +
        '他们带走了四万多人、机关报《新秩序》和都灵的工厂小组。' +
        '意大利最大的党，一夜之间裂成两半。\n\n' +
        '你在阜姆读这条电报的时候，码头上正在卸煤。' +
        '这份电报对这座城的意义很直接：从今天起，能派代表团来省督府的那扇门，少了一扇。',
      it: 'Il PSI tiene il congresso a Livorno. Mosca manda le ventuno condizioni: espellere tutti i riformisti. ' +
        'La maggioranza vota no — non contro la rivoluzione, ma contro l\'obbedienza.\n\n' +
        'Allora la minoranza si alza, esce dalla sala e in una stanza accanto proclama il ' +
        '**Partito Comunista d\'Italia**. Porta via più di quarantamila iscritti, l\'«Ordine Nuovo» ' +
        'e i gruppi di fabbrica di Torino. Il primo partito d\'Italia si spacca in due in una notte.\n\n' +
        'Mentre leggi il telegramma a Fiume, sul molo stanno scaricando carbone. ' +
        'Il senso per questa città è diretto: da oggi le porte da cui una delegazione può salire ' +
        'al Palazzo sono una in meno.' },
    options: [
      {
        id: 'prendere_atto', text: { zh: '记下来。从今天起，莫斯科在意大利有自己的人。', it: 'Prendere atto. Da oggi Mosca ha i suoi uomini in Italia.' },
        subtitle: { zh: '一个能派代表团来省督府的党变成了两个，而其中只有一个肯来。', it: 'Un partito che poteva mandare una delegazione al Palazzo è diventato due: e solo uno verrà.' },
        preview: [{ zh: '秘密接触布尔什维克解禁', label: 'contatto con Mosca sbloccato' }, { zh: '向社会党左翼伸手关闭', label: 'ramo d\'olivo chiuso' }, { zh: '意共立场 +', label: 'comunisti +' }],
        effect: {
          /* Opens the communist door on az_forze_italia and closes the socialist
             one: after the split, the wing worth courting is in the new party. */
          flags: { comintern_door: true, psi_split_from_pcdi: true },
          forze: { comunisti: 6 },
          relations: [['LEG', 'PSI', -4]],
          factions: { sindacalisti: { dis: 6 }, fascisti: { dis: -4 } }
        }
      }
    ]
  };
