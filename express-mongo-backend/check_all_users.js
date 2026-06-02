const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://127.0.0.1:27017/crm_db';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: "Normal User" },
    status: { type: String, default: "Active" }
});

let User;
try {
    User = mongoose.model('User');
} catch (e) {
    User = mongoose.model('User', userSchema);
}

async function main() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const users = ['neha', 'anjali', 'ritesh', 'sneha'];
        for (const username of users) {
            const user = await User.findOne({ username });
            if (user) {
                console.log(`User: ${username} | Name: ${user.name} | Role: ${user.role} | Status: ${user.status} | PW: ${user.password}`);
            } else {
                console.log(`User: ${username} NOT FOUND!`);
            }
        }
        
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

main();
