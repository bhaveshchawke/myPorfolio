# Portfolio Backend

This is the backend for my personal portfolio website, built with **Node.js, Express, MongoDB, EJS, and Tailwind CSS**. It includes features for an admin panel to manage projects, services, skills, and resume uploads via Cloudinary.

## Tech Stack
- **Node.js & Express.js** - Server and API routes
- **MongoDB** - Database for storing portfolio data (Admin, Projects, Services, etc.)
- **EJS** - Template engine for server-side rendering
- **Tailwind CSS** - Styling
- **Cloudinary** - Image and PDF (resume) cloud storage
- **Nodemailer** - Email service for OTP verification

## Prerequisites
Make sure you have the following installed:
- [Node.js](https://nodejs.org/) (v16+)
- [MongoDB](https://www.mongodb.com/) (Local or Atlas cluster)
- Cloudinary Account
- Gmail Account (for Nodemailer App Password)

## Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/bhaveshchawke/myPorfolio.git
   cd myPorfolio
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env` file in the root directory and add the following:
   ```env
   # Server Config
   PORT=3000
   NODE_ENV=development # Set to 'production' on Render

   # Database
   MONGO_URI=your_mongodb_connection_string
   DB_NAME=portfolio_db
   
   # Session
   SESSION_SECRET=your_super_secret_key

   # Admin & Email (Nodemailer)
   ADMIN_EMAIL=your_admin_email@gmail.com
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_gmail_app_password

   # Cloudinary
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

4. **Build CSS (Tailwind):**
   ```bash
   npm run build:css
   ```

5. **Run the application:**
   ```bash
   npm start
   ```
   *For development with Tailwind watcher:*
   ```bash
   npm run dev:css # In one terminal
   npm run start   # Or use nodemon if installed in another
   ```

## Deployment (Render)

This project is configured for easy deployment on **Render**.

1. Connect this GitHub repository to a new **Web Service** on Render.
2. Use the following settings:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
3. Add all the Environment Variables listed above in the Render dashboard under **Environment**.
   - Make sure to set `NODE_ENV` to `production`.

## License
MIT License
