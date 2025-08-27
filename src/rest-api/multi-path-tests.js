import RestApiClient from './axios-client.js';
import { RESULT_KEYS, API_TYPES, OPERATIONS } from '../config/constants.js';
import { generateTestPath, generateMultiPathUpdates } from '../utils/test-data.js';
import { sleep, measureExecutionTime } from '../utils/db-helper.js';
import logger from '../utils/logger.js';

export async function runMultiPathTests() {
  const client = new RestApiClient();
  const results = [];
  
  logger.info('Starting REST API Multi-Path Tests');
  
  const testScenarios = [
    {
      name: 'All paths with leading slash',
      basePath: 'multi-path-test/all-slash',
      updates: {
        '/path1/value': 'value1',
        '/path2/value': 'value2',
        '/path3/nested/value': 'value3'
      }
    },
    {
      name: 'All paths without leading slash',
      basePath: 'multi-path-test/no-slash',
      updates: {
        'path1/value': 'value1',
        'path2/value': 'value2',
        'path3/nested/value': 'value3'
      }
    },
    {
      name: 'Mixed slash patterns',
      basePath: 'multi-path-test/mixed',
      updates: {
        '/absolute/path1': 'absolute1',
        'relative/path1': 'relative1',
        '/absolute/nested/path2': 'absolute2',
        'relative/nested/path2': 'relative2'
      }
    },
    {
      name: 'Complex nested structure with leading slash',
      basePath: '/projects/projectId/pageViews',
      updates: {
        '/pageUuid1/style': { color: 'red', fontSize: 16 },
        '/pageUuid1/children': [],
        '/pageUuid2/style': { color: 'blue', fontSize: 14 },
        '/pageUuid2/children': [{ id: 1 }]
      }
    },
    {
      name: 'Complex nested structure without leading slash',
      basePath: 'projects/projectId/pageViews',
      updates: {
        'pageUuid3/style': { color: 'green', fontSize: 18 },
        'pageUuid3/children': [],
        'pageUuid4/style': { color: 'yellow', fontSize: 12 },
        'pageUuid4/children': [{ id: 2 }]
      }
    },
    {
      name: 'Root-relative paths',
      basePath: '/',
      updates: {
        '/users/user1/name': 'User One',
        'users/user2/name': 'User Two',
        '/posts/post1/title': 'Post One',
        'posts/post2/title': 'Post Two'
      }
    },
    {
      name: 'Empty base path',
      basePath: '',
      updates: {
        '/test/path1': 'value1',
        'test/path2': 'value2'
      }
    },
    {
      name: 'Edge case - double slashes',
      basePath: 'multi-path-test//edge',
      updates: {
        '//double//slash': 'value1',
        'normal/path': 'value2'
      }
    }
  ];
  
  for (const scenario of testScenarios) {
    logger.info(`Running multi-path test: ${scenario.name}`);
    const startTime = Date.now();
    
    try {
      const updateResult = await client.multiPathUpdate(scenario.basePath, scenario.updates);
      
      await sleep(200);
      
      const verificationResults = {};
      
      const baseGetResult = await client.get(scenario.basePath);
      verificationResults.baseData = baseGetResult.data;
      
      for (const [updatePath, expectedData] of Object.entries(scenario.updates)) {
        const fullPath = updatePath.startsWith('/') 
          ? updatePath 
          : `${scenario.basePath}/${updatePath}`;
        
        const pathResult = await client.get(fullPath);
        verificationResults[updatePath] = {
          found: pathResult.success,
          data: pathResult.data,
          checkedPath: fullPath
        };
      }
      
      const result = {
        [RESULT_KEYS.TEST_NAME]: scenario.name,
        [RESULT_KEYS.API_TYPE]: API_TYPES.REST,
        [RESULT_KEYS.PATH_USED]: scenario.basePath,
        [RESULT_KEYS.OPERATION]: OPERATIONS.MULTI_PATH_UPDATE,
        [RESULT_KEYS.SUCCESS]: updateResult.success,
        [RESULT_KEYS.ACTUAL_PATH_WRITTEN]: updateResult.actualUrl,
        updates: scenario.updates,
        verificationResults,
        [RESULT_KEYS.ERROR]: updateResult.error || null,
        [RESULT_KEYS.TIMESTAMP]: Date.now(),
        [RESULT_KEYS.DURATION_MS]: measureExecutionTime(startTime)
      };
      
      results.push(result);
      logger.info('Multi-path test completed', { 
        name: scenario.name,
        success: updateResult.success,
        verificationsFound: Object.values(verificationResults)
          .filter(v => v.found !== undefined && v.found).length
      });
      
    } catch (error) {
      logger.error(`Multi-path test failed: ${scenario.name}`, { error: error.message });
      results.push({
        [RESULT_KEYS.TEST_NAME]: scenario.name,
        [RESULT_KEYS.API_TYPE]: API_TYPES.REST,
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
  
  logger.info('REST API Multi-Path Tests completed', { 
    total: results.length,
    successful: results.filter(r => r[RESULT_KEYS.SUCCESS]).length 
  });
  
  return results;
}

export async function runComplexMultiPathScenario() {
  const client = new RestApiClient();
  const results = [];
  
  logger.info('Starting Complex Multi-Path Scenario');
  
  const projectBase = `projects/test-project-${Date.now()}/pageViews`;
  
  await client.put(projectBase, {
    initial: 'structure',
    metadata: { created: Date.now() }
  });
  
  await sleep(200);
  
  const complexUpdate = {
    '/page1/style/color': 'red',
    '/page1/style/fontSize': 16,
    'page2/style/color': 'blue',
    'page2/style/fontSize': 14,
    '/page1/children/0': { type: 'text', content: 'Hello' },
    'page2/children/0': { type: 'image', src: 'test.jpg' }
  };
  
  const startTime = Date.now();
  
  try {
    const updateResult = await client.multiPathUpdate(projectBase, complexUpdate);
    
    await sleep(200);
    
    const fullStructure = await client.get(projectBase);
    
    const result = {
      [RESULT_KEYS.TEST_NAME]: 'Complex nested multi-path update',
      [RESULT_KEYS.API_TYPE]: API_TYPES.REST,
      [RESULT_KEYS.PATH_USED]: projectBase,
      [RESULT_KEYS.OPERATION]: OPERATIONS.MULTI_PATH_UPDATE,
      [RESULT_KEYS.SUCCESS]: updateResult.success,
      [RESULT_KEYS.DATA_WRITTEN]: fullStructure.data,
      updates: complexUpdate,
      [RESULT_KEYS.ERROR]: updateResult.error || null,
      [RESULT_KEYS.TIMESTAMP]: Date.now(),
      [RESULT_KEYS.DURATION_MS]: measureExecutionTime(startTime)
    };
    
    results.push(result);
    logger.info('Complex scenario completed', { result });
    
  } catch (error) {
    logger.error('Complex scenario failed', { error: error.message });
    results.push({
      [RESULT_KEYS.TEST_NAME]: 'Complex nested multi-path update',
      [RESULT_KEYS.API_TYPE]: API_TYPES.REST,
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