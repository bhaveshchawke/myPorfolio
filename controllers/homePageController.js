const { getDB } = require("../config/dataBase");
const nodemailer = require("nodemailer");

const homePage = async (req, res) => {
  const db = getDB();
  try {
    const projects = await db.collection("FormData").find({}).toArray();
    const skills = await db.collection("Skills").find({}).toArray();
    const services = await db.collection("Services").find({}).toArray();
    const certificates = await db.collection("Certificates").find({}).toArray();
    let admin = req.session.admin || null;
    // Sirf tabhi admin pass karo jab email match ho
    if (admin && admin.email !== process.env.ADMIN_EMAIL) {
      admin = null;
    }

    res.render("index", {
      pageTitle: "Home-Page",
      projects: projects,
      skills: skills,
      services: services,
      certificates: certificates,
    });
  } catch (error) {
    console.error("Data laane mein error:", error);
    // Error hone par khali array bhej dein taaki page na fate
    res.render("index", { projects: [], skills: [], services: [], certificates: [], admin: null });
  }
};

const submitContact = async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ success: false, message: "Sabhi fields bharna zaroori hai!" });
  }

  // Check if email credentials are configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("EMAIL_USER ya EMAIL_PASS .env me set nahi hai!");
    return res.status(500).json({ success: false, message: "Server configuration error. Please contact admin." });
  }

  try {
    // Database se admin ka email lao (jisse login kiya hai)
    const db = getDB();
    const admin = await db.collection("adminData").findOne({});

    if (!admin || !admin.email) {
      console.error("❌ Admin email database me nahi mila!");
      return res.status(500).json({
        success: false,
        message: "Admin email configured nahi hai. Please contact admin.",
      });
    }

    const adminEmail = admin.email; // Yeh wo email hai jisse admin ne register/login kiya hai

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Pehle verify karo ki credentials sahi hain
    try {
      await transporter.verify();
      console.log("✅ SMTP connection verified successfully");
    } catch (verifyError) {
      console.error("❌ SMTP verification failed:", verifyError.message);
      return res.status(500).json({
        success: false,
        message: "Email credentials invalid hain. Admin ko contact karein.",
      });
    }

    const mailOptions = {
      from: `"Portfolio Contact - ${name}" <${process.env.EMAIL_USER}>`,
      to: adminEmail, // Ab email admin ke login wale email pe jaayegi
      subject: `Portfolio Contact: ${subject}`,
      html: `<h3>Naya message aaya hai aapke portfolio se!</h3>
        <p><strong>Naam:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>`,
      replyTo: email, // Reply karne pe visitor ke email pe jaayega
    };

    const info = await transporter.sendMail(mailOptions);

    // Confirm karo ki email actually accept hui ya nahi
    console.log("📧 Email send result:", {
      messageId: info.messageId,
      sentTo: adminEmail,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
    });

    if (info.rejected && info.rejected.length > 0) {
      console.error("❌ Email rejected by server:", info.rejected);
      return res.status(500).json({
        success: false,
        message: "Email server ne message reject kar diya. Thodi der baad try karein.",
      });
    }

    res.status(200).json({ success: true, message: "Aapka message bhej diya gaya hai! Main jaldi hi aapse contact karunga." });
  } catch (error) {
    console.error("❌ Email send error:", error.message);
    console.error("Error code:", error.code);
    console.error("Full error:", error);
    res.status(500).json({ success: false, message: "Email bhejne mein koi error aa gaya, kripya thodi der baad try karein." });
  }
};

module.exports = {
  homePage,
  submitContact,
};
