# Kristena Bingham — UX/UI portfolio

Static site: plain HTML, CSS and JS with GSAP, ScrollTrigger, SplitText and Lenis bundled. No build step.

## Structure

```
index.html            Home: intro, selected work, approach, about, contact
followup.html         Case study: FollowUp
commute.html          Case study: Kingston Commute
rentscope.html        Case study: RentScope
ecommerce.html        Case study: E-commerce Platform

assets/
  css/site.css        All styles
  js/site.js          Motion, page transitions, galleries, cursor
  js/vendor/          GSAP, ScrollTrigger, SplitText, Lenis (minified)
  images/
    followup/         log, mobile, reports, today, phone
    commute/          flow, screen-1 … screen-5, fares, routes
    rentscope/        compare, explore, listing, report
```

Each case study's images live in its own folder under `assets/images/`. Not on the site yet: `commute/fares.jpg`, `commute/routes.jpg` and `followup/phone.jpg`.

## Adding a case study

1. Copy one of the case study pages, e.g. `rentscope.html` to `newproject.html`.
2. Put its images in `assets/images/newproject/`.
3. Add it to the list under "Selected work" in `index.html`. The case studies link to each other in a loop through their "Next" links (FollowUp, Commute, RentScope, E-commerce, back to FollowUp), so slot the new one in there.

## Deploy

Vercel project `kristena-bingham` (Framework preset: Other). Pushing to `main` deploys to production; other branches get a preview link.

`vercel.json` turns on clean URLs, so `followup.html` is served at `/followup`. It also redirects the old image addresses (for example `/followup-today.jpg`) to their new folders, so links shared before the reorganisation keep working.
