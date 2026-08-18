# Figure pose reference — start & end of every body part

> Auto-generated from `FIG_POSES` in `js/figure.js`. To change a pose, edit the angles there.
> (Snapshot — regenerate after editing poses; see "Regenerating" at the bottom.)

**How to read this:** each exercise animates between **f1 (start of the rep)** and **f2 (end)**. Angles use the figure convention — **down = 90°, right = 0°, up = 270°, left = 180°** — and the arrow is the rough direction the bone points. Position `(x, y)` is where that joint lands in the 50×60 drawing box (x: 0 = left … 50 = right; y: 0 = top … 57 ≈ floor). On a side view, **near** = the side facing you (drawn solid), **far** = the back side (drawn dim + thinner for depth). Knees clamp to a natural hinge range (side view: one direction; front view: either direction by magnitude, since left/right legs flex oppositely), so a joint can't fold the wrong way.

## Walk, run & farmer carry (procedural — no fixed frames)

`walk` and `run` are generated continuously by `_gaitPose()`, not by f1/f2: the hip swings on a cosine, the knee bends through the swing phase, the **stance knee gives at each foot-strike** (the landing), arms swing opposite the same-side leg, and the lowest foot is planted on the floor every frame. **Farmer Carry** reuses the walk gait with `carry=true` — the arms stop swinging and hang holding a kettlebell in each hand. Tune all three in `_gaitPose` / `gaitFigure`.

## standing — `standing`

- View: **side** · rep ≈ 2400 ms

| Body part | Start (f1): angle → pos | End (f2): angle → pos |
|---|---|---|
| pelvis (root) | (25, 34) | (25, 34) |
| torso → shoulder | 270° ↑U → (25, 17) | 270° ↑U → (25, 17) |
| head | 270° ↑U → (25, 10) | 270° ↑U → (25, 10) |
| near-arm upper | 90° ↓D → (25, 24) | 92° ↓D → (24.8, 24) |
| near-arm forearm | 90° ↓D → (25, 30) | 92° ↓D → (24.5, 30) |
| far-arm upper | 92° ↓D → (24.8, 24) | 90° ↓D → (25, 24) |
| far-arm forearm | 92° ↓D → (24.5, 30) | 90° ↓D → (25, 30) |
| near-leg thigh | 90° ↓D → (25, 45) | 88° ↓D → (25.4, 45) |
| near-leg shank | 90° ↓D → (25, 56) | 90° ↓D → (25.4, 56) |
| near-leg foot | 0° →R → (29, 56) | 0° →R → (29.4, 56) |
| far-leg thigh | 88° ↓D → (25.4, 45) | 90° ↓D → (25, 45) |
| far-leg shank | 90° ↓D → (25.4, 56) | 90° ↓D → (25, 56) |
| far-leg foot | 0° →R → (29.4, 56) | 0° →R → (29, 56) |

## Calf Raise — `calf_raise`

- View: **side** · rep ≈ 2400 ms · “feel-it-here” mark (pinned)

| Body part | Start (f1): angle → pos | End (f2): angle → pos |
|---|---|---|
| pelvis (root) | (25, 33) | (25, 30) |
| torso → shoulder | 270° ↑U → (25, 16) | 270° ↑U → (25, 13) |
| head | 270° ↑U → (25, 9) | 270° ↑U → (25, 6) |
| near-arm upper | 100° ↓D → (23.8, 22.9) | 100° ↓D → (23.8, 19.9) |
| near-arm forearm | 95° ↓D → (23.3, 28.9) | 95° ↓D → (23.3, 25.9) |
| far-arm upper | 100° ↓D → (23.8, 22.9) | 100° ↓D → (23.8, 19.9) |
| far-arm forearm | 95° ↓D → (23.3, 28.9) | 95° ↓D → (23.3, 25.9) |
| near-leg thigh | 90° ↓D → (25, 44) | 90° ↓D → (25, 41) |
| near-leg shank | 90° ↓D → (25, 55) | 90° ↓D → (25, 52) |
| near-leg foot | 2° →R → (29, 55.1) | 60° ↘DR → (27, 55.5) |
| far-leg thigh | 90° ↓D → (25, 44) | 90° ↓D → (25, 41) |
| far-leg shank | 90° ↓D → (25, 55) | 90° ↓D → (25, 52) |
| far-leg foot | 2° →R → (29, 55.1) | 60° ↘DR → (27, 55.5) |

