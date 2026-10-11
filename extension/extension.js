let vscode;
try {
    vscode = require('vscode');
} catch (e) {
    // We're not running in VS Code environment (e.g., during testing).
    // Minimal mock so the module can be loaded and exercised.
    vscode = {
        window: {
            showErrorMessage: function (message) { console.log('ERROR:', message); },
            showInformationMessage: function (message) { console.log('INFO:', message); },
            registerWebviewViewProvider: function () { }
        },
        commands: {
            registerCommand: function () { },
            executeCommand: function () { }
        },
        workspace: {
            getConfiguration: function () {
                return { get: function (_key, fallback) { return fallback; } };
            }
        },
        env: {
            openExternal: function () { }
        },
        ViewColumn: { Beside: 2 },
        Uri: {
            file: function (path) { return path; },
            parse: function (str) { return str; }
        }
    };
}

const DEFAULT_MONITOR_URL = 'http://127.0.0.1:3777';

function getMonitorUrl() {
    try {
        return vscode.workspace.getConfiguration('agentHub').get('monitorUrl', DEFAULT_MONITOR_URL) || DEFAULT_MONITOR_URL;
    } catch (e) {
        return DEFAULT_MONITOR_URL;
    }
}

/**
 * Sidebar view provider for the "Agent Hub" activity bar container.
 * Registers the webview declared in package.json ("agent-hub-panel").
 */
class AgentHubViewProvider {
    constructor(context) {
        this._context = context;
    }

    resolveWebviewView(view) {
        view.webview.options = {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.file(this._context.extensionPath)]
        };

        view.webview.html = getWebviewContent(view.webview, getMonitorUrl());

        view.webview.onDidReceiveMessage(
            message => this._handleMessage(message),
            undefined,
            this._context.subscriptions
        );
    }

    _handleMessage(message) {
        const monitorUrl = getMonitorUrl();
        switch (message.command) {
            case 'alert':
                vscode.window.showErrorMessage(message.text);
                return;
            case 'runAgent':
                vscode.window.showInformationMessage(`Agent run started: ${message.prompt}`);
                return;
            case 'stopAgent':
                vscode.window.showInformationMessage('Stop requested. Run `agent stop` in the target repo terminal to fully stop the pipeline.');
                return;
            case 'resumeAgent':
                vscode.window.showInformationMessage('Resume requested. Run `agent resume` in the target repo terminal to continue the pipeline.');
                return;
            case 'openMonitor':
                vscode.env.openExternal(vscode.Uri.parse(monitorUrl));
                return;
            case 'openRun':
                if (message.id) {
                    vscode.env.openExternal(vscode.Uri.parse(`${monitorUrl}/run.html?id=${encodeURIComponent(message.id)}`));
                }
                return;
        }
    }
}

function activate(context) {
    const provider = new AgentHubViewProvider(context);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('agent-hub-panel', provider, {
            webviewOptions: { retainContextWhenHidden: true }
        })
    );

    const openPanel = vscode.commands.registerCommand('agent-hub.openPanel', () => {
        vscode.commands.executeCommand('agent-hub-sidebar.focus');
    });
    context.subscriptions.push(openPanel);
}

// This method is called when the extension is deactivated
function deactivate() {}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 24; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

