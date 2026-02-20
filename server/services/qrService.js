const QRCode = require('qrcode');

const generateQR = async (data) => {
    try {
        const qrDataURL = await QRCode.toDataURL(data, {
            width: 300,
            margin: 2,
            color: { dark: '#1a1a2e', light: '#ffffff' }
        });
        return qrDataURL;
    } catch (error) {
        throw new Error('QR Code generation failed: ' + error.message);
    }
};

const generateQRBuffer = async (data) => {
    return await QRCode.toBuffer(data, { width: 200, margin: 1 });
};

module.exports = { generateQR, generateQRBuffer };
