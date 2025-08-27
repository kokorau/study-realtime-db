import SdkClient from './sdk-client.js';
import { RESULT_KEYS, API_TYPES, OPERATIONS } from '../config/constants.js';
import { generateTestPath } from '../utils/test-data.js';
import { sleep, measureExecutionTime } from '../utils/db-helper.js';
import logger from '../utils/logger.js';

export async function runSdkMultiPathTests() {
  const client = new SdkClient();
  const results = [];
  
  logger.info('Starting Firebase SDK Multi-Path Tests');
  
  const testScenarios = [
    {
      name: 'SDK: All paths with leading slash',
      basePath: 'sdk-multi-path/all-slash',
      updates: {
        '/path1/value': 'value1',
        '/path2/value': 'value2',
        '/path3/nested/value': 'value3'
      }
    },
    {
      name: 'SDK: All paths without leading slash',
      basePath: 'sdk-multi-path/no-slash',
      updates: {
        'path1/value': 'value1',
        'path2/value': 'value2',
        'path3/nested/value': 'value3'
      }
    },
    {
      name: 'SDK: Mixed slash patterns',
      basePath: 'sdk-multi-path/mixed',
      updates: {
        '/absolute/path1': 'absolute1',
        'relative/path1': 'relative1',
        '/absolute/nested/path2': 'absolute2',
        'relative/nested/path2': 'relative2'
      }
    },
    {
      name: 'SDK: Complex nested with leading slash',
      basePath: '/projects/sdk-projectId/pageViews',
      updates: {
        '/pageUuid1/style': { color: 'red', fontSize: 16 },
        '/pageUuid1/children': [],
        '/pageUuid2/style': { color: 'blue', fontSize: 14 },
        '/pageUuid2/children': [{ id: 1 }]
      }
    },
    {
      name: 'SDK: Complex nested without leading slash',
      basePath: 'projects/sdk-projectId2/pageViews',
      updates: {
        'pageUuid3/style': { color: 'green', fontSize: 18 },
        'pageUuid3/children': [],
        'pageUuid4/style': { color: 'yellow', fontSize: 12 },
        'pageUuid4/children': [{ id: 2 }]
      }
    },
    {
      name: 'SDK: Root-relative paths',
      basePath: '/',
      updates: {
        '/sdk-users/user1/name': 'SDK User One',
        'sdk-users/user2/name': 'SDK User Two',
        '/sdk-posts/post1/title': 'SDK Post One',
        'sdk-posts/post2/title': 'SDK Post Two'
      }
    },
    {
      name: 'SDK: Empty base path',
      basePath: '',
      updates: {
        '/sdk-test/path1': 'value1',
        'sdk-test/path2': 'value2'
      }
    },
    {
      name: 'SDK: Edge case - double slashes',
      basePath: 'sdk-multi-path//edge',
      updates: {
        '//double//slash': 'value1',
        'normal/path': 'value2'
      }
    }
  ];
  
  for (const scenario of testScenarios) {
    logger.info(`Running SDK multi-path test: ${scenario.name}`);
    const startTime = Date.now();
    
    try {
      const updateResult = await client.multiPathUpdate(scenario.basePath, scenario.updates);
      
      await sleep(200);
      
      const verificationResults = {};
      
      const baseGetResult = await client.getValue(scenario.basePath);
      verificationResults.baseData = baseGetResult.data;
      
      for (const [updatePath, expectedData] of Object.entries(scenario.updates)) {
        const pathsToCheck = [];
        
        if (scenario.basePath === '' || scenario.basePath === '/') {
          if (updatePath.startsWith('/')) {
            pathsToCheck.push(updatePath);
            pathsToCheck.push(updatePath.substring(1));
          } else {
            pathsToCheck.push(updatePath);
            pathsToCheck.push('/' + updatePath);
          }
        } else {
          if (updatePath.startsWith('/')) {
            pathsToCheck.push(updatePath);
            pathsToCheck.push(`${scenario.basePath}${updatePath}`);
          } else {
            pathsToCheck.push(`${scenario.basePath}/${updatePath}`);
            pathsToCheck.push(updatePath);
          }
        }
        
        verificationResults[updatePath] = {};
        for (const checkPath of pathsToCheck) {
          const pathResult = await client.getValue(checkPath);
          verificationResults[updatePath][checkPath] = {
            found: pathResult.exists,
            data: pathResult.data
          };
        }
      }
      
      const result = {
        [RESULT_KEYS.TEST_NAME]: scenario.name,
        [RESULT_KEYS.API_TYPE]: API_TYPES.SDK,
        [RESULT_KEYS.PATH_USED]: scenario.basePath,
        [RESULT_KEYS.OPERATION]: OPERATIONS.MULTI_PATH_UPDATE,
        [RESULT_KEYS.SUCCESS]: updateResult.success,
        updates: scenario.updates,
        verificationResults,
        [RESULT_KEYS.ERROR]: updateResult.error || null,
        [RESULT_KEYS.TIMESTAMP]: Date.now(),
        [RESULT_KEYS.DURATION_MS]: measureExecutionTime(startTime)
      };
      
      results.push(result);
      logger.info('SDK multi-path test completed', { 
        name: scenario.name,
        success: updateResult.success
      });
      
    } catch (error) {
      logger.error(`SDK multi-path test failed: ${scenario.name}`, { error: error.message });
      results.push({
        [RESULT_KEYS.TEST_NAME]: scenario.name,
        [RESULT_KEYS.API_TYPE]: API_TYPES.SDK,
        [RESULT_KEYS.PATH_USED]: scenario.basePath,
        [RESULT_KEYS.OPERATION]: OPERATIONS.MULTI_PATH_UPDATE,
        [RESULT_KEYS.SUCCESS]: false,
        [RESULT_KEYS.ERROR]: error.message,
        [RESULT_KEYS.TIMESTAMP]: Date.now(),
        [RESULT_KEYS.DURATION_MS]: measureExecutionTime(startTime)
      });
    }
    
    await sleep(300);
  }
  
  logger.info('Firebase SDK Multi-Path Tests completed', { 
    total: results.length,
    successful: results.filter(r => r[RESULT_KEYS.SUCCESS]).length 
  });
  
  return results;
}

