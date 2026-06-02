const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const Candidate = require("../models/Candidate");
const Job = require("../models/Job");
const User = require("../models/User");

const seedCandidatesAndJobs = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for seeding...");

        // Clear existing data to ensure a clean state
        console.log("Clearing existing Candidate and Job data...");
        await Candidate.deleteMany({});
        await Job.deleteMany({});

        const admin = await User.findOne({ username: "bhavesh" }) || await User.findOne({});
        if (!admin) {
            console.error("No user found to assign as creator.");
            process.exit(1);
        }

        console.log(`Using user: ${admin.username} (${admin._id})`);

        // Create 10 Jobs
        const jobs = [];
        const jobTitles = ["Frontend Developer", "Backend Developer", "Full Stack Engineer", "UI/UX Designer", "Product Manager", "DevOps Engineer", "QA Automation Engineer", "Data Scientist", "Mobile Developer", "HR Specialist"];
        const locations = ["Mumbai", "Bangalore", "Pune", "Delhi", "Hyderabad", "Chennai", "Remote", "Ahmedabad", "Kolkata", "Noida"];

        for (let i = 0; i < 10; i++) {
            const job = await Job.create({
                title: jobTitles[i % jobTitles.length],
                description: `This is a sample description for ${jobTitles[i % jobTitles.length]} role.`,
                location: locations[i % locations.length],
                department: "Technology",
                type: "Full-time",
                salaryRange: { min: 500000, max: 2000000 },
                status: "Open",
                postedBy: admin._id,
                company: "Tech Corp " + (i + 1),
                date: new Date()
            });
            jobs.push(job);
        }
        console.log(`Created ${jobs.length} jobs.`);

        // Create 500 Candidates
        const candidates = [];
        const names = ["Aarav", "Aditi", "Arjun", "Ananya", "Bhavya", "Chetan", "Deepika", "Esha", "Farhan", "Gauri", "Ishaan", "Jiya", "Kabir", "Kiara", "Laksh", "Myra", "Nikhil", "Navya", "Om", "Pari", "Zoya", "Yuvraj", "Vidya", "Tushar", "Sanya", "Rohan", "Priya", "Nitin", "Meera", "Kunal"];
        const surnames = ["Sharma", "Verma", "Gupta", "Malhotra", "Kapoor", "Singh", "Patel", "Joshi", "Reddy", "Iyer", "Choudhury", "Bose", "Das", "Dutta", "Nair", "Menon", "Kulkarni", "Deshmukh", "Patil", "Saxena"];

        for (let i = 0; i < 500; i++) {
            const firstName = names[i % names.length];
            const lastName = surnames[Math.floor(i / names.length) % surnames.length];
            const name = `${firstName} ${lastName} ${i + 1}`;
            
            // Ensure unique phone by using index
            const phone = "8" + (100000000 + i).toString(); 
            const email = `candidate.seed.${i + 1}@crm-test.com`;
            const pan = "ABCDE" + (1000 + i).toString().padStart(4, '0') + "F";
            
            const candidate = await Candidate.create({
                name: name,
                gender: i % 2 === 0 ? "Male" : "Female",
                dob: new Date(1985 + (i % 20), i % 12, (i % 28) + 1),
                age: 22 + (i % 25),
                phone: phone,
                whatsapp: phone,
                email: email,
                location: locations[i % locations.length],
                pan: pan,
                jobId: jobs[i % jobs.length]._id,
                recruitmentStatus: i % 7 === 0 ? "Interviewed" : (i % 3 === 0 ? "Shortlisted" : "Applied"),
                assessment: i % 10 === 0 ? "Selected" : "Pending",
                createdBy: admin._id,
                isApproved: true,
                applicationId: "APP-V2-" + (2000 + i)
            });
            candidates.push(candidate);
            if (i % 50 === 0) console.log(`Seeded ${i} candidates...`);
        }

        console.log(`Created ${candidates.length} candidates.`);
        console.log("Seeding completed successfully!");
        process.exit();
    } catch (error) {
        console.error("Error seeding data:", error);
        process.exit(1);
    }
};

seedCandidatesAndJobs();
