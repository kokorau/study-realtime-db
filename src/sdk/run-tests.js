import { runSdkSinglePathTests, runSdkUpdateTests } from './path-tests.js';
import { runSdkMultiPathTests, runSdkComplexMultiPathScenario } from './multi-path-tests.js';
import logger from '../utils/logger.js';
import { writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runAllSdkTests() {
  logger.info('=== Starting Firebase SDK Test Suite ===');
  
  const allResults = {
    timestamp: new Date().toISOString(),
    apiType: 'FIREBASE_SDK',
    tests: {
      singlePath: [],
      update: [],
      multiPath: [],
      complexScenario: []
    },
    summary: {
      total: 0,
      successful: 0,
      failed: 0
    }
  };
  
  try {
    logger.info('Running SDK single path tests...');
    allResults.tests.singlePath = await runSdkSinglePathTests();
    
    logger.info('Running SDK UPDATE tests...');
    allResults.tests.update = await runSdkUpdateTests();
    
    logger.info('Running SDK multi-path tests...');
    allResults.tests.multiPath = await runSdkMultiPathTests();
    
    logger.info('Running SDK complex scenario tests...');
    allResults.tests.complexScenario = await runSdkComplexMultiPathScenario();
    
    const allTestResults = [
      ...allResults.tests.singlePath,
      ...allResults.tests.update,
      ...allResults.tests.multiPath,
      ...allResults.tests.complexScenario
    ];
    
    allResults.summary.total = allTestResults.length;
    allResults.summary.successful = allTestResults.filter(r => r.success).length;
    allResults.summary.failed = allTestResults.filter(r => !r.success).length;
    
    const outputPath = path.join(__dirname, '../../results', `sdk-results-${Date.now()}.json`);
    writeFileSync(outputPath, JSON.stringify(allResults, null, 2));
    
    logger.info('=== Firebase SDK Test Suite Completed ===', allResults.summary);
    logger.info(`Results saved to: ${outputPath}`);
    
    return allResults;
    
  } catch (error) {
    logger.error('SDK Test suite failed', { error: error.message });
    throw error;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runAllSdkTests()
    .then(() => {
      logger.info('SDK Test execution completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('SDK Test execution failed', { error: error.message });
      process.exit(1);
    });
}

export default runAllSdkTests;