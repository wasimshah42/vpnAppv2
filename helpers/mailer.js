const nodemailer = require('nodemailer');

// Create a transporter object using the SMTP configuration
const transporter = nodemailer.createTransport({
    host: 'smtp.elasticemail.com',
    port: 2525,
    auth: {
      user: 'no-reply@str.hk',
      pass: '25D855888B4A0042E249DDA9B1560860E82E'
    }
  });
  

// Export the function for sending emails
module.exports.sendEmail = (to, subject, htmlContent, textContent) => {
  const mailOptions = {
    from: 'no-reply@str.hk',
    to: to,
    subject: subject,
    html: htmlContent,
    text: textContent
  };

  return transporter.sendMail(mailOptions);
};
