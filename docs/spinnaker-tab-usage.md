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

### 3. Show Active Stage (kbd: `s`)
Displays the current stage number and details from URL parameters.

**When to use:** Check which stage you're currently viewing.

**Example:**
- On URL: `...executions/01H...?stage=2&step=0&details=runJobConfig`
- Press `s` or click "Show Active Stage"
- Notification shows: "Stage 2: runJobConfig"

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
| `s` | Show Active Stage |
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
2. Press `x` to confirm which execution you're viewing
3. Press `e` to expand execution details if needed
4. Navigate to the failed stage
5. Press `s` to confirm you're on the correct stage
6. Press `p` to extract the pod name
7. Open terminal and run: `kubectl logs <paste-pod-name>`

### Quick Navigation

1. Use `e` or `j` to quickly toggle execution details open/closed
2. Use `s` to verify which stage parameters are in the URL
3. Use `x` to double-check the execution ID

## Troubleshooting

### "Execution details link not found"
The "Execution Details" link is not present on the current page. Make sure you're on an execution page, not the executions list.

### "No execution found in URL"
You're not viewing a specific execution. Navigate to an execution details page first.

### "No stage open"
The URL doesn't contain stage parameters. Click on a stage in the execution timeline.

### "No error container found"
There's no error displayed in the current stage. The Extract Pod Names feature only works when viewing a stage with errors.

### "No pod names found in error"
The error message doesn't contain Kubernetes metadata with pod names. This typically means the error is not from a Kubernetes job failure.

## Technical Details

### DOM Selectors
- Execution Details link: `a.clickable` containing "Execution Details" text
- Error container: `.alert.alert-danger` within `.execution-details-container`

### URL Parsing
- Execution ID: Extracted from `/executions/{ID}` pattern
- Stage info: Parsed from query params `stage`, `step`, and `details`

### Pod Name Extraction
Uses regex pattern: `/"metadata":\s*\{[^}]*"name"\s*:\s*"([^"]+)"/g`

Handles:
- Flexible whitespace in JSON
- Additional fields in metadata object
- Multiple pod names (deduplicates and returns array)

## Integration

The Spinnaker tab is automatically registered with the extension's TabRegistry system. It appears alongside other tabs like "Page Actions", "SO Sprint", and "GitHub Autoscroll".

The tab has priority 0 for Spinnaker URLs, meaning it will be one of the first tabs shown in the popup.
