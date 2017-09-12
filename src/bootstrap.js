import _ from 'lodash';
import Promise from 'bluebird';
import log from './lib/log';
import pkg from '../package.json';
import yargs from 'yargs';

global._ = _;
global.Promise = Promise;
global.log = log;

const { argv } = yargs;

log.info(pkg.description);
log.info(`Version: ${pkg.version}`);
log.info(`Author: ${pkg.author}`);
log.info(`Licence: ${pkg.license}`);
log.info(`Repository: ${pkg.homepage}`);
log.info(`Arguments: ${argv}`);