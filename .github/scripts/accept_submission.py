"""Add an accepted 'paper', 'thesis', 'resource', 'group' or 'person' issue-form submission to the site's data files.

Run by .github/workflows/accept-submission.yml when a maintainer adds the "accepted" label.
Reads the issue from the GitHub event file, writes data/submitted_papers.json or data/groups.json,
and writes a short message to $RESULT_FILE for the bot comment. Plain Python, no dependencies.

Institution names are matched against data/institutions.json (name or any alias, ignoring case and
punctuation) and stored in their standard form, so the People map can place every entry in a district.
Topic and language tags reuse the spelling already on the site when they differ only in case.

Local test:
    python .github/scripts/accept_submission.py path/to/event.json
"""
import json
import os
import re
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"
NO_RESPONSE = "_No response_"

PAPER_FIELDS = {"Title": "title", "Authors": "authors", "India-based institution(s)": "affiliations",
                "Venue": "venue", "Year and month": "date", "Link (DOI or paper page)": "link",
                "Theme": "theme", "Details": "details"}
GROUP_FIELDS = {"Group or lab name": "name", "Institution": "institution", "Group lead(s)": "lead",
                "Research topics": "topics", "Languages you work on": "languages", "Website": "website",
                "Sector": "sector"}
PERSON_FIELDS = {"Action": "action", "Full name": "name", "Role": "role", "Institution": "institution",
                 "Research group or lab (optional)": "group", "Research topics": "topics",
                 "Languages you work on (optional)": "languages", "Public profile link": "profile"}
THESIS_FIELDS = {"Thesis title": "title", "Author": "author", "Supervisor(s)": "supervisors",
                 "Institution": "institution", "Degree": "degree", "Year and month of defence or award": "date",
                 "Link (optional)": "link", "Theme": "theme", "Details": "details"}
RESOURCE_FIELDS = {"Name": "name", "Type": "type", "Short description": "description", "Languages": "languages",
                   "Size (optional)": "size", "Licence": "licence", "Access": "access", "Created by": "creators",
                   "Year released (optional)": "year", "Link": "link"}
OPTIONAL = {"details", "languages", "group", "link", "size", "year"}


class Rejected(Exception):
    pass


def parse_form(body):
    """Issue forms render as '### Label' headings, each followed by the answer."""
    out = {}
    for block in re.split(r"^### ", body or "", flags=re.M)[1:]:
        label, _, value = block.partition("\n")
        value = value.strip()
        out[label.strip()] = "" if value == NO_RESPONSE else value
    return out


def clean(text, limit=400):
    text = re.sub(r"\s+", " ", text or "").strip()
    if len(text) > limit:
        raise Rejected(f"A field is longer than {limit} characters.")
    return text


def url(text):
    text = clean(text, 500)
    if not re.match(r"^https://[^\s<>\"']+$", text):
        raise Rejected("Links must start with https:// and contain no spaces.")
    return text


def key(text):
    return re.sub(r"[^a-z0-9]", "", (text or "").lower())


def institution(text):
    """Standard institution name from data/institutions.json, or Rejected if it is not listed yet."""
    k = key(text)
    for inst in load(DATA / "institutions.json"):
        if k in {key(inst["name"]), *map(key, inst.get("aliases", []))}:
            return inst["name"]
    raise Rejected(f"The institution '{clean(text, 160)}' is not in data/institutions.json yet. Maintainer: add it "
                   "(name, aliases, city, lat, lng) or add this spelling as an alias of an existing institution.")


def tags(text, existing, names=False):
    """Split a comma list; reuse an existing tag's spelling when only the case differs.
    names=True (languages): a tag typed all in lower case gets capital initials ("bodo" -> "Bodo")."""
    known = {t.lower(): t for t in existing}
    out = []
    for t in clean(text).split(","):
        t = t.strip().strip(".")
        if names and t.islower():
            t = " ".join(w[:1].upper() + w[1:] for w in t.split())
        if t and known.get(t.lower(), t) not in out:
            out.append(known.get(t.lower(), t))
    return out


