/**
 * Shared fixture pages: real production URLs paired with toy HTML that
 * mimics the DOM slice each tab's actions target. Served via route
 * interception (see helpers.ts openFixturePage) so the content script
 * injects and its page modules register keybindings.
 *
 * Pure data — imported by both the specs and the demo script.
 */

export const KEYLOGGER_SNIPPET = `<script>
  window.__seenKeys = [];
  window.addEventListener('keydown', (e) => { window.__seenKeys.push(e.key); });
</script>`;

// --- GitHub PR ---------------------------------------------------------

export const PR_URL = 'https://github.com/exo-test/repo/pull/1';

const prFileHeader = (path: string, viewed: boolean) => `
    <div class="DiffFileHeader-module__diff-file-header__UuNN4">
      <h3 class="DiffFileHeader-module__file-name__V">
        <a class="prc-Link-Link-9ZwDx" href="#diff-${path.replace(/[^a-z]/gi, '')}">${'\u200e'}${path}${'\u200e'}</a>
      </h3>
      <button class="prc-Button-ButtonBase MarkAsViewedButton-module__x"
              aria-label="${viewed ? 'Viewed' : 'Not Viewed'}" aria-pressed="${viewed}">
        <span>Viewed</span>
      </button>
    </div>`;

export const PR_HTML = `<!doctype html>
<html>
  <head><meta charset="utf-8"><title>toy app</title></head>
  <body>
    <h1 id="app">toy app</h1>
    ${prFileHeader('services/spinnaker/pipelines2/blocks-copier/dinghy.alpha.json', false)}
    ${prFileHeader('services/spinnaker/pipelines2/blocks-copier/dinghy.staging.json', true)}
    ${prFileHeader('src/index.ts', false)}
    <script>
      // Like real GitHub: the Viewed toggle flips its aria-pressed on click.
      for (const btn of document.querySelectorAll('button[class*="MarkAsViewedButton"]')) {
        btn.addEventListener('click', () => {
          btn.setAttribute('aria-pressed', btn.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
        });
      }
    </script>
    ${KEYLOGGER_SNIPPET}
  </body>
</html>`;

// --- Spinnaker execution page ------------------------------------------

export const EXECUTION_ID = '01HPN64GE091GK831P0XG2JQQT';

export const SPINNAKER_URL =
    `https://spinnaker.k8s.shadowbox.cloud/#/applications/myapp/executions/${EXECUTION_ID}` +
    `?stage=1&step=0&details=deployStatus`;

export const POD_NAME = 'h-bg-provision-step-0-abc12';

export const PIPELINE_NAME = 'Blue Green Provisioning PRODUCTION';

export const STACKED_EXECUTION_ID = '01KYQA4SMS5STF94WB38DZY1A4';

export const STACKED_DETAILS_URL =
    `https://spinnaker.k8s.shadowbox.cloud/#/applications/hyperbase-deploy/executions/details/${STACKED_EXECUTION_ID}` +
    `?stage=0&step=0&details=webhookConfig`;

// Event payload as Deck renders it: JSON-encoded twice inside the
// copy-to-clipboard textarea. Names the execution's owning application.
const STACKED_EVENT_PAYLOAD = JSON.stringify(
    JSON.stringify({
        title: '[prod] spinnaker-pipeline: Deploy worker-assigner PRODUCTION started',
        aggregation_key: STACKED_EXECUTION_ID,
        tags: ['application:worker-assigner', 'pipeline:Deploy worker-assigner PRODUCTION'],
    }),
);

// A k8s manifest dump with metadata fields in real (alphabetical) order —
// labels precede name, which the pod extractor must tolerate.
const ERROR_BODY = `Exception ( Wait For Manifest To Stabilize )
{"kind":"Pod","metadata":{"labels":{"app":"hyperbase"},"name":"${POD_NAME}","namespace":"prod"},"status":{"phase":"Failed"}}`;

export const SPINNAKER_HTML = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8"><title>myapp - executions - Spinnaker</title>
    <style>
      body { font-family: sans-serif; padding: 24px; }
      .clickable { color: #1a73e8; cursor: pointer; text-decoration: underline; }
      .execution-details-container { margin-top: 12px; }
      .alert-danger { background: #fdecea; border: 1px solid #d93025; border-radius: 4px; padding: 12px; }
      .hidden { display: none; }
    </style>
  </head>
  <body>
    <h2>myapp &rsaquo; executions &rsaquo; ${EXECUTION_ID}</h2>
    <div class="execution-group">
      <h4 class="execution-group-title">${PIPELINE_NAME}<span> <span class="badge">1</span></span></h4>
      <div class="execution" id="execution-${EXECUTION_ID}">
        <a class="clickable" id="exec-details-link">Execution Details</a>
        <div class="execution-details-container">
          <div class="alert alert-danger"><pre>${ERROR_BODY}</pre></div>
        </div>
      </div>
    </div>
    <react-ui-view-adapter name="pipelines" class="ng-scope">
      <div class="row"><div class="single-execution-details">stack header</div></div>
      <div class="row" style="height: 600px">
        <div class="execution" id="execution-STACKPARENT">
          <h4 class="execution-name">Deploy PRODUCTION</h4>
        </div>
      </div>
      <div class="row" id="last-pipeline-row" style="height: 400px">
        <div class="execution" id="execution-${STACKED_EXECUTION_ID}">
          <h4 class="execution-name">Deploy worker-assigner PRODUCTION</h4>
          <div class="clickable stage execution-marker stage-type-datadogchangeevent" id="dd-event-marker"></div>
        </div>
      </div>
      <div class="row" id="stage-config-row" style="height: 1600px">Webhook Stage Configuration</div>
    </react-ui-view-adapter>
    <script>
      // Like real Deck: the event payload pane only renders (async) after
      // the Datadog change-event stage marker is clicked.
      document.getElementById('dd-event-marker').addEventListener('click', () => {
        setTimeout(() => {
          const widget = document.createElement('copy-to-clipboard');
          const textarea = document.createElement('textarea');
          textarea.textContent = ${JSON.stringify(STACKED_EVENT_PAYLOAD)};
          widget.appendChild(textarea);
          document.getElementById('stage-config-row').appendChild(widget);
        }, 150);
      });
    </script>
    <script>
      window.__clicks = [];
      const link = document.getElementById('exec-details-link');
      const details = document.querySelector('.execution-details-container');
      link.addEventListener('click', () => {
        window.__clicks.push('exec-details');
        details.classList.toggle('hidden');
      });
    </script>
    ${KEYLOGGER_SNIPPET}
  </body>
</html>`;
