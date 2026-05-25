const { ObjectId } = require("mongodb");
const { getDB } = require("../config/dataBase");
const bcrypt = require("bcrypt");
const { uploadToCloudinary, deleteFromCloudinary } = require("../config/cloudinary");
const { sendOtpEmail } = require("../config/email");

const getDevDoor = async (req, res) => {
  const admin = req.session.admin || null;
  
  try {
    const db = getDB();
    const adminCount = await db.collection("adminData").countDocuments();
    
    // First time setup - agar database me koi admin nahi hai toh access do
    if (adminCount === 0) {
      return res.render("devDoor", { admin: null, adminDB: null });
    }

    let sessionAdmin = req.session.admin || null;
    if (sessionAdmin && sessionAdmin.email !== process.env.ADMIN_EMAIL) {
      sessionAdmin = null;
    }

    if (!sessionAdmin) {
      return res.redirect("/admin/login");
    }

    const adminFromDB = await db.collection("adminData").findOne({ email: sessionAdmin.email });
    res.render("devDoor", { admin: sessionAdmin, adminDB: adminFromDB || null });
  } catch (error) {
    console.error("DevDoor page error:", error);
    res.render("devDoor", { admin: admin, adminDB: null });
  }
};

const getAdminData = async (req, res) => {
  const {
    fullName,
    email,
    role,
    linkedinUrl,
    githubUrl,
    bio,
    aboutMe,
    phone,
    otp,
    password,
    confirmPassword,
  } = req.body;

  try {
    if (email !== process.env.ADMIN_EMAIL) {
      return res.status(403).json({
        success: false,
        message: "Aap is email se admin account setup nahi kar sakte. Sirf official admin email allowed hai.",
      });
    }

    // OTP Verification
    if (!req.session.signupOtp || !req.session.otpExpires) {
      return res.status(400).json({
        success: false,
        message: "Pehle OTP generate karein.",
      });
    }

    if (Date.now() > req.session.otpExpires) {
      return res.status(400).json({
        success: false,
        message: "OTP expire ho gaya hai. Dobara OTP mangwayein.",
      });
    }

    if (otp !== req.session.signupOtp) {
      return res.status(400).json({
        success: false,
        message: "Galat OTP! Kripya sahi OTP darj karein.",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password and confirm password do not match",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const adminData = {
      fullName,
      email,
      role,
      linkedinUrl,
      githubUrl,
      bio,
      aboutMe,
      phone,
      otp,
      password: hashedPassword,
    };

    const db = getDB();
    const existingAdmin = await db.collection("adminData").findOne({});

    // ---- Profile Picture Upload ----
    if (req.files && req.files.profilePic && req.files.profilePic[0]) {
      const picFile = req.files.profilePic[0];
      
      // Agar purani pic hai toh Cloudinary se delete karo
      if (existingAdmin && existingAdmin.profilePicPublicId) {
        try {
          await deleteFromCloudinary(existingAdmin.profilePicPublicId, "image");
        } catch (delErr) {
          console.error("Purani profile pic delete error (continuing):", delErr.message);
        }
      }

      const picResult = await uploadToCloudinary(picFile.path, "portfolio/profilePics", "image");
      adminData.profilePicUrl = picResult.url;
      adminData.profilePicPublicId = picResult.publicId;
      console.log("✅ Profile pic uploaded:", picResult.url);
    }

    // ---- Resume Upload ----
    if (req.files && req.files.resume && req.files.resume[0]) {
      const resumeFile = req.files.resume[0];
      
      // Agar purana resume hai toh Cloudinary se delete karo
      if (existingAdmin && existingAdmin.resumePublicId) {
        try {
          await deleteFromCloudinary(existingAdmin.resumePublicId, "image");
        } catch (delErr) {
          try {
            await deleteFromCloudinary(existingAdmin.resumePublicId, "raw");
          } catch (e) { console.error("Purana resume delete error (continuing):", e.message); }
        }
      }

      const resumeResult = await uploadToCloudinary(resumeFile.path, "portfolio/resumes", "image");
      adminData.resumeUrl = resumeResult.url;
      adminData.resumePublicId = resumeResult.publicId;
      console.log("✅ Resume uploaded:", resumeResult.url);
    }

    if (existingAdmin) {
      if (!req.session.admin || !req.session.admin.isAdmin || req.session.admin.email !== process.env.ADMIN_EMAIL) {
        return res.status(403).json({
          success: false,
          message: "Profile already exists! Sirf verified admin hi ise update kar sakta hai.",
        });
      }
      
      // Update existing admin profile
      await db.collection("adminData").updateOne({}, { $set: adminData });
      console.log("Admin Data updated succesfully..");

      // Session bhi update karo taaki frontend ko latest data mile
      if (req.session.admin) {
        req.session.admin.profilePicUrl = adminData.profilePicUrl || existingAdmin.profilePicUrl || null;
        req.session.admin.resumeUrl = adminData.resumeUrl || existingAdmin.resumeUrl || null;
      }
      
      // Clear the OTP from session since verification passed
      req.session.signupOtp = null;
      req.session.otpExpires = null;

      return res.status(200).json({
        success: true,
        message: "Profile successfully updated",
      });
    }

    // Insert new admin profile if none exists
    await db.collection("adminData").insertOne(adminData);
    console.log("Admin Data saved succesfully..");

    // Clear the OTP from session since verification passed
    req.session.signupOtp = null;
    req.session.otpExpires = null;

    res.status(200).json({
      success: true,
      message: "Profile successfully saved",
    });
  } catch (error) {
    console.error("error behind the scene", error);

    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

// ---- Send OTP ----
const sendOtp = async (req, res) => {
  const { email } = req.body;
  try {
    if (email !== process.env.ADMIN_EMAIL) {
      return res.status(403).json({
        success: false,
        message: "Yeh official admin email nahi hai. OTP nahi bheja ja sakta.",
      });
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Send email
    await sendOtpEmail(email, otp);

    // Save in session
    req.session.signupOtp = otp;
    req.session.otpExpires = Date.now() + 5 * 60 * 1000; // 5 mins

    res.status(200).json({
      success: true,
      message: "OTP aapke email par bhej diya gaya hai. (Check Spam folder if not found)",
    });
  } catch (error) {
    console.error("Send OTP Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "OTP bhejne mein error aayi. Please check console.",
    });
  }
};

// ---- Delete Profile Picture ----
const deleteProfilePic = async (req, res) => {
  try {
    const db = getDB();
    const admin = await db.collection("adminData").findOne({});

    if (!admin || !admin.profilePicPublicId) {
      return res.status(404).json({
        success: false,
        message: "Koi profile picture nahi mili delete karne ke liye.",
      });
    }

    await deleteFromCloudinary(admin.profilePicPublicId, "image");
    await db.collection("adminData").updateOne({}, {
      $unset: { profilePicUrl: "", profilePicPublicId: "" },
    });

    // Session se bhi hatao
    if (req.session.admin) {
      req.session.admin.profilePicUrl = null;
    }

    res.status(200).json({
      success: true,
      message: "Profile picture delete ho gayi!",
    });
  } catch (error) {
    console.error("Delete profile pic error:", error);
    res.status(500).json({
      success: false,
      message: "Profile picture delete karne me error aayi.",
    });
  }
};

// ---- Delete Resume ----
const deleteResume = async (req, res) => {
  try {
    const db = getDB();
    const admin = await db.collection("adminData").findOne({});

    if (!admin || !admin.resumePublicId) {
      return res.status(404).json({
        success: false,
        message: "Koi resume nahi mila delete karne ke liye.",
      });
    }

    try {
      await deleteFromCloudinary(admin.resumePublicId, "image");
    } catch (err) {
      await deleteFromCloudinary(admin.resumePublicId, "raw");
    }

    await db.collection("adminData").updateOne({}, {
      $unset: { resumeUrl: "", resumePublicId: "" },
    });

    // Session se bhi hatao
    if (req.session.admin) {
      req.session.admin.resumeUrl = null;
    }

    res.status(200).json({
      success: true,
      message: "Resume delete ho gaya!",
    });
  } catch (error) {
    console.error("Delete resume error:", error);
    res.status(500).json({
      success: false,
      message: "Resume delete karne me error aayi.",
    });
  }
};

// ---- Quick Upload (Modal) ----
const uploadQuickFile = async (req, res) => {
  try {
    const db = getDB();
    const existingAdmin = await db.collection("adminData").findOne({});
    
    if (!existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Pehle DevDoor se admin profile setup karein.",
      });
    }

    let updatedData = {};

    // Check if it's a profile picture
    if (req.files && req.files.profilePic && req.files.profilePic[0]) {
      const picFile = req.files.profilePic[0];
      
      // Delete old one if exists
      if (existingAdmin.profilePicPublicId) {
        try {
          await deleteFromCloudinary(existingAdmin.profilePicPublicId, "image");
        } catch (e) { console.error("Old pic delete error:", e.message); }
      }

      const picResult = await uploadToCloudinary(picFile.path, "portfolio/profilePics", "image");
      updatedData.profilePicUrl = picResult.url;
      updatedData.profilePicPublicId = picResult.publicId;

      if (req.session.admin) {
        req.session.admin.profilePicUrl = picResult.url;
      }
    }

    // Check if it's a resume
    if (req.files && req.files.resume && req.files.resume[0]) {
      const resumeFile = req.files.resume[0];
      
      // Delete old one if exists
      if (existingAdmin.resumePublicId) {
        try {
          await deleteFromCloudinary(existingAdmin.resumePublicId, "image");
        } catch (e) { 
          try { await deleteFromCloudinary(existingAdmin.resumePublicId, "raw"); } catch(err){}
        }
      }

      const resumeResult = await uploadToCloudinary(resumeFile.path, "portfolio/resumes", "image");
      updatedData.resumeUrl = resumeResult.url;
      updatedData.resumePublicId = resumeResult.publicId;

      if (req.session.admin) {
        req.session.admin.resumeUrl = resumeResult.url;
      }
    }

    if (Object.keys(updatedData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Koi valid file upload nahi hui.",
      });
    }

    await db.collection("adminData").updateOne({}, { $set: updatedData });

    res.status(200).json({
      success: true,
      message: "File successfully uploaded!",
      data: updatedData
    });
  } catch (error) {
    console.error("Quick Upload error:", error);
    res.status(500).json({
      success: false,
      message: "File upload karte waqt error aayi.",
    });
  }
};

const getAddProjectPage = (req, res) => {
  res.render("addProjects", {
    formData: null,
  });
};

const addProjects = async (req, res) => {
  const { id, title, imageUrl, skills, description, sourceUrl, liveUrl } =
    req.body;

  const db = getDB();

  try {
    const formData = {
      title,
      imageUrl,
      skills,
      description,
      sourceUrl,
      liveUrl,
    };

    if (id) {
      await db
        .collection("FormData")
        .updateOne({ _id: new ObjectId(id) }, { $set: formData });

      return res.status(200).json({
        success: true,
        message: "Project updated successfully",
      });
    }

    await db.collection("FormData").insertOne(formData);

    res.status(200).json({
      success: true,
      message: "Project added successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getEditProjectPage = async (req, res) => {
  const db = getDB();
  const { id } = req.params;
  try {
    const project = await db
      .collection("FormData")
      .findOne({ _id: new ObjectId(id) });
    res.render("addProjects", { formData: project, pageTitle: "Edit-Project" });
  } catch (error) {
    console.error("Edit page error:", error);
    res.status(500).send("<h3>Oops! Kuch galat ho gaya. Please try again.</h3>");
  }
};

const deleteProject = async (req, res) => {
  const { formId } = req.params;
  const db = getDB();
  try {
    const result = await db
      .collection("FormData")
      .deleteOne({ _id: new ObjectId(formId) });
    if (result.deletedCount === 1) {
      res.status(200).json({ message: "Project delete ho gaya!" });
    } else {
      res
        .status(404)
        .json({ message: "Is ID ka koi project database me nahi mila." });
    }
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ message: "Database error aa gaya." });
  }
};

const getAddSkills = async (req, res) => {
  res.render("addSkillsPage", {
    pageTitle: "add-skills",
  });
};

const postAddSkills = async (req, res) => {
  let { skillsData } = req.body;
  const db = getDB();

  // Basic XSS Sanitization: Remove <script> and onload/onerror attributes
  skillsData = skillsData.map(skill => {
    let safeIcon = skill.skillIcon || "";
    safeIcon = safeIcon.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
    safeIcon = safeIcon.replace(/on\w+="[^"]*"/gi, "");
    safeIcon = safeIcon.replace(/on\w+='[^']*'/gi, "");
    safeIcon = safeIcon.replace(/on\w+=\w+/gi, "");
    return { ...skill, skillIcon: safeIcon };
  });

  try {
    await db.collection("Skills").insertMany(skillsData);
    res.status(200).json({ message: "Skills added successfully" });
  } catch (error) {
    console.error("Error adding skills:", error);
    res.status(500).json({ message: "Error adding skills" });
  }
};

const deleteSkill = async (req, res) => {
  const { id } = req.params;
  const db = getDB();
  try {
    const result = await db
      .collection("Skills")
      .deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 1) {
      res.status(200).json({ message: "Skill delete ho gaya!" });
    } else {
      res
        .status(404)
        .json({ message: "Is ID ka koi skill database me nahi mila." });
    }
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ message: "Database error aa gaya." });
  }
};

