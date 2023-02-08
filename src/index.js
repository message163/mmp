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

const whiteList = ['npm', 'yarn', 'tencent', 'cnpm', 'taobao', 'npmMirror'] //白名单

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
    if (v) {
        console.log(chalk.blue('当前源:', v))
    } else {
        console.log(chalk.green('当前源:', reg))
    }

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
            .catch(() => console.log(chalk.red('GG', 'timeout')))

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
                if (!answer.trim()) {
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
                if (!answer.trim()) {
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
        try {
            fs.writeFileSync(path.join(__dirname, '../registries.json'), JSON.stringify(registries, null, 4))
            console.log(chalk.blue('添加完成'))
        }
        catch (e) {
            console.log(chalk.red(err))
        }

    })
})

program.command('delete').description('删除自定义的源').action(() => {

    const keys = Object.keys(registries)
    if (keys.length === whiteList.length) {
        return console.log(chalk.red('当前无自定义源可以删除'))
    } else {

        const Difference = keys.filter((key) => !whiteList.includes(key))
        inquirer.prompt([
            {
                type: "list",
                name: "sel",
                message: "请选择删除的镜像",
                choices: Difference
            }
        ]).then(async result => {
            const current = await getOrigin()
            const selOrigin = registries[result.sel]
            if (current.trim() == selOrigin.registry.trim()) {
                console.log(chalk.red(`当前还在使用该镜像${registries[result.sel].registry},请切换其他镜像删除`))
            } else {
                try {
                    delete registries[result.sel]

                    fs.writeFileSync(path.join(__dirname, '../registries.json'), JSON.stringify(registries, null, 4))

                    console.log(chalk.green('SUCCESS 操作完成'))
                }
                catch (e) {
                    console.log(chalk.red(err))
                }
            }

        })
    }
})

program.command('rename').description('重命名').action(() => {
    const keys = Object.keys(registries)
    if (keys.length === whiteList.length) {
        return console.log(chalk.red('当前无自定义源可以重命名'))
    } else {
        const Difference = keys.filter((key) => !whiteList.includes(key))
        inquirer.prompt([
            {
                type: "list",
                name: "sel",
                message: "请选择名称",
                choices: Difference
            },
            {
                type: "input",
                name: "rename",
                message: "请输入新名称",
                validate(answer) {
                    const keys = Object.keys(registries)
                    if (keys.includes(answer)) {
                        return `不能起名${answer}跟保留字冲突`
                    }
                    if (!answer.trim()) {
                        return `名称不能为空`
                    }
                    return true;
                }
            }
        ]).then(async result => {

            registries[result.rename] = Object.assign({}, registries[result.sel])
            delete registries[result.sel]

            try {
                fs.writeFileSync(path.join(__dirname, '../registries.json'), JSON.stringify(registries, null, 4))
                console.log(chalk.greenBright(`SUCCESS 重命名完成 ${result.rename}`))
            }
            catch (e) {
                console.log(chalk.red(err))
            }
        })
    }
})

program.command('edit').description('编辑自定义的源').action(async () => {
    const keys = Object.keys(registries)
    if (keys.length === whiteList.length) {
        return console.log(chalk.red('当前无自定义源可以编辑'))
    }
    const Difference = keys.filter((key) => !whiteList.includes(key))
    const { sel } = await inquirer.prompt([{
        type: "list",
        name: "sel",
        message: "请选择需要编辑的源",
        choices: Difference
    }])
    const { registerUrl } = await inquirer.prompt([{
        type: "input",
        name: "registerUrl",
        message: "输入修改后的镜像地址",
        default: () => registries[sel].registry,
        validate(registerUrl) {
            if (!registerUrl.trim())
                return "镜像地址不能为空"
            return true
        }
    }])
    const del = (url) => {
        const arr = url.split('')
        return arr[arr.length - 1] == '/' ? (arr.pop() && arr.join('')) : arr.join('')
    }

    registries[sel] = {
        home: registerUrl.trim(),
        registry: registerUrl.trim(),
        ping: del(registerUrl.trim()),
    }
    try {
        fs.writeFileSync(path.join(__dirname, '../registries.json'), JSON.stringify(registries, null, 4))
        console.log(chalk.blue('修改完成'))
    }
    catch (e) {
        console.log(chalk.red(err))
    }
})

program.parse(process.argv)     