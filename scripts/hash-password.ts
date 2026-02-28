import bcrypt from 'bcryptjs'

const password = process.argv[2] || 'admin123'

const hash = await bcrypt.hash(password, 12)
console.log('Password hash for:', password)
console.log(hash)
