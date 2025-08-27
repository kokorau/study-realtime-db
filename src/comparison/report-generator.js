import { readFileSync, writeFileSync, readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { table } from 'table';
import chalk from 'chalk';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function generateMarkdownReport(analysis) {
  let markdown = '# Firebase Realtime Database REST API vs SDK Behavior Analysis\n\n';
  markdown += `Generated: ${analysis.timestamp}\n\n`;
  
  markdown += '## Executive Summary\n\n';
  markdown += generateSummaryTable(analysis.summary);
  markdown += '\n\n';
  
  markdown += '## Path Behavior Analysis\n\n';
  markdown += generatePathBehaviorTable(analysis.pathBehaviorDifferences);
  markdown += '\n\n';
  
  markdown += '## Operation Behavior Analysis\n\n';
  markdown += generateOperationTable(analysis.operationDifferences);
  markdown += '\n\n';
  
  if (analysis.summary.criticalDifferences.length > 0) {
    markdown += '## Critical Differences\n\n';
    markdown += 'These tests showed significant behavioral differences between REST API and SDK:\n\n';
    
    for (const diff of analysis.summary.criticalDifferences) {
      markdown += `### ${diff.testName}\n`;
      markdown += `- **Issue**: ${diff.difference}\n`;
      markdown += '\n';
    }
  }
  
  markdown += '## Detailed Test Comparisons\n\n';
  markdown += generateDetailedComparisons(analysis.comparisons);
  
  markdown += '\n## Recommendations\n\n';
  markdown += generateRecommendations(analysis);
  
  return markdown;
}

function generateSummaryTable(summary) {
  let table = '| Metric | Value |\n';
  table += '|--------|-------|\n';
  table += `| Total Tests Compared | ${summary.totalTests} |\n`;
  table += `| Identical Behavior | ${summary.identicalBehavior} (${(summary.identicalBehavior/summary.totalTests*100).toFixed(1)}%) |\n`;
  table += `| Different Behavior | ${summary.differentBehavior} (${(summary.differentBehavior/summary.totalTests*100).toFixed(1)}%) |\n`;
  table += `| Critical Differences | ${summary.criticalDifferences.length} |\n`;
  
  return table;
}

function generatePathBehaviorTable(pathBehavior) {
  let table = '| Path Pattern | Matches | Differences | Match Rate |\n';
  table += '|--------------|---------|-------------|------------|\n';
  
  for (const [pattern, stats] of Object.entries(pathBehavior)) {
    const total = stats.matches + stats.differences;
    const matchRate = total > 0 ? (stats.matches / total * 100).toFixed(1) : 'N/A';
    table += `| ${formatPathPattern(pattern)} | ${stats.matches} | ${stats.differences} | ${matchRate}% |\n`;
  }
  
  return table;
}

function formatPathPattern(pattern) {
  const formatted = {
    withLeadingSlash: 'With Leading Slash (/path)',
    withoutLeadingSlash: 'Without Leading Slash (path)',
    rootPath: 'Root Path (/)',
    emptyPath: 'Empty Path ("")',
    doubleSlash: 'Double Slash (//path)'
  };
  
  return formatted[pattern] || pattern;
}

function generateOperationTable(operationBehavior) {
  let table = '| Operation | Matches | Differences | Match Rate |\n';
  table += '|-----------|---------|-------------|------------|\n';
  
  for (const [operation, stats] of Object.entries(operationBehavior)) {
    const total = stats.matches + stats.differences;
    const matchRate = total > 0 ? (stats.matches / total * 100).toFixed(1) : 'N/A';
    table += `| ${operation} | ${stats.matches} | ${stats.differences} | ${matchRate}% |\n`;
  }
  
  return table;
}

function generateDetailedComparisons(comparisons) {
  let markdown = '';
  
  const differentBehavior = comparisons.filter(c => !c.behaviorMatch);
  
  if (differentBehavior.length > 0) {
    markdown += '### Tests with Different Behavior\n\n';
    
    for (const comp of differentBehavior) {
      markdown += `<details>\n`;
      markdown += `<summary><strong>${comp.testName}</strong></summary>\n\n`;
      markdown += `- **Path Used**: \`${comp.pathUsed}\`\n`;
      markdown += `- **Operation**: ${comp.operation}\n`;
      markdown += `- **REST Success**: ${comp.restResult.success}\n`;
      markdown += `- **SDK Success**: ${comp.sdkResult.success}\n`;
      
      if (comp.differenceDetail) {
        markdown += `- **Difference**: ${comp.differenceDetail}\n`;
      }
      
      if (comp.pathResolutionDifference && comp.pathResolutionDifference.length > 0) {
        markdown += '\n**Path Resolution Differences**:\n';
        for (const diff of comp.pathResolutionDifference) {
          markdown += `  - Path \`${diff.path}\`: REST=${diff.restFound}, SDK=${diff.sdkFound}\n`;
        }
      }
      
      markdown += '\n</details>\n\n';
    }
  }
  
  return markdown;
}

function generateRecommendations(analysis) {
  let recommendations = [];
  
  const pathBehavior = analysis.pathBehaviorDifferences;
  
  if (pathBehavior.withLeadingSlash && pathBehavior.withLeadingSlash.differences > 0) {
    recommendations.push('1. **Leading Slash Handling**: There are behavioral differences when using paths with leading slashes. Consider standardizing path format across your application.');
  }
  
  if (pathBehavior.emptyPath && pathBehavior.emptyPath.differences > 0) {
    recommendations.push('2. **Empty Path Handling**: Empty paths behave differently between REST API and SDK. Avoid using empty paths and always provide explicit path references.');
  }
  
  const multiPathOp = analysis.operationDifferences['MULTI_PATH_UPDATE'];
  if (multiPathOp && multiPathOp.differences > 0) {
    recommendations.push('3. **Multi-Path Updates**: Multi-path updates show behavioral differences. When using REST API, be aware that path resolution may differ from SDK behavior.');
  }
  
  if (analysis.summary.criticalDifferences.length > 0) {
    recommendations.push('4. **Critical Issues**: Address the critical differences identified above before migrating between REST API and SDK.');
  }
  
  recommendations.push('\n### Best Practices\n');
  recommendations.push('- **Use consistent path formats**: Choose either absolute paths (with leading slash) or relative paths (without leading slash) and use consistently');
  recommendations.push('- **Avoid edge cases**: Avoid empty paths, double slashes, and trailing slashes');
  recommendations.push('- **Test thoroughly**: When switching between REST API and SDK, test all path patterns used in your application');
  recommendations.push('- **Document path conventions**: Clearly document your path conventions for team consistency');
  
  return recommendations.join('\n');
}

export function generateConsoleReport(analysis) {
  console.clear();
  console.log(chalk.bold.blue('\n=== Firebase Realtime Database Behavior Analysis ===\n'));
  
  const summaryData = [
    ['Metric', 'Value'],
    ['Total Tests', analysis.summary.totalTests],
    ['Identical Behavior', `${analysis.summary.identicalBehavior} (${(analysis.summary.identicalBehavior/analysis.summary.totalTests*100).toFixed(1)}%)`],
    ['Different Behavior', `${analysis.summary.differentBehavior} (${(analysis.summary.differentBehavior/analysis.summary.totalTests*100).toFixed(1)}%)`],
    ['Critical Differences', analysis.summary.criticalDifferences.length]
  ];
  
  console.log(chalk.yellow('Summary:'));
  console.log(table(summaryData));
  
  if (analysis.summary.criticalDifferences.length > 0) {
    console.log(chalk.red.bold('\nCritical Differences Found:'));
    analysis.summary.criticalDifferences.forEach(diff => {
      console.log(chalk.red(`  ✗ ${diff.testName}`));
      console.log(chalk.gray(`    ${diff.difference}`));
    });
  }
  
  console.log(chalk.yellow('\nPath Behavior Analysis:'));
  const pathData = [['Path Pattern', 'Matches', 'Differences', 'Match Rate']];
  
  for (const [pattern, stats] of Object.entries(analysis.pathBehaviorDifferences)) {
    const total = stats.matches + stats.differences;
    const matchRate = total > 0 ? (stats.matches / total * 100).toFixed(1) + '%' : 'N/A';
    pathData.push([formatPathPattern(pattern), stats.matches, stats.differences, matchRate]);
  }
  
  console.log(table(pathData));
}

export async function generateReport() {
  try {
    const resultsDir = path.join(__dirname, '../../results');
    const files = readdirSync(resultsDir);
    
    const analysisFiles = files.filter(f => f.startsWith('analysis-'));
    
    if (analysisFiles.length === 0) {
      logger.error('No analysis files found. Run the analyzer first.');
      return null;
    }
    
    analysisFiles.sort();
    const latestAnalysisFile = path.join(resultsDir, analysisFiles[analysisFiles.length - 1]);
    
    logger.info(`Loading analysis from: ${latestAnalysisFile}`);
    const analysis = JSON.parse(readFileSync(latestAnalysisFile, 'utf8'));
    
    const markdownReport = generateMarkdownReport(analysis);
    const reportPath = path.join(resultsDir, `report-${Date.now()}.md`);
    writeFileSync(reportPath, markdownReport);
    
    logger.info(`Markdown report saved to: ${reportPath}`);
    
    generateConsoleReport(analysis);
    
    return reportPath;
    
  } catch (error) {
    logger.error('Failed to generate report', { error: error.message });
    throw error;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateReport()
    .then((reportPath) => {
      if (reportPath) {
        console.log(chalk.green(`\n✓ Report generated successfully: ${reportPath}`));
      }
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Report generation failed', { error: error.message });
      process.exit(1);
    });
}