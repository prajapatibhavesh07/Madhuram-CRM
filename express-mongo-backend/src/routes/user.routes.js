const express = require("express");
const router = express.Router();
const {
    createUser,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    bulkDeleteUsers,
    login,
    logout,
    changePassword
} = require("../controllers/user.controller");

const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/profiles/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

const birthdayController = require("../controllers/birthday.controller");

router.get("/birthdates/today", birthdayController.getTodaysBirthdays);
router.get("/birthdates/upcoming", birthdayController.getUpcomingBirthdays);

router.post("/", upload.single('profilePhoto'), createUser);
router.get("/", getUsers);
router.put("/change-password", changePassword);
router.get("/:id", getUserById);
router.put("/:id", upload.single('profilePhoto'), updateUser);
router.delete("/:id", deleteUser);
router.post("/bulk-delete", bulkDeleteUsers);
router.post("/login", login);
router.post("/logout/:id", logout);

module.exports = router;
