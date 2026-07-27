# Spinnaker Tab Usage Guide

## Overview

The Spinnaker tab provides keyboard shortcuts and UI buttons for interacting with Spinnaker executions and stages. It automatically appears in the extension popup when visiting any URL containing "spinnaker".

## Features

The Spinnaker tab offers five core operations:

### 1. Toggle Execution Details (kbd: `e`)
Clicks the "Execution Details" link to expand or collapse the execution view.

**When to use:** Quickly open or close execution details without manual clicking.

**Example:**
- Visit a Spinnaker execution page
- Press `e` or click "Toggle Execution Details"
- The execution details will expand/collapse

### 2. Show Active Execution (kbd: `x`)
Displays the current execution ID and its open/closed status via notification.

**When to use:** Verify which execution you're currently viewing.

**Example:**
- On URL: `https://spinnaker.example.com/#/applications/app/executions/01HPN64GE091GK831P0XG2JQQT`
- Press `x` or click "Show Active Execution"
- Notification shows: "Execution: 01HPN64GE091GK831P0XG2JQQT (open)"

### 3. Isolate Pipeline (kbd: `i`)
Filters the executions view down to the open execution's pipeline by adding
`?pipeline=<name>` to the URL. The pipeline name is read from the execution's
group heading in the page.

**When to use:** An application lists many pipelines and you want to see only
the one your execution belongs to.

**Example:**
- On URL: `...executions/01HPN5GWDEJ5088Y9QZ4JPG2C0?stage=2&step=0&details=runJobConfig`
- Press `i` or click "Isolate Pipeline"
- URL becomes: `...?stage=2&step=0&details=runJobConfig&pipeline=Blue%20Green%20Provisioning%20PRODUCTION`
- Notification shows: "Isolated pipeline: Blue Green Provisioning PRODUCTION"

### 4. Jump to Execution (kbd: `j`)
Alias for "Toggle Execution Details". Provides semantic clarity.

**When to use:** Same as Toggle Execution Details - use whichever makes more sense to you.

### 5. Extract Pod Names (kbd: `p`)
Extracts Kubernetes pod names from error JSON metadata and copies the first one to your clipboard.

**When to use:** Quickly copy pod names from failed job executions for kubectl debugging.

**Example:**
- Open a failed stage with Kubernetes job errors
- Error contains JSON like: `{"metadata":{"name":"hyperbase-job-abc-123"}}`
- Press `p` or click "Extract Pod Names"
- Notification shows: "Copied pod name: hyperbase-job-abc-123"
- You can now paste the pod name into kubectl commands

**Multi-pod scenarios:**
If multiple pod names are found, only the first is copied, but the notification tells you the total count:
- Notification: "Copied pod name: pod-1 (3 total found)"

## Keyboard Shortcuts

All keyboard shortcuts work globally in the browser tab, except when typing in input fields or textareas.

| Key | Action |
|-----|--------|
| `e` | Toggle Execution Details |
| `x` | Show Active Execution |
| `i` | Isolate Pipeline (adds `?pipeline=<name>` so the view shows only that pipeline) |
| `j` | Jump to Execution |
| `p` | Extract Pod Names |

## URL Patterns

The Spinnaker tab automatically appears when your URL contains "spinnaker" (case-insensitive).

### Example URLs:
- `https://spinnaker.k8s.shadowbox.cloud/#/applications/app/executions`
- `https://spinnaker.example.com/#/applications/hyperbase-deploy/executions/01HPN64GE091GK831P0XG2JQQT`
- `https://my-spinnaker-instance.com/pipeline/123`

## Typical Workflow

### Debugging a Failed Pipeline

1. Open your Spinnaker execution page
2. Press `i` to isolate the pipeline you're debugging
3. Press `e` to expand execution details if needed
4. Navigate to the failed stage
5. Press `p` to extract the pod name
6. Open terminal and run: `kubectl logs <paste-pod-name>`

### Quick Navigation

1. Use `e` or `j` to quickly toggle execution details open/closed
2. Use `i` to hide every other pipeline in a busy application
3. Use `x` to double-check the execution ID

## Troubleshooting

### "Execution details link not found"
The "Execution Details" link is not present on the current page. Make sure you're on an execution page, not the executions list.

### "No execution found in URL"
You're not viewing a specific execution. Navigate to an execution details page first.

### "Could not determine the pipeline for this execution"
Isolate couldn't find the execution's group heading in the page
(`.execution-group-title`). If this happens on a real Spinnaker page, save the
DOM and update the selectors in `dom-utils.ts` (see `e2e/spinnaker.spec.ts`
for the iteration loop).

### "No error container found"
There's no error displayed in the current stage. The Extract Pod Names feature only works when viewing a stage with errors.

### "No pod names found in error"
The error message doesn't contain Kubernetes metadata with pod names. This typically means the error is not from a Kubernetes job failure.

## Technical Details

### DOM Selectors
- Execution Details link: `a.clickable` containing "Execution Details" text
- Error container: `.alert.alert-danger` within `.execution-details-container`
- Pipeline name: `.execution-group-title` within the execution's `.execution-group`
  (execution located by `#execution-<id>` or a permalink `a[href*="<id>"]`)

### URL Parsing
- Execution ID: Extracted from `/executions/{ID}` pattern
- Isolate: sets the `pipeline` param in the hash query, preserving other params

### Pod Name Extraction
Locates each `"metadata": {...}` object, takes its brace-balanced top-level
content (string-aware, so nested objects like `labels` don't break it), and
matches top-level `"name": "..."` within it.

Handles:
- Flexible whitespace in JSON
- Nested objects before `name` (k8s serializes metadata alphabetically)
- Multiple pod names (deduplicates and returns array)

## Integration

The Spinnaker tab is automatically registered with the extension's TabRegistry system. It appears alongside other tabs like "Page Actions", "SO Sprint", and "GitHub Autoscroll".

The tab has priority 0 for Spinnaker URLs, meaning it will be one of the first tabs shown in the popup.
