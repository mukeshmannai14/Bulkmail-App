# 📧 BulkMail — MERN Stack Bulk Email Application

A full-stack **Bulk Mail Sending Web Application** built using the MERN stack. BulkMail allows an admin to authenticate, compose an email, add multiple recipients, send bulk emails through SMTP, and maintain a history of sent emails.

The project demonstrates practical full-stack development using **React, Node.js, Express.js, MongoDB, Mongoose, and Nodemailer**.

---

## 🚀 Features

### 🔐 Admin Authentication

* Admin login interface
* Username and password validation
* JWT-based authentication support
* Authentication token stored securely on the client
* Logout functionality

### 📧 Bulk Email Sending

* Compose emails with:

  * Subject
  * Email body
  * Multiple recipients
* Add and remove recipient email addresses
* Email validation
* Loading state while sending
* Success and failure notifications

### 📊 Email Management

* Store email records in MongoDB
* Track email status:

  * `pending`
  * `sent`
  * `failed`
* Store recipient lists
* Store error messages for failed emails
* Maintain sent email timestamps

### 📜 Email History

* View previously sent emails
* Display:

  * Subject
  * Recipients
  * Status
  * Date
* Sort latest emails first

### 🛡️ Error Handling

* Frontend form validation
* Backend request validation
* SMTP error handling
* MongoDB error handling
* API error responses
* User-friendly error messages

---

## 🛠️ Tech Stack

### Frontend

* React.js
* Vite
* Tailwind CSS
* Axios
* JavaScript

### Backend

* Node.js
* Express.js
* Nodemailer
* JWT
* dotenv
* CORS

### Database

* MongoDB
* Mongoose

### Development Tools

* Git
* GitHub
* Postman
* VS Code

---

## 🏗️ Project Architecture

```text
                 ┌────────────────────┐
                 │      React UI      │
                 │     Frontend       │
                 └─────────┬──────────┘
                           │
                           │ REST API
                           ▼
                 ┌────────────────────┐
                 │   Node + Express   │
                 │      Backend       │
                 └─────────┬──────────┘
                           │
                ┌──────────┴──────────┐
                │                     │
                ▼                     ▼
        ┌──────────────┐      ┌──────────────┐
        │   MongoDB    │      │  Nodemailer  │
        │   Database   │      │ SMTP Server  │
        └──────────────┘      └──────┬───────┘
                                     │
                                     ▼
                               Email Recipients
```

---

## 📂 Project Structure

```text
BulkMail/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   ├── Login.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   ├── .env
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── models/
│   │   └── Email.js
│   │
│   ├── routes/
│   │   └── emailRoutes.js
│   │
│   ├── server.js
│   ├── .env
│   ├── .gitignore
│   └── package.json
│
└── README.md
```

---

## ⚙️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
```

```bash
cd BulkMail
```

---

## 💻 Frontend Setup

Navigate to the frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the React development server:

```bash
npm run dev
```

The frontend will normally run at:

```text
http://localhost:5173
```

---

## 🖥️ Backend Setup

Open another terminal and navigate to:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```env
PORT=5000

MONGODB_URI=YOUR_MONGODB_CONNECTION_STRING

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=YOUR_EMAIL@gmail.com
SMTP_PASS=YOUR_GMAIL_APP_PASSWORD

JWT_SECRET=YOUR_SECRET_KEY
```

Start the backend:

```bash
npm run dev
```

The backend will run at:

```text
http://localhost:5000
```

---

## 📧 Gmail SMTP Configuration

BulkMail uses **Nodemailer** to send emails through SMTP.

If you are using Gmail, enable **2-Step Verification** on your Google account and generate a **Google App Password**.

Use the generated app password in:

```env
SMTP_PASS=YOUR_GMAIL_APP_PASSWORD
```

Do **not** use your normal Gmail account password.

---

## 🗄️ MongoDB Configuration

Create a MongoDB database using either:

* MongoDB Atlas
* Local MongoDB

Then add the connection string to:

```env
MONGODB_URI=YOUR_MONGODB_CONNECTION_STRING
```

Example:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bulkmail
```

Never commit database credentials to GitHub.

---

## 🔌 API Endpoints

### Authentication

```text
POST /api/login
```

Authenticates the administrator and returns an authentication token.

### Send Email

```text
POST /api/emails/send
```

Example request:

```json
{
  "subject": "Welcome to BulkMail",
  "body": "Hello, this is a test email.",
  "recipients": [
    "user1@example.com",
    "user2@example.com"
  ]
}
```

### Email History

```text
GET /api/emails/history
```

Returns previously processed email records.

---

## 🗃️ Email Data Model

Example MongoDB document:

```json
{
  "subject": "Welcome to our application",
  "body": "Hello everyone!",
  "recipients": [
    "user1@example.com",
    "user2@example.com"
  ],
  "status": "sent",
  "errorMessage": "",
  "sentAt": "2026-09-04T12:00:00.000Z"
}
```

---

## 🔄 Application Workflow

```text
Admin Login
     ↓
Authentication
     ↓
BulkMail Dashboard
     ↓
Compose Email
     ↓
Add Multiple Recipients
     ↓
Submit Email
     ↓
Express API
     ↓
Validate Request
     ↓
Save Email Record
     ↓
Nodemailer + SMTP
     ↓
Send Email
     ↓
Update Email Status
     ↓
Display Result
```

---

## 🧪 Testing

The API can be tested using Postman.

Example:

```text
POST http://localhost:5000/api/emails/send
```

Request body:

```json
{
  "subject": "Test Email",
  "body": "This email was sent using BulkMail.",
  "recipients": [
    "your-email@example.com"
  ]
}
```

Expected response:

```json
{
  "message": "Email sent successfully!"
}
```

---

## 🔒 Security Considerations

* Environment variables are used for sensitive configuration.
* `.env` files should never be committed.
* SMTP credentials are stored only on the backend.
* Authentication tokens are used for protected operations.
* Backend validation prevents invalid email requests.
* CORS is configured for frontend-backend communication.

For a production deployment, additional protections such as rate limiting, stronger token handling, request sanitization, email quotas, and provider-level authentication should be added.

---

## 🚀 Future Improvements

Possible enhancements include:

* 📊 Admin dashboard with email statistics
* 🔐 Complete JWT authentication and role-based access
* 📎 Email attachments
* 📝 HTML email templates
* 📅 Scheduled email campaigns
* 📥 CSV/Excel recipient upload
* 🔄 Retry failed emails
* 🔍 Search and filter email history
* 📈 Email delivery analytics
* 🌐 Production deployment
* 📱 Improved mobile responsiveness
* 🔔 Real-time sending notifications

---

## 🎯 Learning Outcomes

This project demonstrates practical experience with:

* React component development
* React state management
* REST API integration
* Axios
* Node.js
* Express.js
* MongoDB
* Mongoose
* SMTP and Nodemailer
* Authentication
* Environment configuration
* API error handling
* Full-stack application architecture
* Git and GitHub workflow

---

## 👨‍💻 Author

**Mukesh Kanna**

Built as a full-stack MERN project to demonstrate practical frontend, backend, database, authentication, and email integration skills.

---

## ⭐ Support

If you found this project useful, consider giving the repository a ⭐ on GitHub.

```


```