export async function runSdkComplexMultiPathScenario() {
  const client = new SdkClient();
  const results = [];
  
  logger.info('Starting SDK Complex Multi-Path Scenario');
  
  const projectBase = `projects/sdk-test-project-${Date.now()}/pageViews`;
  
  await client.setValue(projectBase, {
    initial: 'sdk-structure',
    metadata: { created: Date.now() }
  });
  
  await sleep(200);
  
  const complexUpdate = {
    '/page1/style/color': 'red',
    '/page1/style/fontSize': 16,
    'page2/style/color': 'blue', 
    'page2/style/fontSize': 14,
    '/page1/children/0': { type: 'text', content: 'Hello SDK' },
    'page2/children/0': { type: 'image', src: 'sdk-test.jpg' },
    '/page1/metadata/version': 2,
    'page2/metadata/version': 2
  };
  
  const startTime = Date.now();
  
  try {
    const updateResult = await client.multiPathUpdate(projectBase, complexUpdate);
    
    await sleep(200);
    
    const fullStructure = await client.getValue(projectBase);
    
    const pathChecks = {};
    const checkPaths = [
      `${projectBase}/page1/style/color`,
      `${projectBase}/page2/style/color`,
      `${projectBase}/page1/children/0`,
      `${projectBase}/page2/children/0`
    ];
    
    for (const path of checkPaths) {
      const checkResult = await client.getValue(path);
      pathChecks[path] = {
        exists: checkResult.exists,
        data: checkResult.data
      };
    }
    
    const result = {
      [RESULT_KEYS.TEST_NAME]: 'SDK: Complex nested multi-path update',
      [RESULT_KEYS.API_TYPE]: API_TYPES.SDK,
      [RESULT_KEYS.PATH_USED]: projectBase,
      [RESULT_KEYS.OPERATION]: OPERATIONS.MULTI_PATH_UPDATE,
      [RESULT_KEYS.SUCCESS]: updateResult.success,
      [RESULT_KEYS.DATA_WRITTEN]: fullStructure.data,
      updates: complexUpdate,
      pathChecks,
      [RESULT_KEYS.ERROR]: updateResult.error || null,
      [RESULT_KEYS.TIMESTAMP]: Date.now(),
      [RESULT_KEYS.DURATION_MS]: measureExecutionTime(startTime)
    };
    
    results.push(result);
    logger.info('SDK Complex scenario completed', { result });
    
  } catch (error) {
    logger.error('SDK Complex scenario failed', { error: error.message });
    results.push({
      [RESULT_KEYS.TEST_NAME]: 'SDK: Complex nested multi-path update',
      [RESULT_KEYS.API_TYPE]: API_TYPES.SDK,
      [RESULT_KEYS.PATH_USED]: projectBase,
      [RESULT_KEYS.OPERATION]: OPERATIONS.MULTI_PATH_UPDATE,
      [RESULT_KEYS.SUCCESS]: false,
      [RESULT_KEYS.ERROR]: error.message,
      [RESULT_KEYS.TIMESTAMP]: Date.now(),
      [RESULT_KEYS.DURATION_MS]: measureExecutionTime(startTime)
    });
  }
  
  return results;
}