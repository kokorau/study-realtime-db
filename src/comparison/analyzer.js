import { readFileSync, readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import logger from '../utils/logger.js';
import { RESULT_KEYS, API_TYPES, OPERATIONS } from '../config/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function analyzeResults(restResults, sdkResults) {
  const analysis = {
    timestamp: new Date().toISOString(),
    comparisons: [],
    pathBehaviorDifferences: {},
    operationDifferences: {},
    summary: {
      totalTests: 0,
      identicalBehavior: 0,
      differentBehavior: 0,
      criticalDifferences: []
    }
  };
  
  const restByName = groupByTestName(restResults);
  const sdkByName = groupByTestName(sdkResults);
  
  const allTestNames = new Set([...Object.keys(restByName), ...Object.keys(sdkByName)]);
  
  for (const testName of allTestNames) {
    const restTest = restByName[testName];
    const sdkTest = sdkByName[testName];
    
    if (restTest && sdkTest) {
      const comparison = compareTest(restTest, sdkTest);
      analysis.comparisons.push(comparison);
      
      if (!comparison.behaviorMatch) {
        analysis.summary.differentBehavior++;
        
        if (comparison.criticalDifference) {
          analysis.summary.criticalDifferences.push({
            testName: testName,
            difference: comparison.differenceDetail
          });
        }
      } else {
        analysis.summary.identicalBehavior++;
      }
    }
  }
  
  analysis.summary.totalTests = analysis.comparisons.length;
  
  analysis.pathBehaviorDifferences = analyzePathBehavior(analysis.comparisons);
  analysis.operationDifferences = analyzeOperationBehavior(analysis.comparisons);
  
  return analysis;
}

function groupByTestName(results) {
  const grouped = {};
  
  const allTests = [
    ...(results.tests?.singlePath || []),
    ...(results.tests?.patch || []),
    ...(results.tests?.update || []),
    ...(results.tests?.multiPath || []),
    ...(results.tests?.complexScenario || [])
  ];
  
  for (const test of allTests) {
    const name = test[RESULT_KEYS.TEST_NAME];
    if (name) {
      grouped[name] = test;
    }
  }
  
  return grouped;
}

function compareTest(restTest, sdkTest) {
  const comparison = {
    testName: restTest[RESULT_KEYS.TEST_NAME],
    pathUsed: restTest[RESULT_KEYS.PATH_USED],
    operation: restTest[RESULT_KEYS.OPERATION],
    restResult: {
      success: restTest[RESULT_KEYS.SUCCESS],
      dataWritten: restTest[RESULT_KEYS.DATA_WRITTEN],
      error: restTest[RESULT_KEYS.ERROR]
    },
    sdkResult: {
      success: sdkTest[RESULT_KEYS.SUCCESS],
      dataWritten: sdkTest[RESULT_KEYS.DATA_WRITTEN],
      error: sdkTest[RESULT_KEYS.ERROR]
    },
    behaviorMatch: false,
    criticalDifference: false,
    differenceDetail: ''
  };
  
  if (restTest[RESULT_KEYS.SUCCESS] !== sdkTest[RESULT_KEYS.SUCCESS]) {
    comparison.criticalDifference = true;
    comparison.differenceDetail = `Success status mismatch: REST=${restTest[RESULT_KEYS.SUCCESS]}, SDK=${sdkTest[RESULT_KEYS.SUCCESS]}`;
  } else if (restTest[RESULT_KEYS.SUCCESS]) {
    const restData = JSON.stringify(restTest[RESULT_KEYS.DATA_WRITTEN]);
    const sdkData = JSON.stringify(sdkTest[RESULT_KEYS.DATA_WRITTEN]);
    
    if (restData === sdkData) {
      comparison.behaviorMatch = true;
    } else {
      comparison.differenceDetail = 'Data written differs between REST and SDK';
      
      if (restTest.verificationResults && sdkTest.verificationResults) {
        comparison.pathResolutionDifference = analyzePathResolution(
          restTest.verificationResults,
          sdkTest.verificationResults
        );
      }
    }
  }
  
  return comparison;
}

