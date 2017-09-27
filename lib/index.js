let fs = require('fs');
let rf = require('rimraf');
let xls = require('node-xlsx');
let path = require('path');
class Excel2json {
  constructor(options) {
    this.jsonDir = options.jsonDir;//生成的json目录。
    this.excelPath = options.excelPath;//xls目录
    this.fileName = options.fileName;
    this.jsonList = [];
    this.nameKey = [];
    this.doTransform()
      .then(() => {
        console.log(`Transform over ${this.nameKey.length} files:`);
        console.log(`Transform key ====>  ${this.nameKey.join(",")}`);
      })
      .catch(e =>{
        console.log(e)
      })
  }

  doTransform() {
    console.log('Transforming excel to json......');
    const PromiseQueen = [];
    const reg = /(\w+)\[(\d+)\]/g;//数组正则
    const excelData = xls.parse(this.excelPath)[0].data;
    excelData.forEach((colValue, colKey) => {  //write json
      for (let j = 1; j <= colValue.length; j++) {
        if (!this.jsonList[j - 1]) this.jsonList[j - 1] = {};
        let key = colValue[0];
        let value = colValue[j];

        if (!value) value = "";//定义空。

        if (reg.test(key)) { //transform array
          key.replace(reg, (val, $1, $2) => {
            if (!this.jsonList[j - 1][$1]) this.jsonList[j - 1][$1] = [];
            this.jsonList[j - 1][$1][$2] = value
          });
        } else {
          this.jsonList[j - 1][key] = value
        }
      }
    });
    this.outputJson(PromiseQueen);

    return Promise.all(PromiseQueen)
  }

  outputJson(PromiseQueen) {
    if (fs.existsSync(this.jsonDir)) {
      let promise = new Promise((resolve, reject) => {
        rf(this.jsonDir, {}, (err) => {
          err ? reject(err) : resolve();
        })
      })
        .then(() => {
          this.createFiles(PromiseQueen)
        })
        .catch((error) => {
          console.error(error)
        });
      PromiseQueen.push(promise);
    } else {
      this.createFiles(PromiseQueen)
    }
  }

  createFiles(PromiseQueen) {
    let promise = new Promise((resolve) => {
      fs.mkdirSync(this.jsonDir, function (err) {
        if (!err) resolve();
      });
    });
    PromiseQueen.push(promise);

    for (let i = 0; i < this.jsonList.length - 1; i++) {
      let json = this.jsonList[i];
      this.nameKey.push(json['lang']);
      this.fileName.match(/(.*)\[.+\]\.\[(.+)\]/);
      let name = RegExp.$1 + json['lang'] + '.' + RegExp.$2;
      let filePath = path.join(this.jsonDir, './' + name);
      let content = JSON.stringify(json, null, 2);
      let promise = new Promise((resolve) => {
        fs.writeFile(filePath, content, function (err) {
          err ? console.log(err) : resolve()
        })
      });
      PromiseQueen.push(promise)
    }
  }

}

module.exports = Excel2json;