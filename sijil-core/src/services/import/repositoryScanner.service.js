import * as logger from '../../utils/logger.js';

/**
 * Repository Scanner Service
 * Scans GitHub repository for content files without ingestion
 * Read-only operation
 */

/**
 * Parse GitHub repository URL
 * @param {string} repoUrl - GitHub repository URL
 * @returns {{owner: string, name: string, branch?: string}}
 */
export function parseRepoUrl(repoUrl) {
    const patterns = [
        /^https:\/\/github\.com\/([^/]+)\/([^/]+)(?:\/tree\/([^/]+))?/,
        /^git@github\.com:([^/]+)\/([^/]+)\.git$/,
        /^([^/]+)\/([^/]+)$/
    ];

    for (const pattern of patterns) {
        const match = repoUrl.match(pattern);
        if (match) {
            return {
                owner: match[1],
                name: match[2].replace('.git', ''),
                branch: match[3] || 'main'
            };
        }
    }

    throw new Error('Invalid GitHub repository URL format');
}

/**
 * Build GitHub API URLs for repository access
 * @param {{owner: string, name: string, branch: string}} repo - Parsed repository info
 * @returns {{contentsUrl: string, commitUrl: string, treeUrl: string}}
 */
export function buildApiUrls(repo) {
    const baseUrl = `https://api.github.com/repos/${repo.owner}/${repo.name}`;
    return {
        contentsUrl: `${baseUrl}/contents`,
        commitUrl: `${baseUrl}/commits/${repo.branch}`,
        treeUrl: `${baseUrl}/git/trees/${repo.branch}?recursive=1`
    };
}

/**
 * Fetch repository tree from GitHub API
 * @param {string} token - GitHub PAT
 * @param {string} treeUrl - GitHub tree API URL
 * @returns {Promise<Array>} List of files in repository
 */
export async function fetchRepositoryTree(token, treeUrl) {
    const response = await fetch(treeUrl, {
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });

    if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.tree || [];
}

/**
 * Get latest commit SHA from repository
 * @param {string} token - GitHub PAT
 * @param {string} commitUrl - GitHub commit API URL
 * @returns {Promise<string>} Commit SHA
 */
export async function fetchLatestCommit(token, commitUrl) {
    const response = await fetch(commitUrl, {
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });

    if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.sha;
}

/**
 * Scan repository for content files
 * @param {string} token - GitHub PAT
 * @param {{owner: string, name: string, branch: string}} repo - Parsed repository info
 * @returns {Promise<{
 *   commit_sha: string,
 *   documents: Array,
 *   assets: Array,
 *   manifests: Array,
 *   total_files: number
 * }>}
 */
export async function scanRepository(token, repo) {
    logger.info({ repo: `${repo.owner}/${repo.name}` }, 'Starting repository scan');

    const urls = buildApiUrls(repo);
    
    // Fetch commit SHA
    const commit_sha = await fetchLatestCommit(token, urls.commitUrl);
    
    // Fetch repository tree
    const tree = await fetchRepositoryTree(token, urls.treeUrl);

    const documents = [];
    const assets = [];
    const manifests = [];

    // Filter and categorize files
    for (const file of tree) {
        if (file.type !== 'blob') continue;

        const path = file.path;

        // Detect manifest files
        if (path.endsWith('manifest.json')) {
            manifests.push(path);
            continue;
        }

        // Detect JSON content files (excluding config)
        if (path.endsWith('.json') && !path.includes('node_modules') && !path.startsWith('.')) {
            // Skip non-content JSON files
            if (path.includes('package.json') || path.includes('tsconfig.json')) {
                continue;
            }
            documents.push(path);
            continue;
        }

        // Detect image assets
        if (/\.(png|jpg|jpeg|gif|svg|webp)$/i.test(path)) {
            assets.push(path);
        }
    }

    const result = {
        commit_sha,
        documents,
        assets,
        manifests,
        total_files: tree.length
    };

    logger.info(
        { 
            repo: `${repo.owner}/${repo.name}`,
            documents: documents.length,
            assets: assets.length,
            manifests: manifests.length
        },
        'Repository scan completed'
    );

    return result;
}

/**
 * Validate repository structure
 * @param {Object} scanResult - Result from scanRepository
 * @returns {{valid: boolean, errors: Array, warnings: Array}}
 */
export function validateRepositoryStructure(scanResult) {
    const errors = [];
    const warnings = [];

    // Check for minimum requirements
    if (scanResult.documents.length === 0) {
        errors.push('No JSON document files found in repository');
    }

    // Check for manifest
    if (scanResult.manifests.length === 0) {
        warnings.push('No manifest.json found - using default structure assumptions');
    } else if (scanResult.manifests.length > 1) {
        warnings.push(`Multiple manifest files found: ${scanResult.manifests.join(', ')}`);
    }

    // Check asset to document ratio
    if (scanResult.assets.length === 0 && scanResult.documents.length > 0) {
        warnings.push('No image assets found - documents may have missing images');
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}
