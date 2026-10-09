/* ==========================================================================
   内容层 · 派系 · 军团兵运动内部路线
   五个内部派系：阿迪蒂 / 工团派 / 未来主义派 / 法西斯派 / 收复主义者。影响力总和 100。
   每个派系带 zh 与 it 两个名字，界面按当前语言取值（Core.L）。
   ========================================================================== */
(function (root, factory) {
  var mod = factory(root.Fiume.World);
  if (typeof module === 'object' && module.exports) module.exports = mod;
  root.Fiume = root.Fiume || {};
  root.Fiume.Factions = mod;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (W) {
  'use strict';
  var P = W;
  /* ======================= 4. Factions (inside the legionary movement) ======================= */
  /* Influence sums to 100; dissent is independent per faction, 0-100.
     The values are inferred from the movement's actual composition in 1919 (the Arditi
     association, De Ambris's syndicalists, Marinetti's Futurists, Host-Venturi's fascists,
     and the irredentists of the Nationalist Association).
     `order` is the left-to-right axis these factions are displayed on, from the
     movement's revolutionary left to its fascist right. It is not a ranking by
     size: the declaration order of this array is not the display order. */
  W.FACTIONS = [
    { id: 'sindacalisti', zh: '工团派', it: 'Sindacalisti', order: 0, inf: 24, dis: 16, color: '#ab2b17',
      blurb: '怀揣着对民族自由左翼乌托邦幻想的工会领袖与知识分子们齐聚阜姆，尝试将这座亚得里亚海小城进行劳动、平等、进步的美德实验并将打造为全球被压迫民族革命的灯塔。' },
    { id: 'futuristi', zh: '未来主义派', it: 'Futuristi', order: 1, inf: 18, dis: 26, color: '#6a0a71',
      blurb: '先锋派艺术家将赋予了阜姆近乎荒诞的剧场狂欢特质。速度、机械、噪音与反叛，彻底打破一切传统道德与资产阶级世俗秩序。在未来主义者的煽动下，一场绝对的审美颠覆与激进行动将从阜姆起航，直到彻底撕碎旧世界。' },
    { id: 'arditi', zh: '阿迪蒂', it: 'Arditi', order: 2, inf: 26, dis: 22, color: '#4c4545',
      blurb: '这群口衔短剑、身着黑衫的一战幸存者构成了军团最坚硬的军事骨架。带着极度的战壕创伤与病态的英雄主义迷醉涌入阜姆，将战场上冲锋的决死姿态构成了军团最坚硬的武装骨架。' },
    { id: 'irredentisti', zh: '收复主义者', it: 'Irredentisti', order: 3, inf: 15, dis: 20, color: '#c29f13',
      blurb: '怀揣着对《凡尔赛条约》和协约国霸权的愤怒，最纯正的意大利爱国者们和参与哗变的军官们追随邓南遮进驻阜姆，他们的渴望只有一个：促成阜姆无条件并入意大利王国版图。他们只会追随能够完成伟大收复伟业最后一张之人。' },
    { id: 'fascisti', zh: '法西斯派', it: 'Fascisti', order: 4, inf: 17, dis: 34, color: '#8f4124',
      blurb: '军团内部最敏锐的权力投机者与政治煽动家已经做好准备。他们黑暗之中蠢蠢欲动，时刻准备颠覆自己软弱的祖国。' }
  ];
  return P;
});
