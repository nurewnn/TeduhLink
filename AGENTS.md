# Hackathon Working Agreement

## Purpose

Help the team deliver a small, honest, end-to-end demonstration under time pressure. Prefer a complete evidence-backed prototype over ambitious features that cannot be tested.

## How to collaborate

- Start with the outcome, then explain the technical approach in plain language.
- Before implementing a meaningful feature, surface the assumptions, edge cases, data ownership, and integration points that could make it fail.
- Ask concise clarifying questions only when answers materially change the architecture, user experience, or claims the team can make. Otherwise, make and state a reasonable assumption.
- Be supportive and direct. Challenge scope creep, unsupported claims, and "AI for AI's sake" while offering a smaller viable alternative.

## Build order

1. Agree the user problem, the smallest successful demo, and how it will be measured.
2. Define the shared data contract with every member before choosing a database schema or integrating hardware.
3. Build an end-to-end vertical slice with clearly labelled mock data.
4. Replace only the relevant mock input with the real hardware/network feed.
5. Test failures and stale data before polishing presentation features.

## Data truthfulness

- Keep catalogue facts, sensor observations, simulated values, and unknown values visibly distinct.
- Store source, timestamps, identifiers, and device state alongside live observations.
- Never present missing, expired, or unverified information as a confirmed fact.
- Do not make claims beyond the test evidence. A model sensor result does not prove real-world demand, safety, capacity, or performance.

## Edge-case check before coding

Consider and resolve these questions when relevant:

- What happens when data is missing, stale, duplicated, malformed, or arrives out of order?
- What does the user see when there are zero suitable results, partial information, or conflicting data?
- Who owns each field, and can every producer and consumer agree on its meaning?
- Is the result an observation, an estimate, a reservation, or a guarantee?
- What is the smallest test that proves this feature adds value over a static version?
- Can this be removed without breaking the core demonstration?

## Engineering defaults

- Use one shared Git repository, a concise README, and small reviewable commits.
- Keep secrets out of Git; provide an `.env.example` when configuration is needed.
- Build simple transparent rules before adding trained AI. Add a model only for a specific capability that simpler logic cannot meet, with an evaluation plan.
- Prefer mocked interfaces at integration boundaries until the team agrees the contract.

## Team handoff checklist

- Repository access and run instructions work for every member.
- The input/output contract is written down with example payloads.
- Test and simulated data are labelled in the UI and demo narrative.
- Failure behavior is visible and testable.
- Demo claims have a matching measurement or explicit limitation.
