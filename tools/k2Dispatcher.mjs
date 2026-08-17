#!/usr/bin/env node
import http from 'http';
import {appendFileSync, mkdirSync, writeFileSync, readFileSync} from 'fs';
import {spawn} from 'child_process';
import {homedir} from 'os';
import path from 'path';

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const portFlagIndex = args.indexOf('--port');
const port = portFlagIndex === -1 ? 8424 : Number(args[portFlagIndex + 1]);
const concurrencyFlagIndex = args.indexOf('--concurrency');
const maxConcurrent = concurrencyFlagIndex === -1 ? 3 : Number(args[concurrencyFlagIndex + 1]);

const baseDir = path.join(homedir(), '.k2');
const resultsDir = path.join(baseDir, 'results');
mkdirSync(resultsDir, {recursive: true});
const queueFile = path.join(baseDir, 'dispatch-queue.jsonl');

const linksMarkdown = items => items.map(item => `- [${item.title || item.url}](${item.url})`).join('\n');

const ACTIONS = {
    reply: {
        kind: 'single',
        prompt: job => `Draft a reply to the latest mention of me on ${job.url}. Do not post anything — print only the draft reply text (ready to paste as a GitHub comment) and stop.`,
    },
    review: {
        kind: 'single',
        prompt: job => `/review-pr ${job.url}`,
    },
    babysit: {
        kind: 'single',
        prompt: job => `/babysit-pr ${job.url}`,
    },
    update: {
        kind: 'single',
        prompt: job => `Draft a status update comment for ${job.url} covering what has happened since my last comment there (linked PR activity, review state, blockers, next step). Do not post anything — print only the draft comment text and stop.`,
    },
    triage: {
        kind: 'batch',
        prompt: job => `/issue-triage\n\n${linksMarkdown(job.items)}`,
    },
    'review-queue': {
        kind: 'batch',
        prompt: job => `/review-queue\n\n${linksMarkdown(job.items)}`,
    },
};

const isGitHubUrl = url => /^https:\/\/github\.com\//.test(url);

const DEDUPE_WINDOW_MS = 10 * 60 * 1000;
const recentJobs = new Map();
const jobs = new Map();
const pendingJobs = [];
let nextJobId = 1;
let runningCount = 0;

function pumpQueue() {
    while (runningCount < maxConcurrent && pendingJobs.length) {
        const job = pendingJobs.shift();
        job.status = 'running';
        runningCount += 1;
        runClaude(job);
    }
}

function runClaude(job) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    job.resultPath = `${stamp}-${job.action}.md`;
    const resultFile = path.join(resultsDir, job.resultPath);
    let draft = '';
    let errors = '';
    let hasFinished = false;
    const finish = (status, draftText) => {
        if (hasFinished) {
            return;
        }
        hasFinished = true;
        job.status = status;
        job.draft = draftText;
        runningCount -= 1;
        pumpQueue();
    };
    const child = spawn('claude', ['-p', ACTIONS[job.action].prompt(job)], {
        cwd: homedir(),
        stdio: ['ignore', 'pipe', 'pipe'],
    });
    child.stdout.on('data', (chunk) => {
        draft += chunk;
    });
    child.stderr.on('data', (chunk) => {
        errors += chunk;
    });
    child.on('error', (error) => {
        console.error(`[error #${job.id}] could not launch claude: ${error.message}`);
        finish('failed', `Could not launch claude: ${error.message}`);
    });
    child.on('close', (code) => {
        writeFileSync(resultFile, draft + (errors ? `\n\n--- stderr ---\n${errors}` : ''));
        console.log(`[${code === 0 ? 'done' : 'failed'} exit=${code}] #${job.id} ${job.action} -> ${resultFile}`);
        finish(code === 0 ? 'done' : 'failed', draft.trim() || errors.trim());
    });
    console.log(`[start #${job.id}] ${job.action} ${job.title}`);
}

