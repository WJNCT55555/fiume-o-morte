import type { Advisor } from '../content/types';

export const carli: Advisor = { id: 'carli',     zh: '马里奥·卡利', it: 'Mario Carli', faction: 'arditi',
      bio: { zh: '阿迪蒂协会领袖、《铁头》报主编。他的排版比他的政纲更有名。', it: 'Dirigente dell’associazione degli Arditi e direttore di Testa di Ferro. La sua impaginazione è più celebre del suo programma.' },
      portrait: 'img/Portrait/Portrait_mario_carli.png',
      actions: [
        { id: 'newspaper', text: { zh: '出版《铁头》号外', it: 'Numero unico di Testa di Ferro' },
          subtitle: { zh: '以军团报纸争取职员、手工业者与小店主。', it: 'Usare la stampa legionaria per conquistare impiegati, artigiani e bottegai.' },
          effect: { support: [['impiegati', 'LEG', 3], ['artigiani', 'LEG', 3]], order: { fervour: 5, squadre: -2 } } },
        { id: 'arditi_meeting', text: { zh: '召开阿迪蒂集会', it: 'Convocare gli Arditi' },
          subtitle: { zh: '重聚突击队老兵，恢复组织纪律与内部团结。', it: 'Riunire i veterani d’assalto e ricostruire disciplina e coesione.' },
          effect: { factions: { arditi: { inf: 2, dis: -10 } }, order: { milizia: 160, authority: 2 } } },
        { id: 'workers_press', text: { zh: '为工人刊登社论', it: 'Pubblicare un editoriale operaio' },
          subtitle: { zh: '在报纸上支持劳动诉求，争取左翼并触怒民族阵营。', it: 'Sostenere le rivendicazioni del lavoro, avvicinando la sinistra e irritando i nazionalisti.' },
          effect: { support: [['operai', 'LEG', 3], ['portuali', 'LEG', 2]], relations: [['LEG', 'PSI', 5]], factions: { fascisti: { dis: 6 } } } }
      ] };
