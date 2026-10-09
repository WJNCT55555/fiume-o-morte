# Character portrait art direction

The enabled portraits in `public/img/Portrait/` use real character identities. Existing Disco Elysium style paintings take priority over source photographs. The directory contains 15 active PNG assets: eight paintings and seven photographs. Painted portraits are exactly 1086 × 1448 pixels (3:4); photographs retain their source dimensions.

Original portraits, previous variants and inactive assets are retained in `output/portraits/`. The latest seven paintings use naturally colourized identity photographs and the user's four new style references, rendered as broad matte digital paint planes. The current filenames, delivery paths and prompts are recorded in the final section of this document and in `output/portraits/current-portrait-prompts.json`.

## Where a portrait is declared

An advisor's portrait is a field on the advisor record — `Advisor.portrait` in
`src/game/advisors/*.ts`, a project-relative path such as
`img/Portrait/Portrait_mario_carli.png`. `Sel.advisors` copies it out, and the
view layers (`src/legacy/ui/views.js` for the roster and the picker,
`src/legacy/ui/components/common.js` for the ministers) turn it into an `<img>`.
Three rules follow from that:

- **One declaration, no second map.** The old `UI.ADV_AVATAR` in `common.js` and
  the local `ADV_AVATAR` in `views.js` were two hand-kept copies of the same
  idea and had drifted apart, so four advisors were showing another man's
  photograph. Do not reintroduce a portrait table in the UI layer.
- **No portrait means no `<img>`.** `avatar()` falls back to the initial-letter
  plate. Pointing an advisor at a photograph of somebody else, a group shot, or
  a generic scene is worse than an empty plate: it states a falsehood about who
  the advisor is.
- **A declared portrait must exist.** `tools/smoke.js` checks that every
  `Advisor.portrait` resolves to a file and that the number of advisors without
  one never grows.

Portrait filenames use the fixed `Portrait_` prefix followed by lowercase snake_case character names and `.png`, for example `Portrait_mario_carli.png`. The smoke test enforces this convention.

## Current inventory — enabled portraits

| Character | Portrait file | Current asset |
| --- | --- | --- |
| Gabriele D'Annunzio | `Portrait_gabriele_d_annunzio.png` | Disco Elysium style painting, 1086 × 1448 |
| Guido Keller | `Portrait_guido_keller.png` | Disco Elysium style painting, 1086 × 1448 |
| Giuseppe Giulietti | `Portrait_giuseppe_giulietti.png` | Disco Elysium style painting, 1086 × 1448 |
| Mario Carli | `Portrait_mario_carli.png` | Disco Elysium style painting, 1086 × 1448 |
| Antonio Grossich | `Portrait_antonio_grossich.png` | Disco Elysium style painting, 1086 × 1448 |
| Alceste De Ambris | `Portrait_alceste_de_ambris.png` | Disco Elysium style painting, 1086 × 1448 |
| Giovanni Giuriati | `Portrait_giovanni_giuriati.png` | Disco Elysium style painting, 1086 × 1448 |
| Giovanni Host Venturi | `Portrait_giovanni_host_venturi.png` | Disco Elysium style painting, 1086 × 1448 |
| Riccardo Gigante | `Portrait_riccardo_gigante.png` | Photograph; source dimensions preserved |
| Riccardo Zanella and Mario Blasich | `Portrait_riccardo_zanella_mario_blasich.png` | Photograph; source dimensions preserved; paired likeness retained |
| Riccardo Zanella | `Portrait_riccardo_zanella.png` | Photograph; source dimensions preserved |
| Icilio Bacci | `Portrait_icilio_bacci.png` | Photograph; source dimensions preserved |
| Maffeo Pantaleoni | `Portrait_maffeo_pantaleoni.png` | Photograph; source dimensions preserved |
| Enrico Caviglia | `Portrait_enrico_caviglia.png` | Photograph; source dimensions preserved |
| Giovanni Giolitti | `Portrait_giovanni_giolitti.png` | Photograph; source dimensions preserved |

## Gaps — advisors still on the letter plate

These three advisors still have no verified likeness on file and use an initial-letter plate.

| Advisor | What is needed |
| --- | --- |
| Pietro Micheletti | a photograph of Micheletti |
| Ercole Miani | a photograph of Miani |
| Luisa Baccara | a photograph of Baccara |

Giovanni Giuriati's gap is resolved: the locally misnamed `Portrait_Giuseppe_Giurati.jpg` was verified against the Commons original with SHA-1 `6efe643b57d2fa8f8210417710d3b821caf65354`. His painting is now enabled as `Portrait_giovanni_giuriati.png`.

Unused candidates and source photographs are archived under `output/portraits/archive-before-cleanup/`. The active asset catalogue is `public/img/manifest.json`; original source attribution is retained there for the derived paintings.

## Historical shared prompt

> Use the source portrait as the edit target and sole identity reference. Preserve the person's recognizable facial structure, age, hair, facial hair, gaze, period clothing, and head-and-shoulders pose. Use the two supplied expressionist portraits as style references only, without copying their faces, clothing, or colors. Transform the source into the painterly psychological visual language of Disco Elysium: rough broad oil and gouache brush strokes, fractured angular color planes, thick impasto, ink-dark interruptions, scumbled edges, and visible canvas texture. Avoid a smooth or conventional realistic oil portrait. Keep the subject historically grounded around 1919. Use a symbolic abstract background in the assigned faction colors, with darker edges; keep the face legible and the silhouette separate from the backdrop. The faction color should live mainly in the background rather than tinting the skin. Exactly 3:4, centered head and shoulders, no crop through the head, no border, text, symbols, flags, watermark, added people, modern objects, or digital noise.

## Background palette

| Affiliation | Background colors | Project reference |
| --- | --- | --- |
| Legion leader / irredentists | Ochre gold and burnt umber | `#C9A227`, `#c29f13` |
| Syndicalists | Subdued brick red and deep wine | `#ab2b17` |
| Arditi | Charcoal, smoke grey, cold steel | `#4c4545` |
| Fascists | Rust brown and dark burnt orange | `#8f4124` |
| Futurists | Muted violet and dark aubergine | `#6a0a71` |

## Character details used

- **Gabriele D'Annunzio:** Intense eyes, dark moustache, pointed grey beard, dark military cap and formal clothing. Ochre gold backdrop. (`Portrait_Dannunzio_DiscoV2.png`, historical output name.)
- **Giuseppe Giulietti:** Swept-back dark hair, dark moustache, direct stare, dark jacket, white shirt and green necktie. Syndicalist red backdrop.
- **Guido Keller:** Swept dark hair, thick moustache, pointed dark beard, pale eyes, wry expression, dark jacket and white shirt. Arditi charcoal backdrop.

## Identity notes for the four missing advisors

Hair, facial hair and build come from the period sources; treat anything below as
the anchor the generator must not drift from.

- **Luisa Baccara** (arditi backdrop, charcoal): a pianist in her late twenties, dark hair worn up, calm and formal, evening dress rather than uniform. The only woman among the advisors — keep the silhouette clearly distinct from the men's collars and caps.
- **Ercole Miani** (arditi backdrop): Irredentist organizer from Trieste, in his late twenties, clean-shaven or light moustache, officer's uniform, practical rather than theatrical.
- **Pietro Micheletti** (arditi backdrop): an Arditi officer, around thirty, close-cropped hair, moustache, the plain service dress of December 1920 rather than the Arditi parade uniform.
- **Giovanni Giuriati** (irredentist backdrop, ochre gold): in 1919 he was in his mid-forties, balding with dark hair at the sides, moustache, formal civilian suit and wing collar — a parliamentarian, not a soldier.


## Batch 2 — colourize first, then paint (2026-10-07)

Seven portraits were produced sequentially with the built-in `image_gen.imagegen` tool. Every character first received a natural full-colour photographic reference, then that colourized image became the sole identity and local-colour input for the expressionist painting. The attached examples supplied brushwork and abstraction only. This two-stage workflow replaces the monochrome-heavy direct-transfer drafts for this batch. Final assets and colourized references are all PNG, 1086 × 1448, exactly 3:4. These are asset deliverables; game portrait references were not updated.

Colourization choices for undocumented garment and eye colours are plausible artistic choices. The original photographs remain the facial-identity anchors. Local input copies are in `output/portraits/sources/`; the colourized intermediate images are in `output/portraits/colorized/`.

### Shared stage 1 prompt — natural colour reference

