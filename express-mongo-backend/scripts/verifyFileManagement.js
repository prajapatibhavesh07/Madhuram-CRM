const mongoose = require('mongoose');
const Folder = require('../src/models/Folder');
const File = require('../src/models/File');
const User = require('../src/models/User');

const test = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/crm');
        console.log('Connected to MongoDB');

        // Find or create a test user
        let user = await User.findOne();
        if (!user) {
            console.error('No user found in DB. Please seed the DB first.');
            process.exit(1);
        }

        // 1. Create Folder
        const folder = new Folder({
            name: 'Verification Folder ' + Date.now(),
            createdBy: user._id
        });
        await folder.save();
        console.log('Folder created:', folder.name);

        // 2. Create File (Initial Version)
        const file = new File({
            name: 'Verification File',
            folder: folder._id,
            tags: ['Test', 'Initial'],
            createdBy: user._id,
            versions: [{
                versionNumber: 1,
                fileUrl: '/uploads/documents/test-v1.txt',
                note: 'Initial test upload',
                uploadedBy: user._id
            }]
        });
        await file.save();
        console.log('File created with version 1');

        // 3. Add Version
        file.versions.push({
            versionNumber: 2,
            fileUrl: '/uploads/documents/test-v2.txt',
            note: 'Update test v2',
            uploadedBy: user._id
        });
        file.currentVersion = 2;
        file.tags.push('Updated');
        await file.save();
        console.log('File updated to version 2');

        // 4. Verify
        const fetchedFile = await File.findById(file._id).populate('folder');
        console.log('Verification Results:');
        console.log('- File Name:', fetchedFile.name);
        console.log('- Folder Name:', fetchedFile.folder.name);
        console.log('- Current Version:', fetchedFile.currentVersion);
        console.log('- Tags:', fetchedFile.tags.join(', '));
        console.log('- Version Count:', fetchedFile.versions.length);

        // Cleanup (optional)
        // await File.findByIdAndDelete(file._id);
        // await Folder.findByIdAndDelete(folder._id);

        await mongoose.disconnect();
        console.log('Disconnected');
    } catch (error) {
        console.error('Verification failed:', error);
        process.exit(1);
    }
};

test();
