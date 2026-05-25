const express = require("express");
const {
  getDevDoor,
  getAdminData,
  getAddProjectPage,
  addProjects,
  getEditProjectPage,
  deleteProject,
  getAddSkills,
  postAddSkills,
  deleteSkill,
  getAddServices,
  postAddServices,
  deleteService,
  getLoginPage,
  postLoginPage,
  logoutAdmin,
  deleteProfilePic,
  deleteResume,
  sendOtp,
  uploadQuickFile,
} = require("../controllers/adminDoorController");
const { checkAdminAuth } = require("../middlewares/authMiddleware");
const { handleUpload } = require("../middlewares/uploadMiddleware");
const adminRoute = express.Router();

adminRoute.get("/devDoor", getDevDoor);
adminRoute.post("/sendOtp", sendOtp); // OTP route
adminRoute.post("/devDoor", handleUpload, getAdminData); // multer middleware added for file uploads
adminRoute.post("/uploadQuickFile", checkAdminAuth, handleUpload, uploadQuickFile);
adminRoute.get("/addProject", checkAdminAuth, getAddProjectPage);
adminRoute.get("/editProject/:id", checkAdminAuth, getEditProjectPage);
adminRoute.delete("/deleteProject/:formId", checkAdminAuth, deleteProject);
adminRoute.post("/addProjects/add", checkAdminAuth, handleUpload, addProjects);

//login page
adminRoute.get("/login", getLoginPage);
adminRoute.post("/login", postLoginPage);
adminRoute.get("/logout", logoutAdmin);

// Skills Section
adminRoute.get("/addSkill", checkAdminAuth, getAddSkills);
adminRoute.post("/addSkill", checkAdminAuth, postAddSkills);
adminRoute.delete("/deleteSkill/:id", checkAdminAuth, deleteSkill);

// Services Section
adminRoute.get("/addService", checkAdminAuth, getAddServices);
adminRoute.post("/addService", checkAdminAuth, postAddServices);
adminRoute.delete("/deleteService/:id", checkAdminAuth, deleteService);

// Cloudinary file delete routes
adminRoute.delete("/deleteProfilePic", checkAdminAuth, deleteProfilePic);
adminRoute.delete("/deleteResume", checkAdminAuth, deleteResume);

module.exports = adminRoute;
