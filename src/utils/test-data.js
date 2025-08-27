import { TEST_DATA, DB_STRUCTURE } from '../config/constants.js';

export function generateTestData(type = 'simple') {
  const timestamp = Date.now();
  
  switch (type) {
    case 'simple':
      return {
        value: `test-${timestamp}`,
        timestamp,
        type: 'simple'
      };
    
    case 'complex':
      return {
        ...TEST_DATA.NESTED_OBJECT,
        timestamp,
        type: 'complex'
      };
    
    case 'multipath':
      return {
        [`path1-${timestamp}`]: { value: 'value1', timestamp },
        [`path2-${timestamp}`]: { value: 'value2', timestamp },
        [`path3-${timestamp}`]: { value: 'value3', timestamp }
      };
    
    default:
      return TEST_DATA.SIMPLE_OBJECT;
  }
}

export function generateTestPath(pattern, includeTimestamp = true) {
  const timestamp = includeTimestamp ? `-${Date.now()}` : '';
  const base = `${DB_STRUCTURE.BASE_PATH}${timestamp}`;
  
  return {
    base,
    full: `${base}/${pattern}`,
    relative: pattern
  };
}

export function generateMultiPathUpdates(baseRef = '', scenarios = []) {
  const updates = {};
  const timestamp = Date.now();
  
  scenarios.forEach((scenario, index) => {
    const path = scenario.withSlash 
      ? `/${baseRef}/update-${index}-${timestamp}`
      : `${baseRef}/update-${index}-${timestamp}`;
    
    updates[path] = {
      value: `update-value-${index}`,
      timestamp,
      scenario: scenario.name
    };
  });
  
  return updates;
}

export function generateEdgeCaseData() {
  return {
    emptyString: '',
    null: null,
    undefined: undefined,
    zero: 0,
    false: false,
    emptyObject: {},
    emptyArray: [],
    specialChars: 'test-/@#$%^&*()_+-=[]{}|;:,.<>?',
    unicode: 'test-😀-本文-тест',
    veryLongString: 'x'.repeat(1000),
    deeplyNested: createDeepObject(10)
  };
}

function createDeepObject(depth, current = 0) {
  if (current >= depth) {
    return { value: `level-${current}` };
  }
  return {
    [`level-${current}`]: createDeepObject(depth, current + 1)
  };
}

export function createTestStructure() {
  return {
    [DB_STRUCTURE.PROJECTS_PATH]: {
      [DB_STRUCTURE.TEST_PROJECT_ID]: {
        name: 'Test Project',
        created: Date.now(),
        [DB_STRUCTURE.PAGE_VIEWS_PATH]: {
          [DB_STRUCTURE.TEST_PAGE_UUID]: {
            style: {
              color: 'initial',
              fontSize: 14
            },
            children: [],
            metadata: {
              version: 1
            }
          }
        }
      }
    }
  };
}