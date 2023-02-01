
# 这是一个切换镜像源的库

安装建议加上-g

npm i xmzs -g
##### mmp ls 查看目前源

* npm-------  https://registry.npmjs.org/
  
  yarn------  https://registry.yarnpkg.com/

  tencent---  https://mirrors.cloud.tencent.com/npm/

  cnpm------  https://r.cnpmjs.org/

  taobao----  https://registry.npmmirror.com/
  
  npmMirror-  https://skimdb.npmjs.com/registry/

##### mmp use 切换源

选择你要切换的源

##### mmp current 查看当前源

当前源: npm

##### mmp add 添加源

1.输入添加的名称
2.输入源地址

##### mmp ping 测试源

? 请选择镜像 cnpm
响应时长: 1635ms

##### mmp delete 删除自定义源

add添加的源都可以删除


##### mmp rename 重命名

自定义添加的源都可以进行重新命名


# 用法 Usage

Usage: mmp [options] [command]

Options:
  -V, --version   output the version number
  -h, --help      display help for command

Commands:
  ls              查看镜像
  use             请选择镜像
  current         查看当前源
  ping            测试镜像地址速度
  add             自定义镜像
  delete          删除自定义的源
  rename          重命名
  help [command]  display help for command

