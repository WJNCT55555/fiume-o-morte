# Character portrait art direction

## Current source of truth

[`PORTRAIT_MASTER_PROMPT.md`](PORTRAIT_MASTER_PROMPT.md) is the sole active generation prompt for historical-character portraits. It defines input roles, identity preservation, structural abstraction, line and paint language, palette, framing, surface cleanliness and final checks.

Do not restore or fork the retired person-specific prompts. When a character needs special treatment, fill the optional variables in the master prompt and add one short request after it; do not create another permanent prompt file.

## Protected reference set

These approved images define the current visual target:

- `output/portraits/master-outputs/Portrait_alceste_de_ambris_v2.png` — primary calibration for likeness/abstraction balance
- `public/img/Portrait/Portrait_gabriele_d_annunzio.png`
- `public/img/Portrait/Portrait_mario_carli.png`
- `output/portraits/dannunzio-redraw/Portrait_gabriele_d_annunzio_study.png`
- `output/portraits/dannunzio-redraw/v5-references/image_2.png`
- `output/portraits/dannunzio-redraw/v5-references/image_3.png`
- `output/portraits/dannunzio-redraw/v5-references/image_4.png`
- `output/portraits/dannunzio-redraw/v5-references/image_5.png`

The two files under `public/img/Portrait/` are enabled game assets. Never replace them from older copies in `output/portraits/current/`. The De Ambris calibration portrait, study and v5 reference pack are ignored by Git and therefore require explicit protection during any `output/` cleanup.

## Visual standard

- Identity comes from head silhouette, facial proportions, feature placement, characteristic asymmetry, gaze, hair and facial-hair outline—not photographic skin detail.
- Stylisation must reconstruct the face from a small number of broad asymmetric light-and-shadow masses. Large brush marks alone are not sufficient.
- Eyes, nose, mouth and ears are simplified as aggressively as the cheeks and forehead. Preserve their identifying geometry without glossy or anatomical micro-rendering.
- Use irregular, pressure-varying near-black contours with deliberate breaks and lost edges. Do not outline every plane.
- Use opaque matte colour fields with quiet interiors. Texture is sparse, broad and subordinate to the value design.
- Dark and middle values dominate; highlights are few, dull and small.
- Backgrounds use one restrained main hue and three to five unequal broad fields. Avoid literal scenery, flags, halos and repeated stripes.
- Reject mottled small colour chips, confetti facets, all-over brush dabs, grain, noise, dust, scratches, canvas weave, pores, individual hair strands and crusty impasto.
- Default delivery is one opaque 1086 × 1448 PNG, vertical 3:4, tightly cropped to the complete head and upper shoulder corners.

At avatar size, viewers should recognise the person from silhouette, gaze, nose, facial hair or hairstyle and expression before noticing the brushwork.

## Generation workflow

1. Supply one historical photograph as Image 1. It is the sole identity and pose authority.
2. Supply four approved images from the protected set as Images 2–5. They are style references only.
3. Fill `[SUBJECT / DATE]`, `[BACKGROUND HUE]` and `[MOOD EMPHASIS]` in the master prompt when needed.
4. Generate a new drawing from scratch; never use an old portrait candidate as an edit base.
5. Review the result at full size and avatar size against the master prompt's ordered checklist.
6. Promote only an approved final into `public/img/Portrait/`; keep experimental output outside the active asset directory.

## Storage and recovery

- Active game portraits: `public/img/Portrait/`
- Protected ignored references: `output/portraits/dannunzio-redraw/`
- Historical sources and project archives: existing tracked folders under `output/portraits/`
- Current cleanup record: `output/portraits/cleanup-report.json`
- Recoverable archive of retired prompts and recent process images: `output/archives/portrait-cleanup-2026-10-20.zip`

The recovery archive contains the former art-direction history as `legacy/PORTRAIT_ART_DIRECTION.pre-consolidation.md`. It is local and ignored by Git.

## Code integration

An advisor portrait is declared by `Advisor.portrait` in `src/game/advisors/*.ts`, using a project-relative path such as `img/Portrait/Portrait_mario_carli.png`. UI layers should consume that field rather than maintain a second portrait mapping. If no verified portrait exists, use the existing initial-letter fallback instead of assigning another person's image.