def existing_tags(field):
    return [t for path in ("groups.json", "people.json") for r in load(DATA / path) for t in r.get(field, [])]


def load(path):
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else []


def save(path, rows):
    path.write_text(json.dumps(rows, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")


def accept_paper(form, issue):
    f = {key: form.get(label, "") for label, key in PAPER_FIELDS.items()}
    missing = [label for label, k in PAPER_FIELDS.items() if k not in OPTIONAL and not f[k]]
    if missing:
        raise Rejected("Missing: " + ", ".join(missing))
    if not re.match(r"^\d{4}(-\d{2})?$", f["date"].strip()):
        raise Rejected("Year and month should look like 2026-09.")
    path = DATA / "submitted_papers.json"
    rows = load(path)
    link = url(f["link"])
    if any(r["link"].lower() == link.lower() for r in rows + load(DATA / "papers.json")):
        raise Rejected("This paper is already listed.")
    rows.append({
        "id": f"s{issue['number']}",
        "title": clean(f["title"]),
        "authors": clean(f["authors"], 1000),
        "affiliations": clean(f["affiliations"]),
        "institutions": [s.strip() for s in clean(f["affiliations"]).split(";") if s.strip()],
        "venue": clean(f["venue"], 120),
        "venue_type": "",
        "date": f["date"].strip(),
        "link": link,
        "indian_language": "[x]" in f["details"].lower(),
        "first_author_in_india": None,
        "theme": clean(f["theme"], 120),
        "source": "submitted",
        "issue": issue["number"],
        "added": date.today().isoformat(),
    })
    save(path, rows)
    return f"Added the paper **{clean(f['title'])}** to the Outcomes page."


def accept_thesis(form, issue):
    f = {key: form.get(label, "") for label, key in THESIS_FIELDS.items()}
    missing = [label for label, k in THESIS_FIELDS.items() if k not in OPTIONAL and not f[k]]
    if missing:
        raise Rejected("Missing: " + ", ".join(missing))
    if not re.match(r"^\d{4}(-\d{2})?$", f["date"].strip()):
        raise Rejected("Year and month should look like 2026-08.")
    path = DATA / "theses.json"
    rows = load(path)
    link = url(f["link"]) if f["link"] else ""
    title, author = clean(f["title"], 400), clean(f["author"], 120)
    if any(key(r["title"]) == key(title) and key(r["author"]) == key(author) for r in rows):
        raise Rejected("This thesis is already listed.")
    rows.append({
        "id": f"t{issue['number']}", "title": title, "author": author,
        "supervisors": clean(f["supervisors"], 300), "institution": institution(f["institution"]),
        "degree": clean(f["degree"], 40), "date": f["date"].strip(), "link": link,
        "theme": clean(f["theme"], 120), "indian_language": "[x]" in f["details"].lower(),
        "issue": issue["number"], "added": date.today().isoformat(),
    })
    rows.sort(key=lambda r: r["date"], reverse=True)
    save(path, rows)
    return f"Added the thesis **{title}** to the Outcomes and News pages."


def accept_resource(form, issue):
    f = {key: form.get(label, "") for label, key in RESOURCE_FIELDS.items()}
    missing = [label for label, k in RESOURCE_FIELDS.items() if (k not in OPTIONAL or k in ("languages", "link")) and not f[k]]
    if missing:
        raise Rejected("Missing: " + ", ".join(missing))
    if f["year"] and not re.match(r"^\d{4}$", f["year"].strip()):
        raise Rejected("Year released should look like 2025.")
    path = DATA / "resources.json"
    rows = load(path)
    link = url(f["link"])
    if any(r["link"].lower() == link.lower() for r in rows):
        raise Rejected("This resource is already listed.")
    rows.append({
        "name": clean(f["name"], 160), "type": clean(f["type"], 40), "description": clean(f["description"], 600),
        "languages": tags(f["languages"], [t for r in rows for t in r.get("languages", [])] + existing_tags("languages"), names=True),
        "size": clean(f["size"], 120), "licence": clean(f["licence"], 80), "access": clean(f["access"], 80),
        "creators": clean(f["creators"], 200), "year": f["year"].strip(), "link": link,
        "issue": issue["number"], "added": date.today().isoformat(),
    })
    rows.sort(key=lambda r: r["name"].lower())
    save(path, rows)
    return f"Added **{clean(f['name'], 160)}** to the Resources list on the Outcomes page."


def accept_group(form, issue):
    f = {key: form.get(label, "") for label, key in GROUP_FIELDS.items()}
    missing = [label for label, k in GROUP_FIELDS.items() if k not in OPTIONAL and not f[k]]
    if missing:
        raise Rejected("Missing: " + ", ".join(missing))
    path = DATA / "groups.json"
    rows = load(path)
    website = url(f["website"])
    if any(r["website"].lower() == website.lower() for r in rows):
        raise Rejected("A group with this website is already listed.")
    rows.append({
        "name": clean(f["name"], 160), "institution": institution(f["institution"]), "lead": clean(f["lead"], 200),
        "topics": tags(f["topics"], existing_tags("topics")), "languages": tags(f["languages"], existing_tags("languages"), names=True),
        "website": website,
        "sector": clean(f["sector"], 40), "issue": issue["number"], "added": date.today().isoformat(),
    })
    rows.sort(key=lambda r: r["name"].lower())
    save(path, rows)
    return f"Added **{clean(f['name'])}** to the People page."


def accept_person(form, issue):
    f = {key: form.get(label, "") for label, key in PERSON_FIELDS.items()}
    path = DATA / "people.json"
    rows = load(path)
    profile = url(f["profile"])
    same = [r for r in rows if r["profile"].lower() == profile.lower()]
    action = f["action"] or "Add me"
    if action == "Remove my entry":
        if not same:
            raise Rejected("No entry with this profile link was found.")
        save(path, [r for r in rows if r not in same])
        return f"Removed **{same[0]['name']}** from the People page."
    missing = [label for label, k in PERSON_FIELDS.items() if k not in OPTIONAL and not f[k]]
    if missing:
        raise Rejected("Missing: " + ", ".join(missing))
    if action == "Add me" and same:
        raise Rejected("Someone with this profile link is already listed. Choose 'Update my entry' to change it.")
    if action == "Update my entry" and not same:
        raise Rejected("No entry with this profile link was found. Choose 'Add me' instead.")
    entry = {
        "name": clean(f["name"], 120), "role": clean(f["role"], 60), "institution": institution(f["institution"]),
        "group": clean(f["group"], 160), "topics": tags(f["topics"], existing_tags("topics")),
        "languages": tags(f["languages"], existing_tags("languages"), names=True), "profile": profile,
        "issue": issue["number"], "added": same[0]["added"] if same else date.today().isoformat(),
    }
    rows = [r for r in rows if r not in same] + [entry]
    rows.sort(key=lambda r: r["name"].lower())
    save(path, rows)
    return f"{'Updated' if same else 'Added'} **{entry['name']}** on the People page."


def main():
    event = json.loads(Path(sys.argv[1] if len(sys.argv) > 1 else os.environ["GITHUB_EVENT_PATH"]).read_text(encoding="utf-8"))
    issue = event["issue"]
    labels = {l["name"] for l in issue.get("labels", [])}
    form = parse_form(issue.get("body"))
    try:
        if "paper" in labels:
            msg, ok = accept_paper(form, issue), True
        elif "thesis" in labels:
            msg, ok = accept_thesis(form, issue), True
        elif "resource" in labels:
            msg, ok = accept_resource(form, issue), True
        elif "group" in labels:
            msg, ok = accept_group(form, issue), True
        elif "person" in labels:
            msg, ok = accept_person(form, issue), True
        else:
            msg, ok = "This issue has no 'paper', 'thesis', 'resource', 'group' or 'person' label, so nothing was added.", False
    except Rejected as e:
        msg, ok = f"Could not add this submission: {e} Please edit the issue and re-apply the label.", False
    print(msg)
    result = os.environ.get("RESULT_FILE")
    if result:
        Path(result).write_text(json.dumps({"ok": ok, "message": msg}), encoding="utf-8")
    return 0


if __name__ == "__main__":
    sys.exit(main())