// ---- SERVICES SECTION ----
const getAddServices = async (req, res) => {
  res.render("addServicesPage", {
    pageTitle: "Add-Services",
  });
};

const postAddServices = async (req, res) => {
  let { servicesData } = req.body;
  const db = getDB();

  // Basic XSS Sanitization
  servicesData = servicesData.map(service => {
    let safeIcon = service.serviceIcon || "";
    safeIcon = safeIcon.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
    safeIcon = safeIcon.replace(/on\w+="[^"]*"/gi, "");
    safeIcon = safeIcon.replace(/on\w+='[^']*'/gi, "");
    safeIcon = safeIcon.replace(/on\w+=\w+/gi, "");
    return { ...service, serviceIcon: safeIcon };
  });

  try {
    await db.collection("Services").insertMany(servicesData);
    res.status(200).json({ message: "Services added successfully" });
  } catch (error) {
    console.error("Error adding services:", error);
    res.status(500).json({ message: "Error adding services" });
  }
};

const deleteService = async (req, res) => {
  const { id } = req.params;
  const db = getDB();
  try {
    const result = await db
      .collection("Services")
      .deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 1) {
      res.status(200).json({ message: "Service delete ho gaya!" });
    } else {
      res
        .status(404)
        .json({ message: "Is ID ka koi service database me nahi mila." });
    }
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ message: "Database error aa gaya." });
  }
};

