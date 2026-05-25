const checkAdminAuth = (req, res, next) => {
  const admin = req.session.admin;
  if (admin && admin.isAdmin && admin.email === process.env.ADMIN_EMAIL) {
    next();
  } else {
    // Agar request HTML page ke liye hai aur GET request hai toh login par redirect karo
    if (req.method === 'GET' && req.accepts('html')) {
      return res.redirect("/admin/login");
    }
    res.status(401).json({
      success: false,
      message: "Unauthorized! Sirf verified admin is action ko perform kar sakta hai.",
    });
  }
};

module.exports = {
  checkAdminAuth,
};
