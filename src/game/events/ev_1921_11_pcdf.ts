import type { GameEvent } from '../content/types';


export const ev192111Pcdf: GameEvent = {
    id: 'ev_1921_11_pcdf', date: { y: 1921, m: 11 },
    title: { zh: '世界最小的共产党', it: 'Il più piccolo partito comunista del mondo' },
    body: { zh: '11 月，一群人在一间印刷所楼上宣布成立"阜姆共产党——第三国际支部"。第三国际的原则是：每个主权国家都应当有自己的共产党组织。\n\n' +
        '阜姆是一个主权国家——至少条约上是这么写的。因此阜姆必须有一个共产党，哪怕这个党只有几十个人。\n\n' +
        '《共产主义者》报第一期的印量是 400 份。',
      it: 'In novembre, in una stanza sopra una tipografia, nasce il Partito Comunista di Fiume — Sezione della III Internazionale. Il principio è semplice: ogni Stato sovrano deve avere il proprio partito comunista.\n\n' +
        'Fiume è uno Stato sovrano — almeno secondo il trattato. Dunque Fiume deve avere un partito comunista, anche se conta poche decine di iscritti.\n\n' +
        'La prima tiratura de Il Comunista è di 400 copie.' },
    options: [
      {
        id: 'a', text: { zh: '按法律登记它。让最小的党拿到最大的合法性。', it: 'Registrarlo: dare al partito più piccolo la legittimità più grande.' },
        preview: [{ zh: '军团民意 +', label: 'legittimità +' }, { zh: '产业工人支持 +', label: 'operai +' }],
        effect: function () { return { support: [['operai', 'LEG', 2], ['portuali', 'LEG', 2]], parties: { PSI: 2 }, order: { fervour: 3 } }; }
      },
      {
        id: 'b', text: { zh: '让宪兵盯着他们，但不动手。', it: 'Farli sorvegliare, senza toccarli.' },
        preview: [{ zh: '摄政领袖权威 +', label: 'autorità +' }, { zh: '军团民意 −', label: 'legittimità −' }],
        effect: function () { return { order: { authority: 3, violence: 2, fervour: -2 }, parties: { PSI: 1 } }; }
      },
      {
        id: 'c', text: { zh: '把他们的经济纲领抄进宪章。', it: 'Copiare il loro programma economico nella Carta.' },
        preview: [{ zh: '产业工人支持 ++', label: 'operai ++' }, { zh: '工团派异议 ++', label: 'Falange ++' }],
        effect: function () { return { support: [['operai', 'LEG', 4], ['portuali', 'LEG', 3]], parties: { PSI: 2 }, laws: { lavoro: 1 }, factions: { sindacalisti: { dis: 14 } }, order: { fervour: 4 } }; }
      }
    ]
  };
