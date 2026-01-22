# Spinnaker Tab Design

## Overview

Add a new tab to the Chrome extension for Spinnaker pages that provides keyboard shortcuts and UI buttons to interact with Spinnaker executions and stages.

## Commands

1. **Toggle Execution Details** - Click the "Execution Details" link to expand/collapse execution
2. **Display Active Execution** - Show which execution is currently open in the URL
3. **Display Active Stage** - Show which stage is currently open from URL parameters
4. **Jump to Execution** - Open the execution details (alias of toggle)
5. **Extract Pod Names** - Parse error messages for Kubernetes pod names and copy to clipboard

## Architecture

Following the existing action-based architecture pattern used in the GitHub autoscroll tab.

### File Structure

```
src/tabs/spinnaker.tab.tsx
src/components/SpinnakerComponent.tsx
src/library/spinnaker/
  ├── actions.tsx          # Action handlers
  ├── dom-utils.tsx        # DOM selectors & interactions
  └── pod-extractor.tsx    # Extract pod names from errors
```

### Action Definitions

```typescript
export enum SpinnakerAction {
  TOGGLE_EXECUTION = 'toggleExecution',
  DISPLAY_ACTIVE_EXECUTION = 'displayActiveExecution',
  DISPLAY_ACTIVE_STAGE = 'displayActiveStage',
  JUMP_TO_EXECUTION = 'jumpToExecution',
  EXTRACT_POD_NAMES = 'extractPodNames'
}
```

## DOM Utilities (`dom-utils.tsx`)

### Key DOM Operations

**Toggle Execution Details:**
- Selector: `a.clickable` containing "Execution Details" text
- Action: Click to toggle open/closed

**Get Active Execution ID:**
- Parse URL for execution ID pattern: `/executions/01HPN64GE091GK831P0XG2JQQT`
- Check URL params to determine if execution is open

**Get Active Stage:**
- Parse URL query params: `?stage=2&step=0&details=runJobConfig`
- Extract `stage` number and `details` parameter

**Find Error Container:**
- Selector: `.alert.alert-danger` within `.execution-details-container`
- Only available when stage is open with errors

### Helper Functions

```typescript
findExecutionDetailsLink(): HTMLElement | null
getExecutionIdFromUrl(): string | null
isExecutionOpen(): boolean
getActiveStageFromUrl(): { stage: number, details: string } | null
findErrorContainer(): HTMLElement | null
```

## Pod Name Extraction (`pod-extractor.tsx`)

### Strategy

1. Get HTML content from `.alert.alert-danger` container
2. Search for JSON metadata containing pod/job names
3. Pattern: `"metadata":{"name":"<pod-name>"}`
4. Extract using regex, return array of names
5. Copy first name to clipboard via `navigator.clipboard.writeText()`

### Function Signature

```typescript
export function extractPodNames(errorHtml: string): string[]
```

### Result Handling

- If found: Copy first pod name, show notification with count
- If not found: Show "No pod names found in error"

## Action Handlers (`actions.tsx`)

### toggleExecution
- Find "Execution Details" link via DOM utils
- Click to toggle
- Show notification: "Toggled execution details"

### displayActiveExecution
- Parse URL for execution ID
- Check if open (has stage params)
- Show notification: "Execution: {id} (open/closed)"

### displayActiveStage
- Parse URL stage parameters
- Show notification: "Stage {n}: {details}" or "No stage open"

### jumpToExecution
- Alias for toggleExecution
- Provides semantic clarity in UI

### extractPodNames
- Find error container in active stage
- Extract pod names
- Copy first to clipboard
- Show notification with pod name or "not found"

## UI Component (`SpinnakerComponent.tsx`)

### Layout

Section titled "Execution Controls" with five buttons:
- "Toggle Execution Details" (kbd: `e`)
- "Show Active Execution" (kbd: `x`)
- "Show Active Stage" (kbd: `s`)
- "Jump to Execution" (kbd: `j`)
- "Extract Pod Names" (kbd: `p`)

### Keyboard Shortcuts

- `useEffect` hook with `keydown` event listener
- Only trigger when not in input/textarea
- Prevent default for registered keys
- Call same action handlers as buttons

### Button Behavior

Each button directly calls its action handler from `actions.tsx`.

## Tab Registration (`spinnaker.tab.tsx`)

```typescript
TabRegistry.register({
  id: 'spinnaker',
  label: 'Spinnaker',
  component: SpinnakerComponent,
  getPriority: (url: string) => {
    if (url.includes('spinnaker')) {
      return 0;
    }
    return Number.MAX_SAFE_INTEGER;
  },
});
```

## URL Patterns

### Execution List
`https://spinnaker.k8s.shadowbox.cloud/#/applications/hyperbase-deploy/executions`

### Execution Open
`https://spinnaker.k8s.shadowbox.cloud/#/applications/hyperbase-deploy/executions/01HPN64GE091GK831P0XG2JQQT?stage=0&step=0&details=evaluateVariablesConfig`

### Stage Open
`https://spinnaker.k8s.shadowbox.cloud/#/applications/hyperbase-deploy/executions/01HPN64GE091GK831P0XG2JQQT?stage=2&step=0&details=runJobConfig`

## Error Message Example

Pod names appear in JSON within `.alert.alert-danger` divs. Example:
- Container class: `execution-details-container`
- Error class: `alert alert-danger`
- Pod name in JSON: `"metadata":{"name":"h-bg-provision-step-0-5b8e-jqqt"}`

See `docs/example-alert-danger.md` for full example.
