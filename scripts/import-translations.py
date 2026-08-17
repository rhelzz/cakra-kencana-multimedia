#!/usr/bin/env python3
"""
Import the English and Mandarin service copy from content-drafts/ into Joomla.

    python scripts/import-translations.py            # dry run, changes nothing
    python scripts/import-translations.py --apply
    python scripts/import-translations.py --apply --lang en

indonesian.md is the spine, and there are two different pairings — the difference matters:

  · indonesian.md -> Joomla is matched by TITLE. The API returns articles in its own order,
    so pairing by position here silently attaches translations to the wrong article. That
    is not hypothetical: it happened, and the guard below caught it.
  · indonesian.md -> english.md / mandarin.md is matched by POSITION, because their headings
    are translated and there is nothing else left to match on. That only holds while the
    files stay structurally identical, which check_structure() refuses to proceed without.

Re-running is safe: an article whose target alias already exists is PATCHed, not created
again. Alias is the identity here, the same way the frontend's pickTranslations() treats it.

Two Joomla quirks are worked around with direct SQL, both documented in CLAUDE.md §8:

  1. Articles created through the API get no row in #__workflow_associations, so they are
     excluded from the join every GET /content/articles does and become invisible — not
     unpublished, invisible.
  2. `com_fields` in the POST/PATCH body silently stops writing custom field values in this
     environment, which would leave every sub-service without its parent-service link and
     therefore attached to no service at all.

Both are verified after writing rather than assumed, because the failure mode of each is
silent. Nothing here deletes: the worst case is an article that needs editing in the admin.
"""

from __future__ import annotations

import argparse
import json
import pathlib
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
DRAFTS = ROOT / "content-drafts"
ENV = ROOT / "frontend" / ".env.local"

DB = "joomla_db"
PREFIX = "n213k_"
FIELD_PARENT_SERVICE = 4
WORKFLOW_STAGE = 1

CAT_SERVICES = 10
CAT_SUB_SERVICES = 15

# Draft file, Joomla language tag, alias suffix. Indonesian is the spine and is never written.
LANGS = {
    "en": ("english.md", "en-GB"),
    "zh": ("mandarin.md", "zh-CN"),
}

BASE_ALIAS = re.compile(r"-(id|en|zh)$")


def article_id_of(resource: dict) -> int:
    """JSON:API returns the resource id as a *string* while attributes.id is an int, and MySQL
    hands back ints. Everything is normalised here so lookups can never silently miss."""
    return int(resource["id"])


# --------------------------------------------------------------------------- drafts


def parse_draft(path: pathlib.Path) -> list[dict]:
    """The SERVICES section only: ## is a service, ### a sub-service, body is the next line."""
    lines = path.read_text(encoding="utf-8").split("\n")
    in_services = False
    services: list[dict] = []

    for i, line in enumerate(lines):
        if line.startswith("# "):
            in_services = line.strip() == "# SERVICES"
            continue
        if not in_services:
            continue

        body = lines[i + 1].strip() if i + 1 < len(lines) else ""
        if body.startswith(("#", "<!--")):
            body = ""

        if line.startswith("### "):
            if not services:
                sys.exit(f"{path.name}: '### {line[4:].strip()}' appears before any '##'")
            services[-1]["subs"].append({"title": line[4:].strip(), "body": body})
        elif line.startswith("## "):
            services.append({"title": line[3:].strip(), "body": body, "subs": []})

    return services


def check_structure(drafts: dict[str, list[dict]]) -> None:
    """Positional matching is only safe while the files line up. Refuse to guess."""
    spine = drafts["id"]
    problems: list[str] = []

    for code, services in drafts.items():
        if code == "id":
            continue
        if len(services) != len(spine):
            problems.append(f"{code}: {len(services)} services, indonesian.md has {len(spine)}")
            continue
        for want, got in zip(spine, services):
            if len(want["subs"]) != len(got["subs"]):
                problems.append(
                    f"{code}: service '{want['title']}' has {len(got['subs'])} sub-services, "
                    f"indonesian.md has {len(want['subs'])}"
                )

    if problems:
        print("Drafts are out of sync, so position no longer identifies an article:")
        for p in problems:
            print(f"  - {p}")
        sys.exit("Aborted before touching Joomla.")


# --------------------------------------------------------------------------- joomla


