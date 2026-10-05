import type { GameEvent } from '../content/types';

/* 10 October 1919. The freighter Persia was carrying arms and ammunition for
   the White armies in Russia, bound for Vladivostok. The Federazione della
   gente di mare had failed to talk Rome out of shipping Italian weapons to the
   reactionaries, so its members took the ship in the Strait of Messina and
   sailed her to Fiume instead. Thirteen tons of military stores went into the
   command's warehouses, and the city celebrated Captain Giulietti and his crew
   on the evening of the 11th.

   Dated the 10th; the half-month clock reaches 1919-10-12 on the first October
   turn, which satisfies the day gate. The municipal election sits at d: 26 and
   therefore waits for the second October turn. */
export const ev191910Persia: GameEvent = {
    id: 'ev_1919_10_persia', date: { y: 1919, m: 10, d: 10 },
    title: { zh: '10 月 10 日：波斯号', it: '10 ottobre: la Persia' },
    body: { zh: '意大利货船波斯号被征用并驶往阜姆。\n\n' +
        '这是一件独特的战利品：它满载着为白军在俄国作战的武器与弹药，原本要航行到符拉迪沃斯托克，' +
        '用于对抗布尔什维克的战争。\n\n' +
        '海事工人联合会（Federazione della gente di mare）试图说服政府不要向反动的俄军提供意大利武器，' +
        '没有成功。于是它的成员在墨西拿海峡接管了这艘船，把它开进了「大屠杀之城」。\n\n' +
        '不少于十三吨的军事物资被送入指挥部的仓库。11 日晚上，全城庆祝朱塞佩·朱列蒂船长与波斯号船员。\n\n' +
        '对朱列蒂而言，这一举动不只是表明反对向白军供货的立场——它也逼着政府向海事工人做出各种让步。',
      it: 'Il vapore italiano Persia viene requisito e portato a Fiume.\n\n' +
        'È un bottino singolare: carico di armi e munizioni per le armate bianche in Russia, doveva salpare per Vladivostok, per la guerra contro i bolscevichi.\n\n' +
        'La Federazione della gente di mare aveva tentato invano di convincere il governo a non fornire armi italiane ai russi reazionari. I suoi aderenti presero la nave nello Stretto di Messina e la condussero nella «città del natale di sangue».\n\n' +
        'Non meno di tredici tonnellate di materiale militare entrarono nei magazzini del Comando. La sera dell\'11 la città accolse il capitano Giuseppe Giulietti e l\'equipaggio della Persia.\n\n' +
        'Per Giulietti il gesto non segnava soltanto una posizione contro i rifornimenti ai bianchi: costringeva il governo a concessioni verso la gente di mare.' },
    options: [
      {
        id: 'accogliere',
        text: { zh: '接收全部物资，公开嘉奖朱列蒂与船员。', it: 'Accogliere tutto il carico e rendere onore pubblico a Giulietti e all\'equipaggio.' },
        preview: [{ zh: '军械 +++', label: 'armi +++' }, { zh: '苏联关系 +6', label: 'URSS +6' },
                  { zh: '意大利 −−', label: 'Italia −−' },
                  { zh: '动员 ++', label: 'fervore ++' }, { zh: '朱列蒂入幕', label: 'Giulietti consigliere' }],
        effect: function () { return {
          arms: 180,
          order: { fervour: 12, squadre: 5 },
          /* The thirteen tons were destined for the White armies at Vladivostok.
             Taking them is not a gesture of sympathy for Moscow, it is a material
             subtraction from Moscow's enemies — and the Soviet government reads
             it exactly that way, which is why the arms come with goodwill. */
          diplo: { italy: -14, league: -3, soviet: 6 },
          support: [['portuali', 'LEG', 5], ['operai', 'LEG', 3]],
          relations: [['LEG', 'PSI', 10]],
          factions: { sindacalisti: { dis: -14 }, futuristi: { dis: -8 }, fascisti: { dis: 6 } },
          flags: { persia: true },
          }; }
      },
      {
        id: 'silenzio',
        text: { zh: '收下货，不办庆典。别让罗马有借口。', it: 'Prendere il carico senza cerimonie. Non dare a Roma un pretesto.' },
        preview: [{ zh: '军械 +++', label: 'armi +++' }, { zh: '意大利 −', label: 'Italia −' },
                  { zh: '海员失望', label: 'gente di mare delusa' }],
        effect: function () { return {
          arms: 180,
          order: { fervour: 4 },
          diplo: { italy: -6 },
          support: [['portuali', 'LEG', 2]],
          relations: [['LEG', 'PSI', 4]],
          factions: { sindacalisti: { dis: 10 }, arditi: { dis: -4 } },
          flags: { persia: true } }; }
      },
      {
        id: 'restituire',
        text: { zh: '把物资交还罗马。我们不靠偷来的枪立国。', it: 'Restituire il carico a Roma. Non si fonda uno Stato con fucili rubati.' },
        preview: [{ zh: '意大利 ++', label: 'Italia ++' }, { zh: '动员 −−', label: 'fervore −−' },
                  { zh: '工团派异议 ++', label: 'Falange ++' }],
        effect: function () { return {
          order: { fervour: -12, squadre: -4 },
          diplo: { italy: 12, league: 4 },
          support: [['portuali', 'LEG', -5], ['operai', 'LEG', -3]],
          relations: [['LEG', 'PSI', -14]],
          factions: { sindacalisti: { dis: 22 }, arditi: { dis: 12 }, irredentisti: { dis: -8 } },
          flags: { persia_refused: true } }; }
      }
    ]
  };
