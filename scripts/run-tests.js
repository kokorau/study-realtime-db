#!/usr/bin/env node

import ora from 'ora';
import chalk from 'chalk';
import runAllRestApiTests from '../src/rest-api/run-tests.js';
import runAllSdkTests from '../src/sdk/run-tests.js';
import { loadAndAnalyze } from '../src/comparison/analyzer.js';
import { generateReport } from '../src/comparison/report-generator.js';
import logger from '../src/utils/logger.js';

async function runCompleteTestSuite() {
  console.log(chalk.bold.blue('\n🚀 Firebase Realtime Database Behavior Verification Suite\n'));
  
  const steps = [
    {
      name: 'REST API Tests',
      fn: runAllRestApiTests,
      emoji: '🌐'
    },
    {
      name: 'Firebase SDK Tests',
      fn: runAllSdkTests,
      emoji: '🔥'
    },
    {
      name: 'Analyzing Results',
      fn: loadAndAnalyze,
      emoji: '🔍'
    },
    {
      name: 'Generating Report',
      fn: generateReport,
      emoji: '📊'
    }
  ];
  
  const results = {
    restApi: null,
    sdk: null,
    analysis: null,
    report: null
  };
  
  for (const step of steps) {
    const spinner = ora({
      text: `${step.emoji} Running ${step.name}...`,
      color: 'cyan'
    }).start();
    
    try {
      const result = await step.fn();
      
      switch (step.name) {
        case 'REST API Tests':
          results.restApi = result;
          spinner.succeed(chalk.green(`${step.emoji} ${step.name} completed: ${result.summary.successful}/${result.summary.total} passed`));
          break;
        case 'Firebase SDK Tests':
          results.sdk = result;
          spinner.succeed(chalk.green(`${step.emoji} ${step.name} completed: ${result.summary.successful}/${result.summary.total} passed`));
          break;
        case 'Analyzing Results':
          results.analysis = result;
          spinner.succeed(chalk.green(`${step.emoji} Analysis completed`));
          break;
        case 'Generating Report':
          results.report = result;
          spinner.succeed(chalk.green(`${step.emoji} Report generated`));
          break;
      }
      
    } catch (error) {
      spinner.fail(chalk.red(`${step.emoji} ${step.name} failed: ${error.message}`));
      logger.error(`Step failed: ${step.name}`, { error: error.message });
      
      if (step.name === 'REST API Tests' || step.name === 'Firebase SDK Tests') {
        console.log(chalk.yellow('\n⚠️  Continuing with partial results...'));
      } else {
        process.exit(1);
      }
    }
  }
  
  console.log(chalk.bold.green('\n✅ Test Suite Completed Successfully!\n'));
  
  if (results.analysis) {
    console.log(chalk.bold('Summary:'));
    console.log(`  • Total Tests: ${results.analysis.summary.totalTests}`);
    console.log(`  • Identical Behavior: ${results.analysis.summary.identicalBehavior}`);
    console.log(`  • Different Behavior: ${results.analysis.summary.differentBehavior}`);
    
    if (results.analysis.summary.criticalDifferences.length > 0) {
      console.log(chalk.red(`  • Critical Differences: ${results.analysis.summary.criticalDifferences.length}`));
    }
  }
  
  if (results.report) {
    console.log(chalk.cyan(`\n📄 Full report available at: ${results.report}`));
  }
  
  return results;
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  runCompleteTestSuite()
    .then(() => {
      console.log(chalk.gray('\n👋 Goodbye!\n'));
      process.exit(0);
    })
    .catch((error) => {
      console.error(chalk.red('\n❌ Fatal error:'), error);
      process.exit(1);
    });
}

export default runCompleteTestSuite;