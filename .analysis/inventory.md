# 1. 事件清单（44 个）

| id | 日期 | 类型 | 选项 | 触发源 |
| --- | --- | --- | --- | --- |
| `ev_1919_09_marcia` | 1919-09 | 日期 | 4 | 调度池 |
| `ev_1919_10_comunali` | 1919-10 | 日期 | 3 | 调度池 |
| `ev_1919_10_persia` | 1919-10 | 日期 | 3 | 调度池 |
| `ev_1919_11_blocco` | 1919-11 | 日期 | 4 | 调度池 |
| `ev_1919_11_modus` | 1919-11 | 日期 | 3 | 调度池 |
| `ev_1920_01_deambris` | 1920-01 | 日期 | 1 | 调度池 |
| `ev_1920_01_inverno` | 1920-01 | 日期 | 4 | 调度池 |
| `ev_1920_04_sciopero` | 1920-04 | 日期 | 4 | 调度池 |
| `ev_1920_06_alleati` | 1920-06 | 日期 | 4 | 调度池 |
| `ev_1920_06_romafronte` | 1920-06 | 日期 | 3 | 调度池 |
| `ev_1920_09_carta` | 1920-09 | 日期 | 3 | 调度池 |
| `ev_1920_10_adunata` | 1920-10 | 日期 | 6 | 调度池 |
| `ev_1920_11_rapallo` | 1920-11 | 日期 | 4 | 调度池 |
| `ev_1921_01_pcdi` | 1921-01 | 日期 | 1 | 调度池 |
| `ev_1921_04_elezioni` | 1921-04 | 日期 | 3 | 调度池 |
| `ev_1921_11_pcdf` | 1921-11 | 日期 | 3 | 调度池 |
| `ev_1924_01_rome` | 1924-01 | 日期 | 2 | 调度池 |
| `ev_1919_09_autonomi` | — | 条件 | 2 | 调度池 |
| `ev_1919_09_socialisti` | — | 条件 | 2 | 调度池 |
| `ev_1919_10_comunali_result` | — | 链节点 | 1 | **无（孤儿链节点）** |
| `ev_1919_12_modus_vote` | — | 链节点 | 1 | **无（孤儿链节点）** |
| `ev_1920_09_romafronte` | — | 条件 | 2 | 调度池 |
| `ev_baross_talks` | — | 条件 | 3 | 调度池 |
| `ev_blasich_contatto` | — | 条件 | 3 | 调度池 |
| `ev_blockade` | — | 条件 | 3 | 调度池 |
| `ev_carta_dibattito` | — | 条件 | 3 | 调度池 |
| `ev_coup` | — | **超级** | 3 | condition（超级） |
| `ev_coup_after` | — | 链节点 | 2 | **无（孤儿链节点）** |
| `ev_coup_fight` | — | 链节点 | 3 | **无（孤儿链节点）** |
| `ev_factory` | — | 条件 | 3 | 调度池 |
| `ev_fascio_split` | — | 条件 | 3 | 调度池 |
| `ev_legion_party` | — | 条件 | 3 | 调度池 |
| `ev_natale` | — | **超级** | 3 | condition（超级） |
| `ev_natale_after` | — | 链节点 | 3 | **无（孤儿链节点）** |
| `ev_natale_deal` | — | 链节点 | 3 | **无（孤儿链节点）** |
| `ev_natale_fight` | — | 链节点 | 3 | **无（孤儿链节点）** |
| `ev_romafronte_bombacci` | — | 条件 | 3 | 调度池 |
| `ev_romafronte_epilogo` | — | 条件 | 2 | 调度池 |
| `ev_romafronte_gramsci` | — | 条件 | 3 | 调度池 |
| `ev_romafronte_malatesta` | — | 条件 | 3 | 调度池 |
| `ev_romafronte_mussolini` | — | 条件 | 3 | 调度池 |
| `ev_strike` | — | 条件 | 3 | 调度池 |
| `ev_violence` | — | 条件 | 3 | 调度池 |
| `ev_whitehead` | — | 条件 | 4 | 调度池 |

# 2. 日志（13 个）