> Stage 1 of a two-stage portrait workflow: natural full-colour photographic restoration and colourization ONLY. The input photograph is the sole identity reference. Preserve the person's exact recognizable facial geometry, expression, gaze direction, hairline, hair and facial hair, age, pose and period clothing details. Reconstruct plausible natural local colours across the ENTIRE subject: healthy warm skin with subtle pink and peach variation, warm lips, differentiated hair, eyes, cloth and accessories. This must be a truly chromatic full-colour photographic reference, not grayscale with one coloured object, not sepia, not monochrome, and not an oil painting. Remove printed halftone dots, yellowed-paper tint, scanner noise and dust while retaining identity and believable facial detail. Use balanced natural photographic light, no theatrical colour grading. Frame head and shoulders on a vertical EXACT 3:4 canvas, target 1086 by 1448 pixels; preserve the original face orientation and use plausible continuation of clothing where necessary. Complete head/hair/hat visible with room above it. No text, border, watermark, extra people or invented emblems. The chosen garment colours are plausible colourization choices rather than claimed historical facts.

### Shared stage 2 prompt — chromatic impasto painting

> Stage 2: convert the fully COLOURIZED photograph in image 1 into a high-quality expressive hand-painted historical RPG portrait in the Disco Elysium-inspired European expressionist aesthetic. Image 1 is the EDIT TARGET and SOLE identity AND local-colour reference. Images 2 and 3 are references ONLY for bold fractured brushwork and expressive abstraction: never borrow their faces, clothing or subdued monochrome palette. Carry the chromatic skin, hair and garment colours of image 1 into the painting, then exaggerate them through wild complementary colour collisions. Thick impasto oils and gouache, very broad loaded palette-knife strokes, broken angular colour planes, scumbled layers, scraped passages, lost edges, exposed canvas, dramatic chiaroscuro and intense human psychological complexity. Paint shadows with rich BLUE, VIOLET, GREEN and burgundy pigments instead of dead neutral black; warm luminous skin lights. There must be bold visible COLOUR THROUGHOUT the person and background, not a grayscale person on a coloured backdrop. Likeness remains recognizable. Maintain original face orientation, head-and-shoulders composition, full head/hat visible and breathing room above. EXACT 3:4 vertical canvas, target 1086 by 1448 pixels. Symbolic abstract paint-field background in the assigned palette. Deliberate tactile painting texture without halftone dots, scan noise or digital noise. No text, border, watermark, extra people or invented emblems.

### Character prompts and saved assets

The exact prompt sent for each stage is its shared prompt above, two newlines, then the corresponding character-specific prompt below. Stage 1 uses the original photograph only. Stage 2 uses the saved colourized reference as image 1 and the two user-attached expressionist examples as images 2 and 3.

#### 1. Léon Kochnitzky

- Original reference: `public/img/Portrait/Portrait_Leon_Kochnitzky.jpg`; stable copy: `output/portraits/sources/Portrait_Leon_Kochnitzky.jpg`.
- Colourized reference: `output/portraits/colorized/Portrait_Leon_Kochnitzky_Colorized.png`.
- Final painting: `public/img/Portrait/Portrait_Leon_Kochnitzky_DiscoV2.png`.

**Stage 1 character prompt**

> Subject: Léon Kochnitzky. Preserve his youthful slim elongated face, angular nose, high swept tousled dark hair and thoughtful left-facing three-quarter/profile angle. Colour his skin warm peach-pink with real skin variations, hair deep chestnut brown, period suit warm tobacco-brown/taupe, white collar creamy ivory and tie muted burgundy. A softly defocused muted olive garden background. Keep his exact profile silhouette and gaze; avoid inventing front-facing features. His clothing should have visibly differentiated brown pigment, not neutral grey.

**Stage 2 character prompt**

> Subject: Léon Kochnitzky, retain the colourized young slim face, strong angular nose, very high swept dark CHESTNUT hair and contemplative left-facing profile. Keep warm peach skin, wine-red tie and TOBACCO-BROWN suit visibly chromatic, then introduce teal and violet into their shadows and magenta into selective reflected lights. Palette: neutral cool grey as a quiet scaffold ONLY, dominated visually by vivid PEACOCK BLUE and TEAL GREEN large brushwork with sharp MAGENTA accents and warm amber/peach facial highlights. Brown cloth must retain a brown identity within coloured impasto strokes. His face and coat should be colourful living paint, never grey or black-and-white. Thoughtful psychological intensity, full head visible with ample top room.

#### 2. Mario Carli

- Original reference: `public/img/Portrait/Portrait_Mario_Carli.jpg`; stable copy: `output/portraits/sources/Portrait_Mario_Carli.jpg`.
- Colourized reference: `output/portraits/colorized/Portrait_Mario_Carli_Colorized.png`.
- Final painting: `public/img/Portrait/Portrait_Mario_Carli_DiscoV2.png`.

**Stage 1 character prompt**

> Subject: Mario Carli. Preserve the youthful slim face, exact short dark hair and hairline, original slightly inclined head, brows, nose, lips, chin, subtle original facial-hair detail and serious watchful expression. Crop the seated source to head and shoulders while maintaining the original head tilt and clothing cut. Natural warm olive-peach skin, chestnut-brown hair, dark expressive eyes. Colour the period suit DEEP NAVY BLUE with blue cloth visible in both light and shade, shirt creamy white, original neckwear deep wine-brown. Soft neutral warm photographic background. Be faithful to the face, not an idealized modern model.

**Stage 2 character prompt**

> Subject: Mario Carli. Preserve this colourized man's exact young lean face, dark short chestnut hair, original head tilt, facial features and neckwear/clothing details. Keep warm olive-peach skin and NAVY BLUE cloth colour strongly present across the subject. ARDITI palette: charcoal (#4c4545) only as an underlying structure, fiercely saturated COBALT BLUE and VERMILION large gestural strokes around him; orange-red reflected highlights across cheeks and ear, vivid blue-violet and burgundy shadows across his face and coat. Defiant, intelligent, restless mood. Avoid neutral grey skin and broad unmodulated black clothing. Raw angular impasto brush marks but his face remains unmistakably that of the colourized reference. Full hair visible with upper margin.

#### 3. Antonio Grossich

- Original reference: `public/img/Portrait/Portrait_Antonio_Grossich.jpg`; stable copy: `output/portraits/sources/Portrait_Antonio_Grossich.jpg`.
- Colourized reference: `output/portraits/colorized/Portrait_Antonio_Grossich_Colorized.png`.
- Final painting: `public/img/Portrait/Portrait_Antonio_Grossich_DiscoV2.png`.

**Stage 1 character prompt**

> Subject: Antonio Grossich. Preserve his elderly broad balding head, remaining hair at sides, heavy thoughtful eyes, very long white beard and moustache, exact face proportions and original quiet expression. Keep the same hand resting/supporting the same cheek as in the source, with natural anatomy and original pose. Natural aged warm rosy-peach skin with visible life and subtle freckles/age detail. Beard soft ivory-white with warm cream and subtle silver shadow, not a flat grey mass. Colour his period formal suit warm DARK OLIVE-BROWN with visibly brown-green cloth pigment, white cuffs and collar creamy ivory, neckwear muted burgundy-brown. Soft warm brown interior background. Head-and-shoulders crop includes supporting hand and long beard.

**Stage 2 character prompt**

> Subject: Antonio Grossich. Preserve the colourized elderly broad balding face, wise heavy eyes, long white beard and moustache, original hand-on-cheek pose and the warm OLIVE-BROWN suit. His face and hand retain warm peach and coral light, with violet and viridian chromatic shadows; beard remains ivory-white with lively yellow-gold, lavender and turquoise reflected paint. Palette: warm grey only as background scaffold; sweeping vivid EMERALD GREEN and IVORY YELLOW / GOLD dominate the abstract background and mix boldly into garment brushwork. Break the coat into brown, olive, green, violet and warm ochre impasto planes rather than plain black. Contemplative human authority and weariness, readable face and convincing supporting hand, strong psychological portrait. Generous room above full head and around the beard.

#### 4. Filippo Tommaso Marinetti

- Original reference: `public/img/Portrait/Portrait_Filippo_Tommaso_Marinetti.png`; stable copy: `output/portraits/sources/Portrait_Filippo_Tommaso_Marinetti.png`.
- Colourized reference: `output/portraits/colorized/Portrait_Filippo_Tommaso_Marinetti_Colorized.png`.
- Final painting: `public/img/Portrait/Portrait_Filippo_Tommaso_Marinetti_DiscoV2.png`.

**Stage 1 character prompt**