def read_env() -> tuple[str, str]:
    if not ENV.exists():
        sys.exit(f"{ENV} not found — it holds JOOMLA_API and JOOMLA_TOKEN and is not committed.")
    values = dict(
        line.split("=", 1)
        for line in ENV.read_text(encoding="utf-8").splitlines()
        if "=" in line and not line.lstrip().startswith("#")
    )
    try:
        return values["JOOMLA_API"].strip(), values["JOOMLA_TOKEN"].strip()
    except KeyError as missing:
        sys.exit(f"{ENV} is missing {missing}")


def api(method: str, path: str, token: str, base: str, payload: dict | None = None):
    request = urllib.request.Request(
        f"{base}{path}",
        method=method,
        data=json.dumps(payload).encode() if payload else None,
        headers={
            # Both are required: without the vnd.api+json Accept header Joomla answers
            # "Could not match accept header" and never reaches the controller.
            "Accept": "application/vnd.api+json",
            "Content-Type": "application/json",
            "X-Joomla-Token": token,
        },
    )

    # A full run is ~200 requests against a local PHP-FPM, and it does fall over: this loop
    # exists because an import died half way through on a 502. Only 5xx and transport errors
    # are retried — a 4xx is our mistake and will fail again just as fast the second time.
    for attempt in range(4):
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                body = response.read().decode()
            return json.loads(body)["data"] if body.strip() else None
        except urllib.error.HTTPError as error:
            if error.code < 500 or attempt == 3:
                # POST /content/articles is honest about failures; the two endpoints CLAUDE.md
                # warns about are not, which is why every write is verified against the DB.
                raise SystemExit(f"{method} {path} -> HTTP {error.code}\n{error.read().decode()[:400]}")
        except (urllib.error.URLError, TimeoutError):
            if attempt == 3:
                raise SystemExit(f"{method} {path} -> no response after 4 attempts")
        time.sleep(1.5 * (attempt + 1))
    return None


def fetch_indonesian(token: str, base: str) -> tuple[list[dict], dict[str, dict]]:
    """The Indonesian rows are what the translations are derived from: alias and parent."""
    services = api(
        "GET", f"/content/articles?filter[category]={CAT_SERVICES}&page[limit]=300", token, base
    )
    subs = api(
        "GET", f"/content/articles?filter[category]={CAT_SUB_SERVICES}&page[limit]=300", token, base
    )

    services = [a for a in services if a["attributes"]["language"] == "id-ID"]
    subs = [a for a in subs if a["attributes"]["language"] == "id-ID"]

    parents = sql_rows(
        f"SELECT c.id, fv.value FROM {PREFIX}content c "
        f"JOIN {PREFIX}fields_values fv ON fv.item_id = c.id "
        f"WHERE fv.field_id = {FIELD_PARENT_SERVICE} AND c.catid = {CAT_SUB_SERVICES}"
    )
    parent_of = {int(row[0]): row[1] for row in parents}

    by_parent: dict[str, list[dict]] = {}
    for sub in subs:
        parent = parent_of.get(article_id_of(sub))
        if parent:
            by_parent.setdefault(parent, []).append(sub)

    return services, by_parent


# --------------------------------------------------------------------------- mysql


