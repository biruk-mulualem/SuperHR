const bcrypt = require('bcryptjs');
const { User } = require('./models');

async function testPassword() {
  try {
    // Find admin user
    const user = await User.findOne({ where: { username: 'admin' } });
    
    if (!user) {
      console.log('❌ Admin user not found');
      return;
    }
    
    console.log('✅ User found:', user.username);
    console.log('Password hash:', user.password_hash);
    
    // Test bcrypt directly
    const directCompare = await bcrypt.compare('password123', user.password_hash);
    console.log('Direct bcrypt compare:', directCompare);
    
    // Test using model method
    const modelCompare = await user.validatePassword('password123');
    console.log('Model validatePassword:', modelCompare);
    
    // Test with wrong password
    const wrongCompare = await user.validatePassword('wrongpassword');
    console.log('Wrong password test:', wrongCompare);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

testPassword();