> Subject: Filippo Tommaso Marinetti. The source already has some colour: restore it into a clean natural fully coloured photograph rather than introducing any monochrome base. Preserve his exact broad mature face, fierce furrowed eyebrows, intense dark eyes, thin dark moustache, dark-brimmed period fedora, dark jacket, creamy shirt and RED BOW TIE. Healthy warm tan/olive skin with pink-peach variation, dark brown moustache, chocolate-brown jacket with visible warm-brown local colour, beige/tan fedora crown with deep chocolate brim and original red band, burgundy-red bow tie. Keep near-frontal gaze and original hat angle. ENTIRE hat crown and brim visible with at least 5% image-height clear space above. Soft neutral natural photographic background, no paint or style-transfer yet.

**Stage 2 character prompt**

> Subject: Filippo Tommaso Marinetti. Preserve this colourized man's exact broad mature facial geometry, furious eyebrows, intense eyes, dark moustache, warm tan/olive skin, beige and chocolate period fedora with red band, red bow tie and brown coat. Palette: FUTURIST deep violet/aubergine (#6a0a71), wildly vivid ACID YELLOW and ELECTRIC BLUE background strokes; warm coral/amber face light, intense purple and cobalt chromatic face shadows; coat expressed through brown, burgundy, violet and electric-blue impasto colour planes. Colour must permeate the portrait, not only the background. Audacious theatrical psychological tension and huge angular gestures. IMPORTANT COMPOSITION CHANGE from the photo: zoom back/pull framing back to show the ENTIRE fedora crown and brim, complete head and shoulders. Reconstruct any cropped top of the hat naturally. Leave an 8% canvas-height band of abstract background ABOVE the hat's highest point; hat and brim must not touch any canvas edge. Keep exact 3:4 ratio.

#### 5. Giovanni Giuriati

- Original reference: `public/img/Portrait/Portrait_Giuseppe_Giurati.jpg`; stable copy: `output/portraits/sources/Portrait_Giuseppe_Giurati.jpg`.
- Colourized reference: `output/portraits/colorized/Portrait_Giovanni_Giuriati_Colorized.png`.
- Final painting: `public/img/Portrait/Portrait_Giovanni_Giuriati_DiscoV2.png`.

**Stage 1 character prompt**

> Subject: Giovanni Giuriati from the verified historical photograph. Preserve the distinct high receding forehead with sparse dark hair at the sides, large alert dark eyes, long nose, dark moustache and pointed goatee beard, original three-quarter angle and calculating reserved expression. Mature adult in his forties with natural age and exact facial proportions. Warm olive-peach skin with rosy variation, chestnut/espresso-brown hair, moustache and goatee, brown eyes. Colour the original period high-neck outfit warm olive-brown, folded neck scarf/cloth muted deep blue-green with warm cream details, maintaining its original drape and cut. Soft natural warm photographic backdrop. A full-colour restored historical photo, no painting yet, no grey or sepia cast.

**Stage 2 character prompt**

> Subject: Giovanni Giuriati. Preserve the colourized man's high receding forehead, sparse chestnut side hair, large dark eyes, moustache, pointed goatee, three-quarter angle, warm olive-peach skin and exact recognizable face. Keep the warm OLIVE-BROWN garment and DEEP BLUE-GREEN scarf/cloth visibly coloured. IRREDENTIST palette: aged OCHRE GOLD (#c29f13) and burnt umber, large vivid VIRIDIAN/EMERALD GREEN passages, selected violet/burgundy shadows. Warm amber, peach and coral face light against green-blue and purple shadows; his skin must still feel alive and chromatic. Garments painted in gold, brown, olive, teal and violet impasto planes, no neutral grey monochrome treatment. Austere calculating gaze, restless psychological abstraction in the background. Pull framing back slightly to show full head with at least 5% background above hair and more shoulder room. Exact 3:4.

#### 6. Alceste De Ambris

- Original reference: `public/img/Portrait/Portrait_Alceste_De_Ambris.jpg`; stable copy: `output/portraits/sources/Portrait_Alceste_De_Ambris.jpg`.
- Colourized reference: `output/portraits/colorized/Portrait_Alceste_De_Ambris_Colorized.png`.
- Final painting: `public/img/Portrait/Portrait_Alceste_De_Ambris_DiscoV2.png`.

**Stage 1 character prompt**

> Subject: Alceste De Ambris. Preserve his exact mature broad face, ROUND thin-rimmed spectacles with eyes clearly visible behind the lenses, thick dark moustache and full pointed beard, original broad-brimmed slouch hat and its asymmetric angle, formal suit, waistcoat, white collar and dark tie. Keep the slightly turned head and steady thoughtful gaze. Natural warm olive-peach skin, deep chestnut hair/moustache/beard with subtle mature variation. Colour his original hat chocolate-brown with its original dark band, formal suit warm chestnut-brown with differentiated olive-brown vest, tie deep burgundy and shirt creamy ivory. Soft warm natural photographic background. Glasses seated correctly with single lenses, no duplicate frames. Pull back enough to fit the ENTIRE hat crown and both brim edges, at least 5% canvas-height clear background above it. This stage is natural photographic colour restoration, no painterly texture.

**Stage 2 character prompt**

> Subject: Alceste De Ambris. Preserve this colourized man's mature broad face, ROUND thin-rimmed glasses with visible eyes, rich chestnut moustache and full pointed beard, original asymmetric wide-brimmed BROWN slouch hat, chestnut-brown suit and olive-brown vest, wine-red tie, warm olive-peach skin. The face itself is constructed from forceful broad broken angular paint planes, with raw expressive contours rather than smooth photographic skin. SYNDICALIST palette: BRICK RED (#ab2b17) and deep ULTRAMARINE BLUE collide in huge vigorous strokes, accented with creamy OFF-WHITE/IVORY; coral-orange and yellow flesh lights, vivid violet-blue and burgundy shadows, rich brown clothing interrupted by red, cobalt and purple pigment. Intellectual conviction, human weariness and melancholy. Keep glasses anatomically correct with single clear lenses. Retain his slightly turned head and firm thoughtful gaze. The ENTIRE hat must be visible, with at least 5% canvas height of background above it and space around both brim tips. Head-and-shoulders, EXACT 3:4.

#### 7. Giovanni Host Venturi

- Original reference: `public/img/Portrait/Portrait_Giovanni_Host_Venturi.png`; stable copy: `output/portraits/sources/Portrait_Giovanni_Host_Venturi.png`.
- Colourized reference: `output/portraits/colorized/Portrait_Giovanni_Host_Venturi_Colorized.png`.
- Final painting: `public/img/Portrait/Portrait_Giovanni_Host_Venturi_DiscoV2.png`.

**Stage 1 character prompt**

> Subject: Giovanni Host Venturi. Preserve the exact young adult facial proportions, short side-parted dark hair, curled moustache, small pointed goatee, original gaze and slightly turned head. Preserve original period military uniform cut, collar stars, ribbon details and neckwear present in the photo, without inventing additional insignia. Warm olive-peach skin with subtle rosy cheeks and lips, deep chestnut hair, moustache and beard, dark natural eyes. Colour the field uniform SAGE/OLIVE GREEN with rich green cloth visible in both light and shadow, muted khaki neckwear and soft cream collar details. A softly defocused warm natural photographic background. Natural full-colour restored historical photo; remove all scan and halftone artifacts. Full head with breathing room, head-and-shoulders crop.

**Stage 2 character prompt**

> Subject: Giovanni Host Venturi. Preserve the colourized man's precise young adult face, short chestnut side-parted hair, curled moustache and pointed goatee, original slightly turned head and gaze, warm olive-peach skin, SAGE/OLIVE GREEN military uniform with only the collar/ribbon details already present. Face built from forceful broad fractured warm orange, coral and ochre planes against cyan, violet and green pigment shadows, no smooth photographic skin. FASCIST faction palette: RUST-BROWN (#8f4124) and BURNT ORANGE with dark charcoal structure, vivid FIERY ORANGE and COLD CYAN slashing thickly through the abstract background. Uniform remains olive-green but richly interrupted by teal, warm rust, orange, deep blue and burgundy impasto strokes; it must not become a monochrome black coat. Intelligent guarded gaze, intensity and emotional ambiguity, dynamic large brush marks and tactile canvas. Fully visible head with breathing room above, head and shoulders, exact 3:4.

