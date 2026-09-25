# Gondrecourt-le-Château

The lower town, the Ornain and the château on the hill, rebuilt from open
data and rendered as a cel-shaded painted background. The rendering engine
(toon shading, screen-space ink, colour grade) comes from
[Sakura Crossing](https://github.com/Kenton-GMI/sakura-crossing) (MIT, see
`LICENSE-sakura-crossing`). The world itself is new.

```bash
npm install
npm run dev          # http://127.0.0.1:5178, then click "Entrer"
npm test             # geometry unit tests
```

| key | |
|---|---|
| `W A S D`, `Shift` | walk, run |
| `1`–`5` | jump to a reference view and overlay its photo |
| `F` | overlay opacity: off / half / full |
| `0` | leave the reference view |
| `C` / `Shift C` | show / copy the current camera pose (JSON) |
| `R` | back to the start (the bridge, facing Le Central) |
| `B` | ring the church bell (it also strikes the real hour by itself) |
| `O` / `G` | toggle ink / colour grade |

## Where every part comes from

Nothing about *where* or *how big* a building is was placed by hand.

| What | Source | Precision |
|---|---|---|
| Building footprints, eave height, ridge height, number of floors, wall and roof material | IGN **BD TOPO** (`BDTOPO_V3:batiment`, from the cadastre) | 1–3 m in plan, about 1 m in height |
| Ground shape (valley, upper-town plateau, river level) | IGN **RGE ALTI**, sampled every 4 m | about 0.5 m |
| Streets, bridges, river polygon, car parks, cemetery, names of shops | **OpenStreetMap** | varies, usually 1–5 m |
| Roof colour of each building; grass vs paved ground | IGN **BD ORTHO** colour and infrared aerial photos, 50 cm | per building / per 4 m cell |
| Every tree: position, height, crown width | IGN **LiDAR HD** height model (MNH), 50 cm, filtered by the infrared photo | about 1 m |
| Landmark details (signs, veranda, shutter colours) | Your Street View screenshots, listed per landmark in `data/landmarks.json` | by eye |
| Street furniture, balconies, hanging signs | `data/details.json`, each item marked `seen`, `type-seen`, `remembered` or `invented` | as marked |

Some things are rules, not data, and so can be wrong for one building:
- The ridge runs parallel to the nearest street (Lorraine row houses); away from streets it runs along the long side (`src/geo/orient.js`).
- Every roof is a plain gable. Hipped roofs, mansards and dormers do not exist yet.
- Wall render colour and shutter colour are picked from a palette, seeded by building id, so they never reshuffle between runs.
- Window bays are 3.2 m wide and one per floor, on every wall of a house.
- Tree species is not measured: a tree whose crown overhangs the Ornain is drawn as a willow, every other tree as a broadleaf.
- The river drifts in one direction (downstream, toward Abainville); it does not follow each bend.
- Ducks, birdsong and the river sound are atmosphere, not data. The bell is placed at the real church.

## How accuracy is maintained

1. **Geometry is regenerated, never edited.** `npm run fetch` downloads the
   three datasets into `data/raw/`; `npm run build:world` turns them into
   `data/world.json`. If IGN or OSM improves, run both again. Commit
   `data/raw/` so that every build can be reproduced.
2. **Landmarks are pinned to real footprints.** `data/landmarks.json` links
   each landmark to an OSM element (or a BD TOPO id when OSM is wrong, as
   for the tower). The build prints `UNMATCHED` if that link breaks.
   Each landmark lists the facts it must show and where they were checked.
3. **Reference views are the test.** `reference/views.json` stores the camera
   pose of each photo. Press its number and `F`: if an edge in the render and
   in the photo do not line up, the pose or the model is wrong. Tune the pose
   first (walk until the fixed things, like the bridge and the corners, line up,
   then `Shift C`, and paste into `views.json`), then fix the model. Set
   `approx` to `false` when the pose is tuned, and set `verified` in
   `landmarks.json` to `true` when the landmark matches.
4. **Photos stay local.** Street View images are Google's copyright.
   `reference/photos/` is git-ignored and is never in the build. Your own
   photos are better: you can publish them, and you know the date.

## Adding a place

1. Take 2–3 photos (or Street View captures) and put them in `reference/photos/`.
2. Add an entry in `reference/views.json` (a rough pose is fine) and in
   `data/landmarks.json` (the OSM element, with the facts it must show).
3. Add `src/world/landmarks/<id>.js` exporting `style` (to restyle the generic
   building) and `build()` (to add signs and details), and register it in
   `src/world/landmarks/index.js`.
4. `npm run build:world`, then check it with its reference view.

## Status

| Place | State |
|---|---|
| Le Central | From 3 user photos: hipped roof, white, teal shutters, shopfront and steps, both signs, tabac/Gold/PMU/FDJ bracket, glazed veranda and terrace on their own BD TOPO footprint over the river (awning, tables, black railing, posts), tricolour bunting, geranium lamp post. Where the veranda ends and the terrace starts is estimated. |
| Mairie | From a user photo: painted facade (HOTEL DE VILLE plaques, green frames, quoins), hipped roof, petunia boxes, wall lamps, walkable steps with the stepped-cube band. |
| Monument aux morts | At its OSM position: pillar, Cross of Lorraine, ball finial, poilu in horizon blue, lavender bed. |
| Église | From a Street View capture + LiDAR: bell tower at its measured position and height (spire 24.2 m), belfry openings, clock, slate spire, west front with portal, rose window, buttresses, lancet windows. The side aisles are not modelled separately. |
| Place de l'Hôtel de Ville | Shops (boulangerie *position chosen*, La Poste and Léna'turelle from OSM, boucherie and coiffure *invented*), parked cars, benches, planters, lamp posts. |
| Pharmacie de l'Ornain | Lettering, crosses, balconies. |
| Tour (château) | True cylinder from its footprint and heights. **Not checked against a photo.** |
| Everywhere | 2067 LiDAR trees, 594 roof colours from the orthophoto, geraniums on ~30 % of street windows (*invented*), water lilies on the Ornain (*remembered*), ducks, flowing water, river, bird and bell sounds. |
| Cars | Renault Twingo I, Clio II, Kangoo I; Peugeot 205, 206, 406; Citroën Saxo, Xsara Picasso: real dimensions, period colours, plastic bumpers, rubbing strips, hubcaps, old-format plates ending in 55. |
