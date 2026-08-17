#!/usr/bin/env node
import http from 'http';
import {appendFileSync, mkdirSync, writeFileSync} from 'fs';
import {spawn} from 'child_process';
import {homedir} from 'os';
import path from 'path';

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const portFlagIndex = args.indexOf('--port');
const port = portFlagIndex === -1 ? 8424 : Number(args[portFlagIndex + 1]);

const baseDir = path.join(homedir(), '.k2');
const resultsDir = path.join(baseDir, 'results');
mkdirSync(resultsDir, {recursive: true});
const queueFile = path.join(baseDir, 'dispatch-queue.jsonl');

const CLAUDE_PROMPTS = {
    reply: job => `Draft a reply to the latest mention of me on ${job.url}. Do not post anything — print only the draft reply text (ready to paste as a GitHub comment) and stop.`,
    review: job => `/review-pr ${job.url}`,
    babysit: job => `/babysit-pr ${job.url}`,
    update: job => `Draft a status update comment for ${job.url} covering what has happened since my last comment there (linked PR activity, review state, blockers, next step). Do not post anything — print only the draft comment text and stop.`,
};

const DEDUPE_WINDOW_MS = 10 * 60 * 1000;
const recentJobs = new Map();
const jobs = new Map();
let nextJobId = 1;

function runClaude(job) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultFile = path.join(resultsDir, `${stamp}-${job.action}.md`);
    const child = spawn('claude', ['-p', CLAUDE_PROMPTS[job.action](job)], {
        cwd: homedir(),
        stdio: ['ignore', 'pipe', 'pipe'],
    });
    let draft = '';
    let errors = '';
    child.stdout.on('data', (chunk) => {
        draft += chunk;
    });
    child.stderr.on('data', (chunk) => {
        errors += chunk;
    });
    child.on('error', (error) => {
        job.status = 'failed';
        job.draft = `Could not launch claude: ${error.message}`;
        console.error(`[error] ${job.draft}`);
    });
    child.on('close', (code) => {
        job.status = code === 0 ? 'done' : 'failed';
        job.draft = draft.trim() || errors.trim();
        writeFileSync(resultFile, draft + (errors ? `\n\n--- stderr ---\n${errors}` : ''));
        console.log(`[${job.status} exit=${code}] ${job.action} ${job.url} -> ${resultFile}`);
    });
    console.log(`[start #${job.id}] ${job.action} ${job.url}`);
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
        let job = null;
        try {
            job = JSON.parse(body);
        } catch (error) {
            job = null;
        }
        if (!job || !CLAUDE_PROMPTS[job.action] || !/^https:\/\/github\.com\//.test(job.url)) {
            sendJSON(response, 400, {error: 'bad job'});
            return;
        }

        const dedupeKey = `${job.action} ${job.url}`;
        const lastSeen = recentJobs.get(dedupeKey);
        if (lastSeen && Date.now() - lastSeen < DEDUPE_WINDOW_MS) {
            console.log(`[skip duplicate] ${dedupeKey}`);
            sendJSON(response, 200, {status: 'duplicate'});
            return;
        }
        recentJobs.set(dedupeKey, Date.now());

        job = {
            id: nextJobId,
            action: job.action,
            url: job.url,
            title: job.title || job.url,
            status: isDryRun ? 'queued' : 'running',
            draft: null,
            receivedAt: new Date().toISOString(),
        };
        nextJobId += 1;
        jobs.set(job.id, job);

        appendFileSync(queueFile, `${JSON.stringify(job)}\n`);
        if (isDryRun) {
            console.log(`[dry-run queued #${job.id}] ${dedupeKey}`);
        } else {
            runClaude(job);
        }
        sendJSON(response, 202, {status: 'accepted', id: job.id});
    });
});

server.listen(port, '127.0.0.1', () => {
    console.log(`K2 dispatcher listening on http://127.0.0.1:${port}${isDryRun ? ' (dry run)' : ''}`);
    console.log(`Queue: ${queueFile}`);
    console.log(`Results: ${resultsDir}`);
});