Giuriati's locally misnamed `Portrait_Giuseppe_Giurati.jpg` is the verified [GiovanniGiurati.jpg](https://commons.wikimedia.org/wiki/File:GiovanniGiurati.jpg) reference. Its SHA-1 is `6efe643b57d2fa8f8210417710d3b821caf65354`; the final painting uses the corrected `Giovanni_Giuriati` filename.

## 2026-10-07：阴郁肩部肖像与有层次的派系背景（当前交付版）

本节覆盖前文七人版本中关于鲜艳背景撞色、宽松半身构图的要求。当前交付保留自然上色后的身份特征，参照凯勒、朱列蒂、邓南遮三张现有绘画，采用阴郁、颓废的大色块数字油画语言。

### 最终规则与验收

- 背景以派系主色统领，通过暗色底层、主色覆盖、灰化中间调、刮擦露底和断裂宽笔触形成层次。允许沉暗的中性色底层及邻近色变化；主要撞色发生在服装与背景之间。
- 背景采用不等大的明暗色块和不对称笔触节奏，局部轮廓融入暗部。避免平滑纯色、均匀渐变、重复纹理、放射光环和鲜亮多色飞溅。
- 面部保留关键结构、视线、发际线、胡须及时代配饰，压低高光；头发、胡须和服装以较大的绘画色面概括。
- 构图集中于头部、衣领和上部肩缘；Marinetti、De Ambris 的帽子完整入画。Grossich 保留撑颊手势。
- 七张最终 PNG 均已完整解码验证：RGB、1086×1448、严格 3:4；保存文件与所选生成原图的 SHA-256 一致。
- 本批只交付素材与提示词记录，不更新游戏人物引用。先前鲜艳版本保留在 `output/portraits/previous-colorful/`；前四张阴郁转绘底稿保留在 `output/portraits/muted-drafts/`。

### 当前配色

| 人物 | 背景主色与层次 | 服装对比色 |
|---|---|---|
| Léon Kochnitzky | 中性冷烟灰、石板灰、炭黑；露底与破碎竖向笔触 | 烟草棕、少量暗酒红 |
| Mario Carli | 阿迪蒂炭灰 `#4c4545`；烟灰交错斜向笔触与暗底 | 沉暗钢蓝、石油蓝 |
| Antonio Grossich | 中性暖土灰、褐灰、暗棕；沉缓覆盖层与刮擦间隙 | 暗苔绿、橄榄绿 |
| Filippo Tommaso Marinetti | 未来主义深紫 `#6a0a71`；灰紫破碎斜面与近黑梅紫 | 沉暗橄榄棕、少量暗酒红 |
| Giovanni Giuriati | 收复主义赭金 `#c29f13`；烟铜、焦褐暗底与刮擦露底 | 暗蓝绿围巾与肩缘 |
| Alceste De Ambris | 工团主义砖红 `#ab2b17`；酒红覆盖层与暗棕露底 | 暗苔绿、橄榄棕帽子 |
| Giovanni Host Venturi | 法西斯锈褐 `#8f4124`；烟棕斜向笔触与炭黑露底 | 冷青灰、橄榄灰军装肩缘 |

Kochnitzky 与 Grossich 仍采用中性色方案，不新增派系归属。Giuriati 的身份核验和正确拼写沿用前文记录。

### 参考与生成链

- 自然上色身份照片：`output/portraits/colorized/Portrait_*_Colorized.png`。
- 画风参考顺序：`output/portraits/style-references/Portrait_Guido_Keller_DiscoV2.png`、`Portrait_Giuseppe_Giulietti_DiscoV2.png`、`Portrait_Dannunzio_DiscoV2.png`。
- 前四张最终编辑：图 1 为同人的阴郁转绘底稿，图 2–4 为上述三个画风参考；保留人物后修正背景，Marinetti 同时修正帽子边界。
- 后三张最终转绘：图 1 为同人的自然上色照片，图 2–4 为上述三个画风参考。
- 完整逐次提示词、生成来源和校验值记录：`output/portraits/layered-portrait-prompts.json`。

### 后三张共用完整提示词前缀

```text
REQUIRED CANVAS: exactly 1086 pixels wide by 1448 pixels high, 3:4 portrait aspect ratio.

Use case: style-transfer. Repaint image 1, the already naturally COLOURIZED identity photograph, as a tightly framed, sombre Disco Elysium-inspired digital oil character portrait. Images 2, 3 and 4 are STYLE REFERENCES ONLY: the existing Keller, Giulietti and D'Annunzio painted portraits. Match their restrained, dark, introspective character-portrait language; never copy their identities. Preserve image 1's recognizable facial geometry, age, hairline, hair, facial hair, gaze angle, period clothing and characteristic accessories. Keep living, subtle local colour in the skin and clothes.
Art direction: D'Annunzian fin-de-siecle decadence and melancholy, the brooding earthy restraint of Peredvizhniki portrait painting, with Futurist fractured planes and the psychological gloom of Disco Elysium. Use a SMALL number of broad opaque digital-oil colour masses and assertive coarse brush strokes, selective impasto, broken contour and lost edges. SIMPLIFY DETAIL: grouped hair/beard shapes, large cheek/forehead planes, only the eyes and essential facial anchors sharply stated. No individual hair strands, pores, photographic skin, intricate fabric or highly detailed crusty paint relief. Subtle canvas texture.
BACKGROUND PAINTING — essential, not a flat fill: build a deliberately composed abstract painterly space within the assigned faction hue, like the Keller and D'Annunzio references. Use 3–5 UNEQUAL interlocking value masses: an exposed dark neutral underpainting, a muted midtone faction-colour body, and a few dusty lighter tonal patches. Layer broad irregular opaque brush passes, interrupted scumbled blocks, scraped-back marks that reveal the dark ground, and restrained dry-brush canvas gaps. Combine a few vertical architectonic traces with broken diagonal gestures; vary scale, edge hardness and opacity. Dark shapes merge into selected hair/shoulder edges, while quieter midtones separate the gaze-facing silhouette. Asymmetric rhythms and meaningful empty intervals, a brooding sense of depth and tension; no literal scenery or objects. Allow dim neutral earth/charcoal underlayers and closely related muted hue shifts, always with the faction colour clearly dominant. Never a smooth monochrome slab, airbrushed gradient, soft vignette, uniform texture wallpaper, radial halo, random bright multicolour splashes, or large near-white patches. Contrast colours belong primarily to the clothing. A few confident large shapes, not decorative detail.
COLOUR DESIGN: the BACKGROUND is one coherent, subdued assigned FACTION HUE, with strongly composed tonal layers and dark neutral underpainting. No bright complementary accents, rainbow marks or blue/orange slashes in the background. Put the restrained colour contrast in the SUBJECT'S CLOTHING against that background. Low to moderate saturation, dark middle tones, tiny dull off-white facial highlights. No neon, acid yellow, electric blue, fluorescent colours or large bright areas. Skin is muted warm flesh with subtle coloured shadows, never monochrome grey and never orange floodlighting.
COMPOSITION: very tight SHOULDERS-UP portrait, an enlarged complete head/hair/hat occupying most of the 3:4 canvas. Only the neck, collar and uppermost tips of the shoulders occupy the lowest approximately 10–15% of the frame. Bottom edge crops through the upper shoulders. No chest, torso, waist, full jacket front, pockets or half-body view. A small margin above complete hair/hat. EXACT 3:4 vertical canvas, target 1086 by 1448 pixels. No text, border, watermark, added figures or invented emblems.
```

### 1. Léon Kochnitzky

- 最终素材：`public/img/Portrait/Portrait_Leon_Kochnitzky_DiscoV2.png`。
- 已上色身份参考：`output/portraits/colorized/Portrait_Leon_Kochnitzky_Colorized.png`。
- 最终编辑输入：`output/portraits/muted-drafts/Portrait_Leon_Kochnitzky_DiscoV2.png`。

**最终背景与构图编辑提示词（完整）**