def sql_rows(query: str) -> list[list[str]]:
    result = subprocess.run(
        ["mysql", "-uroot", "--default-character-set=utf8mb4", DB, "-N", "-B", "-e", query],
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    if result.returncode != 0:
        sys.exit(f"mysql failed:\n{result.stderr.strip()}")
    return [line.split("\t") for line in result.stdout.strip().split("\n") if line]


def sql_exec(statement: str) -> None:
    result = subprocess.run(
        ["mysql", "-uroot", "--default-character-set=utf8mb4", DB, "-e", statement],
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    if result.returncode != 0:
        sys.exit(f"mysql failed:\n{result.stderr.strip()}\n{statement[:200]}")


def sql_quote(value: str) -> str:
    return "'" + value.replace("\\", "\\\\").replace("'", "\\'") + "'"


def copy_images(language: str) -> int:
    """Carry each source article's image over to its translation, entirely inside MySQL.

    Not through the API: it hands `images` back with absolute URLs already resolved, and
    writing those back would bake a hostname into the database.

    Not through Python either, which was the first attempt and was wrong twice over. The
    column holds JSON with escaped forward slashes (`images\\/gallery\\/x.jpg`); mysql's batch
    output escapes the backslash again, so a read/parse/write round trip turned every `/` into
    a literal backslash. And the CLI's default charset is not utf8mb4, so Chinese alt text came
    back as `????`. Keeping the value in the database sidesteps both: nothing is ever decoded.

    Alt text is the one part that must change, because alt text is prose and prose belongs in
    the reader's language — JSON_SET takes it from the target row's own title, which never
    leaves MySQL either. Sources without an image are skipped, never blanked.
    """
    suffix_len = 3
    sql_exec(
        f"UPDATE {PREFIX}content t "
        f"JOIN {PREFIX}content s "
        f"  ON s.alias = CONCAT(SUBSTRING(t.alias, 1, CHAR_LENGTH(t.alias) - {suffix_len}), '-id') "
        f" AND s.language = 'id-ID' "
        f"SET t.images = JSON_SET(s.images, '$.image_intro_alt', t.title, "
        f"                                  '$.image_fulltext_alt', t.title) "
        f"WHERE t.catid IN ({CAT_SERVICES},{CAT_SUB_SERVICES}) AND t.language = '{language}' "
        f"  AND JSON_VALID(s.images) AND JSON_EXTRACT(s.images, '$.image_intro') IS NOT NULL;"
    )
    return int(
        sql_rows(
            f"SELECT COUNT(*) FROM {PREFIX}content "
            f"WHERE catid IN ({CAT_SERVICES},{CAT_SUB_SERVICES}) AND language = '{language}' "
            f"  AND JSON_VALID(images) AND JSON_EXTRACT(images, '$.image_intro') IS NOT NULL"
        )[0][0]
    )


def repair(article_ids: list[int], parents: dict[int, str]) -> tuple[int, int]:
    """Both quirks fail silently, so both are repaired and then re-counted, never assumed."""
    if not article_ids:
        return 0, 0
    ids = ",".join(str(i) for i in article_ids)

    sql_exec(
        f"INSERT INTO {PREFIX}workflow_associations (item_id, stage_id, extension) "
        f"SELECT c.id, {WORKFLOW_STAGE}, 'com_content.article' FROM {PREFIX}content c "
        f"LEFT JOIN {PREFIX}workflow_associations wa "
        f"  ON wa.item_id = c.id AND wa.extension = 'com_content.article' "
        f"WHERE wa.item_id IS NULL AND c.id IN ({ids});"
    )

    for item_id, value in parents.items():
        sql_exec(
            f"DELETE FROM {PREFIX}fields_values "
            f"WHERE field_id = {FIELD_PARENT_SERVICE} AND item_id = {item_id};"
            f"INSERT INTO {PREFIX}fields_values (field_id, item_id, value) "
            f"VALUES ({FIELD_PARENT_SERVICE}, {item_id}, {sql_quote(value)});"
        )

    workflow = int(
        sql_rows(
            f"SELECT COUNT(*) FROM {PREFIX}workflow_associations "
            f"WHERE extension = 'com_content.article' AND item_id IN ({ids})"
        )[0][0]
    )
    fields = 0
    if parents:
        keys = ",".join(str(i) for i in parents)
        fields = int(
            sql_rows(
                f"SELECT COUNT(*) FROM {PREFIX}fields_values "
                f"WHERE field_id = {FIELD_PARENT_SERVICE} AND item_id IN ({keys})"
            )[0][0]
        )
    return workflow, fields


# --------------------------------------------------------------------------- import


def upsert(article, alias, title, body, catid, language, existing, token, base, apply):
    """Alias is the identity. Present already -> PATCH, absent -> POST."""
    payload = {
        "title": title,
        "alias": alias,
        "catid": catid,
        "language": language,
        "introtext": f"<p>{body}</p>",
        "state": 1,
    }

    if alias in existing:
        if not apply:
            return existing[alias], "update"
        api("PATCH", f"/content/articles/{existing[alias]}", token, base, payload)
        return existing[alias], "update"

    if not apply:
        return None, "create"
    created = api("POST", "/content/articles", token, base, payload)
    return article_id_of(created), "create"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="write to Joomla (default: dry run)")
    parser.add_argument("--lang", choices=["en", "zh", "all"], default="all")
    args = parser.parse_args()

    drafts = {"id": parse_draft(DRAFTS / "indonesian.md")}
    for code, (filename, _) in LANGS.items():
        drafts[code] = parse_draft(DRAFTS / filename)
    check_structure(drafts)

    base, token = read_env()
    services_id, subs_by_parent = fetch_indonesian(token, base)

    if len(services_id) != len(drafts["id"]):
        sys.exit(
            f"Joomla has {len(services_id)} Indonesian services but indonesian.md lists "
            f"{len(drafts['id'])}. Regenerate the drafts before importing."
        )

    # Joomla orders by whatever the API returns; the drafts were generated from it, so pair
    # them by the Indonesian title rather than trusting two independent orderings to match.
    by_title = {a["attributes"]["title"]: a for a in services_id}
    missing = [s["title"] for s in drafts["id"] if s["title"] not in by_title]
    if missing:
        sys.exit("Services in indonesian.md with no Joomla article: " + ", ".join(missing))

    codes = list(LANGS) if args.lang == "all" else [args.lang]

    for code in codes:
        _, language = LANGS[code]
        suffix = f"-{code}"
        existing = {
            row[0]: int(row[1])
            for row in sql_rows(
                f"SELECT alias, id FROM {PREFIX}content "
                f"WHERE catid IN ({CAT_SERVICES},{CAT_SUB_SERVICES}) "
                f"AND alias LIKE '%{suffix}'"
            )
        }

        touched: list[int] = []
        parents: dict[int, str] = {}
        created = updated = 0

        for spine, translated in zip(drafts["id"], drafts[code]):
            source = by_title[spine["title"]]
            service_base = BASE_ALIAS.sub("", source["attributes"]["alias"])

            article_id, action = upsert(
                source,
                service_base + suffix,
                translated["title"],
                translated["body"],
                CAT_SERVICES,
                language,
                existing,
                token,
                base,
                args.apply,
            )
            created += action == "create"
            updated += action == "update"
            if article_id:
                touched.append(article_id)

            source_subs = subs_by_parent.get(service_base, [])
            if len(source_subs) != len(translated["subs"]):
                sys.exit(
                    f"'{spine['title']}': Joomla has {len(source_subs)} sub-services, "
                    f"the draft has {len(translated['subs'])}."
                )

            # Two different pairings, and the difference matters. indonesian.md -> Joomla is
            # matched by TITLE, because the API returns sub-services in its own order and
            # trusting position there attaches translations to the wrong article silently.
            # indonesian.md -> english/mandarin stays positional, because their titles are
            # translated and there is nothing else to match on.
            sub_by_title: dict[str, dict] = {}
            for source_sub in source_subs:
                title = source_sub["attributes"]["title"]
                if title in sub_by_title:
                    sys.exit(f"'{spine['title']}': two sub-services both titled '{title}'.")
                sub_by_title[title] = source_sub

            unknown = [s["title"] for s in spine["subs"] if s["title"] not in sub_by_title]
            if unknown:
                sys.exit(
                    f"'{spine['title']}': in indonesian.md but not in Joomla: "
                    + ", ".join(unknown)
                )

            for spine_sub, translated_sub in zip(spine["subs"], translated["subs"]):
                source_sub = sub_by_title[spine_sub["title"]]
                sub_base = BASE_ALIAS.sub("", source_sub["attributes"]["alias"])
                sub_id, action = upsert(
                    source_sub,
                    sub_base + suffix,
                    translated_sub["title"],
                    translated_sub["body"],
                    CAT_SUB_SERVICES,
                    language,
                    existing,
                    token,
                    base,
                    args.apply,
                )
                created += action == "create"
                updated += action == "update"
                if sub_id:
                    touched.append(sub_id)
                    parents[sub_id] = service_base

        label = language
        if not args.apply:
            print(f"{label}: would create {created}, update {updated} (dry run)")
            continue

        workflow, fields = repair(touched, parents)
        pictures = copy_images(language)
        print(f"{label}: created {created}, updated {updated}")
        print(f"  workflow rows {workflow}/{len(touched)} | parent-service {fields}/{len(parents)}")
        print(f"  articles with an image {pictures}")
        if workflow != len(touched) or fields != len(parents):
            sys.exit("  repair incomplete — those articles would be invisible or unparented.")

    if not args.apply:
        print("\nNothing was written. Re-run with --apply.")


if __name__ == "__main__":
    main()