| id | 名称 | 前置 | 完成条件 | 失败条件 | 激活入口 |
| --- | --- | --- | --- | --- | --- |
| `impresa` | 事业的第一年 | 军团兵进入阜姆 | 军团民意 ≥ 58；摄政权威 ≥ 55 | 1920 年 6 月之后「且」摄政权威 < 32 | 3 处 |
| `comune_italiana` | 城市的同意 | 市政选举举行 | 工团派异议 < 22；军团民意 ≥ 55 | 工团派异议 > 72 | 2 处 |
| `carta` | 实施《卡尔纳罗宪章》 | 宪章被宣读并进入议程 | 《卡尔纳罗宪章》≥ 3 级；劳动立法 ≥ 2 级 | 1921 年 8 月之后仍未实施任何条文（宪章停留在 0 级） | 2 处 |
| `porto` | 港口复兴 | 摄政宣布港口复兴计划 | 吞吐指数 ≥ 75 | 第 11 个月之后吞吐指数仍 < 18 | 2 处 |
| `garanzia` | 国际保证 | 日内瓦渠道建立 | 英国 ≥ 65，法国 ≥ 65，美国 ≥ 60；《卡尔纳罗宪章》≥ 2 级 | 血腥圣诞之后「且」第 9 个月之后「且」国联 < 30 | 5 处 |
| `guardia` | 公民卫队 | 公共秩序立法推进 | 公民卫队 ≥ 800 人；事态 < 100 | 第 11 个月之后公共秩序仍 < 2 级 | 2 处 |
| `elezioni` | 制宪议会 | 选举法公布 | 已举行过选举；军团席位 ≥ 30 | 已举行过选举「且」军团席位 < 12 | 4 处 |
| `cassa` | 阜姆券 | 贴现银行开始发行阜姆券 | 通胀 < 12%；债务 < 1800 K£ | 通胀 > 45% | 1 处 |
| `riconciliazione` | 与本地人和解 | 和解路线开启 | 工团派异议 < 16；官方语言 ≥ 1 级（意/克并行） | 工团派异议 > 70 | 2 处 |
| `movimento` | 把军团兵变成运动 | 军团兵网络开始政党化 | 阿迪蒂影响力 ≥ 24；已打出「军团兵政党」事件 | 法西斯派影响力 ≥ 22（运动被右翼接收） | 1 处 |
| `esilio` | 长夜里的集会 | 运动转入流亡 | 流亡月数 ≥ 24 | **永不失败** | 3 处 |
| `resistenza` | 留在城里 | 拒绝离开 | 法西斯小队 < 25；留城月数 ≥ 18 | 政治暴力 > 85 | 3 处 |
| `marcia_1920` | 向罗马进军 | 决定串联全国的反政府力量 | 军团兵力 ≥ 10 000；与意大利军官团的默契 ≥ 60；墨索里尼／邦巴奇／马拉泰斯塔／葛兰西 中至少三股 ≥ 80 | 1922 年 3 月之后仍未达成，或法西斯已经进城 | 2 处 |

# 3. 结局（14 个，按 priority 升序）

| p | id | 名称 | 标签 | check 读取的字段 |
| --- | --- | --- | --- | --- |
| 1 | `ending_silent_port` | 无声的港口 | 崩溃 | economy.population |
| 2 | `ending_fuga` | 诗人离开 | 历史 | flags.dannunzio_left |
| 3 | `ending_natale` | 血腥圣诞 | 失败 | flags.martyred, order.milizia |
| 3.5 | `ending_civil_strife` | 血腥的僵局 | 崩溃 | flags.coup_done, order.violence |
| 4 | `ending_fascio` | 法西斯城邦 | 失败 | flags.coup_done, flags.exile, flags.stay |
| 4 | `ending_marcia_1920` | 进军罗马 | 架空 | flags.marcia_1920, flags.coup_done |
| 7 | `ending_historical` | 历史的结局 | 历史 | flags.treaty_rome, flags.exile |
| 8 | `ending_comune` | 阜姆公社 | 架空 | flags.carta_done, laws.lavoro, laws.fisco, flags.coup_done |
| 10 | `ending_danzig` | 亚得里亚的但泽 | 架空 | flags.international_guarantee, laws.statuto |
| 10.5 | `ending_fiume_o_morte` | 阜姆或死亡！ | 胜利 | flags.porto_revived, economy.traffic, flags.coup_done, laws.statuto, date.y |
| 11 | `ending_carnaro` | 卡尔纳罗共和国 | 胜利 | flags.coup_done, flags.treaty_rome, laws.statuto, date.y |
| 12 | `ending_venice` | 第二个威尼斯 | 架空 | laws.portofranco, economy.traffic, factions.sindacalisti, flags.coup_done |
| 13 | `ending_exile_endured` | 长夜里的集会 | 架空 | flags.exile_endured, flags.passive_victory |
| 99 | `ending_timer` | 尚未落幕 | 未完 | （恒真） |

