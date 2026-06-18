# Tough Tech Map · Europe

An open, visual directory of European deep-tech infrastructure — labs, cleanrooms,
wet/dry labs, pilot lines, test beds, space launchpads and accelerator programs —
that startups and external teams can **access**. Modelled on Engine's _Tough Tech Map_,
rebuilt for Europe.

- **Interactive Leaflet map** with square markers coloured by resource type and clustering.
- **Faceted filter rail** (country, type, capability, access) with live counts per chip.
- **Spec-sheet result cards** + a slide-in detail drawer.
- **Public "Add a facility" form** that writes to a reviewed (`pending`) queue — nothing
  shows on the map until you approve it.
- **Demo mode**: with no Supabase keys, the app runs on a bundled 46-facility seed so the
  map always works.

Stack: React 18 + Vite 5 + TypeScript + Leaflet (react-leaflet + react-leaflet-cluster) + Supabase.

---

## 1. Run locally (demo mode — no backend)

```bash
npm install
npm run dev
```

Open http://localhost:5173. With no `.env.local`, you'll see the 46 seeded facilities.
The submission form shows a success toast but saves nothing.

> If `npm install` complains about peer dependencies, use
> `npm install --legacy-peer-deps`.

Other scripts: `npm run build` (production build to `dist/`), `npm run preview`
(serve the build), `npm run typecheck` (optional strict TypeScript check).

---

## 2. Connect Supabase

1. Create a free project at https://supabase.com (New project → pick a name + region,
   e.g. Frankfurt).
2. In the dashboard open **SQL Editor → New query**, paste the contents of
   [`supabase/schema.sql`](supabase/schema.sql), and **Run**.
3. New query again, paste [`supabase/seed.sql`](supabase/seed.sql), and **Run**.
   This loads the 46 facilities as `approved` (the seed temporarily disables the
   force-pending trigger).
4. Open **Project Settings → API** and copy **Project URL** and the **anon public** key.
5. In this folder, copy `.env.example` to `.env.local` and paste them:

   ```
   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...your-anon-public-key...
   ```

6. Restart `npm run dev`. The masthead badge flips from **Demo data** to **Live · Supabase**.

The anon key is safe to ship in a frontend: Row Level Security only exposes `approved`
rows, and inserts are forced to `pending`.

---

## 3. Deploy online

The app is a static SPA — build with `npm run build`, serve `dist/`.

**Vercel** — push this folder to a GitHub repo, "Import Project" in Vercel, framework
auto-detects as Vite. Add the two `VITE_SUPABASE_*` environment variables in
Project Settings → Environment Variables, then deploy. (`vercel.json` is included.)

**Netlify** — "Add new site → Import", build command `npm run build`, publish directory
`dist`. Add the two env vars under Site settings → Environment variables.
(`netlify.toml` is included.)

**Lovable** — create a project, connect this repo / paste the source, connect Supabase,
set the two env vars, and Publish.

**Custom domain** (e.g. `map.yourfund.vc`): add the domain in your host's dashboard and
create the CNAME record it shows you at your DNS provider.

---

## 4. Review submissions (the growth loop)

Public submissions land as `status = 'pending'` and stay hidden. To approve:

1. Supabase → **Table Editor → facilities**.
2. Filter `status = pending`, open a row, set `status` to `approved`, save.
3. Reload the site — it now appears on the map.

End-to-end test: submit a facility on the live site → confirm it's **not** on the map →
approve it in Supabase → reload → it appears.

---

## Project structure

```
tough-tech-map/
├─ index.html
├─ src/
│  ├─ App.tsx                  # state, layout, submission handler
│  ├─ main.tsx                 # entry; imports Leaflet CSS
│  ├─ index.css                # full design system (tokens, layout, components)
│  ├─ types.ts                 # Facility + filter types
│  ├─ data/seed.ts             # 46-facility bundled seed (auto-generated)
│  ├─ lib/
│  │  ├─ vocab.ts              # controlled vocab, colors, centroids, helpers
│  │  ├─ filter.ts             # filtering + live facet counts
│  │  └─ supabase.ts           # client (or null → demo), read/insert
│  ├─ hooks/useFacilities.ts   # load approved rows, fall back to seed
│  └─ components/
│     ├─ Masthead.tsx  FilterRail.tsx  MapView.tsx
│     ├─ ResultCard.tsx  DetailDrawer.tsx
│     ├─ AddFacilityModal.tsx  Toast.tsx
└─ supabase/
   ├─ schema.sql               # table, RLS, force-pending trigger
   └─ seed.sql                 # 46 approved rows
```

## Data & disclaimer

Listing data is community-maintained and directionally accurate. Verify access terms,
capabilities and equipment with each facility before relying on them.
