import * as logger from '../../utils/logger.js';

/**
 * Repository Scanner Service
 * Scans GitHub repository for content files without ingestion
 * Read-only operation
 */

/**
 * Parse GitHub repository URL
 * @param {string} repoUrl - GitHub repository URL
 * @returns {{owner: string, name: string, branch?: string, path?: string}}
 */
export function parseRepoUrl(repoUrl) {
    if (!repoUrl || typeof repoUrl !== 'string') {
        throw new Error('Invalid GitHub repository URL format. Expected: https://github.com/owner/repo or owner/repo');
    }
    
    // Trim whitespace and remove trailing slashes
    const url = repoUrl.trim().replace(/\/+$/, '');
    
    // Handle /blob/ URLs (single file view) - extract repo info AND file path
    const blobPattern = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/;
    const blobMatch = url.match(blobPattern);
    if (blobMatch) {
        return {
            owner: blobMatch[1],
            name: blobMatch[2],
            branch: blobMatch[3] || 'main',
            path: blobMatch[4] // Extract the file path
        };
    }
    
    // Handle /tree/ URLs (directory view) - extract repo info AND directory path
    const treePattern = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)\/(.+)$/;
    const treeMatch = url.match(treePattern);
    if (treeMatch) {
        return {
            owner: treeMatch[1],
            name: treeMatch[2],
            branch: treeMatch[3] || 'main',
            path: treeMatch[4] // Extract the directory path
        };
    }
    
    const patterns = [
        /^https:\/\/github\.com\/([^/]+)\/([^/]+)(?:\/tree\/([^/]+))?(?:\/(.+))?/,
        /^git@github\.com:([^/]+)\/([^/]+)\.git$/,
        /^([^/]+)\/([^/]+)$/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            return {
                owner: match[1],
                name: match[2].replace('.git', ''),
                branch: match[3] || 'main',
                path: match[4] || null // Optional path
            };
        }
    }

    throw new Error('Invalid GitHub repository URL format. Expected: https://github.com/owner/repo or owner/repo');
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
 * @param {string} [pathFilter] - Optional path filter to only scan specific folder/file
 * @returns {Promise<{
 *   commit_sha: string,
 *   documents: Array,
 *   assets: Array,
 *   manifests: Array,
 *   total_files: number
 * }>}
 */
export async function scanRepository(token, repo, pathFilter = null) {
    logger.info({ repo: `${repo.owner}/${repo.name}`, pathFilter }, 'Starting repository scan');

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

        const filePath = file.path;

        // Apply path filter if provided
        if (pathFilter) {
            // Check if it's a single file match (no trailing slash and exact match)
            const isSingleFile = !pathFilter.endsWith('/') && filePath === pathFilter;
            
            // Check if it's a directory match (starts with path or path with trailing slash)
            const normalizedPathFilter = pathFilter.endsWith('/') ? pathFilter : pathFilter + '/';
            const isDirectoryMatch = filePath.startsWith(normalizedPathFilter);
            
            // Skip if neither single file nor in directory
            if (!isSingleFile && !isDirectoryMatch) {
                continue;
            }
        }

        // Detect manifest files
        if (filePath.endsWith('manifest.json')) {
            manifests.push(filePath);
            continue;
        }

        // Detect JSON content files (excluding config)
        if (filePath.endsWith('.json') && !filePath.includes('node_modules') && !filePath.startsWith('.')) {
            // Skip non-content JSON files
            if (filePath.includes('package.json') || filePath.includes('tsconfig.json')) {
                continue;
            }
            documents.push(filePath);
            continue;
        }

        // Detect image assets
        if (/\.(png|jpg|jpeg|gif|svg|webp)$/i.test(filePath)) {
            assets.push(filePath);
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