const getLoginPage = (req, res) => {
  const admin = req.session.admin || null;
  res.render("loginPage", { admin });
};

const postLoginPage = async (req, res) => {
  const { email, password } = req.body;
  
  if (email !== process.env.ADMIN_EMAIL) {
    return res.status(401).json({
      success: false,
      message: "Aap is account se login nahi kar sakte. Sirf official admin allowed hai.",
    });
  }

  const db = getDB();

  try {
    const admin = await db.collection("adminData").findOne({ email: email });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Yeh email database me maujood nahi hai.",
      });
    }

    // Since earlier passwords might be stored in plaintext, we should handle both temporarily or just fail if it's plaintext
    // A robust way: check if it's plaintext, and update it later. But let's assume strict bcrypt for now.
    // However, the current password in DB is plaintext! If I use bcrypt.compare on a plaintext password, it will fail.
    // I need to support legacy login:
    let isMatch = false;
    if (admin.password.startsWith("$2b$") || admin.password.startsWith("$2a$")) {
      isMatch = await bcrypt.compare(password, admin.password);
    } else {
      isMatch = (admin.password === password);
      // Auto-upgrade password to hash
      if (isMatch) {
        const newHash = await bcrypt.hash(password, 10);
        await db.collection("adminData").updateOne({ _id: admin._id }, { $set: { password: newHash } });
      }
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Aapka password galat hai.",
      });
    }

    // If login is successful, they are the admin (since there's only 1 profile allowed)
    req.session.admin = {
      id: admin._id,
      fullName: admin.fullName,
      email: admin.email,
      role: admin.role,
      linkedinUrl: admin.linkedinUrl,
      githubUrl: admin.githubUrl,
      bio: admin.bio,
      aboutMe: admin.aboutMe,
      phone: admin.phone,
      profilePicUrl: admin.profilePicUrl || null,
      resumeUrl: admin.resumeUrl || null,
      isLoggedIn: true,
      isAdmin: true, // Dynamically true for valid DB admin
    };

    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).json({
          success: false,
          message: "Session save karne mein error aayi.",
        });
      }
      return res.status(200).json({
        success: true,
        message: "You are logged in successfully",
      });
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Server me koi technical problem aa gayi hai.",
    });
  }
};

const logoutAdmin = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ success: false, message: "Logout karne mein error aayi." });
    }
    res.clearCookie("connect.sid");
    res.redirect("/");
  });
};

module.exports = {
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
};
