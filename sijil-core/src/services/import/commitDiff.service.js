const axios = require('axios');

/**
 * PHASE 20C TASK 1: Real Commit Difference Engine
 * Compares previous commit SHA with current commit SHA
 * Detects: new, modified, deleted, unchanged files
 */
async function getCommitDiff(owner, repo, prevSha, currentSha, branch = 'main') {
  if (!prevSha || prevSha === currentSha) {
    // No previous commit or same commit: all files are "new" for import purposes
    // We need to fetch the full tree to know what exists
    const treeRes = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${currentSha}?recursive=1`,
      { headers: { Accept: 'application/vnd.github.v3+json' } }
    );
    
    const files = treeRes.data.tree
      .filter(item => item.type === 'blob' && item.path.endsWith('.json'))
      .map(item => item.path);
    
    return {
      newFiles: files,
      modifiedFiles: [],
      deletedFiles: [],
      unchangedFiles: []
    };
  }

  // Compare two commits
  const compareRes = await axios.get(
    `https://api.github.com/repos/${owner}/${repo}/compare/${prevSha}...${currentSha}`,
    { headers: { Accept: 'application/vnd.github.v3+json' } }
  );

  const files = compareRes.data.files || [];
  
  const newFiles = [];
  const modifiedFiles = [];
  const deletedFiles = [];
  const unchangedFiles = [];

  for (const file of files) {
    if (!file.filename.endsWith('.json')) continue;

    if (file.status === 'added') {
      newFiles.push(file.filename);
    } else if (file.status === 'modified') {
      modifiedFiles.push(file.filename);
    } else if (file.status === 'removed') {
      deletedFiles.push(file.filename);
    } else if (file.status === 'unchanged') {
      unchangedFiles.push(file.filename);
    }
  }

  return { newFiles, modifiedFiles, deletedFiles, unchangedFiles };
}

module.exports = { getCommitDiff };
