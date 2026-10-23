# 历史人物极乐迪斯科风格头像：唯一母提示词

本文件是当前唯一活动提示词。输入任一历史人物照片时，按下列顺序提供图像：

1. `Image 1`：待重绘人物照片，唯一身份依据。
2. `Image 2`：`output/portraits/master-outputs/Portrait_alceste_de_ambris_v2.png`（首要平衡校准图）
3. `Image 3`：`public/img/Portrait/Portrait_gabriele_d_annunzio.png`
4. `Image 4`：`public/img/Portrait/Portrait_mario_carli.png`
5. `Image 5`：`output/portraits/dannunzio-redraw/v5-references/image_3.png`

`output/portraits/dannunzio-redraw/Portrait_gabriele_d_annunzio_study.png`、`output/portraits/dannunzio-redraw/v5-references/image_2.png`、`image_4.png`、`image_5.png` 是备用风格参考，不必每次全部输入。它们只能替换 Image 2–5 中的风格参考，不能替换身份照片。

使用前只需要填写三个可选变量；其余文字不要删改：

- `[SUBJECT / DATE]`：人物与年代，可留空。
- `[BACKGROUND HUE]`：背景主色，例如暗红、棕紫、烟灰蓝；留空时自动选择。
- `[MOOD EMPHASIS]`：额外神态要求；留空时采用阴郁、克制、疲惫而有意志的默认神态。

---

