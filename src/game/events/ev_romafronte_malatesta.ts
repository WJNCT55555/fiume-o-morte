import type { GameEvent } from '../content/types';

/* Malatesta, 1920. The one who really did approach Fiume and then walked away.
   Luigi Fabbri's life of him records that he was willing "to wind his way
   through some adversary's revolutionary objectives, like the enterprise of
   d'Annunzio in Fiume in 1920", and that he "abandoned this soon... as soon as
   he saw that there weren't enough of the people he needed to overcome and
   defeat the worst enemy tendencies."

   So he is written here as the one who joins on conditions, and who asks the
   question the whole design turns on: is this an insurrection, or a coup? */
export const evRomafronteMalatesta: GameEvent = {
  id: 'ev_romafronte_malatesta',
  once: true,
  condition: function (s) {
    /* Opened in August 1920, while «Umanità Nova» was still running and before
       the September factory occupations changed what everyone was arguing about. */
    const world = (globalThis as any).Fiume?.World;
    return !!(s.journals.marcia_1920 && s.journals.marcia_1920.active
      && world && world.forzaWindowOpen(s, 'anarchici'));
  },
  title: { zh: '《新人类》：马拉泰斯塔', it: '«Umanità Nova»: Malatesta' },
  body: { zh: '他在《新人类》的印刷厂里见你，手指上全是油墨。七十岁，刚从伦敦回来一年，' +
      '意大利所有警察局都认得他。\n\n' +
      '「我不是来加入你的，」他说，「我是来看清楚一件事。」\n\n' +
      '「你要带一万人去罗马。去做什么？换一个国王，还是换掉国王这个东西？' +
      '如果是第一种，我今晚就回米兰，我们以后在街上见。如果是第二种，' +
      '那你要先回答我：你的军团兵在阜姆打了两年人，你的法西斯朋友在街上烧报馆，' +
      '这些账怎么算？」\n\n' +
      '他等你说话的时候，车间里的机器一直没停。',
    it: 'Ti riceve nella tipografia di «Umanità Nova», le mani piene d\'inchiostro. Settant\'anni, ' +
      'tornato da Londra da un anno, conosciuto da tutte le questure d\'Italia.\n\n' +
      '"Non vengo ad arruolarmi," dice. "Vengo a capire una cosa."\n\n' +
      '"Porti diecimila uomini a Roma. Per fare cosa? Cambiare un re, o cambiare il re come istituzione? ' +
      'Se è la prima, torno a Milano stasera e ci vediamo in piazza un\'altra volta. Se è la seconda, ' +
      'allora prima rispondi: i tuoi legionari a Fiume picchiano gente da due anni, i tuoi amici fascisti ' +
      'bruciano tipografie. Come si salda questo conto?"\n\n' +
      'Mentre aspetti di parlare, le macchine del capannone non si fermano.' },
  options: [
    {
      id: 'insurrezione', text: { zh: '这是起义，不是政变。军团兵交出街头的权力，你派人进纵队。', it: 'È un\'insurrezione, non un colpo di Stato. I legionari lasciano la strada, tu mandi uomini nella colonna.' },
      subtitle: { zh: '马拉泰斯塔的全部要求：把街头的权力交出去。', it: 'Tutta la sua richiesta: cedere il controllo della strada.' },
      preview: [{ zh: '马拉泰斯塔 +++', label: 'Malatesta +++' }, { zh: '墨索里尼 −−', label: 'Mussolini −−' }, { zh: '政治暴力／法西斯小队 −−', label: 'violenza / squadre −−' }, { zh: '军官团 −', label: 'corpo ufficiale −' }],
      effect: function () {
        return {
          forze: { anarchici: 34 },
          order: { violence: -16, squadre: -10, fervour: 4 },
          factions: { arditi: { dis: 10 }, fascisti: { dis: 12 }, sindacalisti: { dis: -8 } },
          support: [['operai', 'LEG', 2], ['portuali', 'LEG', 2]],
          flags: { malatesta_front: true }
        };
      }
    },
    {
      id: 'apertura', text: { zh: '给一个含糊的答复：先到罗马，再谈这个国家的形状。', it: 'Una risposta vaga: prima Roma, poi la forma dello Stato.' },
      subtitle: { zh: '他会接受，但他会记住你回避了这个问题。', it: 'Accetterà, ma ricorderà che hai eluso la domanda.' },
      preview: [{ zh: '马拉泰斯塔 +', label: 'Malatesta +' }, { zh: '政治暴力 −', label: 'violenza −' }, { zh: '工团派异议 −', label: 'Falange −' }],
      effect: function () {
        return {
          forze: { anarchici: 16 },
          order: { violence: -6, squadre: -3 },
          factions: { arditi: { dis: 4 }, sindacalisti: { dis: -4 } }
        };
      }
    },
    {
      id: 'chiudere', text: { zh: '把问题挡回去。无政府主义者不会服从任何纵队。', it: 'Respingere la domanda. Gli anarchici non obbediranno mai a una colonna.' },
      subtitle: { zh: '你说得对。他会同意你，然后走掉。', it: 'Hai ragione. Sarà d\'accordo, e se ne andrà.' },
      preview: [{ zh: '马拉泰斯塔 −−−', label: 'Malatesta −−−' }, { zh: '法西斯派异议 −', label: 'Fascio −' }, { zh: '阿迪蒂异议 −', label: 'Arditi −' }],
      effect: function () {
        return {
          forze: { anarchici: -24 },
          order: { squadre: 4 },
          factions: { arditi: { dis: -8 }, fascisti: { dis: -10 }, sindacalisti: { dis: 10 } }
        };
      }
    }
  ]
};
