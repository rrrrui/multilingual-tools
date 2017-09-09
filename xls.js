let fs = require('fs');
let rf = require('rimraf');
let xls = require('node-xlsx');


let filePath = `lang.xlsx`;//xls目录
let dir = `${__dirname}/lang`;//生成的json目录。
let reg = /(\w+)\[(\d+)\]/g;//数组正则
const workSheetsFromFile = xls.parse(filePath)[0];

let data = workSheetsFromFile.data;
let jsonFile = [];
let len = data[0].length;

for (let i = 0; i < len - 1; i++) {
  jsonFile.push({});
}

for (let i in data) {
  for (let j = 1; j < data[i].length; j++) {
    let key = data[i][0];
    let value = data[i][j];

    if (!value) data[i][j] = "";//定义空。

    if (reg.test(key)) {
      key.replace(reg, function (val, $1, $2) {
        if (!jsonFile[j - 1][$1]) jsonFile[j - 1][$1] = [];
        jsonFile[j - 1][$1][$2] = value
      });
    } else {
      jsonFile[j - 1][key] = value
    }
  }
}
function createFiles() {
  fs.mkdir(dir, function (err) {
    if (err)return console.error(err);
    for (let i = 0; i < len - 1; i++) {
      let name = ".\\lang\\lang_" + jsonFile[i]['lang'] + ".json";
      let content = JSON.stringify(jsonFile[i], null, 2);
      fs.writeFile(name, content, function (err) {
        err ? console.log(err) : console.log("转化成功")
      })
    }
  });
}

function fsExistsSync(path) {//判断文件夹是否存在
  try {
    fs.accessSync(path, fs.F_OK);
  } catch (e) {
    return false;
  }
  return true;
}

if (fsExistsSync(dir)) {
  rf(dir, {}, (err) => {
    err ? console.log(err) : createFiles()
  })
} else {
  createFiles()
}