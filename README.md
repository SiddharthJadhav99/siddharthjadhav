# siddharthjadhav.in

Plain HTML, CSS and JavaScript. No build step and no dependencies.

## Files

| Path | What it is |
| --- | --- |
| `index.html` | Home: hero, selected work with live demos, more work, approach, experience, contact |
| `work/project-spring.html` | Case study: AI agent for new-hire IT provisioning (Hershey) |
| `work/ngs-rsc.html` | Case study: offline-first field sales app (Hershey) |
| `work/compliance-events.html` | Case study: compliance event processing (TraceLink) |
| `styles.css` | All styling. Colors and fonts are tokens at the top |
| `main.js` | Theme, scroll effects, crosshair, and the three demos (agent workflow, offline queue, partitions) |
| `Siddharth-Jadhav-Resume.pdf` | Resume with the phone number removed |
| `404.html`, `_headers`, `robots.txt`, `sitemap.xml`, `favicon.svg` | Supporting files |

Links use clean URLs (`/work/ngs-rsc`). Cloudflare Pages serves `work/ngs-rsc.html` at that address automatically.

## Preview locally

```
npx serve .
```

`serve` supports clean URLs. Opening `index.html` directly works too, but the case study links need a server.

## Deploy on Cloudflare

1. Push this folder to a GitHub repo.
2. Cloudflare: Workers & Pages → Create → Pages → Connect to Git → pick the repo.
3. Framework preset: None. Build command: empty. Output directory: `/`.
4. Add the custom domains `siddharthjadhav.in` and `www.siddharthjadhav.in`.

## Editing

- **Text on case study pages:** edit the HTML in `work/` directly. Every metric marked `est.` is an estimate from the architecture, not a benchmark. Keep that label if you change the number.
- **Demo numbers:** the agent demo's calls and timings are in the `AGENT` object in `main.js`.
- **Email:** replace `siddharthjadhav3004@gmail.com` in all four HTML pages once `hi@siddharthjadhav.in` works.
- **Resume:** replace `Siddharth-Jadhav-Resume.pdf` with a newer copy. Keep your phone number out of the public file.
