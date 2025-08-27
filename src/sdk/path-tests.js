import SdkClient from './sdk-client.js';
import { PATH_PATTERNS, TEST_DATA, RESULT_KEYS, API_TYPES, OPERATIONS } from '../config/constants.js';
import { generateTestPath, generateTestData } from '../utils/test-data.js';
import { sleep, measureExecutionTime } from '../utils/db-helper.js';
import logger from '../utils/logger.js';

export async function runSdkSinglePathTests() {
  const client = new SdkClient();
  const results = [];
  
  logger.info('Starting Firebase SDK Single Path Tests');
  
  const testCases = [
    {
      name: 'Absolute path with leading slash',
      path: '/test-sdk/single-path/with-slash',
      data: generateTestData('simple')
    },
    {
      name: 'Relative path without leading slash',
      path: 'test-sdk/single-path/without-slash',
      data: generateTestData('simple')
    },
    {
      name: 'Nested absolute path',
      path: '/projects/sdk-project1/pages/page1/style',
      data: { color: 'red', fontSize: 16 }
    },
    {
      name: 'Nested relative path',
      path: 'projects/sdk-project2/pages/page1/style',
      data: { color: 'blue', fontSize: 14 }
    },
    {
      name: 'Path with trailing slash',
      path: '/test-sdk/trailing-slash/',
      data: generateTestData('simple')
    },
    {
      name: 'Path with double slashes',
      path: '//test-sdk//double//slashes',
      data: generateTestData('simple')
    },
    {
      name: 'Root path update',
      path: '/',
      data: { sdkRootUpdate: true, timestamp: Date.now() }
    },
    {
      name: 'Empty path',
      path: '',
      data: { sdkEmptyPath: true, timestamp: Date.now() }
    }
  ];
  
  for (const testCase of testCases) {
    logger.info(`Running SDK test: ${testCase.name}`);
    const startTime = Date.now();
    
    try {
      const setResult = await client.setValue(testCase.path, testCase.data);
      
      await sleep(100);
      
      const getResult = await client.getValue(testCase.path);
      
      const alternativePaths = [];
      if (testCase.path.startsWith('/')) {
        alternativePaths.push(testCase.path.substring(1));
      } else {
        alternativePaths.push('/' + testCase.path);
      }
      
      const alternativeResults = {};
      for (const altPath of alternativePaths) {
        const altResult = await client.getValue(altPath);
        alternativeResults[altPath] = {
          exists: altResult.exists,
          data: altResult.data
        };
      }
      
      const result = {
        [RESULT_KEYS.TEST_NAME]: testCase.name,
        [RESULT_KEYS.API_TYPE]: API_TYPES.SDK,
        [RESULT_KEYS.PATH_USED]: testCase.path,
        [RESULT_KEYS.OPERATION]: OPERATIONS.SET,
        [RESULT_KEYS.SUCCESS]: setResult.success,
        [RESULT_KEYS.DATA_WRITTEN]: getResult.data,
        dataExists: getResult.exists,
        alternativePathResults: alternativeResults,
        [RESULT_KEYS.ERROR]: setResult.error || null,
        [RESULT_KEYS.TIMESTAMP]: Date.now(),
        [RESULT_KEYS.DURATION_MS]: measureExecutionTime(startTime)
      };
      
      results.push(result);
      logger.info('SDK test completed', { result });
      
    } catch (error) {
      logger.error(`SDK test failed: ${testCase.name}`, { error: error.message });
      results.push({
        [RESULT_KEYS.TEST_NAME]: testCase.name,
        [RESULT_KEYS.API_TYPE]: API_TYPES.SDK,
        [RESULT_KEYS.PATH_USED]: testCase.path,
        [RESULT_KEYS.OPERATION]: OPERATIONS.SET,
        [RESULT_KEYS.SUCCESS]: false,
        [RESULT_KEYS.ERROR]: error.message,
        [RESULT_KEYS.TIMESTAMP]: Date.now(),
        [RESULT_KEYS.DURATION_MS]: measureExecutionTime(startTime)
      });
    }
    
    await sleep(200);
  }
  
  logger.info('Firebase SDK Single Path Tests completed', { 
    total: results.length,
    successful: results.filter(r => r[RESULT_KEYS.SUCCESS]).length 
  });
  
  return results;
}

