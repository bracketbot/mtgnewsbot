'use strict';
const merge = require('lodash.merge');
const buildGrammar = require('./src/build-grammar.js');

const CONFIG_OVERRIDE_PATH = './config-override.json';
const DEFAULT_GRAMMAR_PATH = './src/data/grammar';
const TWEET_LENGTH = 140;
const TEMPFILE_PATH = '/tmp';

let config = {
  defaultGrammarPath:  DEFAULT_GRAMMAR_PATH,
  defaultGrammar: undefined,
  origin: undefined,
  tweetLength: TWEET_LENGTH,
  paths: {
    tempDirectory: TEMPFILE_PATH
  },
  twitterLink: `https://twitter.com/MTGnewsbot`,
  webhookUrl: null,
  webhookUrlErr: null,
  TWITTER_CONSUMER_KEY: null,
  TWITTER_CONSUMER_SECRET: null,
  TWITTER_ACCESS_TOKEN: null,
  TWITTER_ACCESS_TOKEN_SECRET: null
};

// apply overrides from config overrides file
try {
  let override = require(CONFIG_OVERRIDE_PATH);
  console.info(`Loading config overrides from ${CONFIG_OVERRIDE_PATH}`);
  config = merge(config, override);
} catch(e) {
  if (e.code === 'MODULE_NOT_FOUND') { 
    console.info(`No config overrides located at ${CONFIG_OVERRIDE_PATH}`);
  } else {
    console.warn(`Unable to load config override: ${e}`);
  }
}

// load the default grammar after applying overrides
config.defaultGrammar = buildGrammar(config.defaultGrammarPath);

Object.freeze(config);

global.mtgnewsbot = global.mtgnewsbot || {};
global.mtgnewsbot.config = config;

module.exports = config;