function analyzePathBehavior(comparisons) {
  const pathBehavior = {
    withLeadingSlash: { matches: 0, differences: 0 },
    withoutLeadingSlash: { matches: 0, differences: 0 },
    rootPath: { matches: 0, differences: 0 },
    emptyPath: { matches: 0, differences: 0 },
    doubleSlash: { matches: 0, differences: 0 }
  };
  
  for (const comparison of comparisons) {
    const path = comparison.pathUsed;
    let category = null;
    
    if (path === '/') {
      category = 'rootPath';
    } else if (path === '') {
      category = 'emptyPath';
    } else if (path.includes('//')) {
      category = 'doubleSlash';
    } else if (path.startsWith('/')) {
      category = 'withLeadingSlash';
    } else {
      category = 'withoutLeadingSlash';
    }
    
    if (category) {
      if (comparison.behaviorMatch) {
        pathBehavior[category].matches++;
      } else {
        pathBehavior[category].differences++;
      }
    }
  }
  
  return pathBehavior;
}

function analyzeOperationBehavior(comparisons) {
  const operationBehavior = {};
  
  for (const comparison of comparisons) {
    const operation = comparison.operation;
    
    if (!operationBehavior[operation]) {
      operationBehavior[operation] = {
        matches: 0,
        differences: 0,
        details: []
      };
    }
    
    if (comparison.behaviorMatch) {
      operationBehavior[operation].matches++;
    } else {
      operationBehavior[operation].differences++;
      operationBehavior[operation].details.push({
        testName: comparison.testName,
        difference: comparison.differenceDetail
      });
    }
  }
  
  return operationBehavior;
}

function analyzePathResolution(restVerification, sdkVerification) {
  const differences = [];
  
  for (const [path, restResult] of Object.entries(restVerification)) {
    if (sdkVerification[path]) {
      const restFound = restResult.found || restResult.exists;
      const sdkFound = sdkVerification[path].found || sdkVerification[path].exists;
      
      if (restFound !== sdkFound) {
        differences.push({
          path: path,
          restFound: restFound,
          sdkFound: sdkFound
        });
      }
    }
  }
  
  return differences;
}

export async function loadAndAnalyze() {
  try {
    const resultsDir = path.join(__dirname, '../../results');
    const files = readdirSync(resultsDir);
    
    const restFiles = files.filter(f => f.startsWith('rest-api-results'));
    const sdkFiles = files.filter(f => f.startsWith('sdk-results'));
    
    if (restFiles.length === 0 || sdkFiles.length === 0) {
      logger.error('No result files found to analyze');
      return null;
    }
    
    restFiles.sort();
    sdkFiles.sort();
    
    const latestRestFile = path.join(resultsDir, restFiles[restFiles.length - 1]);
    const latestSdkFile = path.join(resultsDir, sdkFiles[sdkFiles.length - 1]);
    
    logger.info(`Loading REST results from: ${latestRestFile}`);
    logger.info(`Loading SDK results from: ${latestSdkFile}`);
    
    const restResults = JSON.parse(readFileSync(latestRestFile, 'utf8'));
    const sdkResults = JSON.parse(readFileSync(latestSdkFile, 'utf8'));
    
    const analysis = analyzeResults(restResults, sdkResults);
    
    const analysisPath = path.join(resultsDir, `analysis-${Date.now()}.json`);
    const { writeFileSync } = await import('fs');
    writeFileSync(analysisPath, JSON.stringify(analysis, null, 2));
    
    logger.info(`Analysis saved to: ${analysisPath}`);
    
    return analysis;
    
  } catch (error) {
    logger.error('Failed to load and analyze results', { error: error.message });
    throw error;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  loadAndAnalyze()
    .then((analysis) => {
      if (analysis) {
        console.log('\n=== Analysis Summary ===');
        console.log(`Total Comparisons: ${analysis.summary.totalTests}`);
        console.log(`Identical Behavior: ${analysis.summary.identicalBehavior}`);
        console.log(`Different Behavior: ${analysis.summary.differentBehavior}`);
        console.log(`Critical Differences: ${analysis.summary.criticalDifferences.length}`);
        
        if (analysis.summary.criticalDifferences.length > 0) {
          console.log('\nCritical Differences:');
          analysis.summary.criticalDifferences.forEach(diff => {
            console.log(`  - ${diff.testName}: ${diff.difference}`);
          });
        }
      }
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Analysis failed', { error: error.message });
      process.exit(1);
    });
}