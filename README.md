# Kristena Bingham — UX/UI portfolio

Static site: plain HTML, CSS and JS with GSAP, ScrollTrigger, SplitText and Lenis bundled. No build step.

## Structure

```
index.html            Home: intro, selected work, approach, ice breaker, about, contact
followup.html         Case study: FollowUp
commute.html          Case study: Kingston Commute
rentscope.html        Case study: RentScope
ecommerce.html        Case study: E-commerce Platform
prototypes/followup/  FollowUp as a working web app, at /prototypes/followup (sample data)

assets/
  css/site.css        All styles
  js/site.js          Motion, page transitions, galleries, cursor
  js/icebreaker.js    Home page ice breaker: spot the three problems on a task board
  js/demos.js         Working sketches on the case study pages (one-line log, trip sort, fair-price check)
  js/vendor/          GSAP, ScrollTrigger, SplitText, Lenis (minified)
  images/
    followup/         cover, today, log, tasks, contact, mobile, phone
    commute/          flow, screen-1 … screen-6, plan, routes, details, live, favourites, settings
    rentscope/        explore, search, listing, compare (panels shown two per board)
    ecommerce/        cover (Home), browse (listing + product), checkout (cart, checkout, order placed)
```

Each case study's images live in its own folder under `assets/images/`. Not on the site yet: `followup/phone.jpg`.

The screens are built from the layered Figma designs (Inter throughout; the IsleMade hero uses Libre Caslon Text). Photos in RentScope and the IsleMade store are from Unsplash.

## Case study layout

Each case study opens with the hero, a status line (what's done, and why there's no live link) and a contents row. The rest is numbered chapters: the problem, who it's for, how it works, a screen-by-screen walkthrough with numbered markers on each screen, a small working sketch, key decisions, visual language, and status with what to test next.

Walkthrough markers are placed with `--x` and `--y` as percentages of the screen image, so they stay put at any width.

## Adding a case study

1. Copy one of the case study pages, e.g. `rentscope.html` to `newproject.html`.
2. Put its images in `assets/images/newproject/`.
3. Add it to the list under "Selected work" in `index.html`, and point the previous case study's "Next" link at it.

## Deploy

Vercel project `kristena-bingham` (Framework preset: Other). Pushing to `main` deploys to production; other branches get a preview link.

`vercel.json` turns on clean URLs, so `followup.html` is served at `/followup`. It also redirects the old image addresses (for example `/followup-today.jpg`) to their new folders, so links shared before the reorganisation keep working.
