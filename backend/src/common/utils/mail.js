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

export const sendVerificationEmail = async ({ to, username, code }) => {
    const transporter = createTransporter();
    if (!transporter) {
        console.info(`Verification Code for ${username}: ${code}`);
        return;
    }

    await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject: "Vietnam Airlines - Xác thực đăng ký",
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
                <h2 style="color: #006885;">Chào mừng ${username}!</h2>
                <p>Cảm ơn bạn đã đăng ký thành viên. Mã xác nhận của bạn là:</p>
                <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #DBA410;">
                    ${code}
                </div>
                <p style="margin-top: 20px; font-size: 12px; color: #777;">Mã này có hiệu lực trong vòng 10 phút. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
            </div>
        `
    });
}

export const sendWelcomeEmail = async ({ to, username }) => {
    const transporter = createTransporter();
    const displayName = username || to || 'Khách hàng';

    if (!transporter) {
        console.info(`Welcome email for ${displayName} not sent (SMTP not configured).`);
        return;
    }

    await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject: "Chúc mừng - Tài khoản đã được tạo",
        text: `Chào ${displayName},\n\nTài khoản của bạn đã được tạo thành công. Cảm ơn bạn đã đăng ký!`,
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
                <h2 style="color: #006885;">Chúc mừng ${displayName}!</h2>
                <p>Tài khoản của bạn đã được tạo thành công. Cảm ơn bạn đã đăng ký và hy vọng bạn có trải nghiệm tốt cùng chúng tôi.</p>
                <p style="font-size:12px;color:#777;margin-top:16px;">Nếu bạn chưa yêu cầu việc này, vui lòng liên hệ bộ phận hỗ trợ.</p>
            </div>
        `
    });
}