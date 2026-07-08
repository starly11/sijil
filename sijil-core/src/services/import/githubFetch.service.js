import axios from 'axios';
import * as logger from '../../utils/logger.js';

const RETRY_CONFIG = {
    maxRetries: 5,
    initialDelayMs: 1000,
    maxDelayMs: 60000,
    timeoutMs: 120000,
    largeFileTimeoutMs: 180000,
};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function calculateBackoffDelay(attempt, retryAfterHeader) {
    if (retryAfterHeader) {
        const seconds = parseInt(retryAfterHeader, 10);
        if (!Number.isNaN(seconds) && seconds > 0) {
            return seconds * 1000;
        }
    }
    const exponentialDelay = Math.min(
        RETRY_CONFIG.initialDelayMs * Math.pow(2, attempt),
        RETRY_CONFIG.maxDelayMs
    );
    const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);
    return Math.round(exponentialDelay + jitter);
}

function classifyError(error) {
    const status = error.response?.status;
    const code = error.code;

    if (code === 'ETIMEDOUT' || code === 'ECONNRESET' || code === 'ENOTFOUND') {
        return { isRetryable: true, category: 'NETWORK_ERROR' };
    }
    if (status >= 500 && status < 600) {
        return { isRetryable: true, category: 'SERVER_ERROR' };
    }
    if (status === 429) {
        return { isRetryable: true, category: 'RATE_LIMITED' };
    }
    if (status === 403 && error.response?.headers?.['x-ratelimit-remaining'] === '0') {
        return { isRetryable: true, category: 'RATE_LIMITED' };
    }
    if (status >= 400 && status < 500) {
        return { isRetryable: false, category: 'CLIENT_ERROR' };
    }
    return { isRetryable: true, category: 'UNKNOWN_ERROR' };
}

function githubHeaders(token, accept = 'application/vnd.github.v3+json') {
    return {
        Authorization: `token ${token}`,
        Accept: accept,
        'User-Agent': 'sijil-import-service/1.0',
    };
}

/**
 * Fetch repository tree from GitHub API (single API call for entire repo).
 */
export async function fetchRepositoryTree(token, owner, name, branch = 'main', context = {}) {
    const url = `https://api.github.com/repos/${owner}/${name}/git/trees/${branch}?recursive=1`;
    let lastError = null;

    for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
        try {
            logger.debug({ ...context, url, attempt: attempt + 1 }, 'Fetching repository tree');

            const response = await axios.get(url, {
                headers: githubHeaders(token),
                timeout: RETRY_CONFIG.timeoutMs,
                validateStatus: (status) => status < 500,
            });

            if (response.status >= 400 && response.status < 500) {
                throw Object.assign(new Error(`GitHub API returned ${response.status}: ${response.statusText}`), {
                    response,
                });
            }

            return response.data.tree || [];
        } catch (error) {
            lastError = error;
            const { isRetryable, category } = classifyError(error);

            logger.warn({
                ...context,
                attempt: attempt + 1,
                error: error.message,
                category,
            }, `Repo tree fetch failed (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1})`);

            if (!isRetryable || attempt >= RETRY_CONFIG.maxRetries) {
                throw error;
            }

            const delay = calculateBackoffDelay(attempt, error.response?.headers?.['retry-after']);
            await sleep(delay);
        }
    }

    throw lastError || new Error('Unknown error during repo tree fetch');
}

/**
 * Fetch a JSON file from GitHub. Uses contents API + download_url for large files
 * (files > 1MB cannot be base64-decoded inline).
 */
export async function fetchGitHubJsonFile(token, owner, name, path, branch = 'main', context = {}) {
    const contentsUrl = `https://api.github.com/repos/${owner}/${name}/contents/${path}?ref=${branch}`;
    let lastError = null;

    for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
        try {
            logger.debug({ ...context, path, attempt: attempt + 1 }, 'Fetching file from GitHub');

            const metaResponse = await axios.get(contentsUrl, {
                headers: githubHeaders(token),
                timeout: RETRY_CONFIG.timeoutMs,
                validateStatus: (status) => status < 500,
            });

            if (metaResponse.status >= 400 && metaResponse.status < 500) {
                throw Object.assign(
                    new Error(`GitHub API returned ${metaResponse.status} for ${path}`),
                    { response: metaResponse }
                );
            }

            const meta = metaResponse.data;

            if (meta.content && meta.encoding === 'base64') {
                const text = Buffer.from(meta.content, 'base64').toString('utf-8');
                return JSON.parse(text);
            }

            const downloadUrl = meta.download_url
                || `https://raw.githubusercontent.com/${owner}/${name}/${branch}/${path}`;

            const fileSize = meta.size || 0;
            const downloadTimeout = fileSize > 1_000_000
                ? RETRY_CONFIG.largeFileTimeoutMs
                : RETRY_CONFIG.timeoutMs;

            const downloadResponse = await axios.get(downloadUrl, {
                headers: githubHeaders(token, 'application/vnd.github.v3.raw'),
                timeout: downloadTimeout,
                maxContentLength: 50 * 1024 * 1024,
                maxBodyLength: 50 * 1024 * 1024,
                validateStatus: (status) => status < 500,
            });

            if (downloadResponse.status >= 400 && downloadResponse.status < 500) {
                throw Object.assign(
                    new Error(`GitHub download returned ${downloadResponse.status} for ${path}`),
                    { response: downloadResponse }
                );
            }

            const data = downloadResponse.data;
            return typeof data === 'string' ? JSON.parse(data) : data;
        } catch (error) {
            lastError = error;
            const { isRetryable, category } = classifyError(error);

            logger.warn({
                ...context,
                attempt: attempt + 1,
                error: error.message,
                category,
            }, `GitHub file fetch failed (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1})`);

            if (!isRetryable || attempt >= RETRY_CONFIG.maxRetries) {
                throw error;
            }

            const delay = calculateBackoffDelay(attempt, error.response?.headers?.['retry-after']);
            await sleep(delay);
        }
    }

    throw lastError || new Error(`Unknown error fetching ${path}`);
}
