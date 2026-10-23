import nodemailer from 'nodemailer';

export function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure =
    process.env.SMTP_SECURE === 'true' || (!Number.isNaN(port) && port === 465);

  if (!host || !user || !pass) {
    throw new Error('SMTP configuration is missing');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const from = process.env.SMTP_FROM || 'no-reply@dentalclinic.local';
  const transporter = createTransporter();

  await transporter.sendMail({
    from,
    to,
    subject: 'Reset your password',
    html: `
      <p>We received a request to reset your password.</p>
      <p>Click the link below to set a new password:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>If you didn’t request this, you can ignore this email.</p>
    `,
  });
}