function parseDispatchPayload(body) {
    let payload = null;
    try {
        payload = JSON.parse(body);
    } catch (error) {
        return null;
    }
    const action = payload && ACTIONS[payload.action];
    if (!action) {
        return null;
    }
    if (action.kind === 'single') {
        if (!isGitHubUrl(payload.url)) {
            return null;
        }
        return {
            action: payload.action,
            url: payload.url,
            title: payload.title || payload.url,
            dedupeKey: `${payload.action} ${payload.url}`,
        };
    }
    const items = payload.items;
    if (!Array.isArray(items) || !items.length || !items.every(item => item && isGitHubUrl(item.url))) {
        return null;
    }
    return {
        action: payload.action,
        items: items.map(item => ({url: item.url, title: item.title || item.url})),
        itemCount: items.length,
        title: payload.title || `${payload.action} (${items.length} items)`,
        dedupeKey: `${payload.action} ${items.map(item => item.url).join(',')}`,
    };
}

function readBody(request, onDone) {
    let body = '';
    request.on('data', (chunk) => {
        body += chunk;
    });
    request.on('end', () => onDone(body));
}

function sendJSON(response, statusCode, payload) {
    response.writeHead(statusCode, {'Content-Type': 'application/json'});
    response.end(JSON.stringify(payload));
}

const server = http.createServer((request, response) => {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Headers', 'content-type');
    if (request.method === 'OPTIONS') {
        response.writeHead(204);
        response.end();
        return;
    }

    if (request.method === 'GET' && request.url === '/jobs') {
        sendJSON(response, 200, {jobs: [...jobs.values()].reverse()});
        return;
    }

    if (request.method === 'GET' && request.url.startsWith('/results/')) {
        const name = path.basename(decodeURIComponent(request.url.slice('/results/'.length)));
        try {
            const content = readFileSync(path.join(resultsDir, name));
            const type = name.endsWith('.html') ? 'text/html' : 'text/plain; charset=utf-8';
            response.writeHead(200, {'Content-Type': type});
            response.end(content);
        } catch (error) {
            response.writeHead(404);
            response.end();
        }
        return;
    }

    if (request.method === 'POST' && request.url === '/resolve') {
        readBody(request, (body) => {
            let payload = null;
            try {
                payload = JSON.parse(body);
            } catch (error) {
                payload = null;
            }
            if (!payload || !jobs.has(payload.id)) {
                sendJSON(response, 404, {error: 'unknown job'});
                return;
            }
            jobs.delete(payload.id);
            console.log(`[resolved #${payload.id}]`);
            sendJSON(response, 200, {status: 'resolved'});
        });
        return;
    }

    if (request.method !== 'POST' || request.url !== '/dispatch') {
        response.writeHead(404);
        response.end();
        return;
    }

    readBody(request, (body) => {
        const parsed = parseDispatchPayload(body);
        if (!parsed) {
            sendJSON(response, 400, {error: 'bad job'});
            return;
        }

        const lastSeen = recentJobs.get(parsed.dedupeKey);
        if (lastSeen && Date.now() - lastSeen < DEDUPE_WINDOW_MS) {
            console.log(`[skip duplicate] ${parsed.action} ${parsed.title}`);
            sendJSON(response, 200, {status: 'duplicate'});
            return;
        }
        recentJobs.set(parsed.dedupeKey, Date.now());

        const job = {
            id: nextJobId,
            action: parsed.action,
            url: parsed.url || null,
            items: parsed.items || null,
            itemCount: parsed.itemCount || null,
            title: parsed.title,
            status: 'queued',
            draft: null,
            resultPath: null,
            receivedAt: new Date().toISOString(),
        };
        nextJobId += 1;
        jobs.set(job.id, job);

        appendFileSync(queueFile, `${JSON.stringify(job)}\n`);
        if (isDryRun) {
            console.log(`[dry-run queued #${job.id}] ${job.action} ${job.title}`);
        } else {
            pendingJobs.push(job);
            pumpQueue();
        }
        sendJSON(response, 202, {status: 'accepted', id: job.id});
    });
});

server.listen(port, '127.0.0.1', () => {
    console.log(`K2 dispatcher listening on http://127.0.0.1:${port}${isDryRun ? ' (dry run)' : ''} (max ${maxConcurrent} concurrent jobs)`);
    console.log(`Queue: ${queueFile}`);
    console.log(`Results: ${resultsDir}`);
});
