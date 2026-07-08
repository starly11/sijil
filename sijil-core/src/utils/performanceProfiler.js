import * as logger from './logger.js';

// Performance profiler utility
class PerformanceProfiler {
  constructor(name) {
    this.name = name;
    this.timers = new Map();
    this.dbOperations = [];
    this.metrics = {
      timers: {},
      mongoDB: {
        queries: 0,
        inserts: 0,
        updates: 0,
        bulkWrites: 0,
        insertManys: 0,
        deletes: 0,
        collections: {}
      },
      repeatedWork: {
        duplicateChecks: 0,
        versionLookups: 0,
        slugGenerations: 0
      }
    };
  }

  // Start a timer
  startTimer(stageName) {
    const startTime = process.hrtime.bigint();
    this.timers.set(stageName, startTime);
    logger.debug(`[PERF] Starting timer for: "${stageName}"`);
    return startTime;
  }

  // Stop a timer and record duration
  stopTimer(stageName) {
    const startTime = this.timers.get(stageName);
    if (!startTime) {
      logger.warn(`[PERF] Timer "${stageName}" was never started`);
      return null;
    }
    const endTime = process.hrtime.bigint();
    const durationNs = endTime - startTime;
    const durationMs = Number(durationNs / BigInt(1000000));
    const durationS = durationMs / 1000;
    this.timers.delete(stageName);
    this.metrics.timers[stageName] = {
      startTime: Number(startTime),
      endTime: Number(endTime),
      durationNs: durationNs,
      durationMs,
      durationS
    };
    logger.debug(`[PERF] Timer "${stageName}" completed: ${durationS.toFixed(3)}s (${durationMs}ms)`);
    return { durationMs, durationS };
  }

  // Increment MongoDB query count (alias for backward compatibility)
  trackMongoOperation(collectionName, operationType, durationMs, docsWritten = 0) {
    this.metrics.mongoDB.queries++;

    // Track operation type counts
    const opLower = operationType.toLowerCase();
    if (opLower.includes('insert')) {
      this.metrics.mongoDB.inserts++;
    } else if (opLower.includes('update')) {
      this.metrics.mongoDB.updates++;
    } else if (opLower.includes('delete')) {
      this.metrics.mongoDB.deletes++;
    } else if (opLower.includes('bulk')) {
      this.metrics.mongoDB.bulkWrites++;
    } else if (opLower.includes('insertmany')) {
      this.metrics.mongoDB.insertManys++;
    }

    // Track collection-specific metrics
    if (collectionName) {
      if (!this.metrics.mongoDB.collections[collectionName]) {
        this.metrics.mongoDB.collections[collectionName] = { inserts: 0, updates: 0, deletes: 0, docsWritten: 0, operations: [] };
      }

      if (opLower.includes('insert') || opLower.includes('bulk') || opLower.includes('insertmany')) {
        this.metrics.mongoDB.collections[collectionName].inserts++;
      } else if (opLower.includes('update')) {
        this.metrics.mongoDB.collections[collectionName].updates++;
      } else if (opLower.includes('delete')) {
        this.metrics.mongoDB.collections[collectionName].deletes++;
      }

      if (docsWritten > 0) {
        this.metrics.mongoDB.collections[collectionName].docsWritten += docsWritten;
      }
    }
  }

  // Increment MongoDB query count
  incrementMongoQuery(collectionName, operationType, docsWritten = 0) {
    this.trackMongoOperation(collectionName, operationType, 0, docsWritten);
  }

  // Track individual database operation
  trackDbOperation(operation, collectionName, docCount, durationMs) {
    this.dbOperations.push({
      operation,
      collectionName,
      docCount,
      durationMs,
      durationS: durationMs / 1000
    });
  }