```text
REQUIRED OUTPUT: PNG canvas exactly 1086 by 1448 pixels, vertical 3:4.

Edit image 1, the selected Léon Kochnitzky painting. Preserve his exact recognizable face, leftward profile, age, silhouette, tall swept brown hair, warm tobacco-brown shoulder clothing and narrow wine tie; no identity change. Images 2–4 are style references only: Keller, Giulietti and D'Annunzio. Give the BACKGROUND the same strongly structured artistic paint layering as these references. BACKGROUND PAINTING — essential, not a flat fill: build a deliberately composed abstract painterly space within the assigned faction hue, like the Keller and D'Annunzio references. Use 3–5 UNEQUAL interlocking value masses: an exposed dark neutral underpainting, a muted midtone faction-colour body, and a few dusty lighter tonal patches. Layer broad irregular opaque brush passes, interrupted scumbled blocks, scraped-back marks that reveal the dark ground, and restrained dry-brush canvas gaps. Combine a few vertical architectonic traces with broken diagonal gestures; vary scale, edge hardness and opacity. Dark shapes merge into selected hair/shoulder edges, while quieter midtones separate the gaze-facing silhouette. Asymmetric rhythms and meaningful empty intervals, a brooding sense of depth and tension; no literal scenery or objects. Allow dim neutral earth/charcoal underlayers and closely related muted hue shifts, always with the faction colour clearly dominant. Never a smooth monochrome slab, airbrushed gradient, soft vignette, uniform texture wallpaper, radial halo, random bright multicolour splashes, or large near-white patches. Contrast colours belong primarily to the clothing. A few confident large shapes, not decorative detail.

Specific background palette: desaturated cool smoke-grey, slate-grey and charcoal. Establish a dark angular upper-right mass merging with hair, a quieter dusty slate midtone interval toward his leftward gaze, and a few incomplete lighter grey vertical/diagonal brushed shapes toward the outside edges. Midtones remain dim; no turquoise, magenta, white bands, literal walls or architectural objects. Visible uneven brush coverage and exposed dark ground, strongly asymmetric interlocking large shapes. Replace evenly mottled texture with bold broad scumbles and directional strokes. Keep a sombre decadent mood and low saturation, dim the brightest facial highlights slightly. Preserve shoulder-up crop and entire hair with small top margin. Simplified digital oil colour masses, essential facial anchors only; no individual hair strands, no detailed microtexture, no text, border or watermark.
```

### 2. Mario Carli

- 最终素材：`public/img/Portrait/Portrait_Mario_Carli_DiscoV2.png`。
- 已上色身份参考：`output/portraits/colorized/Portrait_Mario_Carli_Colorized.png`。
- 最终编辑输入：`output/portraits/muted-drafts/Portrait_Mario_Carli_DiscoV2.png`。

**最终背景与构图编辑提示词（完整）**

```text
REQUIRED OUTPUT: PNG canvas exactly 1086 by 1448 pixels, vertical 3:4.

Edit image 1, the selected Mario Carli painting, to improve the artistic BACKGROUND and simplify paint massing. Preserve exact recognizable youthful lean face, short chestnut hair, original tilted head, gaze and expression, muted dark petrol-blue shoulder clothing, collar and neckwear. Images 2–4 are style references only: Keller, Giulietti, D'Annunzio. BACKGROUND PAINTING — essential, not a flat fill: build a deliberately composed abstract painterly space within the assigned faction hue, like the Keller and D'Annunzio references. Use 3–5 UNEQUAL interlocking value masses: an exposed dark neutral underpainting, a muted midtone faction-colour body, and a few dusty lighter tonal patches. Layer broad irregular opaque brush passes, interrupted scumbled blocks, scraped-back marks that reveal the dark ground, and restrained dry-brush canvas gaps. Combine a few vertical architectonic traces with broken diagonal gestures; vary scale, edge hardness and opacity. Dark shapes merge into selected hair/shoulder edges, while quieter midtones separate the gaze-facing silhouette. Asymmetric rhythms and meaningful empty intervals, a brooding sense of depth and tension; no literal scenery or objects. Allow dim neutral earth/charcoal underlayers and closely related muted hue shifts, always with the faction colour clearly dominant. Never a smooth monochrome slab, airbrushed gradient, soft vignette, uniform texture wallpaper, radial halo, random bright multicolour splashes, or large near-white patches. Contrast colours belong primarily to the clothing. A few confident large shapes, not decorative detail.

Palette: ARDITI subdued CHARCOAL GREY (#4c4545), with smoke grey, dusty warm graphite and exposed near-black neutral underpaint. Make 3–5 bold intersecting, incomplete angular paint fields, asymmetric vertical graphite masses and a couple of low diagonal broad grey scumbles echoing the head tilt. Clearly visible value layering and dark scraped-back gaps. Lighter passages are dull mid-grey, never bright white. Different gesture pattern from a neat lattice or repeating rectangles. No saturated cobalt/vermilion marks. Keep the visual contrast in the muted deep steel/petrol-blue shoulder edges against the charcoal. Brooding muted warm flesh, soft dull highlights, a few broad cheek/forehead planes, selective eye/nose/mouth detail, grouped hair shapes; avoid uniform fine oil noise. Tight shoulders-up, complete head with a small upper margin, no chest/jacket front. No text, border or watermark.
```

### 3. Antonio Grossich

- 最终素材：`public/img/Portrait/Portrait_Antonio_Grossich_DiscoV2.png`。
- 已上色身份参考：`output/portraits/colorized/Portrait_Antonio_Grossich_Colorized.png`。
- 最终编辑输入：`output/portraits/muted-drafts/Portrait_Antonio_Grossich_DiscoV2.png`。

**最终背景与构图编辑提示词（完整）**

```text
REQUIRED OUTPUT: PNG canvas exactly 1086 by 1448 pixels, vertical 3:4.

Edit image 1, the selected Antonio Grossich digital oil painting. Preserve exact elderly face, eyes, bald crown, long ivory beard, supporting hand against cheek, posture and tight head/shoulder crop. Images 2–4 are style references only, Keller/Giulietti/D'Annunzio, for artistic background layering. BACKGROUND PAINTING — essential, not a flat fill: build a deliberately composed abstract painterly space within the assigned faction hue, like the Keller and D'Annunzio references. Use 3–5 UNEQUAL interlocking value masses: an exposed dark neutral underpainting, a muted midtone faction-colour body, and a few dusty lighter tonal patches. Layer broad irregular opaque brush passes, interrupted scumbled blocks, scraped-back marks that reveal the dark ground, and restrained dry-brush canvas gaps. Combine a few vertical architectonic traces with broken diagonal gestures; vary scale, edge hardness and opacity. Dark shapes merge into selected hair/shoulder edges, while quieter midtones separate the gaze-facing silhouette. Asymmetric rhythms and meaningful empty intervals, a brooding sense of depth and tension; no literal scenery or objects. Allow dim neutral earth/charcoal underlayers and closely related muted hue shifts, always with the faction colour clearly dominant. Never a smooth monochrome slab, airbrushed gradient, soft vignette, uniform texture wallpaper, radial halo, random bright multicolour splashes, or large near-white patches. Contrast colours belong primarily to the clothing. A few confident large shapes, not decorative detail.

NEUTRAL background palette: dark WARM EARTH-GREY, taupe and subdued umber. Warm-grey should be visible, not an all-brown flat fill. 3–5 large asymmetric worn taupe fields over a darker charcoal-umber ground, intermittent broad vertical dragging strokes and a few soft diagonal scraped passages. Slow and weighty gestures, quieter than the younger portraits; visible broken edges, overlaps and lost dark gaps. A dusty lighter taupe interval near the outer left upper edge separates the crown; darker right background merges with shoulder. No yellow/emerald patches, cream strips, rainbow or literal scenery. Preserve muted deep olive shoulder cloth as subdued subject/background colour contrast, and the long beard as roughly 6–8 broad dim ivory/grey colour masses. No individual hair strands, fine stippling or etched detail. Brooding quiet human weariness, dim warm beige/rose skin, selective eyes/nostril detail. Complete head with top breathing room, head and beard fill canvas, hand supported at cheek; no added body/chest/cuff. No text, border or watermark.
```

### 4. Filippo Tommaso Marinetti

- 最终素材：`public/img/Portrait/Portrait_Filippo_Tommaso_Marinetti_DiscoV2.png`。
- 已上色身份参考：`output/portraits/colorized/Portrait_Filippo_Tommaso_Marinetti_Colorized.png`。
- 最终编辑输入：`output/portraits/muted-drafts/Portrait_Filippo_Tommaso_Marinetti_DiscoV2.png`。

**最终背景与构图编辑提示词（完整）**

