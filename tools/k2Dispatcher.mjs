#!/usr/bin/env node
import http from 'http';
import {appendFileSync, mkdirSync, createWriteStream} from 'fs';
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
    reply: job => `Draft a reply to the latest mention of me on ${job.url}. Do not post anything — print the draft reply and stop.`,
    review: job => `/review-pr ${job.url}`,
    babysit: job => `/babysit-pr ${job.url}`,
    update: job => `Draft a status update comment for ${job.url} covering what has happened since my last comment there (linked PR activity, review state, blockers, next step). Do not post anything — print the draft and stop.`,
};

const DEDUPE_WINDOW_MS = 10 * 60 * 1000;
const recentJobs = new Map();

function runClaude(job) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultFile = path.join(resultsDir, `${stamp}-${job.action}.md`);
    const child = spawn('claude', ['-p', CLAUDE_PROMPTS[job.action](job)], {
        cwd: homedir(),
        stdio: ['ignore', 'pipe', 'pipe'],
    });
    const output = createWriteStream(resultFile);
    child.stdout.pipe(output);
    child.stderr.pipe(output);
    child.on('error', error => console.error(`[error] could not launch claude: ${error.message}`));
    child.on('close', code => console.log(`[done exit=${code}] ${job.action} ${job.url} -> ${resultFile}`));
    console.log(`[start] ${job.action} ${job.url}`);
}

const server = http.createServer((request, response) => {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Headers', 'content-type');
    if (request.method === 'OPTIONS') {
        response.writeHead(204);
        response.end();
        return;
    }
    if (request.method !== 'POST' || request.url !== '/dispatch') {
        response.writeHead(404);
        response.end();
        return;
    }

    let body = '';
    request.on('data', (chunk) => {
        body += chunk;
    });
    request.on('end', () => {
        let job = null;
        try {
            job = JSON.parse(body);
        } catch (error) {
            job = null;
        }
        if (!job || !CLAUDE_PROMPTS[job.action] || !/^https:\/\/github\.com\//.test(job.url)) {
            response.writeHead(400, {'Content-Type': 'application/json'});
            response.end('{"error":"bad job"}');
            return;
        }

        const dedupeKey = `${job.action} ${job.url}`;
        const lastSeen = recentJobs.get(dedupeKey);
        if (lastSeen && Date.now() - lastSeen < DEDUPE_WINDOW_MS) {
            console.log(`[skip duplicate] ${dedupeKey}`);
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end('{"status":"duplicate"}');
            return;
        }
        recentJobs.set(dedupeKey, Date.now());

        appendFileSync(queueFile, `${JSON.stringify({...job, receivedAt: new Date().toISOString()})}\n`);
        if (isDryRun) {
            console.log(`[dry-run queued] ${dedupeKey}`);
        } else {
            runClaude(job);
        }
        response.writeHead(202, {'Content-Type': 'application/json'});
        response.end('{"status":"accepted"}');
    });
});

server.listen(port, '127.0.0.1', () => {
    console.log(`K2 dispatcher listening on http://127.0.0.1:${port}/dispatch${isDryRun ? ' (dry run)' : ''}`);
    console.log(`Queue: ${queueFile}`);
    console.log(`Results: ${resultsDir}`);
});
