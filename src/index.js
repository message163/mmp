#!/usr/bin/env node

const { program } = require('commander')
const PKG = require('../package.json')
const registries = require('../registries.json');
const inquirer = require('inquirer');
const { exec, execSync } = require('child_process')
const ping = require('node-http-ping')
const fs = require('fs')
const chalk = require("chalk");
const path = require('path')
program.version(PKG.version)

const getOrigin = async () => {
    return await execSync('npm get registry', { encoding: "utf-8" })
}


program.command('ls').description('查看镜像').action(async () => {

    const res = await getOrigin()

    const keys = Object.keys(registries)

    const message = []

    const max = Math.max(...keys.map(v => v.length)) + 3
    keys.forEach(k => {

        const newK = registries[k].registry == res.trim() ? ('* ' + k) : ('  ' + k)
        const Arr = new Array(...newK)
        Arr.length = max;
        const prefix = Array.from(Arr).map(v => v ? v : '-').join('')

        message.push(prefix + '  ' + registries[k].registry)
    })
    console.log(message.join('\n'))
})

program.command('use').description('请选择镜像').action(() => {
    inquirer.prompt([
        {
            type: "list",
            name: "sel",
            message: "请选择镜像",
            choices: Object.keys(registries)
        }
    ]).then(result => {

        const reg = registries[result.sel].registry

        exec(`npm config set registry ${reg}`, null, (err, stdout, stderr) => {

            if (err) {
                console.error('切换错误', err)
            } else {
                console.log('切换成功')
            }
        })
    })
})



program.command('current').description('查看当前源').action(async () => {
    const reg = await getOrigin()
    const v = Object.keys(registries).find(k => {
        if (registries[k].registry === reg.trim()) {
            return k;
        }
    })
    console.log(chalk.blue('当前源:', v))
})

program.command('ping').description('测试镜像地址速度').action(() => {
    inquirer.prompt([
        {
            type: "list",
            name: "sel",
            message: "请选择镜像",
            choices: Object.keys(registries)
        }
    ]).then(result => {

        const url = registries[result.sel].ping.trim()

        ping(url).then(time => console.log(chalk.blue(`响应时长: ${time}ms`)))
            .catch(() => console.log(chalk.red('GG')))

    })
})

program.command('add').description('自定义镜像').action(() => {
    inquirer.prompt([
        {
            type: "input",
            name: "name",
            message: "请输入镜像名称",
            validate(answer) {
                const keys = Object.keys(registries)
                if (keys.includes(answer)) {
                    return `不能起名${answer}跟保留字冲突`
                }
                if (!answer) {
                    return '名称不能为空'
                }
                return true
            }
        },
        {
            type: "input",
            name: "url",
            message: "请输入镜像地址",
            validate(answer) {
                if (!answer) {
                    return `url不能为空`
                }
                return true
            }       
        }
    ]).then(result => {

        const del = (url) => {
            const arr = url.split('')
            return arr[arr.length - 1] == '/' ? (arr.pop() && arr.join('')) : arr.join('')
        }

        registries[result.name] = {
            home: result.url.trim(),
            registry: result.url.trim(),
            ping: del(result.url.trim()),
        }
        fs.writeFileSync(path.join(__dirname, '../registries.json'), JSON.stringify(registries, null, 4))
        console.log(chalk.blue('添加完成'))
    })
})



program.parse(process.argv)     