#!/usr/bin/env node
const download = require('download-git-repo');
const program = require('commander');
const chalk = require('chalk');
const exists = require('fs').existsSync;
const inquirer = require('inquirer');
const rm = require('rimraf').sync
const home = require('user-home');
const ora = require('ora');
const logger = require('../lib/logger');

// const Metalsmith = require('metalsmith');
const path = require('path');
// const getOptions = require('../src/options');
// const ask = require('../src/ask');
// const multimatch = require('multimatch')
// const async = require('async')
// const render = require('consolidate').handlebars.render

const generate = require('../lib/generate')
// const checkVersion = require('../lib/check-version')

const localPath = require('../lib/local-path')

const isLocalPath = localPath.isLocalPath
const getTemplatePath = localPath.getTemplatePath


program.version('1.0.0');

/**
 * Usage.
 */

program
  .usage('<模板名称> [项目名称]')
  .option('--test', 'show first test', true)
  .option('-c, --clone', 'use git clone')
  .option('--offline', 'use cached template')

/**
 * Help.
 */

program.on('--help', () => {
  console.log('  Examples:')
  console.log()
  console.log(chalk.gray('    创建一个标准模板：'))
  console.log('    $ vue init webpack【模板名称】 my-project【项目名称】')
  console.log()
})

/**
 * Help.
 */

function help () {
  program.parse(process.argv)
  if (program.args.length < 1) return program.help()
}
help()

/**
 * Settings.
 */

let template = program.args[0]
const hasSlash = template.indexOf('/') > -1
const rawName = program.args[1]
const inPlace = !rawName || rawName === '.'
const name = inPlace ? path.relative('../', process.cwd()) : rawName
const to = path.resolve(rawName || '.')
const clone = program.clone || false
const tmp = path.join(home, '.mn-templates', template.replace(/[\/:]/g, '-'))
if (program.offline) {
  console.log(`> Use cached template at ${chalk.yellow(tildify(tmp))}`)
  template = tmp
}

/**
 * Padding.
 */
process.on('exit', () => {
  console.log()
})

if (inPlace || exists(to)) {
  inquirer.prompt([{
    type: 'confirm',
    message: inPlace
      ? '在当前目录创建项目？'
      : '目标文件夹[' + rawName + ']已经存在，是否继续？',
    name: 'ok'
  }]).then(answers => {
    if (answers.ok) {
      run()
    } else {
      console.log('创建失败...')
    }
  }).catch(logger.fatal)
} else {
  run()
}

/**
 * 检查-->下载-->创建一个项目.
 */

function run () {
  // 检查是否为本地模板路径
  if (isLocalPath(template)) {
    const templatePath = getTemplatePath(template)
    if (exists(templatePath)) {
      generate(name, templatePath, to, err => {
        if (err) logger.fatal(err);
        logger.success('Generated "%s".', name)
      })
    } else {
      logger.fatal('Local template "%s" not found.', template)
    }
  } else {
    if (!hasSlash) {
      // use official templates
      const officialTemplate = 'github:windowsvico01/' + template
      if (template.indexOf('#') !== -1) {
        downloadAndGenerate(officialTemplate)
      } else {
        if (template.indexOf('-2.0') !== -1) {
          warnings.v2SuffixTemplatesDeprecated(template, inPlace ? '' : name)
          return
        }
        // warnings.v2BranchIsNowDefault(template, inPlace ? '' : name)
        downloadAndGenerate(officialTemplate)
      }
    } else {
      downloadAndGenerate(template)
    }
    // checkVersion(() => {
    // })
  }
}

/**
 * Download a generate from a template repo.
 *
 * @param {String} template
 */

function downloadAndGenerate (template) {
  const spinner = ora('下载模板中...')
  spinner.start()
  // Remove if local template exists
  if (exists(tmp)) rm(tmp)
  download(template, tmp, { clone }, err => {
    spinner.stop()
    if (err) {
      logger.fatal('Failed to download repo ' + template + ': ' + err.message.trim())
    }
    generate(name, tmp, to, err => {
      if (err) logger.fatal(err)
      console.log(chalk.green([
        '.88b  d88.  .d88b.   .d88b.  d8b   db',
        '88 YbdP 88 .8P  Y8. .8P  Y8. 888o  88',
        '88  88  88 88    88 88    88 88V8o 88',
        '88  88  88 88    88 88    88 88 V8o88',
        '88  88  88 `8b  d8  `8b  d8  88  V888',
        'YP  YP  YP   Y88P     Y88P  VP   V8P',
        '       模板创建完成，奥利给！！！       '                                                                              
      ].join('\n')))
      logger.success('Generated "%s".', name)
    })
  })
}

program.parse(process.argv);