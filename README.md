# siddharthjadhav.in

Note: case study wording was written from your resume. Read every card and its detail text, and adjust anything that isn't accurate or that your employer would consider confidential.

Personal site of Siddharth Jadhav. Plain HTML, CSS and JavaScript: no build step, no dependencies, no framework. It deploys anywhere and loads fast.

## What's inside

| File | What it is |
| --- | --- |
| `index.html` | Page structure and most text (hero, numbers, experience, skills, contact). |
| `main.js` | The **projects list** (top of the file), the live Kafka simulation, animations, case-study popup, timeline, theme toggle. |
| `styles.css` | All styling. Colors are at the top under `:root` (light) and the two dark blocks below it. |
| `favicon.svg`, `404.html`, `_headers`, `robots.txt`, `sitemap.xml` | Icon, not-found page, security headers, search engine files. |

## Preview locally

```
npx serve .
```

Then open the address it prints. Opening `index.html` directly also works.

## Deploy (Cloudflare)

1. Push this folder to a new GitHub repo:
   ```
   git init && git add . && git commit -m "New portfolio"
   git branch -M main
   git remote add origin https://github.com/SiddharthJadhav99/portfolio.git
   git push -u origin main
   ```
2. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → pick the repo.
3. Framework preset **None**, build command **empty**, output directory **/**. Deploy.
4. Check the `*.pages.dev` link.
5. In **DNS → Records**, delete old Netlify records (A record `75.2.60.5` or CNAME ending `netlify.app`).
6. In the project's **Custom domains**, add `siddharthjadhav.in` and `www.siddharthjadhav.in`.

Every `git push` after that redeploys within a minute.

## Editing

- **Projects:** edit the `projects` array at the top of `main.js`. Each one has a card (title, desc, big number) and a case study (problem, approach, outcome, stats). Set `featured: true` on the two you want shown large.
- **Before publishing, check the Hershey and TraceLink case studies** against your employer's rules on what you may share publicly. They only use figures from your resume, but you know best what's public.
- **Email:** replace `siddharthjadhav3004@gmail.com` in `index.html` (twice) with `hi@siddharthjadhav.in` once Cloudflare Email Routing is set up.
- **New job:** add it to the `career` list in `main.js` and as a new `<details class="role">` block in `index.html`.
- **Accent color:** change `--accent` in `styles.css` (light and dark values).
- **Link preview image:** add a 1200×630 `og.png` and `<meta property="og:image" content="https://siddharthjadhav.in/og.png">` in `<head>`.

Motion respects the visitor's "reduce motion" setting: animations are skipped and the simulation shows a still frame.
