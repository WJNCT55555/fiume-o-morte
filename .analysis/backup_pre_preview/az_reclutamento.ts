import type { Card } from '../content/types';

/* Recruitment. The Legion was never an army — it was a furnace for madmen, and
   the blockade that was meant to strangle it turned out to be its best
   advertisement. Every option here answers the same question in a different
   currency: who is this movement for, the men who can fight or the men who make
   the world believe?

   All six options are unconditional on purpose. The card's whole subject is that
   the doors are open, so gating them would contradict it; the cost of each door
   is the other doors' silence, which is what the numbers do. */
export const azReclutamento: Card = {
    id: 'az_reclutamento', deck: 'azione',
    name: { zh: '军团招募', it: 'Reclutamento della Legione' },
    cooldown: 4,
    text: { zh: '阜姆的军团从来不是一支真正意义上的军队，而是一座疯子们的熔炉。' +
        '自 1919 年 9 月 12 日邓南遮率约两千六百名志愿者与逃兵从龙基出发以来，' +
        '这支「军团」（Legionari）便以惊人的速度膨胀——从最初的突击队老兵与正规军逃兵，' +
        '到从意大利各地涌来的中学生、退伍军人、无政府主义者、未来主义者以及形形色色的冒险家。\n\n' +
        '意大利政府的封锁切断了补给，但恰恰是封锁本身成了最好的征兵广告：' +
        '激进的民族主义青年、心怀不满的退伍军人、被蒙骗的左翼激进主义者，' +
        '正在用行动宣告他们对罗马政府的不屑。\n\n' +
        '如今，指挥官需要一个决定：军团究竟该向谁敞开大门——' +
        '是那些真正能战斗的人，还是那些能让世界相信这场革命的人？',
        it: 'La Legione di Fiume non è mai stata un vero esercito: è stata una fornace di pazzi. ' +
        'Dal 12 settembre 1919, quando D\'Annunzio partì da Ronchi con circa duemilaseicento fra volontari ' +
        'e disertori, i legionari sono cresciuti a un ritmo prodigioso — dai primi arditi e disertori ' +
        'del Regio Esercito fino agli studenti delle medie, ai reduci, agli anarchici, ai futuristi ' +
        'e a ogni sorta di avventuriero arrivato da tutta Italia.\n\n' +
        'Il blocco del governo italiano ha tagliato i rifornimenti, ed è stato proprio il blocco ' +
        'la migliore reclame possibile: giovani nazionalisti radicali, reduci scontenti, ' +
        'rivoluzionari di sinistra ingannati stanno dichiarando con i fatti il loro disprezzo per Roma.\n\n' +
        'Ora il Comandante deve decidere a chi la Legione apre le porte: ' +
        'agli uomini che sanno davvero combattere, o a quelli che faranno credere al mondo in questa rivoluzione?' },
    cost: { ap: 1 },
    options: [
        { id: 'regio_esercito',
          text: { zh: '向意大利皇家陆军发出公开呼吁——号召所有「未被凡尔赛毒害」的军官与士兵来到阜姆。', it: 'Appello pubblico al Regio Esercito: che ogni ufficiale e soldato non «avvelenato da Versailles» venga a Fiume.' },
          subtitle: { zh: '真正的军人有义务为意大利而死，而不是在贫瘠的村镇中腐烂。', it: 'Un vero soldato ha il dovere di morire per l\'Italia, non di marcire in un villaggio povero.' },
          preview: ['与意大利军官团 +5', '斯拉夫农民 −6', '码头劳工 −5', '阿迪蒂派影响力 +3', '军团兵力 +1000', '金库 −220'],
          /* The appeal is to the officer corps, which is the `forzearmate` line
             on the forces axis (see W.FORZE), not to the Italian government —
             so it moves `forze` and not `diplo.italy`.
             Officers do not walk to Fiume: they have to be brought, housed and
             paid, which is what the 220 K£ is. */
          effect: { funds: -220,
                    forze: { forzearmate: 5 },
                    support: [['contadini', 'LEG', -6], ['portuali', 'LEG', -5]],
                    factions: { arditi: { inf: 3 } },
                    order: { milizia: 1000 } } },
        { id: 'studenti',
          text: { zh: '接纳来自意大利各地中学的未成年志愿者。', it: 'Accogliere i volontari minorenni dalle scuole medie d\'Italia.' },
          subtitle: { zh: '十六岁的青少年们偷偷渡过边境，加入领袖狂热的事业中。', it: 'Ragazzi di sedici anni attraversano il confine di nascosto per unirsi alla causa del Capo.' },
          preview: ['意大利侨民 +3', '失业率 +', '政治暴力 +5', '军团兵力 +500', '金库 −180'],
          /* Five hundred adolescents have to be fed, lodged and hidden — the
             blockade means none of it comes free. */
          effect: { funds: -180,
                    support: [['regnicoli', 'LEG', 3]],
                    economy: { unemployment: 3 },
                    order: { violence: 5, fervour: 3, milizia: 500 },
                    factions: { futuristi: { dis: -6 }, arditi: { dis: -4 } } } },
        { id: 'rastrellamento',
          text: { zh: '在街头围捕逃兵役的适龄公民。', it: 'Rastrellare per strada i renitenti alla leva.' },
          subtitle: { zh: '让妇女、商人与少年都成为这场战争中的音符，即便他们无法扣动扳机。', it: 'Che donne, bottegai e ragazzi diventino note di questa guerra, anche se non sanno premere un grilletto.' },
          preview: ['政治暴力 +5', '法西斯小队 +3', '法西斯派影响力 +5', '军团兵力 +250', '民众热忱 −5', '金库 −80', '阿迪蒂派异议 +', '工团派异议 ++'],
          /* Round-ups cost money before they cost anything else: the pay of the
             men doing the rounding up. */
          effect: { funds: -80,
                    order: { violence: 5, squadre: 3, milizia: 250, fervour: -5 },
                    factions: { fascisti: { inf: 5, dis: -8 }, arditi: { dis: 6 }, sindacalisti: { dis: 12 } },
                    support: [['artigiani', 'LEG', -3], ['operai', 'LEG', -3]] } },
        { id: 'popoli_oppressi',
          text: { zh: '向海外被压迫民族发出召唤，将阜姆宣传为「世界民族主义」之都。', it: 'Appellarsi ai popoli oppressi e presentare Fiume come capitale del «nazionalismo mondiale».' },
          subtitle: { zh: '阜姆不仅属于意大利，它属于每一个拒绝跪下的民族。', it: 'Fiume non appartiene solo all\'Italia: appartiene a ogni popolo che rifiuta di inginocchiarsi.' },
          preview: ['英国 −3／法国 −3', '民众热忱 +3', '军团兵力 +300×(1+0.1×阜姆联盟已用选项)', '收复主义者异议 +'],
          /* The network pays out: the wider the League already reaches, the more
             volunteers this appeal brings. `counters.leagueUsed` is incremented by
             az_fiume_league's five substantive options (not its decline), and
             applyEffect settles `order` before `counters`, so this reads the value
             as it stood when the card was played.
             The formula is the one specified: 300 x (1 + 0.1 x uses), rounded. */
          effect: function (s) {
            const uses = (s.counters && s.counters.leagueUsed) || 0;
            return {
              order: { fervour: 3, authority: 2, milizia: Math.round(300 * (1 + 0.1 * uses)) },
              diplo: { uk: -3, france: -3 },
              factions: { irredentisti: { dis: 8 }, futuristi: { dis: -4 } }
            };
          } },
        { id: 'socialisti',
          text: { zh: '激起社会主义者的热情，推动左翼革命。', it: 'Accendere l\'entusiasmo dei socialisti e spingere la rivoluzione da sinistra.' },
          subtitle: { zh: '构建一支左翼力量的国际纵队。', it: 'Costruire una colonna internazionale delle forze di sinistra.' },
          preview: ['产业工人 +3', '码头劳工 +3', '工团派影响力 +6', '军团兵力 +650', '金库 −260', '收复主义者异议 +5', '意大利 −5', '意共 +3（若已成立）／无政府主义者 +5'],
          /* Bringing a foreign column to Fiume means paying its passage and
             feeding it on arrival: the dearest of the six. */
          effect: function (s) {
            /* Typed as a record so the conditional key can be added. */
            const out: Record<string, unknown> = {
              funds: -260,
              support: [['operai', 'LEG', 3], ['portuali', 'LEG', 3]],
              factions: { sindacalisti: { inf: 6 }, irredentisti: { dis: 5 }, fascisti: { dis: 4 } },
              order: { milizia: 650 },
              diplo: { italy: -5 },
              forze: { anarchici: 5 }
            };
            if (s.flags && s.flags.comintern_door) {
              (out.forze as Record<string, number>).comunisti = 3;
            }
            return out;
          } },
        /* The decline. Closing the doors is a real decision and it reads as
           distrust: the movement hears the Capo locking it out of its own house. */
        { id: 'chiudere',
          text: { zh: '封闭招募。军团已经足够庞大。', it: 'Chiudere il reclutamento. La Legione è già abbastanza grande.' },
          subtitle: { zh: '拒绝再增加一张饥饿的嘴，比任何招募令都更需要勇气。', it: 'Rifiutare un\'altra bocca affamata richiede più coraggio di qualunque ordine di reclutamento.' },
          preview: ['军团兵力 −250', '摄政权威 +', '事态 −', '金库 +60', '意大利侨民支持 −', '阿迪蒂／未来主义派异议 +'],
          /* The only option that pays in: closing the doors means not feeding the
             mouths that would have come. */
          effect: { funds: 60,
                    order: { milizia: -250, authority: 3, coup: -4, fervour: -3 },
                    support: [['regnicoli', 'LEG', -3], ['artigiani', 'LEG', -2]],
                    economy: { capitalConfidence: 4 },
                    factions: { arditi: { dis: 8 }, futuristi: { dis: 8 }, sindacalisti: { dis: -4 } } } }
    ]
};