```text
REQUIRED OUTPUT: PNG canvas exactly 1086 by 1448 pixels, vertical 3:4.

Edit image 1, the selected Filippo Tommaso Marinetti portrait. Images 2–4 are Keller/Giulietti/D'Annunzio STYLE references only. Preserve exact broad mature face, furrowed brow and fierce eyes, moustache, fedora design/angle, period collar and bow tie. TWO essential corrections: (1) artistically layered sombre purple background; (2) the ENTIRE hat including crown and both brim tips must fit inside frame. Recompose the full head and hat slightly smaller, with about 4–5% canvas-height background above crown and small side margins around brim; NEVER crop top of hat. Keep shoulder-up portrait, cropped through upper shoulder line at bottom, no chest/jacket front. Only a SMALL dim burgundy bow-tie/collar glimpse at bottom, not the entire oversized bow tie. Do not pull back to half-body.

BACKGROUND PAINTING — essential, not a flat fill: build a deliberately composed abstract painterly space within the assigned faction hue, like the Keller and D'Annunzio references. Use 3–5 UNEQUAL interlocking value masses: an exposed dark neutral underpainting, a muted midtone faction-colour body, and a few dusty lighter tonal patches. Layer broad irregular opaque brush passes, interrupted scumbled blocks, scraped-back marks that reveal the dark ground, and restrained dry-brush canvas gaps. Combine a few vertical architectonic traces with broken diagonal gestures; vary scale, edge hardness and opacity. Dark shapes merge into selected hair/shoulder edges, while quieter midtones separate the gaze-facing silhouette. Asymmetric rhythms and meaningful empty intervals, a brooding sense of depth and tension; no literal scenery or objects. Allow dim neutral earth/charcoal underlayers and closely related muted hue shifts, always with the faction colour clearly dominant. Never a smooth monochrome slab, airbrushed gradient, soft vignette, uniform texture wallpaper, radial halo, random bright multicolour splashes, or large near-white patches. Contrast colours belong primarily to the clothing. A few confident large shapes, not decorative detail.

FUTURIST background: deep subdued AUBERGINE PURPLE (#6a0a71) dominant, with smoky grey-purple midtone shards and near-black plum underpainting. Use broad incomplete oblique angular planes intersected by a couple of dark vertical masses, scraped-back breaks and patches of dim exposed ground, unequal rhythm and quiet intervals; psychologically tense fractured space, no literal architecture or machinery. Background clearly layered and composed, not evenly brushed purple. No electric blue, acid yellow, luminous magenta or orange. SUBJECT contrast: dark muted OLIVE-BROWN hat and shoulder cloth against purple, subdued wine-red hatband and bow tie. Hat crown has dim earth-grey/olive massing, never golden bright. Skin warm muted beige and dusty rose/mauve shadows, REDUCE bright face highlights and simplify to broad forehead/cheek planes, group moustache and hair as simple shapes. Brooding decadent exhaustion and inward psychological tension, limited paint detail, no pores or individual hairs. No text, border, watermark or invented objects.
```

### 5. Giovanni Giuriati

- 最终素材：`public/img/Portrait/Portrait_Giovanni_Giuriati_DiscoV2.png`。
- 已上色身份参考：`output/portraits/colorized/Portrait_Giovanni_Giuriati_Colorized.png`。

**角色提示词（接在上方共用前缀之后，中间空一行）**

```text
Character: Giovanni Giuriati, using image 1's colourized face as the exact identity. Preserve high receding forehead, sparse dark side hair, large alert dark eyes, long nose, short moustache and pointed goatee, original three-quarter head angle and guarded gaze. Mature age and authentic facial proportions. BACKGROUND: IRREDENTIST muted aged OCHRE-GOLD (#c29f13), layered with smoked bronze, dull ochre-grey midtones and very dark burnt-umber/charcoal exposed ground. Make an asymmetric set of broad dragged vertical ochre passages crossed by just a few incomplete oblique scraped planes, as in D'Annunzio's reference. Tonal masses with unequal size, lost edges and shadow gaps; ochre must remain recognizably dominant, no green background strokes, no glowing yellow, near-white bands or literal objects. SUBJECT CLOTHING contrast: desaturated deep TEAL/BLUE-GREEN scarf and upper shoulder cloth against the ochre field; only a couple of subdued bone-coloured scarf markings, simplify all embroidery into a few blocks. Skin dim warm beige/dusty rose, mauve/olive coloured shadows, small dull highlights, no orange floodlighting. Face reduced to broad decisive oil patches, goatee and hair grouped dark masses with minimal hair detail. Close face portrait, chin near lower portion, enlarged whole head and tiny collar/top-shoulder corners only; forehead and hair complete with a small upper margin, no chest/jacket-front/scarf length below shoulders. Decadent restrained melancholy, introspective political calculation, dark large digital-oil colour masses.
```

### 6. Alceste De Ambris

- 最终素材：`public/img/Portrait/Portrait_Alceste_De_Ambris_DiscoV2.png`。
- 已上色身份参考：`output/portraits/colorized/Portrait_Alceste_De_Ambris_Colorized.png`。

**角色提示词（接在上方共用前缀之后，中间空一行）**

```text
Character: Alceste De Ambris, exact colourized photo identity. Preserve mature broad face, ROUND thin-rimmed glasses with single correctly seated lenses and clear visible eyes, thick dark curled moustache and full pointed beard, original asymmetric wide-brim slouch hat angle, slightly turned head and steady thoughtful gaze. BACKGROUND: SYNDICALIST deep subdued BRICK RED (#ab2b17), layered with dim wine-red, dusty red-brown and nearly black umber underpaint. Red remains dominant but broken into large unequal masses: broad ragged vertical red drags, a few interrupted horizontal/diagonal wine scumbles, scraped openings and exposed brown-black ground. Like Giulietti's background structure with brightness and saturation reduced; bold composed negative space and selective lost edges, no literal scenery, ultramarine/cream background streaks or vermilion glare. SUBJECT CONTRAST: dark subdued MOSS/OLIVE-GREEN shoulder cloth against red background, weathered olive/chocolate-brown hat, tiny dim bone collar and burgundy neckwear at bottom. Hat never has a luminous golden crown. Skin dim warm olive-beige/dusty rose with muted mauve shadows, eyes and glasses provide the essential sharp anchors. Simplify beard into a few large dark brown/grey planes, no individual hair strands, pores or intricate clothing. Dignified melancholy and intellectual fatigue, broad digital-oil massing and broken contours. MUST CHANGE COMPOSITION from source: zoom into a tight SHOULDERS-UP character icon. The COMPLETE hat crown and BOTH brim tips must remain in frame, small margin above/around hat; the face and hat occupy almost all the image, neck/collar and only uppermost shoulder tips at bottom. No chest, waistcoat, pockets, buttons, jacket-front, full tie or half-body. Head remains large despite including whole hat.
```

### 7. Giovanni Host Venturi

- 最终素材：`public/img/Portrait/Portrait_Giovanni_Host_Venturi_DiscoV2.png`。
- 已上色身份参考：`output/portraits/colorized/Portrait_Giovanni_Host_Venturi_Colorized.png`。

**角色提示词（接在上方共用前缀之后，中间空一行）**

```text
Character: Giovanni Host Venturi, exact colourized photo identity. Preserve precise adult facial geometry and age, short chestnut side-parted hair and hairline, curled moustache with upturned tips, small pointed goatee, original slightly turned head and off-centre gaze, period military collar cut. BACKGROUND: FASCIST subdued RUST-BROWN (#8f4124), built from smoky rust/earthy red-brown midtones, dusty warm brown planes and exposed dark charcoal-umber underpainting. Broad asymmetric dragging brushwork, 3–5 strongly composed unequal masses, a few worn vertical fragments interrupted by blunt diagonal knife swipes and scraped dark breaks. Clear layering and shadow depths, as painterly and strongly composed as Keller/D'Annunzio, but rust remains the dominant hue. No fluorescent orange, cyan accents in backdrop, smooth fill, gradient or literal objects. SUBJECT contrast: uniform's tiny upper shoulder/collar edges in desaturated deep TEAL-GREY / cool green-grey with olive notes, visibly cooler than the rust backdrop; faint dark khaki neckwear. Keep original collar stars only if they naturally remain within tight crop. Chest ribbons/pockets/buttons are OUTSIDE frame. Skin restrained warm flesh, dusty rose and subdued cool mauve/olive shadow planes, no orange spotlight and no greyscale skin. Broad angular cheek/forehead digital-oil masses, minimal selective facial anchor detail, grouped dark hair/moustache/goatee shapes without individual hairs. Guarded intelligence, emotional ambiguity, brooding decadent gloom. VERY TIGHT SHOULDERS-UP portrait with enlarged complete head, small upper margin, bottom frame cuts through uppermost shoulders; only a sliver of neck and military collar under chin, no chest or half-body. Broken painted silhouette and selective lost edges into background.
```




## 2026-10-07：四张新参考的数字绘画版本与资源清理（当前版本）

