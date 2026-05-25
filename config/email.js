const nodemailer = require("nodemailer");

// Create a transporter using environment variables
const getTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendOtpEmail = async (toEmail, otp) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("EMAIL_USER ya EMAIL_PASS .env me set nahi hai.");
  }

  const transporter = getTransporter();

  const mailOptions = {
    from: `"Portfolio Admin" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Admin Registration OTP",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #ff9800; text-align: center;">DevDoor Verification</h2>
        <p>Aapne DevDoor par admin profile setup/update ke liye request kiya hai.</p>
        <p>Aapka One Time Password (OTP) neeche diya gaya hai:</p>
        <div style="text-align: center; margin: 20px 0;">
          <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; background: #f4f4f4; padding: 10px 20px; border-radius: 5px; color: #333;">${otp}</span>
        </div>
        <p style="color: #666; font-size: 14px;">Yeh OTP 5 minute ke liye valid hai. Kripya ise kisi ke saath share na karein.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999; text-align: center;">This is an automated message from your Portfolio App.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendOtpEmail,
};
