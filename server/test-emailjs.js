// Quick EmailJS test script
// Run: node test-emailjs.js <your-email>
require('dotenv').config();
const emailjs = require('@emailjs/nodejs');

const testEmail = process.argv[2];
if (!testEmail) {
    console.error('Usage: node test-emailjs.js your@email.com');
    process.exit(1);
}

const main = async () => {
    const serviceId = process.env.EMAILJS_SERVICE_ID;
    const templateId = process.env.EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.EMAILJS_PUBLIC_KEY;
    const privateKey = process.env.EMAILJS_PRIVATE_KEY;

    console.log('📧 Testing EmailJS...');
    console.log('  Service  :', serviceId);
    console.log('  Template :', templateId);
    console.log('  Public   :', publicKey);

    try {
        const booleanFlag = await emailjs.send(
            serviceId,
            templateId,
            {
                to_email: testEmail,
                to_name: 'Test User',
                otp: '123456',
                purpose: 'Test',
                expiry: '10 minutes'
            },
            { publicKey, privateKey }
        );
        console.log('\n✅ SUCCESS! Email sent.');
        console.log('   Status:', result.status, result.text);
    } catch (err) {
        console.error('\n❌ FAILED:', err.message || err);
        if (err.text) console.error('   Detail:', err.text);
    }
};

main();
