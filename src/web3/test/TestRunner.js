#!/usr/bin/env node

/**
 * Test Runner for NFT Collection & Bonding Token Ecosystem
 * 
 * This script runs all test suites in the correct order and provides
 * comprehensive reporting of test results.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Test suites in order of execution
const testSuites = [
  {
    name: 'Bonding Curve Math Library',
    file: 'BondingCurveMath.test.js',
    description: 'Tests the mathematical functions for linear bonding curves'
  },
  {
    name: 'NFT System',
    file: 'NFTSystem.test.js',
    description: 'Tests NFT Factory and Collection contracts'
  },
  {
    name: 'Bonding System',
    file: 'BondingSystem.test.js',
    description: 'Tests ERC20 Factory and Bonding Token contracts'
  },
  {
    name: 'Staking System',
    file: 'StakingSystem.test.js',
    description: 'Tests Staking Factory and Pool contracts'
  },
  {
    name: 'Protocol Fees',
    file: 'ProtocolFees.test.js',
    description: 'Tests protocol fee functionality across all contracts'
  },
  {
    name: 'Time-Based Eligibility',
    file: 'TimeBasedEligibility.test.js',
    description: 'Tests time-based reward eligibility to prevent gaming'
  },
  {
    name: 'Integration Tests',
    file: 'Integration.test.js',
    description: 'End-to-end tests of complete system workflows'
  }
];

class TestRunner {
  constructor() {
    this.results = [];
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
    this.startTime = Date.now();
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  logHeader(message) {
    const border = '='.repeat(60);
    this.log(border, 'cyan');
    this.log(`  ${message}`, 'cyan');
    this.log(border, 'cyan');
  }

  logSubHeader(message) {
    this.log(`\n${'─'.repeat(40)}`, 'blue');
    this.log(message, 'blue');
    this.log('─'.repeat(40), 'blue');
  }

  async runTestSuite(suite) {
    this.logSubHeader(`Running: ${suite.name}`);
    this.log(suite.description, 'yellow');

    const testFile = path.join(__dirname, suite.file);

    // Check if test file exists
    if (!fs.existsSync(testFile)) {
      this.log(`❌ Test file not found: ${suite.file}`, 'red');
      this.results.push({
        name: suite.name,
        status: 'MISSING',
        duration: 0,
        tests: 0,
        passed: 0,
        failed: 0
      });
      return;
    }

    try {
      const startTime = Date.now();

      // Run the test suite
      const output = execSync(
        `npx hardhat test ${testFile} --reporter json`,
        {
          encoding: 'utf8',
          cwd: path.dirname(__dirname), // Go up one level to project root
          timeout: 300000 // 5 minute timeout
        }
      );

      const duration = Date.now() - startTime;

      // Parse test results
      let testResults;
      try {
        testResults = JSON.parse(output);
      } catch (e) {
        // If JSON parsing fails, try to extract basic info from text output
        const textOutput = execSync(
          `npx hardhat test ${testFile}`,
          {
            encoding: 'utf8',
            cwd: path.dirname(__dirname),
            timeout: 300000
          }
        );

        const passedMatch = textOutput.match(/(\d+) passing/);
        const failedMatch = textOutput.match(/(\d+) failing/);

        testResults = {
          stats: {
            passes: passedMatch ? parseInt(passedMatch[1]) : 0,
            failures: failedMatch ? parseInt(failedMatch[1]) : 0,
            tests: (passedMatch ? parseInt(passedMatch[1]) : 0) + (failedMatch ? parseInt(failedMatch[1]) : 0)
          }
        };
      }

      const passed = testResults.stats.passes || 0;
      const failed = testResults.stats.failures || 0;
      const total = testResults.stats.tests || (passed + failed);

      this.totalTests += total;
      this.passedTests += passed;
      this.failedTests += failed;

      const status = failed === 0 ? 'PASSED' : 'FAILED';
      const statusColor = failed === 0 ? 'green' : 'red';

      this.log(`${status === 'PASSED' ? '✅' : '❌'} ${suite.name}: ${passed}/${total} tests passed`, statusColor);
      this.log(`   Duration: ${duration}ms`, 'yellow');

      this.results.push({
        name: suite.name,
        status,
        duration,
        tests: total,
        passed,
        failed
      });

      if (failed > 0) {
        this.log(`   ${failed} test(s) failed`, 'red');
      }

    } catch (error) {
      const duration = Date.now() - startTime;

      this.log(`❌ ${suite.name}: ERROR`, 'red');
      this.log(`   Error: ${error.message}`, 'red');

      this.results.push({
        name: suite.name,
        status: 'ERROR',
        duration,
        tests: 0,
        passed: 0,
        failed: 0,
        error: error.message
      });
    }
  }

  printSummary() {
    const totalDuration = Date.now() - this.startTime;

    this.logHeader('TEST SUMMARY');

    // Overall results
    this.log(`Total Tests: ${this.totalTests}`, 'bright');
    this.log(`Passed: ${this.passedTests}`, 'green');
    this.log(`Failed: ${this.failedTests}`, this.failedTests > 0 ? 'red' : 'green');
    this.log(`Total Duration: ${totalDuration}ms (${(totalDuration / 1000).toFixed(2)}s)`, 'yellow');

    // Success rate
    const successRate = this.totalTests > 0 ? ((this.passedTests / this.totalTests) * 100).toFixed(1) : 0;
    this.log(`Success Rate: ${successRate}%`, successRate == 100 ? 'green' : 'yellow');

    this.log('\n' + '─'.repeat(60), 'cyan');
    this.log('DETAILED RESULTS', 'cyan');
    this.log('─'.repeat(60), 'cyan');

    // Detailed results for each test suite
    this.results.forEach(result => {
      const statusIcon = result.status === 'PASSED' ? '✅' :
        result.status === 'FAILED' ? '❌' :
          result.status === 'ERROR' ? '💥' : '❓';

      this.log(`${statusIcon} ${result.name}`);
      this.log(`   Status: ${result.status}`,
        result.status === 'PASSED' ? 'green' :
          result.status === 'FAILED' ? 'red' : 'yellow');

      if (result.tests > 0) {
        this.log(`   Tests: ${result.passed}/${result.tests} passed`);
      }

      this.log(`   Duration: ${result.duration}ms`);

      if (result.error) {
        this.log(`   Error: ${result.error}`, 'red');
      }

      this.log('');
    });

    // Final status
    if (this.failedTests === 0 && this.results.every(r => r.status !== 'ERROR' && r.status !== 'MISSING')) {
      this.logHeader('🎉 ALL TESTS PASSED! 🎉');
      this.log('The NFT Collection & Bonding Token Ecosystem is working correctly!', 'green');
    } else {
      this.logHeader('❌ SOME TESTS FAILED');
      this.log('Please review the failed tests and fix any issues.', 'red');
    }
  }

  async run() {
    this.logHeader('NFT Collection & Bonding Token Ecosystem - Test Suite');
    this.log('Running comprehensive tests for all smart contracts...', 'yellow');

    // Check if we're in the right directory
    const packageJsonPath = path.join(path.dirname(__dirname), 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      this.log('❌ Error: Not in a Node.js project directory', 'red');
      this.log('Please run this script from the project root directory.', 'red');
      process.exit(1);
    }

    // Check if Hardhat is available
    try {
      execSync('npx hardhat --version', { stdio: 'pipe' });
    } catch (error) {
      this.log('❌ Error: Hardhat not found', 'red');
      this.log('Please install Hardhat: npm install --save-dev hardhat', 'red');
      process.exit(1);
    }

    // Run each test suite
    for (const suite of testSuites) {
      await this.runTestSuite(suite);
    }

    // Print summary
    this.printSummary();

    // Exit with appropriate code
    const hasFailures = this.failedTests > 0 || this.results.some(r => r.status === 'ERROR' || r.status === 'MISSING');
    process.exit(hasFailures ? 1 : 0);
  }
}

// Run the tests if this script is executed directly
if (require.main === module) {
  const runner = new TestRunner();
  runner.run().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = TestRunner; 