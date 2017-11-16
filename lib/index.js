'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var fs = require('fs');
var rf = require('rimraf');
var xls = require('node-xlsx');
var path = require('path');
var md5 = require('md5');

var Excel2json = function () {
	function Excel2json(options) {
		var _this = this;

		_classCallCheck(this, Excel2json);

		this.jsonDir = options.jsonDir; //生成的json目录。
		this.excelPath = options.excelPath; //xls目录
		this.fileName = options.fileName;
		this.jsonList = [];
		this.nameKey = [];
		this.staticPath = options.staticPath || '';
		this.doTransform().then(function () {
			console.log('Transform over ' + _this.nameKey.length + ' files:');
			var objectString = {};
			_this.nameKey.forEach(function (name) {
				objectString[Object.keys(name)[0]] = _this.staticPath + Object.values(name)[0];
			});
			console.log(JSON.stringify(objectString, null, 2));
		}).catch(function (e) {
			console.log(e);
		});
	}

	_createClass(Excel2json, [{
		key: 'doTransform',
		value: function doTransform() {
			var _this2 = this;

			console.log('Transforming excel to json......');
			var PromiseQueen = [];
			var reg = /(\w+)\[(\d+)\]/g; //数组正则
			var excelData = xls.parse(this.excelPath)[0].data;
			excelData.forEach(function (colValue, colKey) {
				var _loop = function _loop(j) {
					if (!_this2.jsonList[j - 1]) _this2.jsonList[j - 1] = {};
					var key = colValue[0];
					var value = colValue[j];

					if (!value) value = ""; //定义空。

					if (reg.test(key)) {
						//transform array
						key.replace(reg, function (val, $1, $2) {
							if (!_this2.jsonList[j - 1][$1]) _this2.jsonList[j - 1][$1] = [];
							_this2.jsonList[j - 1][$1][$2] = value;
						});
					} else {
						_this2.jsonList[j - 1][key] = value;
					}
				};

				//write json
				for (var j = 1; j <= colValue.length; j++) {
					_loop(j);
				}
			});
			this.outputJson(PromiseQueen);

			return Promise.all(PromiseQueen);
		}
	}, {
		key: 'outputJson',
		value: function outputJson(PromiseQueen) {
			var _this3 = this;

			if (fs.existsSync(this.jsonDir)) {
				var promise = new Promise(function (resolve, reject) {
					rf(_this3.jsonDir, {}, function (err) {
						err ? reject(err) : resolve();
					});
				}).then(function () {
					_this3.createFiles(PromiseQueen);
				}).catch(function (error) {
					console.error(error);
				});
				PromiseQueen.push(promise);
			} else {
				this.createFiles(PromiseQueen);
			}
		}
	}, {
		key: 'createFiles',
		value: function createFiles(PromiseQueen) {
			var _this4 = this;

			var promise = new Promise(function (resolve) {
				fs.mkdirSync(_this4.jsonDir, function (err) {
					if (!err) resolve();
				});
			});
			PromiseQueen.push(promise);

			var _loop2 = function _loop2(i) {
				var json = _this4.jsonList[i];

				var content = JSON.stringify(json, null, 2);
				var md5V = md5(content);

				_this4.fileName.match(/(.*)\[.+\]\.\[(.+)\]/);
				var hashName = RegExp.$1 + json['lang'] + '.' + md5V.slice(0, 8) + '.' + RegExp.$2;
				var name = RegExp.$1 + json['lang'] + '.' + RegExp.$2;

				_this4.nameKey.push(_defineProperty({}, json['lang'], hashName));
				var filePath = path.join(_this4.jsonDir, './' + name);

				var promise = new Promise(function (resolve) {
					fs.writeFile(filePath, content, function (err) {
						err ? console.log(err) : resolve();
					});
				});
				PromiseQueen.push(promise);
			};

			for (var i = 0; i < this.jsonList.length - 1; i++) {
				_loop2(i);
			}
		}
	}]);

	return Excel2json;
}();

module.exports = Excel2json;