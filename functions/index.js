const functions = require('firebase-functions');
const nodemailer = require('nodemailer');

// Create a transporter using Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'infopydah@gmail.com',
    pass: 'zqiu btbf uyyv cjpw'  // App-specific password
  }
});

exports.sendComplaintEmail = functions.firestore
  .document('complaints/{complaintId}')
  .onCreate(async (snap, context) => {
    const complaintData = snap.data();

    const emailTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #F27528; text-align: center;">HCCMS - Complaint Confirmation</h2>
        
        <div style="background-color: #f8f8f8; padding: 20px; border-radius: 8px; margin-top: 20px;">
          <h3 style="color: #333;">Complaint Details</h3>
          <p><strong>Complaint Token:</strong> ${complaintData.token}</p>
          <p><strong>Category:</strong> ${complaintData.category}</p>
          <p><strong>Status:</strong> ${complaintData.status}</p>
          <p><strong>Location:</strong> ${complaintData.locationType} - ${complaintData.locationDetail}</p>
          <p><strong>Description:</strong> ${complaintData.description}</p>
          
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p><strong>Submitted By:</strong> ${complaintData.name}</p>
            <p><strong>Student ID:</strong> ${complaintData.studentId}</p>
            <p><strong>Contact:</strong> ${complaintData.mobile}</p>
          </div>
        </div>
        
        <div style="margin-top: 20px; text-align: center; color: #666;">
          <p>You can track your complaint status using the token number.</p>
          <p style="color: #F27528; font-weight: bold;">Keep this token safe: ${complaintData.token}</p>
        </div>

        <div style="margin-top: 20px; text-align: center; font-size: 12px; color: #666;">
          <p>This is an automated message from HCCMS. Please do not reply to this email.</p>
          <p>© 2024 HCCMS - Hostel and Campus Complaint Management System</p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: 'HCCMS Support <infopydah@gmail.com>',
      to: complaintData.email,
      subject: `HCCMS Complaint Confirmation - ${complaintData.token}`,
      html: emailTemplate
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('Confirmation email sent successfully');
      return { success: true };
    } catch (error) {
      console.error('Error sending email:', error);
      return { error: error.message };
    }
  }); 