  // Print sorted DB operations table
  printDbOperationsTable() {
    if (this.dbOperations.length === 0) return;

    // Sort by duration descending
    const sortedOps = [...this.dbOperations].sort((a, b) => b.durationMs - a.durationMs);
    const totalDbTime = sortedOps.reduce((sum, op) => sum + op.durationMs, 0);

    logger.info('');
    logger.info('=================================== DATABASE OPERATIONS ===================================');
    logger.info('');
    logger.info('Operation              Collection              Docs       Duration (ms)  Duration (s)  % of Total');
    logger.info('-------------------------------------------------------------------------------------------');

    for (const op of sortedOps) {
      const percent = totalDbTime > 0 ? ((op.durationMs / totalDbTime) * 100).toFixed(1) : '0.0';
      const opStr = op.operation.padEnd(20);
      const collStr = op.collectionName.padEnd(25);
      const docStr = op.docCount.toString().padStart(8);
      const msStr = op.durationMs.toFixed(1).padStart(15);
      const sStr = op.durationS.toFixed(3).padStart(13);
      const percentStr = percent.padStart(10) + '%';
      logger.info(`${opStr}${collStr}${docStr}${msStr}${sStr}${percentStr}`);
    }

    logger.info('-------------------------------------------------------------------------------------------');
    const totalStr = 'TOTAL'.padEnd(20) + ''.padEnd(25) + ''.padStart(8) + totalDbTime.toFixed(1).padStart(15) + (totalDbTime / 1000).toFixed(3).padStart(13) + '  100.0%';
    logger.info(totalStr);
    logger.info('===========================================================================================');
    logger.info('');

    // Highlight the slowest operation
    if (sortedOps.length > 0) {
      const slowest = sortedOps[0];
      const slowPercent = totalDbTime > 0 ? ((slowest.durationMs / totalDbTime) * 100).toFixed(1) : '0.0';

      logger.info('⚠️ SLOWEST OPERATION:');
      logger.info(`   ${slowest.operation} on ${slowest.collectionName} (${slowest.docCount} docs)`);
      logger.info(`   Duration: ${slowest.durationS.toFixed(3)}s (${slowPercent}% of total DB time)`);
      logger.info('');
    }
  }

  // Track number of docs written to collection
  addDocsWritten(collectionName, count = 1) {
    if (!this.metrics.mongoDB.collections[collectionName]) {
      this.metrics.mongoDB.collections[collectionName] = { inserts: 0, updates: 0, deletes: 0, docsWritten: 0 };
    }
    if (!this.metrics.mongoDB.collections[collectionName].docsWritten) {
      this.metrics.mongoDB.collections[collectionName].docsWritten = 0;
    }
    this.metrics.mongoDB.collections[collectionName].docsWritten += count;
  }

  // Increment repeated work counter
  incrementRepeatedWork(type, count = 1) {
    this.metrics.repeatedWork[type] = (this.metrics.repeatedWork[type] || 0) + count;
    logger.debug(`[PERF] Repeated work "${type}" incremented to ${this.metrics.repeatedWork[type]}`);
  }

  // Get metrics
  getMetrics() {
    return { ...this.metrics };
  }

  // Print performance summary
  printSummary(chapterName = 'Unknown Chapter') {
    const timers = this.metrics.timers;
    const totalTimeS = Object.values(timers).reduce((acc, t) => acc + (t.durationS || 0), 0);

    // Find bottleneck
    let bottleneck = null;
    let maxTime = 0;
    for (const [name, timer] of Object.entries(timers)) {
      if ((timer.durationS || 0) > maxTime) {
        maxTime = timer.durationS || 0;
        bottleneck = name;
      }
    }
    const bottleneckPercent = totalTimeS > 0 ? (maxTime / totalTimeS) * 100 : 0;

    logger.info('\n' + '='.repeat(90));
    logger.info('INGESTION PERFORMANCE REPORT');
    logger.info('');
    logger.info(`Chapter: ${chapterName}`);
    logger.info('');

    for (const [name, timer] of Object.entries(timers)) {
      logger.info(name);
      logger.info(`  ${(timer.durationS || 0).toFixed(2)}s`);
      logger.info(' ');
    }

    logger.info('');
    logger.info('TOTAL TIME');
    logger.info('');
    logger.info(`  ${totalTimeS.toFixed(2)} seconds`);
    logger.info('');

    if (bottleneck && maxTime > 0) {
      logger.info('⚠️ Largest Bottleneck:');
      logger.info(`  ${bottleneck}`);
      logger.info(`  ${maxTime.toFixed(2)} seconds`);
      logger.info(`  ${bottleneckPercent.toFixed(1)}% of total execution time`);
    }
    logger.info('='.repeat(90) + '\n');

    // Print detailed DB operations table
    this.printDbOperationsTable();
  }
}

// Create a profiler
export function createProfiler(name) {
  return new PerformanceProfiler(name);
}

// Store current profiler
let currentProfiler = null;

export function getCurrentProfiler() {
  return currentProfiler;
}

export function setCurrentProfiler(profiler) {
  currentProfiler = profiler;
}