## Towel Heel Raise — `pf_heel_raise`

- View: **side** · rep ≈ 2600 ms · single-leg (far leg tucked) · low step (bench prop) +
  towel-wedge prop under the near toes (behind), “feel-it-here” mark at the arch (pinned)

| Body part | Start (f1): angle → pos | End (f2): angle → pos |
|---|---|---|
| pelvis (root) | (28.53, 29.55) | (27.58, 22.56) |
| torso → shoulder | 270° ↑U → (28.53, 12.55) | 270° ↑U → (27.58, 5.56) |
| head | 270° ↑U → (28.53, 5.55) | 270° ↑U → (27.58, -1.44) |
| near-arm upper | 100° ↓D → (27.31, 19.44) | 100° ↓D → (26.36, 12.45) |
| near-arm forearm | 95° ↓D → (26.79, 25.42) | 95° ↓D → (25.84, 18.43) |
| far-arm upper | 100° ↓D → (27.31, 19.44) | 100° ↓D → (26.36, 12.45) |
| far-arm forearm | 95° ↓D → (26.79, 25.42) | 95° ↓D → (25.84, 18.43) |
| near-leg thigh | 90° ↓D → (28.53, 40.55) | 90° ↓D → (27.58, 33.56) |
| near-leg shank | 98° ↓D → (27, 51.44) | 93° ↓D → (27, 44.54) |
| near-leg foot | 300° ↗UR → (29, 47.98) | 60° ↘DR → (29, 48.01) |
| far-leg thigh | 40° ↘DR → (36.96, 36.62) | 40° ↘DR → (36.01, 29.63) |
| far-leg shank | 200° ←L → (26.62, 32.86) | 200° ←L → (25.67, 25.87) |
| far-leg foot | 0° →R → (30.62, 32.86) | 0° →R → (29.67, 25.87) |

The near (working) foot is pinned to almost the same spot in both frames (the ball of the
foot stays on the towel/step throughout the rep) — f1 drops the ankle/heel *below* the step
edge (dorsiflexed stretch, knee soft), f2 rises the ankle well *above* it (full plantarflexion
on the forefoot, knee slightly straighter). The far leg reuses `sl_calf_raise`'s tucked
config verbatim (constant across both frames). `frame: "16 24 23 34"` crops the thumbnail to
the working leg + step + towel; the torso/head fall outside it by design (lower-body focus).

## Glute Bridge — `glute_bridge`

- View: **side** · rep ≈ 2200 ms

| Body part | Start (f1): angle → pos | End (f2): angle → pos |
|---|---|---|
| pelvis (root) | (27, 47.9) | (27, 43) |
| torso → shoulder | 168° ←L → (10.4, 51.5) | 145° ↙DL → (13.1, 52.8) |
| head | 182° ←L → (3.4, 51.2) | 176° ←L → (6.1, 53.2) |
| near-arm upper | 16° →R → (17.1, 53.4) | 20° →R → (19.7, 55.1) |
| near-arm forearm | 2° →R → (23.1, 53.6) | 2° →R → (25.6, 55.4) |
| far-arm upper | 20° →R → (16.9, 53.9) | 24° ↘DR → (19.5, 55.6) |
| far-arm forearm | 4° →R → (22.9, 54.3) | 4° →R → (25.5, 56) |
| near-leg thigh | 350° →R → (37.8, 46) | 10° →R → (37.8, 44.9) |
| near-leg shank | 93° ↓D → (37.3, 57) | 90° ↓D → (37.8, 55.9) |
| near-leg foot | 0° →R → (41.3, 57) | 0° →R → (41.8, 55.9) |
| far-leg thigh | 346° →R → (37.7, 45.3) | 6° →R → (37.9, 44.1) |
| far-leg shank | 93° ↓D → (37.1, 56.2) | 90° ↓D → (37.9, 55.1) |
| far-leg foot | 0° →R → (41.1, 56.2) | 0° →R → (41.9, 55.1) |

## Calf Stretch — `calf_stretch`

- View: **side** · rep ≈ 2400 ms · solid wall, prop behind, “feel-it-here” mark (pinned)

