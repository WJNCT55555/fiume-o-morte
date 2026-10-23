import type { Advisor } from '../content/types';

export const giuriati: Advisor = { id: 'giuriati',  zh: '乔瓦尼·朱里亚蒂', it: 'Giovanni Giuriati', faction: 'irredentisti',
      bio: { zh: '1919 年阜姆行动的实际组织者之一，后来成了墨索里尼派来的军事委员。他站在每一边。', it: 'Tra gli organizzatori dell’impresa di Fiume, poi commissario militare inviato da Mussolini. Ha contatti in ogni campo.' },
      /* Based on the verified Giovanni Giuriati photograph; provenance and
         painting prompts are recorded in PORTRAIT_ART_DIRECTION.md. */
      portrait: 'img/Portrait/Portrait_giovanni_giuriati.png',
      require: function (s) { return s.order.coup < 60 && s.factions.fascisti.inf >= 10; },
      actions: [
        { id: 'national_bloc', text: { zh: '与民族阵营谈判', it: 'Trattare col blocco nazionale' },
          subtitle: { zh: '约束民族阵营的街头队伍，换取工团派的不满。', it: 'Contenere le squadre nazionaliste, al prezzo del malcontento sindacalista.' },
          effect: { order: { squadre: -8, coup: -6 }, factions: { sindacalisti: { dis: 8 } } } },
        { id: 'rome_contacts', text: { zh: '疏通罗马联络', it: 'Riaprire i contatti con Roma' },
          subtitle: { zh: '借助旧有关系改善对意交涉，激进派会认为这是退让。', it: 'Usare i vecchi contatti per migliorare i rapporti con l’Italia, irritando i radicali.' },
          effect: { diplo: { italy: 7 }, order: { coup: -3, fervour: -3 }, factions: { irredentisti: { dis: -7 }, arditi: { dis: 5 } } } }
      ] };