# 4. 成就（18 个）

| id | 名称 | 授予条件（源码片段） |
| --- | --- | --- |
| `ach_balcony` | 阳台上的国家 | `` |
| `ach_arengo` | 阿伦戈 | `` |
| `ach_carta` | 不是诗，是法 | `` |
| `ach_comune` | 劳动的共和国 | `` |
| `ach_survive` | 活过圣诞 | `` |
| `ach_disarm` | 解除侧翼的武装 | `` |
| `ach_seats` | 制度陷阱 | `` |
| `ach_geneva` | 日内瓦的赌注 | `` |
| `ach_port` | 港口回来了 | `` |
| `ach_sound` | 不印钞的政府 | `` |
| `ach_reconcile` | 三次语言 | `` |
| `ach_movement` | 军团兵政党 | `` |
| `ach_stay` | 留在佩奇内 | `` |
| `ach_exile` | 出走的集会 | `` |
| `ach_empty` | 一千个空房子 | `` |
| `ach_calm` | 不流血的三年 | `` |
| `ach_dissent` | 四派同桌 | `` |
| `ach_o_morte` | 自由未烬 | `` |

# 5. 卡牌（26）

- **azione** 11：az_arditi(3), az_testa(3), az_intrighi(4), az_fiume_league(6), az_forze_italia(7), az_cervo_doro(6), az_reclutamento(6), az_propaganda(6), az_legione_finanziaria(6), az_uscocchi(4), az_fazioni(7)
- **governo** 15：gv_portofranco(3), gv_nave(3), gv_nota_roma(3), gv_dogana_yu(3), gv_lavori(3), gv_disoccupazione(3), gv_guardia(3), gv_disarco(3), gv_stampa(3), gv_lingua(3), gv_cittadinanza(3), gv_bilancio(3), gv_fisco(3), gv_amnistia(3), gv_arengo(3)

# 6. 顾问（11）

- `deambris` 阿尔切斯特·德·安布里斯（sindacalisti） **[有前置]**
- `keller` 圭多·凯勒（arditi）
- `carli` 马里奥·卡利（arditi）
- `gigante` 里卡多·吉甘特（外部）
- `micheletti` 彼得罗·米凯莱蒂（arditi）
- `miani` 埃尔科莱·米亚尼（arditi）
- `baccara` 路易莎·巴卡拉（arditi）
- `giuriati` 乔瓦尼·朱里亚蒂（irredentisti） **[有前置]**
- `blasich` 马里奥·布拉西奇（外部） **[有前置]**
- `grossich` 安东尼奥·格罗西奇（外部） **[有前置]**
- `giulietti` 朱塞佩·朱列蒂（sindacalisti） **[有前置]**

# 7. 可选政治力量（player: true）

- `LEG` 军团（Legione del Carnaro）

# 8. 派系

- `arditi` 阿迪蒂 inf=26 dis=22
- `sindacalisti` 工团派 inf=24 dis=16
- `futuristi` 未来主义派 inf=18 dis=26
- `fascisti` 法西斯派 inf=17 dis=34
- `irredentisti` 收复主义者 inf=15 dis=20

# 9. 势力线 W.FORZE

- `fascisti` 意大利法西斯 init=38 gate=80 allied=true
- `socialisti` 意大利社会党 init=32 gate=80 allied=true
- `anarchici` 意大利无政府主义者 init=30 gate=80 allied=true
- `comunisti` 意大利共产党 init=24 gate=80 allied=true
- `corradini` 意大利民族主义协会 init=34 gate=80 allied=true
- `forzearmate` 意大利军官团 init=22 gate=60 allied=false