| Body part | Start (f1): angle → pos | End (f2): angle → pos |
|---|---|---|
| pelvis (root) | (22, 34) | (22, 34) |
| torso → shoulder | 300° ↗UR → (30.5, 19.3) | 300° ↗UR → (30.5, 19.3) |
| head | 300° ↗UR → (34, 13.2) | 300° ↗UR → (34, 13.2) |
| near-arm upper | 8° →R → (37.4, 20.3) | 8° →R → (37.4, 20.3) |
| near-arm forearm | 2° →R → (43.4, 20.5) | 2° →R → (43.4, 20.5) |
| far-arm upper | 12° →R → (37.3, 20.7) | 12° →R → (37.3, 20.7) |
| far-arm forearm | 4° →R → (43.3, 21.2) | 4° →R → (43.3, 21.2) |
| near-leg thigh | 70° ↓D → (25.8, 44.3) | 70° ↓D → (25.8, 44.3) |
| near-leg shank | 90° ↓D → (25.8, 55.3) | 90° ↓D → (25.8, 55.3) |
| near-leg foot | 2° →R → (29.8, 55.5) | 2° →R → (29.8, 55.5) |
| far-leg thigh | 122° ↙DL → (16.2, 43.3) | 122° ↙DL → (16.2, 43.3) |
| far-leg shank | 130° ↙DL → (9.1, 51.8) | 118° ↙DL → (11, 53) |
| far-leg foot | 6° →R → (13.1, 52.2) | 12° →R → (14.9, 53.9) |

## Single-Arm DB Row — `db_row`

- View: **side** · rep ≈ 1700 ms · prop behind, weight/prop in front

| Body part | Start (f1): angle → pos | End (f2): angle → pos |
|---|---|---|
| pelvis (root) | (15, 33) | (15, 33) |
| torso → shoulder | 6° →R → (31.9, 34.8) | 6° →R → (31.9, 34.8) |
| head | 6° →R → (38.9, 35.5) | 6° →R → (38.9, 35.5) |
| near-arm upper | 82° ↓D → (32.9, 41.7) | 250° ↑U → (29.5, 28.2) |
| near-arm forearm | 98° ↓D → (32, 47.7) | 108° ↓D → (27.7, 33.9) |
| far-arm upper | 90° ↓D → (31.9, 41.8) | 90° ↓D → (31.9, 41.8) |
| far-arm forearm | 90° ↓D → (31.9, 47.8) | 90° ↓D → (31.9, 47.8) |
| near-leg thigh | 100° ↓D → (13.1, 43.8) | 100° ↓D → (13.1, 43.8) |
| near-leg shank | 90° ↓D → (12.3, 54.8) | 90° ↓D → (12.3, 54.8) |
| near-leg foot | 4° →R → (16.3, 55.1) | 4° →R → (16.3, 55.1) |
| far-leg thigh | 96° ↓D → (13.9, 43.9) | 96° ↓D → (13.9, 43.9) |
| far-leg shank | 90° ↓D → (13.9, 54.9) | 90° ↓D → (13.9, 54.9) |
| far-leg foot | 4° →R → (17.8, 55.2) | 4° →R → (17.8, 55.2) |

## Single-Leg Stance — `sl_stance`

- View: **side** · rep ≈ 2400 ms

| Body part | Start (f1): angle → pos | End (f2): angle → pos |
|---|---|---|
| pelvis (root) | (25, 34) | (25, 33) |
| torso → shoulder | 271° ↑U → (25.3, 17) | 270° ↑U → (25, 16) |
| head | 271° ↑U → (25.4, 10) | 270° ↑U → (25, 9) |
| near-arm upper | 98° ↓D → (24.3, 23.9) | 100° ↓D → (23.8, 22.9) |
| near-arm forearm | 62° ↘DR → (27.1, 29.2) | 60° ↘DR → (26.8, 28.1) |
| far-arm upper | 108° ↓D → (23.1, 23.7) | 110° ↓D → (22.6, 22.6) |
| far-arm forearm | 57° ↘DR → (26.4, 28.7) | 55° ↘DR → (26, 27.5) |
| near-leg thigh | 90° ↓D → (25, 45) | 90° ↓D → (25, 44) |
| near-leg shank | 90° ↓D → (25, 56) | 90° ↓D → (25, 55) |
| near-leg foot | 5° →R → (29, 56.3) | 5° →R → (29, 55.3) |
| far-leg thigh | 345° →R → (35.6, 31.2) | 340° →R → (35.3, 29.2) |
| far-leg shank | 98° ↓D → (34.1, 42) | 95° ↓D → (34.4, 40.2) |
| far-leg foot | 0° →R → (38.1, 42) | 0° →R → (38.4, 40.2) |

