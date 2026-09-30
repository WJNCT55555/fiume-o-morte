import type { GameEvent } from '../content/types';


export const ev192006Alleati: GameEvent = {
    id: 'ev_1920_06_alleati', date: { y: 1920, m: 6 },
    title: { zh: '六月：三个人的委员会', it: 'Giugno: una commissione di tre uomini' },
    body: { zh: '英、法、美三国的代表来到阜姆，调查去年七月军团兵与法军安南兵冲突的责任。' +
        '他们的报告建议解散「阜姆军团」，并把意大利驻军减少到一个营。\n\n' +
        '同一批人私下里跟你说的是另一件事：如果这座城市能证明它是一个能维持秩序的地方，' +
        '而不是一个需要被拯救的混乱地区，那么有些方案就会重新回到桌面上。\n\n' +
        '他们指的是威尔逊总统去年提过的那个方案：把阜姆变成一个独立国家，甚至是国联的所在地。',
      it: 'I rappresentanti di Gran Bretagna, Francia e Stati Uniti arrivano a Fiume per indagare sulle responsabilità degli scontri del luglio scorso fra legionari e truppe francesi. La loro relazione raccomanda lo scioglimento della Legione Fiumana e la riduzione del presidio italiano a un battaglione.\n\n' +
        'In privato ti dicono un\'altra cosa: se questa città dimostra di essere un luogo capace di mantenere l\'ordine, e non una regione in disordine da salvare, allora certe soluzioni tornano sul tavolo.\n\n' +
        'Alludono al progetto che il presidente Wilson avanzò l\'anno scorso: fare di Fiume uno Stato indipendente, persino la sede della Società delle Nazioni.' },
    options: [
      {
        id: 'a', text: { zh: '配合调查。让军团兵表现得像一支军队。', it: 'Collaborare. Che i legionari si comportino come un esercito.' },
        preview: [{ zh: '英法美 ++', label: 'UK/FR/US ++' }, { zh: '开启「国际保证」日志', label: 'Diario: garanzia' }, { zh: '阿迪蒂异议 +', label: 'Arditi +' }],
        effect: function () { return { diplo: { uk: 8, france: 8, usa: 8, league: 8 }, economy: { recognition: 8 }, laws: { ordine: 1 }, order: { authority: 5, violence: -6 }, factions: { arditi: { dis: 8 } }, journals: ['garanzia'] }; }
      },
      {
        id: 'b', text: { zh: '拒绝解散军团。这是唯一属于这座城市的东西。', it: 'Rifiutare lo scioglimento. È l\'unica cosa che appartiene a questa città.' },
        preview: [{ zh: '热忱 ++', label: 'fervore ++' }, { zh: '英法美 −−', label: 'UK/FR/US −−' }, { zh: '合法性 −', label: 'legittimità −' }],
        effect: function () { return { order: { fervour: 10, milizia: 200, violence: 4 }, diplo: { uk: -8, france: -8, usa: -6 }, factions: { arditi: { inf: 2, dis: -10 } } }; }
      },
      {
        id: 'c', text: { zh: '把军团改编成市政卫队。名字变了，人没变。', it: 'Trasformare la Legione in Guardia Civica. Cambia il nome, non gli uomini.' },
        preview: [{ zh: '英法美 +', label: 'UK/FR/US +' }, { zh: '领袖权威 +', label: 'autorità +' }, { zh: '军团兵力 −', label: 'Milizia −' }],
        effect: function () { return { laws: { ordine: 1 }, organizations: ['guardia'], order: { civicGuard: 380, authority: 6, milizia: -260, violence: -6 }, diplo: { uk: 5, france: 5, league: 5 }, factions: { arditi: { dis: 8 } }, journals: ['guardia'] }; }
      },
      {
        id: 'd', text: { zh: '把报告交给外国报纸。让全世界看见谁在阻挠。', it: 'Dare la relazione alla stampa estera. Che il mondo veda chi ostruisce.' },
        preview: [{ zh: '国际声望 +', label: 'riconoscimento +' }, { zh: '意大利 −−', label: 'Italia −−' }, { zh: '合法性 +', label: 'legittimità +' }],
        effect: function () { return { diplo: { uk: 4, france: 4, usa: 4, italy: -12, league: 5 }, economy: { recognition: 6 }, support: [['impiegati', 'LEG', 3], ['borghesia', 'LEG', 2]], order: { fervour: 5 } }; }
      }
    ]
  };
