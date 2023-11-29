// node fs 模块
const fs = require('fs');
// node path 模块
const path = require('path');

// 加解密使用的密钥 key 和向量 iv
const cipherInfo = {
    // 32字节长度(256位)密钥key 
    key: 'www.luculent.net|UED|DigitalTwin',
    // 16字节长度向量iv
    iv: 'luculent1!202311'
};

let getFileListTimer = null;
function getFileList(url, cb, fileList) {
    if(!fileList){
        fileList = [];
    }
    const filePath = path.resolve(url);
    // 根据文件路径读取文件，返回文件列表
    fs.readdir(filePath, (err, files) => {
        if (err) {
            return console.error('Error:(spec)', err);
        }
        files.forEach((filename) => {
            // 获取当前文件的绝对路径
            const filedir = path.join(filePath, filename);
            // fs.stat(path) 执行后，会将stats类的实例返回给其回调函数。
            fs.stat(filedir, (eror, stats) => {
                if (eror) {
                    return console.error('Error:(spec)', err);
                }
                // 是否是文件
                const isFile = stats.isFile();
                if (isFile) {
                    // 处理多余的绝对路径，第一个 replace 是替换掉那个路径，第二个是所有满足\\的直接替换掉
                    fileList.push(filedir.replace(__dirname, '').replace(/\\/img, '/'));
                    if (getFileListTimer) {
                        clearTimeout(getFileListTimer);
                    }
                    // 最后输出完整的文件路径
                    getFileListTimer = setTimeout(() => cb && cb(fileList), 200);
                }
                // 是否是文件夹
                const isDir = stats.isDirectory();
                if (isDir) {
                    getFileList(filedir, cb);
                }
            });
        });
    });
};

function createDirsSync(dir, callback) {
    // 判断有没有当前文件夹，有就查询下一层文件夹，没有就建立
    var dirs = dir.split('/');
    if (dirs[0] == '.' || dirs[0] == "..") {
        dirs[1] = dirs[0] + "/" + dirs[1];
        dirs.shift();
    }
    if (dirs[dirs.length - 1] == "") {
        dirs.pop();
    }
    var len = dirs.length;
    var i = 0;
    var url = dirs[i];
    // 启动递归函数
    mkDirs(url);
    // 逐级检测有没有当前文件夹，没有建立，有就继续检测下一级
    function mkDirs(url) {
        if (fs.existsSync(url)) {
            i = i + 1;
            if (len > i) {
                url = url + "/" + dirs[i];
                mkDirs(url);
            } else {
                callback();
            }
        } else {
            mkDir(url)
        }
    }
    // 建立文件
    function mkDir(url) {
        fs.mkdirSync(url);
        i = i + 1;
        if (len > i) {
            url = url + "/" + dirs[i];
            mkDir(url);
        } else {
            callback();
        }
    }
}

function writeFile(writePath, buffer, callback) {
    let arr = writePath.split('/');
    arr.pop();
    createDirsSync(arr.join('/'), () => {
        fs.writeFile(writePath, buffer, function(error){
            if(error){
                console.error('写入文件内容失败');
                console.error(error);
                return false;
            }
            // console.log(99999, '写入成功');
            callback();
        });
    });
}

function readFile(readPath, callback) {
    fs.readFile(readPath, 'binary', function(error, data) {
        if(error){
            console.error('读取文件内容失败');
            console.error(error);
            return false;
        }
        const buffer = Buffer.from(data, 'binary');
        callback(buffer);
    });
}

function initCryptoJS(CryptoJS) {
    CryptoJS.enc.u8a = {
        /**
         * Converts a word array to a Uint8Array.
         * @param {WordArray} wordArray The word array.
         * @return {Uint8Array} The Uint8Array.
         * @static
         * @example
         * var u8arr = CryptoJS.enc.u8a.stringify(wordArray);
         */
        stringify: function (wordArray) {
            // Shortcuts
            var words = wordArray.words;
            var sigBytes = wordArray.sigBytes;
            // Convert
            var u8 = new Uint8Array(sigBytes);
            for (var i = 0; i < sigBytes; i++) {
                var byte = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
                u8[i] = byte;
            }
            return u8;
        },
        /**
         * Converts a Uint8Array to a word array.
         * @param {String} u8Str The Uint8Array.
         * @return {WordArray} The word array.
         * @static
         * @example
         * var wordArray = CryptoJS.enc.u8a.parse(u8arr);
         */
        parse: function (u8arr) {
            // Shortcut
            var len = u8arr.length;
            // Convert
            var words = [];
            for (var i = 0; i < len; i++) {
                words[i >>> 2] |= (u8arr[i] & 0xff) << (24 - (i % 4) * 8);
            }
            return CryptoJS.lib.WordArray.create(words, len);
        }
    };
    // 将 key 和 iv 转换成 Uint8Array 数组后，再转换为 WordArray
    CryptoJS.AES.cipher = {
        key: CryptoJS.enc.u8a.parse(new TextEncoder().encode(cipherInfo.key)),
        iv: CryptoJS.enc.u8a.parse(new TextEncoder().encode(cipherInfo.iv))
    };
}

function forEachFile(CryptoJS, folderPath, callback) {
    return new Promise((resolve, reject) => {
        const startTime = new Date().getTime();
        initCryptoJS(CryptoJS);
        getFileList(folderPath, pathList => {
            let totalLen = pathList.length;
            const totalNum = totalLen;
            pathList.forEach(filePath => {
                readFile(filePath, buffer => {
                    callback(buffer, filePath, (writePath, newBuffer) => {
                        writeFile(writePath, newBuffer, () => {
                            if(--totalLen <= 0){
                                const endTime = new Date().getTime();
                                resolve({
                                    totalTime: endTime - startTime, 
                                    totalNum: totalNum
                                });
                            }
                        });
                    });
                });
            });
        });
    });
}

module.exports = {
    forEachFile
};