// Webview UI — warm, terminal-inspired (Claude Code aesthetic),
// themed with VS Code CSS variables and graceful fallbacks.
function getWebviewContent(webview, monitorUrl) {
    const nonce = getNonce();
    let cspConnect = 'http://127.0.0.1:3777 http://localhost:3777';
    try {
        const origin = new URL(monitorUrl).origin;
        const alt = origin.includes('127.0.0.1')
            ? origin.replace('127.0.0.1', 'localhost')
            : origin.replace('localhost', '127.0.0.1');
        cspConnect = [origin, alt].join(' ');
    } catch (e) { /* keep defaults */ }

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src data:; connect-src ${cspConnect};">
    <style>
        :root {
            --bg: var(--vscode-sideBar-background, #1c1915);
            --surface: var(--vscode-editor-background, #231f1a);
            --surface-inset: rgba(255, 255, 255, 0.04);
            --border: var(--vscode-panel-border, rgba(255, 255, 255, 0.10));
            --text: var(--vscode-sideBar-foreground, var(--vscode-foreground, #ece7db));
            --text-dim: var(--vscode-descriptionForeground, #a39d8e);
            --accent: var(--vscode-focusBorder, #d97757);
            --accent-contrast: var(--vscode-button-foreground, #ffffff);
            --btn: var(--vscode-button-background, #d97757);
            --btn-hover: var(--vscode-button-hoverBackground, #e08a6d);
            --input-bg: var(--vscode-input-background, rgba(255, 255, 255, 0.06));
            --input-border: var(--vscode-input-border, rgba(255, 255, 255, 0.14));
            --input-fg: var(--vscode-input-foreground, #ece7db);
            --error: var(--vscode-errorForeground, #f85149);
            --ok: #3fb950;
            --warn: #d29922;
            --mono: var(--vscode-editor-font-family, ui-monospace, Menlo, Consolas, monospace);
            --radius: 6px;
        }

        * { box-sizing: border-box; }

        body {
            margin: 0;
            padding: 12px;
            font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
            font-size: 12.5px;
            line-height: 1.5;
            color: var(--text);
            background: var(--bg);
        }

        button { font-family: inherit; }

        /* ---------- Header ---------- */
        .app-header {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 2px 2px 12px;
        }

        .logo {
            display: grid;
            place-items: center;
            width: 20px;
            height: 20px;
            border-radius: 5px;
            background: var(--btn);
            color: var(--accent-contrast);
            flex: none;
        }

        .logo svg { width: 11px; height: 11px; }

        .app-title { font-weight: 650; font-size: 13px; letter-spacing: -0.1px; }

        .conn {
            margin-left: auto;
            display: inline-flex;
            align-items: center;
            gap: 5px;
            font-size: 10.5px;
            font-weight: 600;
            color: var(--text-dim);
        }

        .conn-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--text-dim); }
        .conn.live .conn-dot { background: var(--ok); animation: pulse 1.8s ease-in-out infinite; }
        .conn.offline .conn-dot { background: var(--error); }

        @keyframes pulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(63, 185, 80, 0.4); }
            50% { box-shadow: 0 0 0 4px rgba(63, 185, 80, 0); }
        }

        /* ---------- Prompt ---------- */
        .prompt-wrap { position: relative; margin-bottom: 8px; }

        textarea#prompt {
            width: 100%;
            min-height: 62px;
            max-height: 160px;
            resize: vertical;
            padding: 9px 11px;
            border: 1px solid var(--input-border);
            border-radius: var(--radius);
            background: var(--input-bg);
            color: var(--input-fg);
            font-family: inherit;
            font-size: 12.5px;
            line-height: 1.45;
        }

        textarea#prompt:focus {
            outline: none;
            border-color: var(--accent);
        }

        textarea#prompt::placeholder { color: var(--text-dim); }

        .prompt-hint {
            margin: 5px 2px 0;
            font-size: 10.5px;
            color: var(--text-dim);
        }

        .prompt-hint kbd {
            font-family: var(--mono);
            font-size: 10px;
            background: var(--surface-inset);
            border: 1px solid var(--border);
            border-radius: 3px;
            padding: 0 4px;
        }

        /* ---------- Buttons ---------- */
        .actions { display: flex; gap: 6px; margin: 10px 0 14px; }

        .btn {
            flex: 1;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: 6px 8px;
            border: 1px solid var(--input-border);
            border-radius: var(--radius);
            background: var(--input-bg);
            color: var(--input-fg);
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.1s ease, border-color 0.1s ease;
        }

        .btn svg { width: 12px; height: 12px; flex: none; }

        .btn:hover { border-color: var(--text-dim); }

        .btn:focus-visible { outline: 1.5px solid var(--accent); outline-offset: 1px; }

        .btn-primary {
            background: var(--btn);
            border-color: var(--btn);
            color: var(--accent-contrast);
        }

        .btn-primary:hover { background: var(--btn-hover); border-color: var(--btn-hover); }

        /* ---------- Cards ---------- */
        .card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            margin-bottom: 10px;
            overflow: hidden;
        }

        .card-head {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 7px 11px;
            border-bottom: 1px solid var(--border);
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--text-dim);
        }

        .card-head .spacer { flex: 1; }

        .card-body { padding: 10px 11px; }

        .icon-btn {
            display: grid;
            place-items: center;
            width: 20px;
            height: 20px;
            border: none;
            border-radius: 4px;
            background: transparent;
            color: var(--text-dim);
            cursor: pointer;
        }

        .icon-btn:hover { background: var(--surface-inset); color: var(--text); }
        .icon-btn svg { width: 12px; height: 12px; }

        /* ---------- Status ---------- */
        .status-row { display: flex; align-items: center; gap: 8px; }

        .status-pill {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 2px 9px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 600;
            background: var(--surface-inset);
            border: 1px solid var(--border);
            color: var(--text-dim);
        }

        .status-pill::before {
            content: '';
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--text-dim);
        }

        .status-pill.state-running { color: var(--ok); border-color: rgba(63, 185, 80, 0.35); }
        .status-pill.state-running::before { background: var(--ok); animation: pulse 1.8s ease-in-out infinite; }
        .status-pill.state-waiting { color: var(--warn); border-color: rgba(210, 153, 34, 0.35); }
        .status-pill.state-waiting::before { background: var(--warn); }
        .status-pill.state-failed { color: var(--error); border-color: rgba(248, 81, 73, 0.35); }
        .status-pill.state-failed::before { background: var(--error); }
        .status-pill.state-done { color: var(--accent); border-color: var(--accent); }
        .status-pill.state-done::before { background: var(--accent); }

        .status-meta { margin-left: auto; font-size: 11px; color: var(--text-dim); font-family: var(--mono); }

        /* ---------- Progress ---------- */
        .progress {
            height: 4px;
            border-radius: 2px;
            background: var(--surface-inset);
            overflow: hidden;
        }

        .progress-fill {
            height: 100%;
            width: 0%;
            border-radius: 2px;
            background: var(--btn);
            transition: width 0.3s ease;
        }

        .progress-labels {
            display: flex;
            justify-content: space-between;
            margin-top: 5px;
            font-size: 10.5px;
            color: var(--text-dim);
            font-family: var(--mono);
        }

        /* ---------- Runs ---------- */
        .run-list { max-height: 220px; overflow-y: auto; }

        .run-item {
            display: block;
            width: 100%;
            padding: 8px 11px;
            border: none;
            border-bottom: 1px solid var(--border);
            background: transparent;
            color: var(--text);
            text-align: left;
            cursor: pointer;
        }

        .run-item:last-child { border-bottom: none; }
        .run-item:hover { background: var(--surface-inset); }

        .run-item-top {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .run-repo { font-weight: 600; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        .run-state {
            margin-left: auto;
            flex: none;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            color: var(--text-dim);
        }

        .run-state.s-running { color: var(--ok); }
        .run-state.s-waiting { color: var(--warn); }
        .run-state.s-failed { color: var(--error); }
        .run-state.s-done { color: var(--accent); }

        .run-item-sub {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 3px;
            font-size: 10.5px;
            color: var(--text-dim);
            font-family: var(--mono);
        }

        .run-item-sub .grow { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        .mini-progress {
            flex: none;
            width: 64px;
            height: 3px;
            border-radius: 2px;
            background: var(--surface-inset);
            overflow: hidden;
        }

        .mini-progress-fill { height: 100%; background: var(--btn); border-radius: 2px; }

        .run-empty {
            padding: 14px 11px;
            text-align: center;
            color: var(--text-dim);
            font-size: 11.5px;
        }

        .run-empty .hint-code {
            font-family: var(--mono);
            font-size: 10.5px;
            background: var(--surface-inset);
            border: 1px solid var(--border);
            border-radius: 4px;
            padding: 1px 5px;
        }

        /* ---------- Gate callout ---------- */
        .gate-callout {
            display: none;
            margin-bottom: 10px;
            padding: 9px 11px;
            border: 1px solid rgba(210, 153, 34, 0.4);
            border-radius: var(--radius);
            background: rgba(210, 153, 34, 0.08);
            color: var(--warn);
            font-size: 11.5px;
            line-height: 1.45;
        }

        .gate-callout strong { font-weight: 650; }
        .gate-callout .hint-code {
            font-family: var(--mono);
            font-size: 10.5px;
            background: var(--surface-inset);
            border-radius: 4px;
            padding: 1px 5px;
        }

        /* ---------- Timeline ---------- */
        .timeline { list-style: none; margin: 0; padding: 4px 0; max-height: 260px; overflow-y: auto; }

        .timeline-item {
            position: relative;
            padding: 4px 11px 8px 28px;
        }

        .timeline-item::before {
            content: '';
            position: absolute;
            left: 14px;
            top: 0;
            bottom: 0;
            width: 1.5px;
            background: var(--border);
        }

        .timeline-item:first-child::before { top: 12px; }
        .timeline-item:last-child::before { bottom: calc(100% - 12px); }

        .timeline-dot {
            position: absolute;
            left: 10.5px;
            top: 9px;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--text-dim);
            border: 2px solid var(--surface);
        }

        .timeline-dot.dot-accent { background: var(--btn); }
        .timeline-dot.dot-warn { background: var(--warn); }
        .timeline-dot.dot-error { background: var(--error); }

        .timeline-head {
            display: flex;
            align-items: baseline;
            gap: 8px;
        }

        .timeline-agent { font-weight: 650; font-size: 11.5px; color: var(--accent); }
        .timeline-time { margin-left: auto; font-size: 10px; color: var(--text-dim); font-family: var(--mono); flex: none; }

        .timeline-msg { margin-top: 2px; font-size: 11.5px; color: var(--text); overflow-wrap: anywhere; }
        .timeline-item.loading .timeline-msg { color: var(--text-dim); font-style: italic; }

        .timeline-empty { padding: 12px 11px; text-align: center; color: var(--text-dim); font-size: 11.5px; }
    </style>
</head>
<body>
    <div class="app-header">
        <span class="logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 4.5v15M4.5 12h15"/></svg>
        </span>
        <span class="app-title">Agent Hub</span>
        <span class="conn" id="conn"><span class="conn-dot"></span><span id="connText">connecting</span></span>
    </div>

    <div class="prompt-wrap">
        <textarea id="prompt" rows="2" placeholder="Describe a task for the agent…" spellcheck="false"></textarea>
        <p class="prompt-hint">Press <kbd>Cmd</kbd>+<kbd>Enter</kbd> to run</p>
    </div>

    <div class="actions">
        <button class="btn btn-primary" id="runBtn" title="Start agent run">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            Run
        </button>
        <button class="btn" id="stopBtn" title="Stop agent run">
            <svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1.5"/></svg>
            Stop
        </button>
        <button class="btn" id="resumeBtn" title="Resume agent run">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>
            Resume
        </button>
    </div>

    <div class="card">
        <div class="card-head">Status</div>
        <div class="card-body">
            <div class="status-row">
                <span class="status-pill" id="statusPill">Ready</span>
                <span class="status-meta" id="statusMeta"></span>
            </div>
            <div class="progress" style="margin-top: 10px;">
                <div class="progress-fill" id="progressFill"></div>
            </div>
            <div class="progress-labels">
                <span id="progressPct">0%</span>
                <span id="progressDetail">idle</span>
            </div>
        </div>
    </div>

    <div class="gate-callout" id="gateCallout">
        <strong>Gate needs input.</strong> A run is waiting for approval — resume it with <span class="hint-code">agent resume</span> in the repo terminal.
    </div>

    <div class="card">
        <div class="card-head">
            Runs
            <span class="spacer"></span>
            <button class="icon-btn" id="refreshRunsBtn" title="Refresh runs">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.6-6.4L21 8"/><path d="M21 3v5h-5"/></svg>
            </button>
        </div>
        <div class="run-list" id="runList">
            <div class="run-empty" id="runEmpty">Loading runs…</div>
        </div>
    </div>

    <div class="card">
        <div class="card-head">Activity</div>
        <ul class="timeline" id="timeline">
            <li class="timeline-empty">No activity yet</li>
        </ul>
    </div>

    <script nonce="${nonce}">
        const vscodeApi = (typeof acquireVsCodeApi === 'function') ? acquireVsCodeApi() : null;
        const MONITOR_URL = ${JSON.stringify(monitorUrl)};

        const $ = (id) => document.getElementById(id);

        function post(command, extra) {
            if (!vscodeApi) return;
            vscodeApi.postMessage(Object.assign({ command }, extra || {}));
        }

        // ---------- Status / progress ----------
        function setStatus(text, state) {
            const pill = $('statusPill');
            pill.textContent = text;
            pill.className = 'status-pill' + (state ? ' state-' + state : '');
        }

        function setProgress(percent, detail) {
            $('progressFill').style.width = Math.max(0, Math.min(100, percent)) + '%';
            $('progressPct').textContent = percent + '%';
            if (detail) $('progressDetail').textContent = detail;
        }

        // ---------- Timeline ----------
        function addTimelineItem(agent, message, loading, kind) {
            const timeline = $('timeline');
            const empty = timeline.querySelector('.timeline-empty');
            if (empty) empty.remove();

            const item = document.createElement('li');
            item.className = 'timeline-item' + (loading ? ' loading' : '');

            const dot = document.createElement('span');
            dot.className = 'timeline-dot' + (kind ? ' dot-' + kind : '');
            item.appendChild(dot);

            const body = document.createElement('div');

            const head = document.createElement('div');
            head.className = 'timeline-head';
            const agentSpan = document.createElement('span');
            agentSpan.className = 'timeline-agent';
            agentSpan.textContent = agent || 'Agent';
            const timeSpan = document.createElement('span');
            timeSpan.className = 'timeline-time';
            timeSpan.textContent = new Date().toLocaleTimeString();
            head.appendChild(agentSpan);
            head.appendChild(timeSpan);
            body.appendChild(head);

            const msg = document.createElement('div');
            msg.className = 'timeline-msg';
            msg.textContent = message || '';
            body.appendChild(msg);

            item.appendChild(body);
            timeline.appendChild(item);
            timeline.scrollTop = timeline.scrollHeight;
        }

        function clearTimeline() {
            const timeline = $('timeline');
            timeline.innerHTML = '';
            const empty = document.createElement('li');
            empty.className = 'timeline-empty';
            empty.textContent = 'No activity yet';
            timeline.appendChild(empty);
        }

        // ---------- Live runs ----------
        function stateClass(state) {
            const s = state || 'unknown';
            if (s === 'waiting_gate') return 'waiting';
            return ['running', 'waiting', 'blocked', 'failed', 'done', 'queued', 'stalled'].includes(s) ? s : 'unknown';
        }

        function relTime(ts) {
            if (!ts) return '';
            const diff = Date.now() - new Date(ts).getTime();
            if (isNaN(diff)) return '';
            const s = Math.max(0, Math.floor(diff / 1000));
            if (s < 60) return s + 's';
            const m = Math.floor(s / 60);
            if (m < 60) return m + 'm';
            const h = Math.floor(m / 60);
            if (h < 24) return h + 'h';
            return Math.floor(h / 24) + 'd';
        }

        function setConn(mode, text) {
            const conn = $('conn');
            conn.className = 'conn ' + mode;
            $('connText').textContent = text;
        }

        async function refreshRuns() {
            try {
                const res = await fetch(MONITOR_URL + '/api/runs');
                if (!res.ok) throw new Error('HTTP ' + res.status);
                const runs = await res.json();
                setConn('live', 'live');
                renderRuns(Array.isArray(runs) ? runs : []);
            } catch (e) {
                setConn('offline', 'offline');
                const list = $('runList');
                list.innerHTML = '';
                const empty = document.createElement('div');
                empty.className = 'run-empty';
                empty.textContent = 'Monitor offline — start it with ';
                const code = document.createElement('span');
                code.className = 'hint-code';
                code.textContent = 'agent monitor';
                empty.appendChild(code);
                list.appendChild(empty);
            }
        }

        function renderRuns(runs) {
            const list = $('runList');
            list.innerHTML = '';

            if (!runs.length) {
                const empty = document.createElement('div');
                empty.className = 'run-empty';
                empty.textContent = 'No runs yet — write a prompt above and press Run.';
                list.appendChild(empty);
                $('gateCallout').style.display = 'none';
                return;
            }

            let gateWaiting = false;

            for (const run of runs.slice(0, 12)) {
                const st = stateClass(run.state);
                if (run.state === 'waiting_gate' || run.state === 'blocked') gateWaiting = true;

                const item = document.createElement('button');
                item.className = 'run-item';
                item.type = 'button';

                const top = document.createElement('div');
                top.className = 'run-item-top';
                const repo = document.createElement('span');
                repo.className = 'run-repo';
                repo.textContent = run.repo || 'unknown repo';
                const state = document.createElement('span');
                state.className = 'run-state s-' + st;
                state.textContent = st;
                top.appendChild(repo);
                top.appendChild(state);
                item.appendChild(top);

                const sub = document.createElement('div');
                sub.className = 'run-item-sub';
                const branch = document.createElement('span');
                branch.className = 'grow';
                branch.textContent = [run.branch, run.stage].filter(Boolean).join(' · ') || (run.id || '').substring(0, 8);
                sub.appendChild(branch);

                if (run.task_index !== undefined && run.task_total) {
                    const done = Math.min(run.task_index + (run.state === 'done' ? 0 : 1), run.task_total);
                    const pct = Math.min(100, Math.round((done / run.task_total) * 100));
                    const bar = document.createElement('span');
                    bar.className = 'mini-progress';
                    const fill = document.createElement('span');
                    fill.className = 'mini-progress-fill';
                    fill.style.width = pct + '%';
                    bar.appendChild(fill);
                    sub.appendChild(bar);
                    const frac = document.createElement('span');
                    frac.textContent = done + '/' + run.task_total;
                    sub.appendChild(frac);
                } else {
                    const when = document.createElement('span');
                    when.textContent = relTime(run.last_heartbeat || run.started_at);
                    sub.appendChild(when);
                }

                item.appendChild(sub);
                item.addEventListener('click', () => post('openRun', { id: run.id }));
                list.appendChild(item);
            }

            $('gateCallout').style.display = gateWaiting ? 'block' : 'none';
        }

        // ---------- Actions ----------
        function submitPrompt() {
            const input = $('prompt');
            const prompt = input.value.trim();
            if (!prompt) return;
            post('runAgent', { prompt });
            input.value = '';
            setStatus('Starting…', 'running');
            setProgress(0, 'starting');
            addTimelineItem('You', prompt, false, 'accent');
            addTimelineItem('Pipeline', 'Starting agent pipeline…', true);
        }

        $('runBtn').addEventListener('click', submitPrompt);
        $('prompt').addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                submitPrompt();
            }
        });

        $('stopBtn').addEventListener('click', () => {
            post('stopAgent');
            setStatus('Stopping…', 'waiting');
            addTimelineItem('Control', 'Stop requested', false, 'warn');
        });

        $('resumeBtn').addEventListener('click', () => {
            post('resumeAgent');
            setStatus('Resuming…', 'running');
            addTimelineItem('Control', 'Resume requested', false, 'accent');
        });

        $('refreshRunsBtn').addEventListener('click', refreshRuns);

        // ---------- Messages from extension host ----------
        window.addEventListener('message', (event) => {
            const message = event.data;
            switch (message.command) {
                case 'updateStatus':
                    setStatus(message.status, message.state);
                    break;
                case 'updateProgress':
                    setProgress(message.progress, message.detail);
                    break;
                case 'addTimelineItem':
                    addTimelineItem(message.agent, message.message, message.loading, message.kind);
                    break;
                case 'clearTimeline':
                    clearTimeline();
                    break;
                case 'showAlert':
                    post('alert', { text: message.text });
                    break;
            }
        });

        refreshRuns();
        setInterval(refreshRuns, 3000);
    </script>
</body>
</html>`;
}

// Export for testing
module.exports = {
    activate,
    deactivate,
    _getWebviewContent: getWebviewContent
};
