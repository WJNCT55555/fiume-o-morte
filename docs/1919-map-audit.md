# 1919 阜姆地图核查

核查基准：1919 年 9 月 12 日邓南遮进城后的局势。地图供游戏点选，不是经过测绘复原的 1919 年行政图或营区图。现有 13 个多边形来自 OpenStreetMap 现代社区边界简化数据；控制、动荡、族群占比及驻军人数均为游戏参数。

## 主要修正

| 项目 | 原问题 | 现处理 |
| --- | --- | --- |
| 地点坐标 | 地图多边形实际投影原点为 14.4135°E、45.3477°N，元数据却写成 14.4°E、45.3°N，地标与部队整体错位数公里 | 更正投影原点，地标和部队使用同一投影 |
| 瑟尔多齐 | 在 1919 开局即命名、着色为“拉帕洛走廊” | 使用史料中的 Serdozi，并作为境外地点灰色显示；拉帕洛条约签订于 1920 年 11 月 |
| 佩奇内 | 被绘为军团控制区 | 标为苏沙克一侧的境外地点，灰色显示 |
| 周边 | 主图外围只有海色空白 | 加入灰度陆地/海岸方位背景，标注 Castua、Mattuglie、Preluca、Abbazia、Baccari、Grobnico；不按势力染色 |
| 兵力 | 把军团总兵力挂在省督府单一坐标上，又虚构阿迪蒂、舰艇、意军和南国边防的精确驻点及人数 | 仅保留省督府指挥部，以及史料能确认的 1919 年坎特里达、苏沙克宪兵警备点与波尔托巴罗斯法军基地；坐标和人数不作精确史实宣称 |

## 13 个游戏地点的名称核查

| ID | 当前显示 | 1919 年的解释 |
| --- | --- | --- |
| `centro` | Città Vecchia | 历史地名；多边形是游戏用市中心分区。 |
| `porto` | Punto Franco · Porto di Fiume | 自由港是当时协约国警备分区之一；港口在游戏中合并处理。 |
| `brajda` | Braida-Dolaz | 两个历史地名的合并游戏区。 |
| `belvedere` | Belvedere-Turni | 两个地点的合并游戏区，不是已核实的 1919 年行政区名。 |
| `kozala` | Cosala | 当时使用的意大利语地名。 |
| `plase` | Plasse | 当时使用的意大利语地名。 |
| `drenova` | Drenova | 历史地名；现有多边形不能用来复原当年的国界。 |
| `zamet` | Zamet | 历史地点；原文案错误地在 1919 年提及后来的条约走廊，现已纠正。 |
| `pecine` | Pecine | 位于苏沙克一侧，已改为境外灰色。 |
| `srdoci` | Serdozi | 1920 年条约文本把 Serdozi 留给塞尔维亚人、克罗地亚人和斯洛文尼亚人王国，绝非走廊本身。 |
| `susak` | Sussak | 埃内奥河东岸的苏沙克；1919 年有协约国/意大利宪兵警备，不能把“境外”理解成没有其他军队。 |
| `tersatto` | Tersatto | 苏沙克上方的特尔萨特，作为境外地点。 |
| `valle` | Valle dell'Eneo | 河谷地理称谓，不是官方行政区名。 |

## 驻军位置的证据界限

意大利宪兵官方历史资料记载，1919 年 3 月 16 日的协约国警备分成 Sussak、Industriale、Valscurigne、Centro、Eneo、Punto Franco 六个**军事分区**。1919 年 8 月，宪兵分队在自由港、苏沙克及市内；9 月 1 日的调防记录又明确提到苏沙克和坎特里达。资料还记载波尔托巴罗斯由法军作基地、苏沙克设营房和服务设施。资料没有给出可直接落到游戏 SVG 的营房坐标，所以图标只表示附近方向。省督府作为邓南遮指挥部有历史依据，但图标不表示全部军团兵驻扎在同一建筑。

## 几何与时间限制

- 周边陆地和海岸线是方位示意，现代 OSM/国家轮廓只提供地理底图；地图没有把它们伪装成 1919 年国界。
- 13 个可点选多边形不是上述六个协约国军事分区，也不是 1919 年官方行政边界。需要精确边界时，应另行配准 1919—1920 年原始军事测绘图或地籍图。
- “军团控制”颜色显示模拟器当前控制值；苏沙克、特尔萨特、佩奇内和瑟尔多齐保持无势力着色。
- 1919 年警备图标仅在 1919 游戏日期出现。后续军事配置随剧情变化，未用未经考证的固定点位冒充史实。

## 资料

- [意大利宪兵官方历史期刊《Notiziario Storico dell'Arma dei Carabinieri》2019 年第 5 期](https://www.carabinieri.it/docs/default-source/editoria/notiziariostorico/notiziario-2019-5.pdf?sfvrsn=799d2a23_10)：六个军事分区。
- [意大利宪兵《L’Arma dei Carabinieri e l’impresa di Fiume》](https://www.carabinieri.it/media---comunicazione/rassegna-dell-arma/la-rassegna/anno-2011/n-4---ottobre-dicembre/studi)：1919 年驻点与波尔托巴罗斯基地。
- [1920 年拉帕洛条约文本](https://mjp.univ-perp.fr/traites/1920rapallo.htm)：Corpus separatum、后设走廊及 Serdozi 归属。
- [里耶卡市政府的佩奇内历史介绍](https://www.rijeka.hr/mjesni-odbori/pecine/zanimljivosti/stambena-arhitektura-pecina/)：佩奇内在苏沙克城区。
- [里耶卡市政府的苏沙克港历史](https://www.rijeka.hr/susacka-luka-polako-se-mijenja-u-buducu-aci-marinu-rijeka/)：波尔托巴罗斯的位置与港史。
- [里耶卡文化遗产名录中的省督府](https://rijekaheritage.org/hr/kj/guvernerovapalaca)：省督府建筑和地址；[OpenStreetMap 波尔托巴罗斯地物](https://www.openstreetmap.org/way/1363584049) 与 [坎特里达地名](https://www.openstreetmap.org/node/2710647727) 仅用于现代地理定位。
