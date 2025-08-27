#!/usr/bin/env node

import chalk from 'chalk';
import { select, confirm } from '@inquirer/prompts';
import runAllRestApiTests from './rest-api/run-tests.js';
import runAllSdkTests from './sdk/run-tests.js';
import { loadAndAnalyze } from './comparison/analyzer.js';
import { generateReport } from './comparison/report-generator.js';
import setupDatabase from '../scripts/setup-db.js';
import cleanupDatabase from '../scripts/cleanup-db.js';
import runCompleteTestSuite from '../scripts/run-tests.js';

async function main() {
  console.log(chalk.bold.blue('\n🔥 Firebase Realtime Database Verification Tool\n'));
  console.log(chalk.gray('Compare REST API and SDK behavior for path handling\n'));
  
  try {
    const action = await select({
      message: 'What would you like to do?',
      choices: [
        {
          name: '🚀 Run Complete Test Suite',
          value: 'complete',
          description: 'Setup, run all tests, analyze, and generate report'
        },
        {
          name: '🔧 Setup Database',
          value: 'setup',
          description: 'Initialize test database structure'
        },
        {
          name: '🌐 Run REST API Tests Only',
          value: 'rest',
          description: 'Test REST API path behavior'
        },
        {
          name: '🔥 Run SDK Tests Only',
          value: 'sdk',
          description: 'Test Firebase SDK path behavior'
        },
        {
          name: '🔍 Analyze Existing Results',
          value: 'analyze',
          description: 'Compare previous test results'
        },
        {
          name: '📊 Generate Report',
          value: 'report',
          description: 'Create markdown report from analysis'
        },
        {
          name: '🧹 Cleanup Database',
          value: 'cleanup',
          description: 'Remove all test data'
        },
        {
          name: '❌ Exit',
          value: 'exit'
        }
      ]
    });
    
    switch (action) {
      case 'complete':
        await runCompleteTestSuite();
        break;
        
      case 'setup':
        await setupDatabase();
        break;
        
      case 'rest':
        console.log(chalk.cyan('\n🌐 Running REST API Tests...\n'));
        const restResults = await runAllRestApiTests();
        console.log(chalk.green(`\n✅ REST API Tests completed: ${restResults.summary.successful}/${restResults.summary.total} passed`));
        break;
        
      case 'sdk':
        console.log(chalk.cyan('\n🔥 Running Firebase SDK Tests...\n'));
        const sdkResults = await runAllSdkTests();
        console.log(chalk.green(`\n✅ SDK Tests completed: ${sdkResults.summary.successful}/${sdkResults.summary.total} passed`));
        break;
        
      case 'analyze':
        console.log(chalk.cyan('\n🔍 Analyzing Results...\n'));
        const analysis = await loadAndAnalyze();
        if (analysis) {
          console.log(chalk.green('\n✅ Analysis completed'));
          console.log(`  • Identical Behavior: ${analysis.summary.identicalBehavior}/${analysis.summary.totalTests}`);
          console.log(`  • Different Behavior: ${analysis.summary.differentBehavior}/${analysis.summary.totalTests}`);
        }
        break;
        
      case 'report':
        console.log(chalk.cyan('\n📊 Generating Report...\n'));
        const reportPath = await generateReport();
        if (reportPath) {
          console.log(chalk.green(`\n✅ Report generated: ${reportPath}`));
        }
        break;
        
      case 'cleanup':
        const confirmCleanup = await confirm({
          message: 'Are you sure you want to delete all test data?',
          default: false
        });
        
        if (confirmCleanup) {
          await cleanupDatabase();
        } else {
          console.log(chalk.yellow('\n⚠️  Cleanup cancelled'));
        }
        break;
        
      case 'exit':
        console.log(chalk.gray('\n👋 Goodbye!\n'));
        process.exit(0);
        break;
    }
    
    const continuePrompt = await confirm({
      message: '\nWould you like to perform another action?',
      default: true
    });
    
    if (continuePrompt) {
      await main();
    } else {
      console.log(chalk.gray('\n👋 Goodbye!\n'));
      process.exit(0);
    }
    
  } catch (error) {
    if (error.name === 'ExitPromptError') {
      console.log(chalk.gray('\n👋 Goodbye!\n'));
      process.exit(0);
    } else {
      console.error(chalk.red('\n❌ Error:'), error.message);
      process.exit(1);
    }
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  main();
}

export default main;