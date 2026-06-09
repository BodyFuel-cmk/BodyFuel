/**
 * Email service stub for BodyFuel TV.
 * Replace with a real email provider (SendGrid, Resend, Postmark, etc.)
 */

/**
 * Send a welcome email to a newly registered user
 * @param {object} user — { id, email, name }
 */
async function sendWelcomeEmail(user) {
  const to = user.email;
  const name = user.name || 'there';

  // In development, log to console
  console.log(`\n📧 [EMAIL] Welcome email to ${to}`);
  console.log(`   Subject: Welcome to BodyFuel TV!`);
  console.log(`   Body:`);
  console.log(`   Hi ${name},`);
  console.log(`   `);
  console.log(`   Welcome to BodyFuel TV! Your account is ready.`);
  console.log(`   Start your fitness journey today:`);
  console.log(`   ${process.env.FRONTEND_URL || 'http://localhost:3000'}/#pricing`);
  console.log(`   `);
  console.log(`   Stay fueled,`);
  console.log(`   The BodyFuel Team\n`);

  // TODO: Replace with real email API call
  // Example with SendGrid:
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // await sgMail.send({ to, from: 'welcome@bodyfueltv.com', subject: '...', text: '...' });

  return true;
}

module.exports = { sendWelcomeEmail };