import RestApiClient from './axios-client.js';
import { PATH_PATTERNS, TEST_DATA, RESULT_KEYS, API_TYPES, OPERATIONS } from '../config/constants.js';
import { generateTestPath, generateTestData } from '../utils/test-data.js';
import { sleep, measureExecutionTime } from '../utils/db-helper.js';
import logger from '../utils/logger.js';

export async function runSinglePathTests() {
  const client = new RestApiClient();
  const results = [];
  
  logger.info('Starting REST API Single Path Tests');
  
  const testCases = [
    {
      name: 'Absolute path with leading slash',
      path: '/test-rest-api/single-path/with-slash',
      data: generateTestData('simple')
    },
    {
      name: 'Relative path without leading slash',
      path: 'test-rest-api/single-path/without-slash',
      data: generateTestData('simple')
    },
    {
      name: 'Nested absolute path',
      path: '/projects/project1/pages/page1/style',
      data: { color: 'red', fontSize: 16 }
    },
    {
      name: 'Nested relative path',
      path: 'projects/project2/pages/page1/style',
      data: { color: 'blue', fontSize: 14 }
    },
    {
      name: 'Path with trailing slash',
      path: '/test-rest-api/trailing-slash/',
      data: generateTestData('simple')
    },
    {
      name: 'Path with double slashes',
      path: '//test-rest-api//double//slashes',
      data: generateTestData('simple')
    },
    {
      name: 'Root path update',
      path: '/',
      data: { rootUpdate: true, timestamp: Date.now() }
    },
    {
      name: 'Empty path',
      path: '',
      data: { emptyPath: true, timestamp: Date.now() }
    }
  ];
  
  for (const testCase of testCases) {
    logger.info(`Running test: ${testCase.name}`);
    const startTime = Date.now();
    
    try {
      const putResult = await client.put(testCase.path, testCase.data);
      
      await sleep(100);
      
      const getResult = await client.get(testCase.path);
      
      const result = {
        [RESULT_KEYS.TEST_NAME]: testCase.name,
        [RESULT_KEYS.API_TYPE]: API_TYPES.REST,
        [RESULT_KEYS.PATH_USED]: testCase.path,
        [RESULT_KEYS.OPERATION]: OPERATIONS.PUT,
        [RESULT_KEYS.SUCCESS]: putResult.success,
        [RESULT_KEYS.ACTUAL_PATH_WRITTEN]: putResult.actualUrl,
        [RESULT_KEYS.DATA_WRITTEN]: getResult.success ? getResult.data : null,
        [RESULT_KEYS.ERROR]: putResult.error || null,
        [RESULT_KEYS.TIMESTAMP]: Date.now(),
        [RESULT_KEYS.DURATION_MS]: measureExecutionTime(startTime)
      };
      
      results.push(result);
      logger.info('Test completed', { result });
      
    } catch (error) {
      logger.error(`Test failed: ${testCase.name}`, { error: error.message });
      results.push({
        [RESULT_KEYS.TEST_NAME]: testCase.name,
        [RESULT_KEYS.API_TYPE]: API_TYPES.REST,
        [RESULT_KEYS.PATH_USED]: testCase.path,
        [RESULT_KEYS.OPERATION]: OPERATIONS.PUT,
        [RESULT_KEYS.SUCCESS]: false,
        [RESULT_KEYS.ERROR]: error.message,
        [RESULT_KEYS.TIMESTAMP]: Date.now(),
        [RESULT_KEYS.DURATION_MS]: measureExecutionTime(startTime)
      });
    }
    
    await sleep(200);
  }
  
  logger.info('REST API Single Path Tests completed', { 
    total: results.length,
    successful: results.filter(r => r[RESULT_KEYS.SUCCESS]).length 
  });
  
  return results;
}

export async function runPatchTests() {
  const client = new RestApiClient();
  const results = [];
  
  logger.info('Starting REST API PATCH Tests');
  
  const basePath = generateTestPath('patch-test', true);
  
  await client.put(basePath.full, {
    existing: 'data',
    nested: {
      value1: 'initial',
      value2: 'initial'
    }
  });
  
  await sleep(200);
  
  const patchTests = [
    {
      name: 'PATCH with absolute sub-path',
      basePath: basePath.full,
      updates: {
        '/nested/value1': 'updated-absolute',
        '/newField': 'added-via-absolute'
      }
    },
    {
      name: 'PATCH with relative sub-path',
      basePath: basePath.full,
      updates: {
        'nested/value2': 'updated-relative',
        'anotherField': 'added-via-relative'
      }
    },
    {
      name: 'PATCH with mixed paths',
      basePath: basePath.full,
      updates: {
        '/absolute/path': 'absolute-value',
        'relative/path': 'relative-value',
        '/mixed': { absolute: true },
        'mixed2': { relative: true }
      }
    }
  ];
  
  for (const test of patchTests) {
    logger.info(`Running PATCH test: ${test.name}`);
    const startTime = Date.now();
    
    try {
      const patchResult = await client.patch(test.basePath, test.updates);
      
      await sleep(100);
      
      const getResult = await client.get(test.basePath);
      
      const result = {
        [RESULT_KEYS.TEST_NAME]: test.name,
        [RESULT_KEYS.API_TYPE]: API_TYPES.REST,
        [RESULT_KEYS.PATH_USED]: test.basePath,
        [RESULT_KEYS.OPERATION]: OPERATIONS.PATCH,
        [RESULT_KEYS.SUCCESS]: patchResult.success,
        [RESULT_KEYS.ACTUAL_PATH_WRITTEN]: patchResult.actualUrl,
        [RESULT_KEYS.DATA_WRITTEN]: getResult.success ? getResult.data : null,
        updates: test.updates,
        [RESULT_KEYS.ERROR]: patchResult.error || null,
        [RESULT_KEYS.TIMESTAMP]: Date.now(),
        [RESULT_KEYS.DURATION_MS]: measureExecutionTime(startTime)
      };
      
      results.push(result);
      logger.info('PATCH test completed', { result });
      
    } catch (error) {
      logger.error(`PATCH test failed: ${test.name}`, { error: error.message });
      results.push({
        [RESULT_KEYS.TEST_NAME]: test.name,
        [RESULT_KEYS.API_TYPE]: API_TYPES.REST,
        [RESULT_KEYS.PATH_USED]: test.basePath,
        [RESULT_KEYS.OPERATION]: OPERATIONS.PATCH,
        [RESULT_KEYS.SUCCESS]: false,
        [RESULT_KEYS.ERROR]: error.message,
        [RESULT_KEYS.TIMESTAMP]: Date.now(),
        [RESULT_KEYS.DURATION_MS]: measureExecutionTime(startTime)
      });
    }
    
    await sleep(200);
  }
  
  logger.info('REST API PATCH Tests completed', { 
    total: results.length,
    successful: results.filter(r => r[RESULT_KEYS.SUCCESS]).length 
  });
  
  return results;
}