export async function runSdkUpdateTests() {
  const client = new SdkClient();
  const results = [];
  
  logger.info('Starting Firebase SDK UPDATE Tests');
  
  const basePath = generateTestPath('sdk-update-test', true);
  
  await client.setValue(basePath.full, {
    existing: 'data',
    nested: {
      value1: 'initial',
      value2: 'initial'
    }
  });
  
  await sleep(200);
  
  const updateTests = [
    {
      name: 'Update with absolute sub-path',
      basePath: basePath.full,
      updates: {
        '/nested/value1': 'updated-absolute',
        '/newField': 'added-via-absolute'
      }
    },
    {
      name: 'Update with relative sub-path',
      basePath: basePath.full,
      updates: {
        'nested/value2': 'updated-relative',
        'anotherField': 'added-via-relative'
      }
    },
    {
      name: 'Update with mixed paths',
      basePath: basePath.full,
      updates: {
        '/absolute/path': 'absolute-value',
        'relative/path': 'relative-value',
        '/mixed': { absolute: true },
        'mixed2': { relative: true }
      }
    },
    {
      name: 'Update at root level',
      basePath: '/',
      updates: {
        'sdk-root-update-1': 'value1',
        '/sdk-root-update-2': 'value2'
      }
    },
    {
      name: 'Update with empty base path',
      basePath: '',
      updates: {
        'sdk-empty-base-1': 'value1',
        '/sdk-empty-base-2': 'value2'
      }
    }
  ];
  
  for (const test of updateTests) {
    logger.info(`Running SDK UPDATE test: ${test.name}`);
    const startTime = Date.now();
    
    try {
      const updateResult = await client.updateValue(test.basePath, test.updates);
      
      await sleep(100);
      
      const getResult = await client.getValue(test.basePath);
      
      const pathVerifications = {};
      for (const updatePath of Object.keys(test.updates)) {
        const checkPaths = [];
        
        if (updatePath.startsWith('/')) {
          checkPaths.push(updatePath);
          checkPaths.push(updatePath.substring(1));
        } else {
          checkPaths.push(`${test.basePath}/${updatePath}`);
          checkPaths.push(updatePath);
        }
        
        for (const checkPath of checkPaths) {
          const verifyResult = await client.getValue(checkPath);
          pathVerifications[checkPath] = {
            exists: verifyResult.exists,
            data: verifyResult.data
          };
        }
      }
      
      const result = {
        [RESULT_KEYS.TEST_NAME]: test.name,
        [RESULT_KEYS.API_TYPE]: API_TYPES.SDK,
        [RESULT_KEYS.PATH_USED]: test.basePath,
        [RESULT_KEYS.OPERATION]: OPERATIONS.UPDATE,
        [RESULT_KEYS.SUCCESS]: updateResult.success,
        [RESULT_KEYS.DATA_WRITTEN]: getResult.data,
        updates: test.updates,
        pathVerifications,
        [RESULT_KEYS.ERROR]: updateResult.error || null,
        [RESULT_KEYS.TIMESTAMP]: Date.now(),
        [RESULT_KEYS.DURATION_MS]: measureExecutionTime(startTime)
      };
      
      results.push(result);
      logger.info('SDK UPDATE test completed', { result });
      
    } catch (error) {
      logger.error(`SDK UPDATE test failed: ${test.name}`, { error: error.message });
      results.push({
        [RESULT_KEYS.TEST_NAME]: test.name,
        [RESULT_KEYS.API_TYPE]: API_TYPES.SDK,
        [RESULT_KEYS.PATH_USED]: test.basePath,
        [RESULT_KEYS.OPERATION]: OPERATIONS.UPDATE,
        [RESULT_KEYS.SUCCESS]: false,
        [RESULT_KEYS.ERROR]: error.message,
        [RESULT_KEYS.TIMESTAMP]: Date.now(),
        [RESULT_KEYS.DURATION_MS]: measureExecutionTime(startTime)
      });
    }
    
    await sleep(200);
  }
  
  logger.info('Firebase SDK UPDATE Tests completed', { 
    total: results.length,
    successful: results.filter(r => r[RESULT_KEYS.SUCCESS]).length 
  });
  
  return results;
}