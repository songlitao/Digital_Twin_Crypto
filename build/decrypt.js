const CryptoJS = require('crypto-js');

const { forEachFile } = require('./common.js');

// 解密方法 传入密文的 Uint8Array 数组
function decryptBinary(array) {
    const acontent = array;
    // 将密文转换成 WordArray
    const contentWA = CryptoJS.enc.u8a.parse(acontent);
    // 插件要求密文是 base64 格式
    const dcBase64String = contentWA.toString(CryptoJS.enc.Base64);
    // 解密 选定mode是CFB类型，无偏移量
    const decrypted = CryptoJS.AES.decrypt(dcBase64String, CryptoJS.AES.cipher.key, {
        iv: CryptoJS.AES.cipher.iv, 
        mode: CryptoJS.mode.CTR, 
        padding: CryptoJS.pad.NoPadding
    });
    // 将解密后的明文转回 Uint8Array 数组
    const bv = CryptoJS.enc.u8a.stringify(decrypted);
    return bv;
}

function init() {
    const folderPath = './temp/output/encrypt/';
    forEachFile(CryptoJS, folderPath, (buffer, filePath, callback) => {
        // console.log(filePath);
        // 解密后的二进制流
        const newBuffer = decryptBinary(buffer);
        // const outputPath = filePath.split('/encrypt/')[0] + '/decrypt/' + filePath.split('/encrypt/')[1];
        const outputPath = filePath.split('/encrypt/')[0] + '/decrypt/' + filePath.split('/encrypt/')[1].split('.')[0] + '.glb';
        console.log(99999, outputPath);
        callback(outputPath, newBuffer);
    }).then(result => {
        console.log('解密用时和文件数量：', result.totalTime, result.totalNum);
    });
}

init();