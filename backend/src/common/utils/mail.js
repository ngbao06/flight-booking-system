import nodemailer from "nodemailer";

const createTransporter = () => {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
        return null;
    }

    return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
    });
};

export const sendResetPasswordEmail = async ({ to, username, resetUrl }) => {
    const transporter = createTransporter();

    if (!transporter) {
        // Không throw để tránh làm lỗi flow trong môi trường local chưa cấu hình SMTP.
        console.warn("SMTP is not configured. Reset email was not sent.");
        console.info(`Reset URL for ${username}: ${resetUrl}`);
        console.log(transporter);
        return;
    }

    await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject: "Flight Booking - Reset Password [do not reply]",
        text: `Hello ${username},\n\nPlease use the link below to reset your password:\n${resetUrl}\n\nThis link expires in 15 minutes.`,
        html: `
            <p>Hello <strong>${username}</strong>,</p>
            <p>Please click the link below to reset your password:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <p>This link expires in <strong>15 minutes</strong>.</p>
        `
    });
};