本节取代前文生成记录中有关当前文件名、使用版本及资源目录的说明。七位人物已根据本次四张新参考重新生成，使用内置 imagegen，先前的自然上色照片仍是唯一身份来源。画面采用更概括的明暗色面、局部深色轮廓、宽笔触与哑光数字绘画表现，减少浮雕油彩和密集细节。背景由派系主色、沉暗中间调和露底笔触形成层次，撞色主要出现在服装与背景之间。

### 资源规范与当前交付

- 启用目录：`public/img/Portrait/`，从 31 张整理为 15 张；8 张采用已有的迪斯科风格绘画，其余 7 张使用照片。
- 文件名格式：固定前缀 `Portrait_`，角色英文名以小写下划线分隔，扩展名统一为 `.png`，例如 `Portrait_giovanni_giuriati.png`。启用目录不保留版本后缀。
- 所有图片均为可完整解码的真实 PNG；照片转码保留原尺寸和解码像素。8 张启用绘画及本批七张输出均为 1086×1448，严格 3:4。
- 顾问、党派领袖、部长和外交界面的引用已同步到规范名称。Giuriati 现在使用其已核验身份照片转绘的独立肖像。
- 31 张清理前文件及原素材清单已按 SHA-256 校验备份至 `output/portraits/archive-before-cleanup/`。来源、旧版本和未启用照片已移出游戏资源目录。
- Kochnitzky、Marinetti 当前没有游戏入口，本批成品保存在 `output/portraits/current/`；其余五张本批成品已启用。
- Blasich 继续使用他与 Zanella 的双人历史照片，文件名保留两人姓名；本次未生成其单人肖像。
- 机器可读清单：`output/portraits/cleanup-report.json`。完整提示词、参考与生成来源：`output/portraits/current-portrait-prompts.json`。

### 本批七张成品

| 人物 | 成品路径 | 游戏启用 |
|---|---|---|
| Léon Kochnitzky | `output/portraits/current/Portrait_leon_kochnitzky.png` | 当前无游戏入口 |
| Mario Carli | `output/portraits/current/Portrait_mario_carli.png` | `public/img/Portrait/Portrait_mario_carli.png` |
| Antonio Grossich | `output/portraits/current/Portrait_antonio_grossich.png` | `public/img/Portrait/Portrait_antonio_grossich.png` |
| Filippo Tommaso Marinetti | `output/portraits/current/Portrait_filippo_tommaso_marinetti.png` | 当前无游戏入口 |
| Giovanni Giuriati | `output/portraits/current/Portrait_giovanni_giuriati.png` | `public/img/Portrait/Portrait_giovanni_giuriati.png` |
| Alceste De Ambris | `output/portraits/current/Portrait_alceste_de_ambris.png` | `public/img/Portrait/Portrait_alceste_de_ambris.png` |
| Giovanni Host Venturi | `output/portraits/current/Portrait_giovanni_host_venturi.png` | `public/img/Portrait/Portrait_giovanni_host_venturi.png` |

### 新画风参考

图 1 为对应人物已上色的身份照片；图 2–5 依次为以下画风参考，人物身份与现代服装不参与复制：

1. `output/portraits/new-style-references/Style_01_Angular_Portrait.png`
2. `output/portraits/new-style-references/Style_02_Broken_Colour_Planes.png`
3. `output/portraits/new-style-references/Style_03_Simplified_Masses.png`
4. `output/portraits/new-style-references/Style_04_Broad_Digital_Brushes.png`

### 当前共用提示词

```text
REQUIRED CANVAS: exactly 1086 pixels wide by 1448 pixels high, vertical 3:4.
Use case: style-transfer. Asset: a hand-painted RPG character portrait.
Inputs: image 1 is the already naturally colourized identity photograph. Images 2–5 are the user's NEW Disco Elysium style references ONLY. Keep image 1's identity, age, facial proportions, hairline, facial hair, original head direction and gaze, period clothing and accessories; do not copy reference faces or their modern outfits.
Primary request: redraw the person completely in the illustrated DIGITAL PAINTING language of images 2–5. Face and clothes built from a FEW broad opaque angular colour planes. Economical asymmetric brush marks, irregular dark contour accents, broken silhouettes and selectively lost edges. Group hair into bold sweeping shapes and beards into a few cohesive masses. Keep only eyes, nose and mouth sharply legible. Painterly simplification and emotional character, readable at small size. Dense colour coverage feels thickly painted, but the surface stays mostly FLAT and matte: no embossed physical paint, pores, tiny hairs, fine stippling, crosshatching or all-over texture. Match the planar modelling and expressive edges of images 2–3, with the simpler massing and broad brushes of images 4–5. No photorealistic rendering, oil-filtered photograph, glossy 3D or clean vector/cel shading.
Background: replace the photo backdrop with an artistic abstract space dominated by the assigned faction hue. Unequal overlapping colour/value fields, broad interrupted vertical/diagonal strokes, dry-brush gaps and exposed dark neutral ground. Layered and asymmetrical; quiet intervals around the face. Closely related muted tones and dark neutrals provide depth. No smooth plain fill, uniform gradient, busy multicolour collage or bright contrasting background slashes. Main subdued colour contrast is clothing against backdrop.
Mood/palette: brooding psychological tension, decadent melancholy, muted vintage colour. Warm dusty flesh with olive-grey, mauve or blue-grey shadow planes, dark middle tones and just a few SMALL bone-coloured highlights. Retain subtle local colour after colourization. Avoid large bright areas, neon and fluorescent accents.
Composition: tight SHOULDERS-UP icon. Complete head/hair/hat, small margin above and around it. Head dominates; only collar and top shoulder corners at bottom, no chest, waistcoat, jacket front, pockets or half-body. No text, frame, watermark, additional people, invented insignia or props.
```

### 1. Léon Kochnitzky：角色提示词

下列内容接在共用提示词之后，中间空一行。

```text
Subject: Léon Kochnitzky. Exact youthful long slim face, angular nose, high swept chestnut hair and left-facing profile/three-quarter gaze. Keep his age and profile silhouette; do not make him front-facing or grow a beard. NEUTRAL background, no assigned faction: subdued cool smoke-grey and slate-grey layered over charcoal, a few broad grey paint remnants and open dark gaps. Clothing contrast: muted tobacco/oxblood BROWN shoulder edges, shadowed cream collar and a tiny wine tie glimpse. Dim dusty rose/beige skin, cool olive-mauve shadows. Head enlarged, full tall hair visible with narrow top margin. Medal, hands and jacket front stay outside crop. Melancholy inward-looking poet; strong simple nose/cheek planes, bold grouped hair strokes.
```

### 2. Mario Carli：角色提示词

下列内容接在共用提示词之后，中间空一行。

```text
Subject: Mario Carli. Preserve exact youthful lean face, original short chestnut hair/hairline, tilted head, serious watchful eyes, angular nose and mouth; preserve natural eye size and age. Background: ARDITI CHARCOAL GREY (#4c4545), graphite, dusty warm-grey and near-black neutral ground, clearly layered broad incomplete grey planes and worn vertical/diagonal strokes. No blue or red slashes in background. Clothing: muted deep NAVY/PETROL BLUE at upper shoulder edges, small dim bone collar and wine-brown tie glimpse, original collar details only. Skin in dusty warm olive-beige and rose midtones with blue-grey/mauve shadows. Very simplified expressive angular painted face like references 2–3, broad cheek/forehead shapes, irregular dark eyebrow/eye contours, bold grouped hair, strong psychological weariness and restless intelligence. Enlarge head and crop through upper shoulder tips: no chest, pockets, full tie or jacket front. Complete short hair with small top margin. Flat opaque digital paint, no dense texture.
```

### 3. Antonio Grossich：角色提示词

下列内容接在共用提示词之后，中间空一行。

```text
Subject: Antonio Grossich. Preserve exact elderly broad balding head, heavy thoughtful eyes, age and wrinkles expressed by just a few important painted planes, long white moustache/beard and same hand supporting the same cheek. Keep the recognizable facial geometry; no rejuvenation. NEUTRAL background, no assigned faction: subdued warm earth-GREY / taupe, layered grey-brown midtones over dark umber/charcoal, broad worn patches and open shadow gaps, restrained slow abstract strokes. Clothing at shoulder corners: muted MOSS/OLIVE GREEN contrasting gently with warm grey. Beard built from approximately SIX large cohesive dim ivory, ash-grey and taupe shapes with broken edges, not individual strands or curls; match the economical massing of references 4–5. Skin pale dusty rose-beige and olive-mauve shadows, a few bone highlights only, no bright white beard. The hand has convincing simplified fingers/knuckles, original ring muted. Very tight shoulders-up portrait: whole bald crown and long beard fill almost all frame; supporting knuckles at cheek, forearm exits left edge, no cuff, chest or jacket front. Quiet weary authority and decadent melancholy. Flat matte digital paint with broad strokes, strongly stylized face while keeping identity.
```

