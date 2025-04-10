console.log('环境变量测试:');
console.log('LISTEN_ONLY:', process.env.LISTEN_ONLY);
console.log('LISTEN_ONLY === \'true\':', process.env.LISTEN_ONLY === 'true');
console.log('读取.env文件中...');
require('dotenv').config();
console.log('读取.env后:');
console.log('LISTEN_ONLY:', process.env.LISTEN_ONLY);
console.log('LISTEN_ONLY === \'true\':', process.env.LISTEN_ONLY === 'true'); 