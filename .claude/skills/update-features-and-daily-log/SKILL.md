---
name: update-features-and-daily-log
description: Update docs/features.md and docs/daily-log.md from today's merged PRs and commits. Use when the user asks to log today's changes, refresh the feature inventory, or runs /update-features-and-daily-log at end of day.
---

# update-features-and-daily-log

End-of-day skill that refreshes `docs/daily-log.md` (today's entry) and `docs/features.md` (capability inventory) from today's merged PRs and commits. Bilingual EN + ZH, written from a user / PM perspective.

## Quick start

1. Capture today's date once: `today=$(date +%Y-%m-%d)`.
2. List today's merged PRs: `gh pr list --state merged --search "merged:>=$today" --json number,title,body,mergedAt --limit 50`.
3. List today's commits on `main`: `git log --since="$today 00:00" --pretty=format:"%h %s" main`. Skip merge-only commits if redundant with the PR list.
4. Read the existing `docs/daily-log.md` and `docs/features.md` to follow their structure and avoid duplicating entries.
5. Draft both updates, show diffs, wait for user confirmation before saving.

## Voice (applies to both files)

- **Write from a user / product manager perspective.** Describe what users notice, what was broken vs fixed, what's newly possible. The audience is a stakeholder reading at a glance, not an engineer reading a diff.
- **No code, no file paths, no function / column / library / framework names.** If a fact only makes sense to someone who has read the source, drop it or rephrase it in product terms.
- **Bilingual, in sync.** Every English change has a matching Chinese counterpart. Don't update one language alone.
- **Chinese typography.** Full-width em-dash `——` (ASCII ` — ` forbidden); add a space between Latin and CJK (`热门 Skill`); use Chinese punctuation throughout (`，。：；“”——`).

## docs/daily-log.md — today's entry

Shape (mirror under both `## English` and `## 中文`):

```markdown
### YYYY-MM-DD

**Briefing.** One sentence summarizing the day's changes at a high level.

<details>
<summary>Details</summary>

- **<Feature area or improvement>** — User-perspective description of what changed and why it matters. (#PR, #PR)

</details>
```

Rules:

- **Group by feature or improvement, not by PR.** Multiple PRs can roll into one bullet; one PR can split into several bullets if it touched unrelated areas.
- Cite sources in parentheses at the end of each detail bullet — PR numbers (`(#26, #28)`) for normal merges, or short SHAs (`(commit:abc1234)`) for the rare direct-to-main commit. Every bullet has at least one citation.
- If today's section already exists, extend it — don't duplicate bullets, refresh the briefing if needed.
- Newest day on top, separated by `---` from the previous day if you add one.

## docs/features.md — capability inventory

`features.md` is a static inventory, not a changelog. For each user-facing change today, decide:

- **New capability** → add a bullet under the right area (e.g. *Browse & discover*, *Detail page*, *Publish*, *Accounts & sign-in*). Create a new area only if nothing fits.
- **Improved capability** → revise the existing bullet's wording.
- **Retired capability** → delete the bullet.
- **Internal-only change** (infra, refactor, tests, copy polish that doesn't change behavior) → skip; it does not belong in `features.md`.

Each bullet follows the **Voice** rules above — bold the capability name, describe in plain user terms, no code references.

Refresh the **Overview** paragraph only if the product's scope changed materially (new pillar, removed pillar). Don't rewrite it for incremental adds.

## Confirm before writing

Always show the proposed diff (or the full new daily section) and wait for explicit user confirmation before saving. The user may want to tighten copy, drop bullets, or rephrase first.

## Review checklist

Before declaring done:

- [ ] Today's daily-log entry exists in both EN and ZH, with matching content.
- [ ] Each detail bullet cites at least one PR (or commit SHA fallback).
- [ ] No code, file paths, or library names leaked into user-facing copy.
- [ ] `features.md` reflects any new / changed / removed user-facing capability — and only those.
- [ ] Chinese sections use `——`, proper spacing around Latin tokens, and Chinese punctuation.
