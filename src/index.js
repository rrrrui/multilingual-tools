let fs = require('fs');
let rf = require('rimraf');
let xls = require('node-xlsx');
let path = require('path');
let md5 = require('md5');
require('babel-polyfill');

class Excel2json {
	constructor(options) {
		this.jsonDir = options.jsonDir;//生成的json目录。
		this.excelPath = options.excelPath;//xls目录
		this.fileName = options.fileName;
		this.jsonList = [];
		this.nameKey = [];
		this.staticPath = options.staticPath || '';
		this.doTransform()
			.then(() => {
				console.log(`Transform over ${this.nameKey.length} files:`);
				let objectString = {};
				this.nameKey.forEach((name) => {
					objectString[Object.keys(name)[0]] = this.staticPath + Object.values(name)[0];
				});
				console.log(JSON.stringify(objectString, null, 2))
			})
			.catch((e) => {
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

			let content = JSON.stringify(json, null, 2);
			let md5V = md5(content);

			this.fileName.match(/(.*)\[.+\]\.\[(.+)\]/);
			let hashName = RegExp.$1 + json['lang'] + '.' + md5V.slice(0, 8) + '.' + RegExp.$2;
			let name = RegExp.$1 + json['lang'] + '.' + RegExp.$2;

			this.nameKey.push({[json['lang']]: hashName});
			let filePath = path.join(this.jsonDir, './' + name);

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