## Single-Leg Mini-Squat — `sl_squat`

- View: **side** · rep ≈ 2400 ms

| Body part | Start (f1): angle → pos | End (f2): angle → pos |
|---|---|---|
| pelvis (root) | (25, 33) | (25, 35.4) |
| torso → shoulder | 272° ↑U → (25.6, 16) | 276° ↑U → (26.8, 18.4) |
| head | 272° ↑U → (25.8, 9) | 276° ↑U → (27.5, 11.5) |
| near-arm upper | 95° ↓D → (25, 23) | 82° ↓D → (27.8, 25.4) |
| near-arm forearm | 92° ↓D → (24.8, 29) | 88° ↓D → (28, 31.4) |
| far-arm upper | 98° ↓D → (24.6, 22.9) | 85° ↓D → (27.4, 25.4) |
| far-arm forearm | 92° ↓D → (24.4, 28.9) | 88° ↓D → (27.6, 31.4) |
| near-leg thigh | 90° ↓D → (25, 44) | 72° ↓D → (28.4, 45.8) |
| near-leg shank | 90° ↓D → (25, 55) | 100° ↓D → (26.5, 56.7) |
| near-leg foot | 5° →R → (29, 55.3) | 5° →R → (30.5, 57) |
| far-leg thigh | 118° ↙DL → (19.8, 42.7) | 120° ↙DL → (19.5, 44.9) |
| far-leg shank | 150° ↙DL → (10.3, 48.2) | 150° ↙DL → (10, 50.4) |
| far-leg foot | 20° →R → (14.1, 49.6) | 20° →R → (13.7, 51.8) |

## Single-Leg Hop — `sl_hop`

- View: **front (head-on)** · rep ≈ 850 ms

| Body part | Start (f1): angle → pos | End (f2): angle → pos |
|---|---|---|
| pelvis (root) | (25, 35.1) | (25, 32) |
| torso → shoulder | 266° ↑U → (23.8, 18.1) | 270° ↑U → (25, 15) |
| head | 266° ↑U → (23.3, 11.2) | 270° ↑U → (25, 8) |
| left-arm upper | 148° ↙DL → (13.4, 21.8) | 134° ↙DL → (15.6, 20) |
| left-arm forearm | 160° ←L → (7.7, 23.9) | 140° ↙DL → (11, 23.9) |
| right-arm upper | 32° ↘DR → (34.3, 21.8) | 46° ↘DR → (34.4, 20) |
| right-arm forearm | 20° →R → (39.9, 23.9) | 40° ↘DR → (39, 23.9) |
| left-leg thigh | 93° ↓D → (20.9, 46.1) | 90° ↓D → (21.5, 43) |
| left-leg shank | 97° ↓D → (19.6, 57) | 90° ↓D → (21.5, 54) |
| right-leg thigh | 80° ↓D → (30.4, 45.9) | 83° ↓D → (29.8, 42.9) |
| right-leg shank | 300° ↗UR → (35.9, 36.4) | 296° ↗UR → (34.7, 33) |

## Side-Lying Hip Abduction — `hip_abd`

- View: **side** · rep ≈ 2400 ms · “feel-it-here” mark (pinned)

