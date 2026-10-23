# SIG-ILSP website

Website of the ISCA Special Interest Group on Indian Language Speech Processing (SIG-ILSP).
Served by GitHub Pages at `https://spinlabiitg.github.io/sig-ilsp/`.

Plain HTML, CSS and JavaScript. No build step: pages read their content from `data/*.json`.
Nothing here needs an AI assistant or special software to maintain: a browser and a GitHub account are enough.

## Who updates what

| Content | File | Updated by |
|---|---|---|
| Lectures | `data/lectures.json` | Maintainer, by hand. Dates as `YYYY-MM-DD`; add `recording_url` and `slides_url` after the talk. |
| Events | `data/events.json` | Maintainer, by hand (`start` as `YYYY-MM-DD` is used for sorting). |
| Datasets and resources | `data/resources.json` | **Automatic** from the resource form, after a maintainer approves. |
| Papers added by authors | `data/submitted_papers.json` | **Automatic** from the paper form, after a maintainer approves. |
| PhD theses | `data/theses.json` | **Automatic** from the thesis form, after a maintainer approves. |
| Research groups | `data/groups.json` | **Automatic** from the group form, after a maintainer approves. |
| People | `data/people.json` | **Automatic** from the directory form (add, update or remove), after a maintainer approves. |
| Institutions | `data/institutions.json` | Maintainer, by hand: standard name, `aliases` (other spellings), `city`, `lat`, `lng`. Every group and person must belong to an institution listed here. |
| District boundaries | `data/districts.geojson` | Fixed. LGD districts via INDIAN-SHAPEFILES (MIT), simplified. |
| Paper snapshot, Sep 2025 – Oct 2026 | `data/papers.json`, `data/meta.json` | Fixed. A one-time compilation; do not edit. |
| Voice clips on the home page | `voices/`, `data/voices.json` | Fixed. Real recordings from Vaani (CC-BY 4.0). |

You can edit any JSON file directly on github.com (open the file, click the pencil icon, commit).
Check that the file still has matching brackets and commas; a broken file stops that page from loading.

## Approving submissions

1. Someone fills in **Add a paper**, **Add a PhD thesis**, **Add a dataset or resource**, **Add your research group** or **Join the people directory** (Issues → New issue).
2. A maintainer reads the issue. To fix a typo or capitalisation, edit the issue directly (⋯ → Edit); the
   corrected text is what gets published, and GitHub keeps the original in the edit history.
   For people, open the profile link and check it is really theirs.
3. To approve, add the label **`accepted`**. A GitHub Action (`.github/workflows/accept-submission.yml`,
   a short Python script with no dependencies) adds the entry to the data file, commits it, comments on the issue and closes it.
   If the entry is incomplete or a duplicate, the bot says so and removes the label instead.
4. To remove an entry later, delete it from `data/submitted_papers.json`, `data/theses.json`, `data/resources.json`, `data/groups.json` or `data/people.json`.
   People can also remove themselves by submitting the directory form with "Remove my entry".

### When the bot says the institution is not listed

Groups and people must belong to an institution in `data/institutions.json`, so the map can place them.
- If it is a new spelling of a listed institution (e.g. "IITG"), add it to that institution's `aliases`.
- If it is a new institution, add an entry. For coordinates, right-click the campus in Google Maps or
  OpenStreetMap and copy the latitude and longitude. The map works out the district by itself.

Then remove and re-add the `accepted` label on the issue.

### Tidying done automatically

Institution names are replaced by their standard form. Topic and language tags reuse the spelling already
on the site when only the case differs (`asr` becomes `ASR` if `ASR` exists). Names are never re-capitalised
automatically; fix those by editing the issue before approving.

Only people with write access to the repository can add labels, so only maintainers can approve.

## One-time repository setup

- Create the labels `paper`, `thesis`, `resource`, `group`, `person` and `accepted` (Issues → Labels). The forms apply `paper`/`thesis`/`resource`/`group`/`person` automatically, but only if the labels exist.
- Settings → Actions → General → Workflow permissions: **Read and write**.
- Settings → Pages: deploy from the `main` branch, root folder.

## Preview locally

```bash
python -m http.server 8802
```

Then open http://localhost:8802/.

## Notes for maintainers

- All links are relative (`outcomes.html`, not `/sig-ilsp/outcomes.html`), so the site works unchanged if it moves to its own domain.
- After changing `assets/style.css` or `assets/site.js`, raise the `?v=` number on their links in every HTML page so browsers fetch the new version.
