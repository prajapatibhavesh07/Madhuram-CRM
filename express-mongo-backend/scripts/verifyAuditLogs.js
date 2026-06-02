const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../src/.env') });

const AuditLog = require('../src/models/AuditLog');
const Task = require('../src/models/Task');
const auditService = require('../src/services/auditService');

async function verifyAuditLogs() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/crm_database');
        console.log('Connected.');

        // 1. Simulate a Request object
        const mockUser = { _id: new mongoose.Types.ObjectId(), name: 'Test Auditor' };
        const mockReq = {
            user: mockUser,
            ip: '127.0.0.1',
            get: (header) => header === 'user-agent' ? 'NodeTestRunner' : ''
        };

        // 2. Test Logging CREATE
        console.log('Testing CREATE log...');
        const targetId = new mongoose.Types.ObjectId();
        await auditService.logAction(mockReq, {
            action: 'CREATE',
            module: 'Task',
            targetId: targetId,
            targetModel: 'Task',
            details: 'Verification script created a test task'
        });

        // 3. Test Change Detection and UPDATE log
        console.log('Testing UPDATE log with change detection...');
        const oldData = { status: 'Todo', priority: 'Medium' };
        const newData = { status: 'In Progress', priority: 'High' };
        const changes = auditService.detectChanges(oldData, newData);
        
        await auditService.logAction(mockReq, {
            action: 'STATUS_CHANGE',
            module: 'Task',
            targetId: targetId,
            targetModel: 'Task',
            changes: changes,
            details: 'Verification script updated task status'
        });

        // 4. Verify Logs in Database
        console.log('Verifying logs in database...');
        const logs = await AuditLog.find({ targetId }).sort({ createdAt: -1 });
        
        if (logs.length === 2) {
            console.log('✅ Success: 2 logs found for targetId.');
            console.log('Latest log action:', logs[0].action);
            console.log('Latest log changes:', JSON.stringify(logs[0].changes));
        } else {
            console.log('❌ Failure: Expected 2 logs, found', logs.length);
        }

        // Cleanup
        // await AuditLog.deleteMany({ targetId });
        
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Verification failed:', error);
        process.exit(1);
    }
}

verifyAuditLogs();