**最终针对性修正提示词**（图 1 为该人物初次转绘结果；Grossich 还附同一组四张画风参考）

```text
REQUIRED CANVAS exactly 1086x1448, vertical 3:4. Image 1 is the selected Antonio Grossich portrait to refine; images 2–5 are the user's digital-painting style references only. Keep the exact face, identity, elderly age, bald crown, eyes, hand-on-cheek pose, ring, shoulder-up framing, muted warm-grey layered background and olive clothing. Change ONLY the rendering of beard, moustache and remaining side hair. REMOVE all individual hair strands, wiry curls, scratch lines and fine-line whisker outlines. Repaint beard/moustache as FIVE OR SIX LARGE FLAT OPAQUE ivory/ash-grey/taupe masses, strongly grouped and cohesive, as economically stylized as references 4–5. Preserve exact overall length and silhouette of the beard, with a few blunt broken brush edges instead of a fringe of thin curls. Side hair is one or two simple grey blocks. Broad matte digital brush marks only; no physical impasto, photographic strands or stippling. Leave face structure, facial planes and eyes intact. Subdued melancholy, no bright white beard, no text, border or watermark.
```

### 4. Filippo Tommaso Marinetti：角色提示词

下列内容接在共用提示词之后，中间空一行。

```text
Subject: Filippo Tommaso Marinetti. Preserve image 1's exact broad mature face, deeply furrowed brows, intense eyes, dark moustache, fedora design and angle, wine-red hatband and red bow tie, authentic age and period clothes. Background: FUTURIST DEEP PURPLE/AUBERGINE (#6a0a71), subdued plum and smoky grey-violet broad broken planes over near-black purple ground. A few asymmetric vertical strokes crossed by fractured oblique patches create expressive tension and layered painterly depth. Purple stays clearly dominant; no acid yellow, electric blue or multicolour backdrop. Clothing contrast: subdued dark OLIVE-BROWN shoulder cloth, weathered taupe/olive-brown hat crown and dark chocolate brim, small burgundy bow-tie glimpse. Keep hat and face highlights limited to small dull bone patches; no golden glaring crown. Skin dusty warm beige/rose with olive-grey and mauve shadows, forehead/brow/cheeks expressed through a few angular matte brush planes and irregular dark contours like style references 2–3. Theatrical inner exhaustion, sombre decadent intensity. IMPORTANT: reconstruct full hat above source's cropped crown. ENTIRE CROWN and BOTH BRIM TIPS inside canvas, 4–5% canvas-height background above crown, small side margins around brim. Tight shoulders-up icon, whole face and hat dominate, tiny collar/upper shoulder corners at bottom; no chest/jacket front/full shirt or oversized bow tie.
```

### 5. Giovanni Giuriati：角色提示词

下列内容接在共用提示词之后，中间空一行。

```text
Subject: Giovanni Giuriati, from the verified colourized identity photo. Preserve high receding forehead, sparse dark side hair, large alert eyes, long nose, short moustache and pointed goatee, original three-quarter head angle, mature age and reserved gaze. Background: IRREDENTIST aged OCHRE GOLD (#c29f13), subdued dirty ochre, smoked bronze and ochre-grey broad painted fields over dark burnt-umber/charcoal ground. Unequal abstract vertical passages, broken diagonal sweeps and exposed dark gaps, clearly layered. Ochre remains dominant; no emerald background marks, glowing yellow or ivory-white backdrop swathes. Clothing contrast: deep muted BLUE-GREEN/TEAL folded neck scarf and subdued olive shoulder tips, only a few dim bone-coloured scarf markings, simplify the decorative pattern into a couple of brush blocks. Face in subdued warm beige, dusty rose and cool olive-mauve shadow planes, calm yet psychologically tense. Moustache painted as one dark angular group and pointed beard as THREE simple brown/charcoal wedges with a few broad grey-brown planes; no hair-by-hair rendering. Match the new references' angular graphic face planes, selective dark edge accents and matte opaque brushwork. VERY TIGHT shoulders-up head icon, enlarged complete head with narrow top margin, collar and upper shoulder corners only, no torso, scarf length, jacket front or chest.
```

### 6. Alceste De Ambris：角色提示词

下列内容接在共用提示词之后，中间空一行。

```text
Subject: Alceste De Ambris. Preserve exact mature broad face, original thin-rimmed ROUND glasses with single CLEAR transparent lenses and visible eyes (not tinted sunglasses), thick dark curled moustache and full pointed beard, original asymmetric wide-brim slouch hat and slightly turned head/gaze. Authentic age, facial geometry and period collar. Background: SYNDICALIST subdued deep BRICK RED (#ab2b17), dusty wine-red and red-brown overlapping broad curved/oblique brush fields, a few blunt broken vertical fragments and exposed near-black umber ground. Expressive asymmetric rhythm with meaningful darker gaps, no regular repeating stripe pattern. Brick red dominant, no ultramarine/cream background slashes or luminous vermilion. Clothing contrast: muted deep MOSS/OLIVE GREEN shoulder cloth; hat weathered olive/chocolate-brown, small dim bone collar and burgundy tie glimpse. No glowing golden hat crown. Skin pale dusty olive-beige, rose and mauve-grey shadows. Beard is FOUR OR FIVE COHESIVE dark brown/grey brush masses with a few large strokes; avoid wiry individual curls and etched hairs. Clear irregular contour accents near glasses/eyes/nose, broad simple cheek and forehead planes as in new references, matte flat opaque digital painting. Thoughtful intellectual conviction and weary melancholy. Change source's half-body crop to a VERY TIGHT SHOULDERS-UP head icon: complete hat crown and both brim tips with small upper/side margin, head and hat fill almost all canvas, collar and tiny top shoulder corners only. No waistcoat, pockets, buttons, jacket front, chest or full tie.
```

**最终针对性修正提示词**（图 1 为该人物初次转绘结果；Grossich 还附同一组四张画风参考）

```text
Edit the supplied completed Alceste De Ambris portrait ONLY to correct the output canvas size. REQUIRED EXACT OUTPUT: width 1086 pixels, height 1448 pixels, exact 3:4 ratio. The input is 1087x1447, which is incorrect. Preserve exact facial proportions, identity, age, round clear glasses, curled moustache, beard, complete wide-brim hat, gaze angle, layered muted brick-red syndicalist backdrop, olive shoulder clothing, sombre planar matte digital-painting style and existing brushwork. Recompose the surrounding background imperceptibly to meet the exact required canvas without stretching or distorting the person. Complete hat with small upper/side margins, tight shoulders-up crop. No additions, text, border or watermark. EXACT FINAL CANVAS 1086 wide by 1448 high.
```

### 7. Giovanni Host Venturi：角色提示词

下列内容接在共用提示词之后，中间空一行。

```text
Subject: Giovanni Host Venturi. Preserve exact colourized face, authentic adult age, short chestnut side-parted hair and hairline, curled upturned moustache, pointed goatee, original slightly turned head and off-centre gaze, period military collar. Background: FASCIST muted RUST BROWN (#8f4124), smoky rusty earth tones and subdued brown-grey broad incomplete brush fields over dark charcoal/umber. Large unequal oblique shapes, broken dragged strokes, scraped dark gaps, quieter space near face; layered and artistic, rust clearly dominant, no bright orange/cyan background slashes. Clothing contrast: desaturated dark TEAL-GREY / cool green-grey military collar and shoulder tips, olive notes and dim khaki neckwear. Original collar stars only if within tight crop, no invented medals. Chest ribbons and pockets are outside frame. Face rendered with a few bold matte dusty beige/rose colour planes, cool olive-grey/mauve shadows and tiny bone highlights. Emphasize irregular drawn dark eye/brow/nose edges and angular painted cheek planes like new style references, psychologically guarded and melancholic. Group moustache and goatee into a few dark sweeping shapes with minimal broad marks, no individual hairs. Very tight shoulders-up icon, enlarged entire head with narrow top margin, neck and collar and upper shoulder corners only, no chest/jacket front or half-body. Selective lost silhouette edges in dark background.
```