| Body part | Start (f1): angle → pos | End (f2): angle → pos |
|---|---|---|
| pelvis (root) | (33, 52) | (33, 52) |
| torso → shoulder | 178° ←L → (16, 52.6) | 178° ←L → (16, 52.6) |
| head | 178° ←L → (9, 52.8) | 178° ←L → (9, 52.8) |
| near-arm upper | 200° ←L → (9.4, 50.2) | 200° ←L → (9.4, 50.2) |
| near-arm forearm | 210° ↖UL → (4.2, 47.2) | 210° ↖UL → (4.2, 47.2) |
| far-arm upper | 185° ←L → (9, 52) | 185° ←L → (9, 52) |
| far-arm forearm | 185° ←L → (3.1, 51.5) | 185° ←L → (3.1, 51.5) |
| near-leg thigh | 6° →R → (43.9, 53.1) | 315° ↗UR → (40.8, 44.2) |
| near-leg shank | 6° →R → (54.9, 54.3) | 315° ↗UR → (48.6, 36.4) |
| near-leg foot | 30° ↘DR → (58.3, 56.3) | 300° ↗UR → (50.6, 33) |
| far-leg thigh | 5° →R → (44, 53) | 5° →R → (44, 53) |
| far-leg shank | 5° →R → (54.9, 53.9) | 5° →R → (54.9, 53.9) |
| far-leg foot | 30° ↘DR → (58.4, 55.9) | 30° ↘DR → (58.4, 55.9) |

## Lateral Band Walk — `band_walk`

- View: **front (head-on)** · rep ≈ 2400 ms · prop behind, “feel-it-here” mark (pinned)

| Body part | Start (f1): angle → pos | End (f2): angle → pos |
|---|---|---|
| pelvis (root) | (25, 35.2) | (25, 35.3) |
| torso → shoulder | 269° ↑U → (24.7, 18.2) | 269° ↑U → (24.7, 18.4) |
| head | 269° ↑U → (24.6, 11.2) | 269° ↑U → (24.6, 11.4) |
| left-arm upper | 100° ↓D → (19, 25.1) | 100° ↓D → (19, 25.2) |
| left-arm forearm | 90° ↓D → (19, 31.1) | 90° ↓D → (19, 31.2) |
| right-arm upper | 80° ↓D → (30.4, 25.1) | 80° ↓D → (30.4, 25.2) |
| right-arm forearm | 90° ↓D → (30.4, 31.1) | 90° ↓D → (30.4, 31.2) |
| left-leg thigh | 100° ↓D → (18.6, 46.1) | 114° ↙DL → (16, 45.4) |
| left-leg shank | 84° ↓D → (19.7, 57) | 80° ↓D → (17.9, 56.2) |
| right-leg thigh | 80° ↓D → (31.4, 46.1) | 78° ↓D → (31.8, 46.1) |
| right-leg shank | 96° ↓D → (30.3, 57) | 98° ↓D → (30.3, 57) |

## Single-Leg Calf Raise — `sl_calf_raise`

- View: **side** · rep ≈ 2400 ms · solid wall, prop behind, “feel-it-here” mark (pinned)

| Body part | Start (f1): angle → pos | End (f2): angle → pos |
|---|---|---|
| pelvis (root) | (25, 33) | (25, 30) |
| torso → shoulder | 270° ↑U → (25, 16) | 270° ↑U → (25, 13) |
| head | 270° ↑U → (25, 9) | 270° ↑U → (25, 6) |
| near-arm upper | 15° →R → (31.8, 17.8) | 15° →R → (31.8, 14.8) |
| near-arm forearm | 8° →R → (37.7, 18.6) | 8° →R → (37.7, 15.6) |
| far-arm upper | 40° ↘DR → (30.4, 20.5) | 40° ↘DR → (30.4, 17.5) |
| far-arm forearm | 200° ←L → (24.7, 18.4) | 200° ←L → (24.7, 15.4) |
| near-leg thigh | 90° ↓D → (25, 44) | 90° ↓D → (25, 41) |
| near-leg shank | 90° ↓D → (25, 55) | 90° ↓D → (25, 52) |
| near-leg foot | 2° →R → (29, 55.1) | 60° ↘DR → (27, 55.5) |
| far-leg thigh | 40° ↘DR → (33.4, 40.1) | 40° ↘DR → (33.4, 37.1) |
| far-leg shank | 200° ←L → (23.1, 36.3) | 200° ←L → (23.1, 33.3) |
| far-leg foot | 0° →R → (27.1, 36.3) | 0° →R → (27.1, 33.3) |

## Goblet Squat — `goblet_sq`

- View: **front (head-on)** · rep ≈ 2400 ms · weight/prop in front

