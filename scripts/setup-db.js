#!/usr/bin/env node

import { initializeFirebaseSDK, closeConnections } from '../src/config/firebase.js';
import { writeToPath, deletePath } from '../src/utils/db-helper.js';
import { createTestStructure } from '../src/utils/test-data.js';
import { DB_STRUCTURE } from '../src/config/constants.js';
import logger from '../src/utils/logger.js';
import chalk from 'chalk';
import ora from 'ora';

async function setupDatabase() {
  console.log(chalk.bold.blue('\n🔧 Setting up Firebase Realtime Database for testing\n'));
  
  const spinner = ora({
    text: 'Initializing Firebase connection...',
    color: 'cyan'
  }).start();
  
  try {
    const { database } = initializeFirebaseSDK();
    spinner.succeed('Firebase connection established');
    
    spinner.start('Cleaning up existing test data...');
    const testPaths = [
      'test-rest-api',
      'test-sdk',
      'multi-path-test',
      'sdk-multi-path',
      'verification-tests',
      DB_STRUCTURE.BASE_PATH
    ];
    
    for (const path of testPaths) {
      try {
        await deletePath(database, path);
      } catch (error) {
        // Ignore errors for non-existent paths
      }
    }
    spinner.succeed('Existing test data cleaned');
    
    spinner.start('Creating initial test structure...');
    const testStructure = createTestStructure();
    await writeToPath(database, DB_STRUCTURE.BASE_PATH, testStructure);
    spinner.succeed('Test structure created');
    
    console.log(chalk.green('\n✅ Database setup completed successfully!\n'));
    console.log(chalk.gray('Test structure created at:'));
    console.log(chalk.cyan(`  ${DB_STRUCTURE.BASE_PATH}/`));
    console.log(chalk.cyan(`  └── ${DB_STRUCTURE.PROJECTS_PATH}/`));
    console.log(chalk.cyan(`      └── ${DB_STRUCTURE.TEST_PROJECT_ID}/`));
    console.log(chalk.cyan(`          └── ${DB_STRUCTURE.PAGE_VIEWS_PATH}/`));
    console.log(chalk.cyan(`              └── ${DB_STRUCTURE.TEST_PAGE_UUID}/`));
    
    await closeConnections();
    
  } catch (error) {
    spinner.fail('Setup failed');
    logger.error('Database setup failed', { error: error.message });
    console.error(chalk.red('\n❌ Setup failed:'), error.message);
    
    console.log(chalk.yellow('\n💡 Troubleshooting tips:'));
    console.log('  1. Check your .env file configuration');
    console.log('  2. Verify Firebase project exists and is accessible');
    console.log('  3. Ensure database rules allow write access');
    console.log('  4. Check internet connection');
    
    process.exit(1);
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  setupDatabase()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error(chalk.red('\n❌ Fatal error:'), error);
      process.exit(1);
    });
}

export default setupDatabase;