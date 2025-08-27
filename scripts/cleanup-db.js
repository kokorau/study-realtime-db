#!/usr/bin/env node

import { initializeFirebaseSDK, closeConnections } from '../src/config/firebase.js';
import { deletePath, readFromPath } from '../src/utils/db-helper.js';
import logger from '../src/utils/logger.js';
import chalk from 'chalk';
import ora from 'ora';
import dotenv from 'dotenv';

dotenv.config();

async function cleanupDatabase() {
  console.log(chalk.bold.blue('\n🧹 Cleaning up Firebase Realtime Database test data\n'));
  
  const cleanupEnabled = process.env.TEST_CLEANUP_ENABLED !== 'false';
  
  if (!cleanupEnabled) {
    console.log(chalk.yellow('⚠️  Cleanup is disabled in environment settings'));
    console.log(chalk.gray('Set TEST_CLEANUP_ENABLED=true to enable cleanup'));
    return;
  }
  
  const spinner = ora({
    text: 'Initializing Firebase connection...',
    color: 'cyan'
  }).start();
  
  try {
    const { database } = initializeFirebaseSDK();
    spinner.succeed('Firebase connection established');
    
    spinner.start('Identifying test data...');
    
    const testPaths = [
      'test-rest-api',
      'test-sdk',
      'multi-path-test',
      'sdk-multi-path',
      'verification-tests',
      'sdk-users',
      'sdk-posts',
      'sdk-test',
      'sdk-root-update-1',
      'sdk-root-update-2',
      'sdk-empty-base-1',
      'sdk-empty-base-2',
      'projects/test-project-',
      'projects/sdk-test-project-',
      'projects/sdk-projectId',
      'projects/sdk-projectId2',
      'projects/project1',
      'projects/project2'
    ];
    
    const namespacePrefix = process.env.TEST_NAMESPACE || 'test_verification_';
    
    const pathsToDelete = [];
    let totalSize = 0;
    
    for (const path of testPaths) {
      try {
        const data = await readFromPath(database, path);
        if (data !== null) {
          pathsToDelete.push(path);
          const size = JSON.stringify(data).length;
          totalSize += size;
        }
      } catch (error) {
        // Path doesn't exist, skip
      }
    }
    
    try {
      const rootData = await readFromPath(database, '/');
      if (rootData) {
        Object.keys(rootData).forEach(key => {
          if (key.startsWith(namespacePrefix) || 
              key.startsWith('test-') || 
              key.startsWith('sdk-') ||
              key.includes('verification-tests')) {
            pathsToDelete.push(key);
          }
        });
      }
    } catch (error) {
      // Root read failed, skip
    }
    
    spinner.succeed(`Found ${pathsToDelete.length} test paths to clean`);
    
    if (pathsToDelete.length === 0) {
      console.log(chalk.green('\n✨ No test data found to clean up'));
      await closeConnections();
      return;
    }
    
    console.log(chalk.gray('\nPaths to be deleted:'));
    pathsToDelete.forEach(path => {
      console.log(chalk.gray(`  • ${path}`));
    });
    
    spinner.start('Deleting test data...');
    
    let deleted = 0;
    let failed = 0;
    
    for (const path of pathsToDelete) {
      try {
        await deletePath(database, path);
        deleted++;
      } catch (error) {
        logger.error(`Failed to delete path: ${path}`, { error: error.message });
        failed++;
      }
    }
    
    if (failed === 0) {
      spinner.succeed(`Successfully deleted ${deleted} test paths`);
    } else {
      spinner.warn(`Deleted ${deleted} paths, ${failed} failed`);
    }
    
    console.log(chalk.green('\n✅ Cleanup completed!'));
    console.log(chalk.gray(`  Paths cleaned: ${deleted}`));
    console.log(chalk.gray(`  Approximate data removed: ${(totalSize / 1024).toFixed(2)} KB`));
    
    await closeConnections();
    
  } catch (error) {
    spinner.fail('Cleanup failed');
    logger.error('Database cleanup failed', { error: error.message });
    console.error(chalk.red('\n❌ Cleanup failed:'), error.message);
    process.exit(1);
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  cleanupDatabase()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error(chalk.red('\n❌ Fatal error:'), error);
      process.exit(1);
    });
}

export default cleanupDatabase;