| Body part | Start (f1): angle → pos | End (f2): angle → pos |
|---|---|---|
| pelvis (root) | (25, 33) | (25, 38.5) |
| torso → shoulder | 270° ↑U → (25, 16) | 271° ↑U → (25.3, 21.5) |
| head | 270° ↑U → (25, 9) | 271° ↑U → (25.4, 14.5) |
| left-arm upper | 84° ↓D → (21.2, 23) | 86° ↓D → (21.3, 28.4) |
| left-arm forearm | 89° ↓D → (21.3, 29) | 90° ↓D → (21.3, 34.4) |
| right-arm upper | 96° ↓D → (28.8, 23) | 94° ↓D → (29.3, 28.4) |
| right-arm forearm | 91° ↓D → (28.7, 29) | 90° ↓D → (29.3, 34.4) |
| left-leg thigh | 92° ↓D → (20.6, 44) | 120° ↙DL → (15.5, 48) |
| left-leg shank | 90° ↓D → (20.6, 55) | 55° ↘DR → (21.8, 57) |
| right-leg thigh | 88° ↓D → (29.4, 44) | 60° ↘DR → (34.5, 48) |
| right-leg shank | 90° ↓D → (29.4, 55) | 125° ↙DL → (28.2, 57) |

## Pushup — `pushup`

- View: **side** · rep ≈ 2400 ms

| Body part | Start (f1): angle → pos | End (f2): angle → pos |
|---|---|---|
| pelvis (root) | (27, 41.8) | (27, 45.5) |
| torso → shoulder | 8° →R → (43.8, 44.1) | 8° →R → (43.8, 47.9) |
| head | 8° →R → (50.8, 45.1) | 8° →R → (50.8, 48.8) |
| near-arm upper | 100° ↓D → (42.6, 51) | 150° ↙DL → (37.8, 51.4) |
| near-arm forearm | 95° ↓D → (42.1, 57) | 70° ↓D → (39.8, 57) |
| far-arm upper | 100° ↓D → (42.6, 51) | 150° ↙DL → (37.8, 51.4) |
| far-arm forearm | 95° ↓D → (42.1, 57) | 70° ↓D → (39.8, 57) |
| near-leg thigh | 170° ←L → (16.2, 43.7) | 170° ←L → (16.2, 47.4) |
| near-leg shank | 170° ←L → (5.3, 45.6) | 170° ←L → (5.3, 49.3) |
| near-leg foot | 90° ↓D → (5.3, 49.6) | 90° ↓D → (5.3, 53.3) |
| far-leg thigh | 170° ←L → (16.2, 43.7) | 170° ←L → (16.2, 47.4) |
| far-leg shank | 170° ←L → (5.3, 45.6) | 170° ←L → (5.3, 49.3) |
| far-leg foot | 90° ↓D → (5.3, 49.6) | 90° ↓D → (5.3, 53.3) |

## Plank Hold — `plank`

- View: **side** · rep ≈ 2400 ms

| Body part | Start (f1): angle → pos | End (f2): angle → pos |
|---|---|---|
| pelvis (root) | (26, 45.9) | (26, 45.9) |
| torso → shoulder | 12° →R → (42.6, 49.5) | 12° →R → (42.6, 49.5) |
| head | 12° →R → (49.5, 50.9) | 12° →R → (49.5, 50.9) |
| near-arm upper | 95° ↓D → (42, 56.5) | 95° ↓D → (42, 56.5) |
| near-arm forearm | 180° ←L → (36, 56.5) | 180° ←L → (36, 56.5) |
| far-arm upper | 92° ↓D → (42.4, 56.5) | 92° ↓D → (42.4, 56.5) |
| far-arm forearm | 180° ←L → (36.4, 56.5) | 180° ←L → (36.4, 56.5) |
| near-leg thigh | 162° ←L → (15.5, 49.3) | 162° ←L → (15.5, 49.3) |
| near-leg shank | 162° ←L → (5.1, 52.7) | 162° ←L → (5.1, 52.7) |
| near-leg foot | 120° ↙DL → (3.1, 56.2) | 120° ↙DL → (3.1, 56.2) |
| far-leg thigh | 160° ←L → (15.7, 49.7) | 160° ←L → (15.7, 49.7) |
| far-leg shank | 160° ←L → (5.3, 53.5) | 160° ←L → (5.3, 53.5) |
| far-leg foot | 118° ↙DL → (3.4, 57) | 118° ↙DL → (3.4, 57) |

## Romanian Deadlift, DB — `rdl`

- View: **side** · rep ≈ 2400 ms · weight/prop in front, “feel-it-here” mark (pinned)

