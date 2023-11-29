const CryptoJS = require('crypto-js');

const { forEachFile } = require('./common.js');

// 加密方法 传入明文的 Uint8Array 数组
function encryptBinary(array) {
    const acontent = array;
    // 将明文转换成 WordArray
    const contentWA = CryptoJS.enc.u8a.parse(acontent);
    // 插件要求明文是 base64 格式
    const dcBase64String = contentWA.toString(CryptoJS.enc.Base64);
    // 加密 选定mode是CFB类型，无偏移量
    const encrypted = CryptoJS.AES.encrypt(contentWA, CryptoJS.AES.cipher.key, {
        iv: CryptoJS.AES.cipher.iv, 
        mode: CryptoJS.mode.CTR, 
        padding: CryptoJS.pad.NoPadding
    });
    // 将加密后的密文转回 Uint8Array 数组
    const bv = CryptoJS.enc.u8a.stringify(encrypted.ciphertext);
    return bv;
}

function init() {
    const folderPath = './temp/input/';
    forEachFile(CryptoJS, folderPath, (buffer, filePath, callback) => {
        // console.log(filePath);
        // 加密后的二进制流
        const newBuffer = encryptBinary(buffer);
        // const outputPath = filePath.split('/input/')[0] + '/output/encrypt/' + filePath.split('/input/')[1];
        const outputPath = filePath.split('/input/')[0] + '/output/encrypt/' + filePath.split('/input/')[1].split('.')[0] + '.lk';
        console.log(99999, outputPath);
        callback(outputPath, newBuffer);
    }).then(result => {
        console.log('加密用时和文件数量：', result.totalTime, result.totalNum);
    });
}

init();