```text
Use case: style-transfer / historical-character portrait.

Create one sombre, psychologically expressive, Disco Elysium-inspired historical RPG portrait. Redraw the subject from scratch as a new illustration; do not apply a painterly filter, trace photographic pixels, or preserve photographic surface detail. Final output: one opaque PNG, exactly 1086 x 1448 pixels, vertical 3:4.

OPTIONAL PARAMETERS
Subject / date: [SUBJECT / DATE]
Dominant background hue: [BACKGROUND HUE; if blank, choose one restrained, period-appropriate hue that separates the silhouette]
Mood emphasis: [MOOD EMPHASIS; if blank, use brooding intelligence, restraint, fatigue and self-possession]

INPUT ROLES — NON-NEGOTIABLE
Image 1 is the SOLE authority for identity, age, ethnicity, cranial and facial proportions, characteristic asymmetry, head angle, gaze, expression, hairline, hairstyle, facial hair, period clothing and genuine accessories.

Images 2–5 are STYLE REFERENCES ONLY. Learn their irregular dark contour language, broad planar light-and-shadow design, simplified facial construction, restrained matte colour and selective lost edges. Never borrow or merge their people, face shapes, eyes, noses, moustaches, beards, hats, uniforms, insignia, skulls, symbols, background layouts or exact palettes. If a style reference conflicts with Image 1, Image 1 always wins.

Image 2 is the primary calibration reference for the BALANCE between likeness and abstraction: organic contour breaks, connected shadow design, readable gaze and background scale. It remains STYLE ONLY. Never transfer its hat, glasses, facial hair, face shape, pose or palette to the subject.

IDENTITY STUDY BEFORE DRAWING
Silently identify 6–10 immutable identity anchors in Image 1: complete head silhouette; forehead and hairline; eye spacing, tilt and lid weight; eyebrow arcs; nose bridge, length and tip; mouth width and lip line; cheek break; jaw and chin; ears; facial-hair outline; characteristic asymmetry; pose and gaze. Preserve their relationships. Recognition must come from silhouette, proportions, placement and expression rather than pores or realistic rendering.

Use this priority order whenever constraints compete: identity relationships > asymmetric value hierarchy > contour rhythm > surface texture and background gesture.

Keep the subject's real age, ethnicity and period character. Do not beautify, rejuvenate, masculinise, feminise, idealise or replace the person with a generic dramatic face. Preserve the source head direction, gaze and expression unless an explicit user instruction overrides them. When the source is monochrome, infer a restrained plausible palette without inventing biographical details. Do not reinterpret blur, film grain, damage or harsh exposure as anatomy.

CONTROLLED STRUCTURAL ABSTRACTION
This is not realism painted with large brushes. Reconstruct the face as an asymmetric design of a SMALL number of large interlocking value masses. Slightly exaggerate only the subject's two or three most recognisable traits while keeping their proportions and mutual placement intact.

The ranges below are soft upper guidance, not quotas and never a request for visibly countable polygons. Large masses should overlap, fuse and change edge character as a few connected organic value families. Preserve one broad quiet side and one more articulated side. Never impose a centred symmetrical mask, forehead diamond, mirrored cheek triangles or low-poly tessellation on the subject.

- Forehead and cranium: 2–4 broad quiet planes.
- Each cheek: 2–3 large continuous planes, with one dominant cheek shadow rather than many patches.
- Each eye: one dominant irregular dark socket fused into the eyebrow and upper-cheek shadow; within it, show at most one small broken low-contrast cool-grey sclera wedge and one pupil notch that partly disappears into the socket. Preserve Image 1's eye-slit width, tilt, lid weight, gaze direction and natural difference in opening; keep the two eyes unequal in height and edge clarity. No complete white almond, circular iris, catchlight, glossy eyeball, eyelashes or detailed sclera.
- Nose: 2–3 simple wedge-like planes; preserve its characteristic length, direction and tip, but reduce nostrils to blunt dark marks.
- Mouth: one decisive broken mouth line plus one restrained lower-lip or under-mouth plane. No individually modelled lips or teeth unless indispensable in Image 1.
- Each ear: 2–3 simple shapes.
- Hair: 3–5 cohesive silhouette masses, never individual strands.
- Moustache or beard: 2–4 cohesive graphic masses that preserve the exact source outline, separation and length, never borrowed from a style reference.

Simplify the eyes, nose, lips and ears as strongly as the cheeks and forehead. No facial region may dissolve into a mosaic. At thumbnail size, the identity anchors and expression must remain immediately legible.

Broad planes must dominate, but allow one or two irregular transitional turns only where they preserve identity at a nose wing, cheek break or mouth corner. Do not force every feature into a separate geometric tile.

LINE LANGUAGE
Use assertive charcoal-black or near-black hand-drawn contours with changing pressure, blunt turns, deliberate breaks and selective lost edges. Concentrate the strongest accents on the outer silhouette, brow, upper eyelids, one side of the nose, mouth, facial-hair boundary and collar. Do not uniformly outline every colour plane. Let selected contours disappear into the dominant shadow. The line must feel human, tense and economical—not smooth vector ink, comic inking or decorative crosshatching.

Contours are irregular painted masses, not a fixed-width ink system. Some edges are defined only by adjacent colour fields without black. Permit overshoot, doubled or slightly misregistered passes and abrupt thick-to-thin changes, but never turn every anatomical boundary into a straight black bar or a closed uniform outline.

PAINT AND VALUE LANGUAGE
Use broad opaque angular matte colour masses with hard or slightly torn painted edges. Shadows are intentionally designed shapes, not smooth gradients or collections of small strokes. Plane interiors are quiet and nearly flat. Permit only a few large blunt brush drags or sparse dry-edge interruptions at the silhouette and background. Do not use brush texture to simulate form that should be carried by the value shapes.

Organise the head into two or three CONNECTED value families rather than assigning a separate polygon to every feature. Let at least one dominant shadow travel continuously through brow, socket, temple and cheek—and through facial hair when naturally present—while other regions remain broad and quiet. Do not mirror the same construction on both sides of the face.

Use one clear directional value structure. Dark eye sockets, one dominant cheek shadow, a simplified nose wedge and a few lost edges provide psychological depth. Dark and middle values dominate. Highlights are sparse, dull and small—worn bone rather than pure white. Avoid uniform frontal lighting, rim-light spectacle, glossy highlights and maximum contrast everywhere.

COLOUR
Use a coherent, low-saturation vintage palette. Skin may combine dusty warm beige, subdued rose and restrained olive-grey, mauve-grey or blue-grey shadow planes. Clothing retains the simplified local colour visible in Image 1, with at most one muted contrasting accent. Never wash the whole portrait in one colour; preserve clear value separation between skin, hair, clothing and background.

Any clothing accent must remain darker, greyer and less attention-grabbing than the eyes, nose and facial-hair focal area.

The background is dominated by [BACKGROUND HUE] or, if unspecified, one automatically chosen subdued hue appropriate to the subject. Build it from 3–5 unequal, broad, interlocking value fields over charcoal or dark-earth underpainting, with a few large interrupted vertical or oblique strokes and meaningful quiet gaps. Keep background colours closely related. Use selective lost edges between the figure and background. No literal scenery, flag, halo, repeated stripes, wallpaper pattern or multicolour collage.

Make the background fields deliberately unequal in visual weight: one underpainting dominates, the secondary hue supports the silhouette, and at most one subordinate pale or brighter interruption cuts out a useful edge. Keep background saturation and its strongest contrast below the facial focal area. Never ring the head with equally forceful blocks or create mirrored bands, an X-shaped poster frame or radial rays.

COMPOSITION
Create an extremely tight shoulders-up portrait icon. The enlarged complete head, hair or hat occupies roughly 65–75% of the canvas, with a small but visible margin above and around it. Show only the neck, collar and uppermost shoulder corners in approximately the bottom 10–15%. Crop out the chest, jacket front, pockets, hands and unrelated props. Preserve characteristic period accessories actually visible in Image 1, simplify them into broad shapes, and invent no medals, insignia or decoration.

SURFACE CLEANLINESS — CRITICAL
The finished face must read as a few intentional shapes, never as a mosaic or distressed texture sample.

NO mottled tiny colour chips, patchwork facets, confetti shapes or clusters of short brush dabs.
NO all-over grunge, grain, film noise, dust, speckles, scratches, scan artefacts, paper fibres or visible canvas weave.
NO pores, individually rendered wrinkles, individual hair strands, stippling, crosshatching or etched detail.
NO embossed paint, crusty impasto, palette-knife relief, wet gloss or decorative paint splatter.
NO smooth airbrush gradients, photographic skin, oil-filtered photograph, polished 3D, low-poly crystal facets, vector finish, anime or clean cartoon rendering.

Any texture must be sparse, broad and subordinate to the large value design. Keep large colour fields clean and materially quiet while retaining slightly imperfect hand-painted edges. Clean does not mean digitally uniform or vector-flat: a large mass may contain one broad irregular internal shift or one dry drag, provided it does not fragment into repeated micro-variation.

MOOD AND FINAL CHECK
Aim for brooding psychological tension, decadent melancholy, restrained historical dignity and inner fatigue. Avoid heroic propaganda glamour, theatrical snarling or a smile unless Image 1 contains it.

Before finalising, verify in this order:
1. It is unmistakably the person in Image 1, not a face from the style references.
2. Head silhouette, gaze, facial-hair outline and the two or three most distinctive facial traits are intact.
3. Eyes, nose, mouth and ears are simplified, not realistically rendered.
4. The face is built from a small number of large coherent light-and-shadow masses.
5. Contours are irregular, selective and partly lost in shadow.
6. There are no tiny mottled patches, grain, noise or all-over brush texture.
7. The full head or hat fits inside the 3:4 frame and excess torso is absent.
8. The original eye direction and unequal opening remain alive; the eyes are not matching white slits or a generic angry mask.
9. The portrait contains no centred low-poly facial template, mechanical bilateral symmetry or equally forceful background blocks ringing the head.

One character only, full bleed. No text, lettering, UI, border, frame, watermark, logo, additional figure or copied symbol.
```

## 验收标准

成图缩小到头像尺寸后，应先读出人物的头部轮廓、视线、鼻形、胡须或发型和神态，再读到笔触。若第一眼只看到“厚涂”“碎色块”或某张风格参考中的人物，则未通过。
