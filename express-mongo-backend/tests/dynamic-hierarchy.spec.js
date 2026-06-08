const mongoose = require('mongoose');
const Role = require('../src/models/Role');
const User = require('../src/models/User');
const { seedBuiltInRoles } = require('../src/controllers/role.controller');
const { getSubordinateIds } = require('../src/middleware/roleMiddleware');

const MONGO_URI = 'mongodb://127.0.0.1:27017/crm_db';

async function runTests() {
    console.log('--- STARTING HIERARCHY TESTS ---');
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // Test 1: Seed Roles & Verify Mappings
        console.log('\n[TEST 1] Running role seeder and verifying default hierarchies...');
        // Reset reportsTo for built-in roles to force seeder to apply defaults
        await Role.updateMany({ isBuiltIn: true }, { $set: { reportsTo: null } });
        await seedBuiltInRoles();
        
        const hrRole = await Role.findOne({ name: 'HR', isBuiltIn: true });
        const managerRole = await Role.findOne({ name: 'Manager', isBuiltIn: true });
        const tlRole = await Role.findOne({ name: 'Team Lead', isBuiltIn: true });
        const recruiterRole = await Role.findOne({ name: 'Recruiter', isBuiltIn: true });
        
        console.log(`HR Reports To: ${hrRole.reportsTo} (Expected: Admin)`);
        console.log(`Manager Reports To: ${managerRole.reportsTo} (Expected: HR)`);
        console.log(`Team Lead Reports To: ${tlRole.reportsTo} (Expected: Manager)`);
        console.log(`Recruiter Reports To: ${recruiterRole.reportsTo} (Expected: Team Lead)`);

        if (hrRole.reportsTo !== 'Admin' || 
            managerRole.reportsTo !== 'HR' || 
            tlRole.reportsTo !== 'Manager' || 
            recruiterRole.reportsTo !== 'Team Lead') {
            throw new Error('Default seeded hierarchy does not match expected mappings!');
        }
        console.log('✔ Seeding verified successfully.');

        // Test 2: Create Mock User Hierarchy and Test Subordinates Traversal
        console.log('\n[TEST 2] Creating mock users in hierarchy...');
        
        // Clean up previous test users if any
        await User.deleteMany({ email: /@test-hierarchy-mock\.com$/ });

        // User A: Manager
        const managerUser = await User.create({
            name: 'Mock Manager',
            email: 'manager@test-hierarchy-mock.com',
            username: 'mockmanager',
            password: 'password123',
            role: 'Manager'
        });

        // User B: Operation Manager (reports to Manager)
        const opManagerUser = await User.create({
            name: 'Mock Op Manager',
            email: 'opmanager@test-hierarchy-mock.com',
            username: 'mockopmanager',
            password: 'password123',
            role: 'Operation Manager',
            managerId: managerUser._id
        });

        // User C: Team Lead (reports to Operation Manager)
        const tlUser = await User.create({
            name: 'Mock Team Lead',
            email: 'tl@test-hierarchy-mock.com',
            username: 'mocktl',
            password: 'password123',
            role: 'Team Lead',
            managerId: opManagerUser._id
        });

        // User D: Recruiter (reports to Team Lead)
        const recruiterUser = await User.create({
            name: 'Mock Recruiter',
            email: 'recruiter@test-hierarchy-mock.com',
            username: 'mockrecruiter',
            password: 'password123',
            role: 'Recruiter',
            teamLeadId: tlUser._id
        });

        console.log('Hierarchy created: Manager -> Op Manager -> Team Lead -> Recruiter');

        // Verify Recursive Subordinates
        const managerSubs = await getSubordinateIds(managerUser._id);
        // Expected: Op Manager, Team Lead, Recruiter
        if (managerSubs.length !== 3) {
            throw new Error(`Expected Manager to have 3 subordinates, got ${managerSubs.length}`);
        }

        const opManagerSubs = await getSubordinateIds(opManagerUser._id);
        // Expected: Team Lead, Recruiter
        if (opManagerSubs.length !== 2) {
            throw new Error(`Expected Operation Manager to have 2 subordinates, got ${opManagerSubs.length}`);
        }

        const tlSubs = await getSubordinateIds(tlUser._id);
        // Expected: Recruiter
        if (tlSubs.length !== 1) {
            throw new Error(`Expected Team Lead to have 1 subordinate, got ${tlSubs.length}`);
        }

        console.log('✔ Recursive subordinates verified successfully.');

        // Clean up
        await User.deleteMany({ email: /@test-hierarchy-mock\.com$/ });
        console.log('\nMock users cleaned up successfully.');

        console.log('\n--- ALL HIERARCHY TESTS PASSED SUCCESSFULLY! ---');

    } catch (err) {
        console.error('❌ Test failed with error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

runTests();
