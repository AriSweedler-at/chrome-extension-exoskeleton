# Spinnaker Tab Usage Guide

## Overview

The Spinnaker tab provides keyboard shortcuts and UI buttons for working with
Spinnaker executions. It automatically appears in the extension popup when
visiting any URL containing "spinnaker".

## Features

### 1. Toggle Execution Details (kbd: `e`)

Clicks the "Execution Details" link to expand or collapse the execution view.

**When to use:** Quickly open or close execution details without manual clicking.

**Example:**

- Visit a Spinnaker execution page
- Press `e` or click "Toggle Execution Details"
- The execution details will expand/collapse

### 2. Isolate Pipeline (kbd: `i`)

Filters the executions view down to the open execution's pipeline by adding
`?pipeline=<name>` to the URL. The pipeline name is read from the execution's
group heading in the page (direct text only — the running-count badge is not
part of the name).

**When to use:** An application lists many pipelines and you want to see only
the one your execution belongs to.

**On a stacked details view** (`.../executions/details/<id>`): `i` jumps to
the execution's own isolated view instead. The pipeline name comes from the
execution's heading; the owning application is read from the notification
event payloads on the page (the `application:<name>` tag under the
execution's `aggregation_key` — the only place the DOM names it). Example:
`.../hyperbase-deploy/executions/details/01KYQ...?stage=0` becomes
`.../worker-assigner/executions/01KYQ...?stage=0&pipeline=Deploy%20worker-assigner%20PRODUCTION`.
If no payload names the application, `i` gives up with an error toast.

**Example:**

- On URL: `...executions/01HPN5GWDEJ5088Y9QZ4JPG2C0?stage=2&step=0&details=runJobConfig`
- Press `i` or click "Isolate Pipeline"
- URL becomes: `...?stage=2&step=0&details=runJobConfig&pipeline=Blue%20Green%20Provisioning%20PRODUCTION`
- Notification shows: "Isolated pipeline: Blue Green Provisioning PRODUCTION"

## Keyboard Shortcuts

All keyboard shortcuts work globally in the browser tab, except when typing in input fields or textareas.

| Key | Action                                                                           |
| --- | -------------------------------------------------------------------------------- |
| `e` | Toggle Execution Details                                                         |
| `i` | Isolate Pipeline (adds `?pipeline=<name>` so the view shows only that pipeline)  |
| `G` | Jump to the last pipeline of a stacked details view (its row scrolls to the top) |

## Rich links (Cmd+Shift+C)

On executions views, the Spinnaker copier offers a **pipeline** link only in
isolation mode (after `i`), sourced from the URL filter itself. Without
isolation it offers a **Spinnaker Application** link instead, so copying
always works.

## Environment switching (Cmd+Shift+X)

The primary action cycles alpha → staging → production by rewriting the
hostname; the popup also shows one button per environment. Pipeline filters
are carried across and retargeted: the environment token inside the pipeline
name is swapped (`?pipeline=Continuous Migration PRODUCTION` becomes
`?pipeline=Continuous Migration ALPHA` on the alpha URL).

## URL Patterns

The Spinnaker tab automatically appears when your URL contains "spinnaker" (case-insensitive).

### Example URLs:

- `https://spinnaker.k8s.shadowbox.cloud/#/applications/app/executions`
- `https://spinnaker.example.com/#/applications/hyperbase-deploy/executions/01HPN64GE091GK831P0XG2JQQT`

## Troubleshooting

### "Execution details link not found"

The "Execution Details" link is not present on the current page. Make sure you're on an execution page, not the executions list.

### "No execution found in URL"

You're not viewing a specific execution. Navigate to an execution details page first.

### "Could not determine the pipeline for this execution"

Isolate couldn't find the execution's group heading in the page
(`.execution-group-title`). If this happens on a real Spinnaker page, save the
DOM (see `docs/testing.md`, Spinnaker DOM Tools) and update the selectors in
`dom-utils.ts`.

## Technical Details

### DOM Selectors

- Execution Details link: `a.clickable` containing "Execution Details" text
- Pipeline name: direct text of `.execution-group-title` within the execution's
  `.execution-group` (execution located by `#execution-<id>` or a permalink
  `a[href*="<id>"]`)

### URL Parsing

- Execution ID: Extracted from `/executions/{ID}` pattern
- Isolate: sets the `pipeline` param in the hash query, preserving other params
  (`src/exo-tabs/spinnaker/filters.ts` owns all pipeline-filter URL state)

## Integration

The Spinnaker tab is automatically registered with the extension's TabRegistry system.

The tab has priority 0 for Spinnaker URLs, meaning it will be one of the first tabs shown in the popup.
