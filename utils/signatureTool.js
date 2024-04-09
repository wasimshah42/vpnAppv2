const crypto = require('crypto');

class SignatureTool {
    static sign(httpMethod, path, clientId, reqTime, content, merchantPrivateKey) {
        const signContent = this.genSignContent(httpMethod, path, clientId, reqTime, content);
        const signValue = this.signWithSHA256RSA(signContent, merchantPrivateKey);
        return encodeURIComponent(signValue);
    }

    static verify(httpMethod, path, clientId, rspTime, rspBody, signature, alipayPublicKey) {
        const rspContent = this.genSignContent(httpMethod, path, clientId, rspTime, rspBody);
        return this.verifySignatureWithSHA256RSA(rspContent, signature, alipayPublicKey);
    }

    static genSignContent(httpMethod, path, clientId, timeString, content) {
        const payload = `${httpMethod} ${path}\n${clientId}.${timeString}.${content}`;
        return payload;
    }

    static signWithSHA256RSA(signContent, merchantPrivateKey) {
        const priKey = `-----BEGIN PRIVATE KEY-----\n${merchantPrivateKey}\n-----END PRIVATE KEY-----`;
        const sign = crypto.createSign('RSA-SHA256');
        sign.write(signContent);
        sign.end();
        const signature = sign.sign(priKey, 'base64');
        return signature;
    }

    static  verifySignatureWithSHA256RSA(rspContent, rspSignValue, alipayPublicKey) {
        const pubKey = `-----BEGIN PUBLIC KEY-----\n${alipayPublicKey}\n-----END PUBLIC KEY-----`;
        let originalRspSignValue;
    
        if (Buffer.isBuffer(rspSignValue)) {
            originalRspSignValue = rspSignValue;
        } else if (typeof rspSignValue === 'string') {
            if (rspSignValue.includes('=') || rspSignValue.includes('+') || rspSignValue.includes('/')) {
                originalRspSignValue = Buffer.from(rspSignValue, 'base64');
            } else {
                originalRspSignValue = Buffer.from(decodeURIComponent(rspSignValue), 'base64');
            }
        } else {
            throw new TypeError('Invalid argument type for signature');
        }
    
        const verifyResult = crypto.verify('SHA256', Buffer.from(rspContent), pubKey, originalRspSignValue);
    
        return verifyResult === 1;
    }
    
}

module.exports = SignatureTool;
