/**
 * @file A terminal output generator for test-suites results.
 */

'use strict';

// add color methods to String.prototype
require( 'colors' );

var util = require( 'util' );

var percentageForDisplay = require('../lib/percentageForDisplay');
var testSuiteHelpers = require('../lib/test_suite_helpers');

/**
 * Format and print a test result to the terminal.
 */
function prettyPrintTestCase( testCase, quiet ){
  var result = testSuiteHelpers.getMainResult(testCase);
  var id = result.testCase.id;
  delete result.testCase.in.api_key; // don't display API key

  var input = JSON.stringify(result.testCase.in);
  var expectationCount;
  var expectationString = (expectationCount > 1) ? ' (' + expectationCount + ' expectations)' : '';
  var testDescription = input + expectationString;

  if (result.testCase.expected && result.testCase.expected.properties) {
    expectationCount = result.testCase.expected.properties.length;
  } else {
    expectationCount = 0;
  }

  var status = (result.progress === undefined) ? '' : result.progress.inverse + ' ';
  switch( result.result ){
    case 'pass':
      if (!quiet) {
        console.log(util.format('  ✔ %s[%s] "%s"', status, id, testDescription).green);
      }
      break;

    case 'fail':
      var color = (result.progress === 'regression') ? 'red' : 'yellow';
      if (!quiet || color === 'red') {
        console.log(
          util.format( '  ✘ %s[%s] "%s": %s', status, id, testDescription, result.msg )[ color ]
        );
      }
      break;

    case 'placeholder':
      console.log( util.format( '  ! [%s] "%s": %s', id, testDescription, result.msg ).cyan );
      break;

    default:
      console.log( util.format( 'Result type `%s` not recognized.', result.result ) );
      process.exit( 1 );
      break;
  }
}

/*
 * Decide whether a test suite should be displayed in output
 * only tests where an unexpected (regression or improvement) result occured should cause
 * the test suite to display
 */
function shouldDisplayTestSuite(testSuite) {
  return !testSuiteHelpers.allTestsAsExpected(testSuite);
}

/**
 * Format and print all of the results from any number of test-suites.
 */
function prettyPrintSuiteResults( suiteResults, config, testSuites ){
  console.log( 'Tests for:', config.endpoint.url.blue + ' (' + config.endpoint.name.blue + ')' );

  testSuites.forEach( function(testSuite) {

    if (!config.quiet || shouldDisplayTestSuite(testSuite)) {
      console.log();
      console.log(testSuite.name.blue);

      testSuite.tests.forEach( function(testCase) {
        prettyPrintTestCase( testCase, config.quiet );
      });
    }
  });

  console.log( '\nAggregate test results'.blue );
  console.log( 'Pass: ' + suiteResults.stats.pass.toString().green );
  console.log( 'Improvements: ' + suiteResults.stats.improvement.toString().green);
  console.log( 'Fail: ' + suiteResults.stats.fail.toString().yellow );
  console.log( 'Placeholders: ' + suiteResults.stats.placeholder.toString().cyan );

  var numRegressions = suiteResults.stats.regression;
  var total = suiteResults.stats.pass +  suiteResults.stats.fail + suiteResults.stats.regression;
  var pass = total - numRegressions;

  console.log( 'Regressions: ' + numRegressions.toString().red);
  console.log( 'Took %sms', suiteResults.stats.timeTaken );
  console.log( 'Test success rate %s%%', percentageForDisplay(total,pass));

  console.log( '' );
  if( numRegressions > 0 ){
    console.log( 'FATAL ERROR: %s regression(s) detected.'.red.inverse, numRegressions );
    return 1;
  }
  else {
    console.log( '0 regressions detected. All good.' );
    return 0;
  }
}

module.exports = prettyPrintSuiteResults;
