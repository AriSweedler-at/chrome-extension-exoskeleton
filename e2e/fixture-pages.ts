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

// --- Google Docs (playground tab) ----------------------------------------

export const GDOC_URL = 'https://docs.google.com/document/d/exo-test/edit';

export const GDOC_HTML = `<!doctype html>
<html>
  <head><meta charset="utf-8"><title>toy doc</title></head>
  <body>
    <h1 id="doc">toy doc</h1>
    <input id="doc-input" placeholder="type here" />
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

// The parent execution with a child-pipeline stage selected: only then does
// the fixture render the stage pane with the View Pipeline Execution link.
export const EXPANDING_DETAILS_URL =
    `https://spinnaker.k8s.shadowbox.cloud/#/applications/hyperbase-deploy/executions/details/${STACKED_EXECUTION_ID}` +
    `?stage=59&step=0&details=pipelineConfig`;

// A child spawned by a deploy, viewed in its own application: it renders
// parent-execution breadcrumbs whose last link climbs back to the stack.
const DEPLOY_CHILD_ID = '01KYWEXG47N131DFQ6W6C8EA30';

export const CHILD_OF_DEPLOY_URL = `https://spinnaker.k8s.shadowbox.cloud/#/applications/web-service/executions/${DEPLOY_CHILD_ID}`;

// Where the climb lands: the breadcrumb's own href, then the stage that ran
// the child, selected by the fixture's stage-label click handler.
export const CLIMB_PARENT_URL =
    `https://spinnaker.k8s.shadowbox.cloud/#/applications/hyperbase-deploy/executions/details/${STACKED_EXECUTION_ID}` +
    `?stage=49&step=0&details=pipelineConfig`;

const CHILD_EXECUTION_ID = '01KYWEXG59VW8KF897QNBXAWRX';
const CHILD_DETAILS_HASH = `/applications/taskworker-service/executions/details/${CHILD_EXECUTION_ID}?stage=0&step=0`;

// Where the View Pipeline Execution link lands — what G expands to.
export const EXPANDED_CHILD_URL = `https://spinnaker.k8s.shadowbox.cloud/#${CHILD_DETAILS_HASH}`;

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
          <div class="execution-stage-label clickable"><span>Datadog: Pipeline Started</span></div>
          <div class="execution-stage-label clickable" id="monitoring-stage-label"><span>Monitoring Links</span></div>
        </div>
      </div>
      <div class="row" id="stage-config-row" style="height: 1600px">Webhook Stage Configuration</div>
    </react-ui-view-adapter>
    <script>
      // Like real Deck: a child-pipeline stage's open pane carries a View
      // Pipeline Execution link, and following it swaps in the child's own
      // stack (async, after Deck fetches the child execution).
      if (location.hash.includes('details=pipelineConfig')) {
        const pane = document.createElement('div');
        pane.className = 'execution-details';
        pane.innerHTML = '<div class="stage-details">' +
          '<a>Pipeline Config</a> <a>Task Status</a> ' +
          '<dl><dt>Application</dt><dd>taskworker-service</dd>' +
          '<dt>Pipeline</dt><dd>Deploy taskworker PRODUCTION</dd></dl>' +
          '<a href="#${CHILD_DETAILS_HASH}">View Pipeline Execution</a></div>';
        document.getElementById('stage-config-row').appendChild(pane);
      }
      window.addEventListener('hashchange', () => {
        if (!location.hash.includes('${CHILD_EXECUTION_ID}')) return;
        const pane = document.querySelector('.execution-details');
        if (pane) pane.remove();
        setTimeout(() => {
          const adapter = document.querySelector('react-ui-view-adapter[name="pipelines"]');
          const row = document.createElement('div');
          row.className = 'row';
          row.id = 'child-pipeline-row';
          row.style.height = '500px';
          row.innerHTML = '<div class="execution" id="execution-${CHILD_EXECUTION_ID}">' +
            '<h4 class="execution-name">Deploy taskworker PRODUCTION</h4></div>';
          adapter.appendChild(row);
          const config = document.createElement('div');
          config.className = 'row';
          config.style.height = '1600px';
          config.textContent = 'Child Stage Configuration';
          adapter.appendChild(config);
        }, 150);
      });
    </script>
    <script>
      // Like real Deck: a child-of-deploy page renders the child under its
      // own group, with parent-execution breadcrumbs (nearest ancestor last).
      if (location.hash.includes('/executions/${DEPLOY_CHILD_ID}')) {
        const group = document.createElement('div');
        group.className = 'execution-group';
        group.innerHTML = '<h4 class="execution-group-title">Deploy sar-proxy PRODUCTION</h4>' +
          '<div class="execution" id="execution-${DEPLOY_CHILD_ID}">' +
          '<div class="execution-breadcrumbs">Parent Executions: ' +
          '<a href="#/applications/hyperbase-deploy/executions/details/01KYWDY7DH8Y22MT8VG0GDY42H?stage=0&step=0">Deploy PRODUCTION</a>' +
          '<a href="#/applications/hyperbase-deploy/executions/details/${STACKED_EXECUTION_ID}?stage=0&step=0">K8s Meta Pipeline PRODUCTION</a>' +
          '</div></div>';
        document.body.insertBefore(group, document.body.firstChild);
      }
      // Following the breadcrumb renders the parent's stage graph (async).
      // Clicking a stage label selects that stage, like Deck does.
      window.addEventListener('hashchange', () => {
        if (!location.hash.includes('details/${STACKED_EXECUTION_ID}')) return;
        if (document.getElementById('climb-stage-label')) return;
        setTimeout(() => {
          const exec = document.getElementById('execution-${STACKED_EXECUTION_ID}');
          const decoy = document.createElement('div');
          decoy.className = 'execution-stage-label clickable';
          decoy.innerHTML = '<span>Run other-service pipeline</span>';
          exec.appendChild(decoy);
          const label = document.createElement('div');
          label.className = 'execution-stage-label clickable';
          label.id = 'climb-stage-label';
          label.innerHTML = '<span>Run sar-proxy pipeline</span>';
          label.addEventListener('click', () => {
            location.hash = '/applications/hyperbase-deploy/executions/details/${STACKED_EXECUTION_ID}?stage=49&step=0&details=pipelineConfig';
          });
          exec.appendChild(label);
        }, 150);
      });
    </script>
    <script>
      // Like real Deck: the Monitoring Links pane renders (async) after its
      // stage-graph label is clicked; the OpenSearch link lives in that pane.
      document.getElementById('monitoring-stage-label').addEventListener('click', () => {
        setTimeout(() => {
          const pane = document.createElement('div');
          pane.className = 'execution-details';
          pane.innerHTML = '<h1>Monitoring Links</h1><h2>OpenSearch Link</h2>' +
            '<a href="#opensearch">OpenSearch Link</a>';
          pane.querySelector('a').addEventListener('click', (e) => {
            e.preventDefault();
            window.__clicks.push('opensearch-link');
          });
          document.getElementById('execution-${STACKED_EXECUTION_ID}').appendChild(pane);
        }, 150);
      });
    </script>
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
