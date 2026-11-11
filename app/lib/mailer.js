
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendVerificationEmail(email, token) {
  const verifyUrl =
    `${process.env.APP_URL}/verify-email?token=${encodeURIComponent(token)}`;

  await transporter.sendMail({
    from: `"Journey Share" <${process.env.SMTP_EMAIL}>`,
    to: email,
    subject: "Verify your Journey Share account",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto">
        <h2>Welcome to Journey Share!</h2>
        <p>Please verify your email address to activate your account.</p>
        <a href="${verifyUrl}"
           style="display:inline-block;padding:12px 20px;
           background:#2563eb;color:white;text-decoration:none;
           border-radius:6px">
          Verify Email
        </a>
        <p>This verification link expires in 1 hour.</p>
        <p>If you did not create this account, ignore this email.</p>
      </div>
    `,
  });
}

