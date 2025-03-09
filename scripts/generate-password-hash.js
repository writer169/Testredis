const bcrypt = require('bcryptjs');

// Замените 'password123' на свой пароль
const password = 'password123';

async function generateHash() {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  
  console.log('Хеш пароля:', hash);
  console.log('Используйте этот хеш в файле pages/api/login.js');
}

generateHash();