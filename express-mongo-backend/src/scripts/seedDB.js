const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const User = require("../models/User");
const Candidate = require("../models/Candidate");
const Job = require("../models/Job");
const Option = require("../models/Option");
const Settings = require("../models/Settings");

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for seeding...");

        // Clear existing data
        await User.deleteMany({});
        await Candidate.deleteMany({});
        await Job.deleteMany({});
        await Option.deleteMany({});
        await Settings.deleteMany({});
        console.log("Cleared existing data.");

        // 1. Seed Users
        const admin = await User.create({
            name: "bhavesh",
            email: "prajapatibbhavesh07@gmail.com",
            username: "admin",
            password: "password123",
            role: "Super Admin",
            status: "Active"
        });

        const hr = await User.create({
            name: "HR Manager",
            email: "hr@crm.com",
            username: "hrmanager",
            password: "password123",
            role: "HR",
            status: "Active"
        });

        const recruiter = await User.create({
            name: "Rahul Recruiter",
            email: "rahul@crm.com",
            username: "rahul",
            password: "password123",
            role: "Recruiter",
            status: "Active"
        });

        console.log("Seeded Users.");

        // 2. Seed Jobs
        const job1 = await Job.create({
            title: "Frontend Developer",
            description: "Looking for a React expert.",
            location: "Mumbai",
            type: "Full-time",
            salaryRange: { min: 600000, max: 1200000 },
            postedBy: admin._id,
            company: "Tech Solutions",
            status: "Open"
        });

        const job2 = await Job.create({
            title: "Sales Executive",
            description: "Experienced sales professional needed.",
            location: "Delhi",
            type: "Full-time",
            postedBy: hr._id,
            company: "Global Sales Inc",
            status: "Open"
        });

        console.log("Seeded Jobs.");

        // 3. Seed Candidates
        await Candidate.create({
            name: "John Doe",
            gender: "Male",
            dob: new Date("1995-05-15"),
            age: 29,
            phone: "9876543210",
            whatsapp: "9876543210",
            email: "john@example.com",
            location: "Pune",
            pan: "ABCDE1234F",
            jobId: job1._id,
            recruitmentStatus: "Applied",
            createdBy: recruiter._id
        });

        await Candidate.create({
            name: "Jane Smith",
            gender: "Female",
            dob: new Date("1992-08-20"),
            age: 32,
            phone: "9822334455",
            whatsapp: "9822334455",
            email: "jane@example.com",
            location: "Bangalore",
            pan: "FGHIJ5678K",
            jobId: job2._id,
            recruitmentStatus: "Interviewed",
            createdBy: recruiter._id
        });

        console.log("Seeded Candidates.");

        // 4. Seed Options
        const options = [
            { category: "sector", value: "BFSI" },
            { category: "sector", value: "IT" },
            { category: "sector", value: "Banking" },
            { category: "channel", value: "LinkedIn" },
            { category: "channel", value: "Referral" },
            { category: "designation", value: "Manager" },
            { category: "designation", value: "Developer" }
        ];
        await Option.insertMany(options);
        console.log("Seeded Options.");

        // 5. Seed Settings
        await Settings.create({
            general: {
                companyName: "CRM Enterprise Ltd",
                website: "https://crm.example.com"
            }
        });
        console.log("Seeded Settings.");

        console.log("Database seeding completed successfully!");
        process.exit();
    } catch (error) {
        console.error("Error seeding database:", error);
        process.exit(1);
    }
};

seedData();