| Body part | Start (f1): angle → pos | End (f2): angle → pos |
|---|---|---|
| pelvis (root) | (25, 33) | (22, 35.1) |
| torso → shoulder | 270° ↑U → (25, 16) | 20° →R → (38, 40.9) |
| head | 270° ↑U → (25, 9) | 12° →R → (44.8, 42.4) |
| near-arm upper | 92° ↓D → (24.8, 23) | 90° ↓D → (38, 47.9) |
| near-arm forearm | 90° ↓D → (24.8, 29) | 90° ↓D → (38, 53.9) |
| far-arm upper | 88° ↓D → (25.2, 23) | 90° ↓D → (38, 47.9) |
| far-arm forearm | 90° ↓D → (25.2, 29) | 90° ↓D → (38, 53.9) |
| near-leg thigh | 90° ↓D → (25, 44) | 85° ↓D → (23, 46) |
| near-leg shank | 90° ↓D → (25, 55) | 95° ↓D → (22, 57) |
| near-leg foot | 5° →R → (29, 55.3) | 0° →R → (26, 57) |
| far-leg thigh | 90° ↓D → (25, 44) | 83° ↓D → (23.3, 46) |
| far-leg shank | 90° ↓D → (25, 55) | 95° ↓D → (22.4, 57) |
| far-leg foot | 5° →R → (29, 55.3) | 0° →R → (26.4, 57) |

## Overhead Press, DB — `oh_press`

- View: **side** · rep ≈ 2400 ms · weight/prop in front

| Body part | Start (f1): angle → pos | End (f2): angle → pos |
|---|---|---|
| pelvis (root) | (25, 34.7) | (25, 34.7) |
| torso → shoulder | 270° ↑U → (25, 17.7) | 270° ↑U → (25, 17.7) |
| head | 270° ↑U → (25, 10.7) | 270° ↑U → (25, 10.7) |
| near-arm upper | 60° ↘DR → (28.5, 23.7) | 274° ↑U → (25.5, 10.7) |
| near-arm forearm | 300° ↗UR → (31.5, 18.5) | 272° ↑U → (25.7, 4.7) |
| far-arm upper | 64° ↘DR → (28.1, 23.9) | 270° ↑U → (25, 10.7) |
| far-arm forearm | 304° ↗UR → (31.4, 19) | 268° ↑U → (24.8, 4.7) |
| near-leg thigh | 90° ↓D → (25, 45.7) | 90° ↓D → (25, 45.7) |
| near-leg shank | 90° ↓D → (25, 56.7) | 90° ↓D → (25, 56.7) |
| near-leg foot | 5° →R → (29, 57) | 5° →R → (29, 57) |
| far-leg thigh | 90° ↓D → (25, 45.7) | 90° ↓D → (25, 45.7) |
| far-leg shank | 90° ↓D → (25, 56.7) | 90° ↓D → (25, 56.7) |
| far-leg foot | 5° →R → (29, 57) | 5° →R → (29, 57) |

## Bulgarian Split Squat — `split_sq`

- View: **side** · rep ≈ 2400 ms · prop behind

| Body part | Start (f1): angle → pos | End (f2): angle → pos |
|---|---|---|
| pelvis (root) | (26, 35.1) | (25, 36.4) |
| torso → shoulder | 278° ↑U → (28.4, 18.3) | 280° ↑U → (28, 19.7) |
| head | 278° ↑U → (29.3, 11.3) | 280° ↑U → (29.2, 12.8) |
| near-arm upper | 100° ↓D → (27.2, 25.1) | 104° ↓D → (26.3, 26.5) |
| near-arm forearm | 120° ↙DL → (24.2, 30.3) | 128° ↙DL → (22.6, 31.2) |
| far-arm upper | 104° ↓D → (26.7, 25) | 108° ↓D → (25.8, 26.4) |
| far-arm forearm | 124° ↙DL → (23.3, 30) | 132° ↙DL → (21.8, 30.8) |
| near-leg thigh | 86° ↓D → (26.8, 46.1) | 64° ↘DR → (29.8, 46.3) |
| near-leg shank | 96° ↓D → (25.6, 57) | 104° ↓D → (27.2, 57) |
| near-leg foot | 0° →R → (29.6, 57) | 0° →R → (31.2, 57) |
| far-leg thigh | 140° ↙DL → (17.6, 42.2) | 150° ↙DL → (15.5, 41.9) |
| far-leg shank | 208° ↖UL → (7.9, 37) | 205° ↖UL → (5.5, 37.3) |
| far-leg foot | 6° →R → (11.8, 37.4) | 2° →R → (9.5, 37.4) |

