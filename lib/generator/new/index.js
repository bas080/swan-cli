"use strict";

const newProject = require('./new-project');
const newServer  = require('./new-server');
const readline   = require('readline');
const newClient  = require('./new-client');
const path       = require('path');
const config     = require('../../config');
const utils      = require('../../cli-utils');
const mkdirp     = require('mkdirp');

module.exports = function executeNew(options) {
  options.path = options.path || path.join(process.cwd(), options.projectName);
  mkdirp.sync(options.path);
  process.chdir(options.path);

  let repositoryBase   = `${config.sources[options.source]}:${options.username}/${options.projectName}`;
  options.repositories = {
    project: {
      directory: '.'
    },
    server : {
      directory: options.projectName + '-server'
    },
    client : {
      directory: options.projectName + '-client'
    }
  };

  if (options.owner) {
    let ownerBase                         = `${config.sources[options.source]}:${options.owner}/${options.projectName}`;
    options.repositories.project.upstream = `${ownerBase}.git`;
    options.repositories.server.upstream  = `${ownerBase}-server.git`;
    options.repositories.client.upstream  = `${ownerBase}-client.git`;
  } else {
    options.repositories.project.origin = `${repositoryBase}.git`;
    options.repositories.server.origin  = `${repositoryBase}-server.git`;
    options.repositories.client.origin  = `${repositoryBase}-client.git`;
  }

  let rl = readline.createInterface({
    input : process.stdin,
    output: process.stdout
  });

  rl.setPrompt('');

  // Simulate ctrl+u to delete the line written previously
  rl.write(null, {ctrl: true, name: 'u'});

  rl.write('\n- Setting up project... ');
  return newProject(options)
    .then(() => {
      rl.write('Done!'.bold.green + '\n');
      rl.write('- Setting up server... ');

      return newServer(options);
    })
    .then(() => {
      rl.write('Done!'.bold.green + '\n');
      rl.write('- Setting up client (might take a while, because magic)... ');
      return newClient(options);
    })
    .then(() => {
      if (!options.owner) {
        return;
      }

      rl.write('Done!'.bold.green + '\n');
      rl.write('- Setting origins (just for you)...');

      return utils.setOrigin('project')
        .then(() => utils.setOrigin('server'))
        .then(() => utils.setOrigin('client'));
    })
    .then(() => {
      rl.write('Done!'.bold.green + '\n');
      rl.close();
    })
    .catch((error) => {
      rl.write('Error!'.bold.red + '\n');
      console.error(error);
      rl.close();
    });
};