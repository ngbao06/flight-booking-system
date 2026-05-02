import dotenv from 'dotenv';

dotenv.config({ path: `.env` });

const qrConfig = {
    BANK_INFO: {
        BANK_ID: process.env.BANK_ID,
        ACCOUNT_NO: process.env.ACCOUNT_NO,
        ACCOUNT_NAME: process.env.ACCOUNT_NAME
    },
    QR_OPTIONS: {
        errorCorrectionLevel: 'H', // Mức độ sửa lỗi cao (giúp QR dễ quét hơn)
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        width: 400,
        color: {
            dark: '#000000',
            light: '#FFFFFF',
        },
    }
};

export default qrConfig;