## Dead Bug — `dead_bug`

- View: **side** · rep ≈ 2400 ms

| Body part | Start (f1): angle → pos | End (f2): angle → pos |
|---|---|---|
| pelvis (root) | (30, 53.5) | (30, 53.5) |
| torso → shoulder | 180° ←L → (13, 53.5) | 180° ←L → (13, 53.5) |
| head | 180° ←L → (6, 53.5) | 180° ←L → (6, 53.5) |
| near-arm upper | 270° ↑U → (13, 46.5) | 185° ←L → (6, 52.9) |
| near-arm forearm | 270° ↑U → (13, 40.5) | 182° ←L → (0, 52.7) |
| far-arm upper | 270° ↑U → (13, 46.5) | 270° ↑U → (13, 46.5) |
| far-arm forearm | 270° ↑U → (13, 40.5) | 270° ↑U → (13, 40.5) |
| near-leg thigh | 270° ↑U → (30, 42.5) | 270° ↑U → (30, 42.5) |
| near-leg shank | 0° →R → (41, 42.5) | 0° →R → (41, 42.5) |
| near-leg foot | 0° →R → (45, 42.5) | 0° →R → (45, 42.5) |
| far-leg thigh | 270° ↑U → (30, 42.5) | 10° →R → (40.8, 55.4) |
| far-leg shank | 0° →R → (41, 42.5) | 5° →R → (51.8, 56.4) |
| far-leg foot | 0° →R → (45, 42.5) | 0° →R → (55.8, 56.4) |

## Kettlebell Swing — `kb_swing`

- View: **side** · rep ≈ 2200 ms · weight/prop in front

| Body part | Start (f1): angle → pos | End (f2): angle → pos |
|---|---|---|
| pelvis (root) | (26, 34.9) | (25, 33) |
| torso → shoulder | 305° ↗UR → (35.8, 20.9) | 270° ↑U → (25, 16) |
| head | 312° ↗UR → (40.4, 15.7) | 270° ↑U → (25, 9) |
| near-arm upper | 112° ↓D → (33.1, 27.4) | 357° →R → (32, 15.6) |
| near-arm forearm | 114° ↙DL → (30.7, 32.9) | 357° →R → (38, 15.3) |
| far-arm upper | 108° ↓D → (33.6, 27.6) | 353° →R → (31.9, 15.1) |
| far-arm forearm | 110° ↓D → (31.5, 33.2) | 353° →R → (37.9, 14.4) |
| near-leg thigh | 98° ↓D → (24.5, 45.7) | 90° ↓D → (25, 44) |
| near-leg shank | 100° ↓D → (22.6, 56.6) | 90° ↓D → (25, 55) |
| near-leg foot | 4° →R → (26.5, 56.9) | 5° →R → (29, 55.3) |
| far-leg thigh | 94° ↓D → (25.2, 45.8) | 90° ↓D → (25, 44) |
| far-leg shank | 98° ↓D → (23.7, 56.7) | 90° ↓D → (25, 55) |
| far-leg foot | 4° →R → (27.7, 57) | 5° →R → (29, 55.3) |

---

## Regenerating this file

This is a snapshot decoded from `FIG_POSES`. After editing a pose, regenerate it by serving the app and running the generator in the browser console, then paste the output back here. The authoritative data is always the `f1`/`f2` angle arrays in `js/figure.js`.

### Known "off-canvas" reaches to watch (tweak candidates)
A few extended limbs resolve past the 50-wide box and get clipped at the edge:
- **Side-Lying Hip Abduction** — the working leg's foot reaches x ≈ 58 (start) / shank x ≈ 55.
- **Dead Bug** — the extended (far) leg reaches x ≈ 56 at full extension.
- **Pushup** — head reaches x ≈ 51 at the top.
- **Bulgarian Split Squat** — rear foot sits at y ≈ 37 while the bench top is y = 40, so the foot floats ~3 above the bench.
