const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const password = process.argv[2] || 'admin123';
const hash = bcrypt.hashSync(password, 10);

console.log('Password:', password);
console.log('Hash:', hash);
console.log('');
console.log('Use this hash in the INSERT statement:');
console.log(`INSERT INTO users (username, password_hash) VALUES ('admin', '${hash}');`);

const jwtSecret = crypto.randomBytes(32).toString('hex');
console.log('');
console.log('JWT Secret (add to wrangler.toml):');
console.log(jwtSecret);
