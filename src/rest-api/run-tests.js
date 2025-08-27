import { runSinglePathTests, runPatchTests } from './path-tests.js';
import { runMultiPathTests, runComplexMultiPathScenario } from './multi-path-tests.js';
import logger from '../utils/logger.js';
import { writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runAllRestApiTests() {
  logger.info('=== Starting REST API Test Suite ===');
  
  const allResults = {
    timestamp: new Date().toISOString(),
    apiType: 'REST_API',
    tests: {
      singlePath: [],
      patch: [],
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
    logger.info('Running single path tests...');
    allResults.tests.singlePath = await runSinglePathTests();
    
    logger.info('Running PATCH tests...');
    allResults.tests.patch = await runPatchTests();
    
    logger.info('Running multi-path tests...');
    allResults.tests.multiPath = await runMultiPathTests();
    
    logger.info('Running complex scenario tests...');
    allResults.tests.complexScenario = await runComplexMultiPathScenario();
    
    const allTestResults = [
      ...allResults.tests.singlePath,
      ...allResults.tests.patch,
      ...allResults.tests.multiPath,
      ...allResults.tests.complexScenario
    ];
    
    allResults.summary.total = allTestResults.length;
    allResults.summary.successful = allTestResults.filter(r => r.success).length;
    allResults.summary.failed = allTestResults.filter(r => !r.success).length;
    
    const outputPath = path.join(__dirname, '../../results', `rest-api-results-${Date.now()}.json`);
    writeFileSync(outputPath, JSON.stringify(allResults, null, 2));
    
    logger.info('=== REST API Test Suite Completed ===', allResults.summary);
    logger.info(`Results saved to: ${outputPath}`);
    
    return allResults;
    
  } catch (error) {
    logger.error('Test suite failed', { error: error.message });
    throw error;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runAllRestApiTests()
    .then(() => {
      logger.info('Test execution completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Test execution failed', { error: error.message });
      process.exit(1);
    });
}

export default runAllRestApiTests;