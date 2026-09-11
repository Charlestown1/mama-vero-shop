import nodemailer from "nodemailer";

function getTransporter() {
  if (!process.env.SMTP_HOST) {
    throw new Error("SMTP is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASSWORD in .env");
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
  });
}

export async function sendEmail(to, subject, html) {
  const transporter = getTransporter();
  await transporter.sendMail({ from: process.env.SMTP_FROM, to, subject, html });
}
