const store = require('./src/config/store');
const { hashPassword } = require('./src/auth/password');

async function reset() {
    const admin = store.getAdmin('admin');
    if (!admin) {
        console.log('Admin user not found. Creating default admin...');
        const h = await hashPassword('123456');
        store.createAdmin('admin', h);
        console.log('Admin created: admin / 123456');
    } else {
        const h = await hashPassword('123456');
        store.updateAdminPw(admin.id, h);
        console.log('Password reset to: admin / 123456');
    }
    store.close();
    process.exit(0);
}
reset();
