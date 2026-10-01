import type { Card } from '../content/types';

/* The League of Fiume: D'Annunzio and the Belgian poet Leon Kochnitzky's answer
   to Versailles — a front of the oppressed nations, with Fiume as its hinge.
   Modelled on the reference project's `international_relations` card: an action
   card, free to hold, where each option that does something pays for itself and
   the option that declines does nothing at all.

   Each substantive option also counts as one use of the network
   (`counters.leagueUsed`). az_reclutamento's "appeal to the oppressed peoples"
   option reads that counter to size its recruitment: the wider the network
   Fiume already reaches, the more volunteers the appeal brings in. The decline
   option does not count, because nothing was asked of the network. */
export const azFiumeLeague: Card = {
    id: 'az_fiume_league', deck: 'azione',
    name: { zh: '阜姆联盟', it: 'La Lega di Fiume' },
    cooldown: 6,
    text: { zh: '阜姆联盟是由指挥官邓南遮的追随者与比利时诗人莱昂·科赫尼茨基（Léon Kochnitzky）共同设计的“被压迫民族国际”。联盟构想了一个反凡尔赛体系的跨国阵线——以阜姆为枢纽，联结爱尔兰、埃及、印度、法兰西等地的独立运动与反殖民力量，作为“国际联盟”的替代方案。联盟号召所有“受不公与压迫摧残的民族”反抗那个“由盗贼与骗子组成的国际联盟”。如今，是否需要进一步利用这一网络？',
            it: 'La Lega di Fiume, concepita da Kochnitzky con gli uomini del Comandante: un\'Internazionale degli oppressi, perno a Fiume, contro Versailles.' },
    // Every card costs 1 AP, charged the moment it is played. `funds` and
    // `arms` wait for the resource layer that corresponds to the reference
    // project's `resources`.
    cost: { ap: 1 },
    options: [
      { id: 'patrioti',
        text: { zh: '呼唤意大利国内的爱国主义者，激起他们对国联的憎恶。', it: 'Chiamare i patrioti d\'Italia contro la Societa delle Nazioni.' },
        subtitle: { zh: '以残缺的胜利为名，让凡尔赛的虚伪和平在悲愤中颤抖。', it: 'In nome della vittoria mutilata.' },
        preview: ['意大利 −−', '国民集团 +', '民众热忱 +', '事态 +'],
        effect: { order: { fervour: 7, coup: 5 },
                  counters: { leagueUsed: 1 },
                  diplo: { italy: -14, league: -6 },
                  support: [['artigiani', 'ANI', 4], ['borghesia', 'ANI', 3], ['regnicoli', 'LEG', 4]],
                  relations: [['LEG', 'ANI', 10]],
                  factions: { irredentisti: { dis: -10 }, fascisti: { dis: -6 } } } },
      { id: 'soviet',
        text: { zh: '借助阜姆联盟，改善与苏联之间的关系。', it: 'Servirsi della Lega per avvicinare la Russia sovietica.' },
        subtitle: { zh: '共产主义俄国如我们一样，拥有所有精神上有生命力的元素。', it: 'La Russia comunista ha, come noi, tutti gli elementi di vitalita spirituale.' },
        preview: ['苏联 ++', '工团派异议 −−', '资本信心 −−', '法西斯派异议 ++'],
        effect: { diplo: { soviet: 18, italy: -8, league: -4 },
                  counters: { leagueUsed: 1 },
                  economy: { capitalConfidence: -9 },
                  flags: { soviet_contact: true },
                  factions: { sindacalisti: { dis: -16 }, fascisti: { dis: 14 }, futuristi: { dis: -4 } } } },
      { id: 'protesta',
        text: { zh: '向国际联盟发出正式抗议', it: 'Protesta formale alla Societa delle Nazioni' },
        subtitle: { zh: '在最粗鄙的语言撕开大国分赃的伪善面纱。', it: 'Strappare il velo dell\'ipocrisia con il linguaggio piu crudo.' },
        preview: ['国联 −−−', '英法 −', '民众热忱 ++'],
        effect: { diplo: { league: -20, uk: -7, france: -7, usa: -3 },
                  counters: { leagueUsed: 1 },
                  order: { fervour: 9 },
                  factions: { futuristi: { dis: -12 }, arditi: { dis: -5 } } } },
      { id: 'ungheria',
        text: { zh: '支援流亡的匈牙利左翼力量', it: 'Sostenere la sinistra ungherese in esilio' },
        subtitle: { zh: '为流亡的马扎儿苏维埃递出面包、武器与橄榄枝。', it: 'Pane, armi e un ramo d\'olivo ai soviet magiari in esilio.' },
        preview: ['金库 −−', '军械 −', '苏联 +', '意大利 −'],
        require: function (s) { return s.funds >= 320 && s.arms >= 30; },
        requireText: { zh: '需要 320 千镑与 30 箱军械', it: 'Servono 320 e 30 casse' },
        effect: function () { return { funds: -320, arms: -30,
                  counters: { leagueUsed: 1 },
                  diplo: { soviet: 9, italy: -7, yugoslavia: -5 },
                  flags: { magyar_exiles: true },
                  order: { squadre: 4 },
                  relations: [['LEG', 'PSI', 8]],
                  factions: { sindacalisti: { dis: -8 }, arditi: { dis: 6 } } }; } },
      { id: 'balcani',
        text: { zh: '推动“巴尔干阴谋”', it: 'Promuovere il complotto balcanico' },
        subtitle: { zh: '在火药桶的暗影里煽动南斯拉夫的叛乱。', it: 'Soffiare sulla rivolta jugoslava, all\'ombra del barile di polvere.' },
        preview: ['南斯拉夫 −−−', '金库 −', '小队 ++', '事态 ++'],
        require: function (s) { return s.funds >= 220; },
        requireText: { zh: '需要 220 千镑的秘密经费', it: 'Servono 220 per i fondi segreti' },
        effect: function () { return { funds: -220,
                  counters: { leagueUsed: 1 },
                  diplo: { yugoslavia: -22, italy: -6, league: -5 },
                  order: { squadre: 9, coup: 9, violence: 6 },
                  flags: { balkan_plot: true },
                  districts: { susak: { agitation: 8 }, pecine: { agitation: 6 } },
                  factions: { arditi: { dis: -10 }, fascisti: { dis: -5 }, sindacalisti: { dis: 8 } } }; } },
      /* The decline: no effect, exactly as the reference project's @return. */
      { id: 'nulla',
        text: { zh: '我们目前不打算利用阜姆联盟。', it: 'Per ora non servirsi della Lega.' },
        subtitle: { zh: '让这张网留在暗处。', it: 'Lasciare la rete nell\'ombra.' },
        preview: [],
        effect: {} }
    ]
  };
