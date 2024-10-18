const userModel = require("../models/userSchema");
const refreshTokens = require("../models/refreshTokens");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { generateAccessToken, generateRefreshToken } = require("../utils/token");
const nodemailer = require("nodemailer");
const crypto = require('crypto');
const { totp, authenticator } = require("otplib");
const useragent = require("user-agent");
// Cấu hình Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
authenticator.options = { step: 60, window: 1 };
const sendSecurityAlertEmail = (email) => {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: email,
    subject: "Security Alert: Multiple Logins Detected",
    text:
      "We detected multiple logins to your account. If this was not you, please click the link below to log out from all devices: \n\n" +
      "http://yourapp.com/logout-all-devices?email=" +
      email,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
};

const userController = {
  isRegister: async (req, res, next) => {
    try {
      const existingUser = await userModel.findOne({
        username: req.body.username,
      });
      if (existingUser) {
        return res.status(500).json("User already exists");
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(req.body.password, salt);

      const newUser = new userModel({
        username: req.body.username,
        email: req.body.email,
        password: hashedPassword,
      });
      const user = await newUser.save();

      // Gửi email xác nhận
      const mailOptions = {
        from: process.env.SMTP_USER,
        to: newUser.email,
        subject: "Chào mừng đến với Test Eranin!",
        text: `Chào ${newUser.username},\n\nChúc mừng bạn đã trở thành thành viên mới của chúng tôi ! Chúng tôi rất hào hứng được chào đón bạn.\n\nNếu bạn cần bất kỳ sự hỗ trợ nào, vui lòng liên hệ với chúng tôi qua ${process.env.SMTP_USER}. Đội ngũ của chúng tôi luôn sẵn lòng hỗ trợ bạn.`,
      };
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
          res.status(500).json("Error in sending email");
        } else {
          console.log("Email sent: " + info.response);
          res.status(200).json(user);
        }
      });
    } catch (err) {
      next(err);
    }
  },

  isLogin: async (req, res, next) => {
    try {
      const user = await userModel.findOne({ email: req.body.email });
      if (!user) {
        return res.status(301).send("User does not exist");
      }

      const isPasswordCorrect = await bcrypt.compare(
        req.body.password,
        user.password
      );
      if (!isPasswordCorrect) {
        return res.status(404).send("Wrong username or password");
      }

      // Lấy thông tin thiết bị từ User-Agent
      const agent = useragent.parse(req.headers["user-agent"]);
      const deviceInfo = {
        full: agent.full,
        name: agent.name,
        version: agent.version,
        fullName: agent.fullName,
        os: agent.os,
      };

      const isDifferentDevice =
        user.deviceInfo && user.deviceInfo !== deviceInfo.full;
      if (isDifferentDevice) {
        // Gửi email thông báo nếu đăng nhập từ thiết bị khác
        sendSecurityAlertEmail(user.email);
      }

      user.deviceInfo = deviceInfo.full;

      // Kiểm tra xem secret đã được tạo chưa
      const secret = authenticator.generateSecret();
      user.twoFactorSecret = secret; // Lưu trữ secret vào cơ sở dữ liệu
      await user.save();

      // Tạo mã TOTP
      const token = authenticator.generate(secret);

      // Gửi mã QR qua email
      const mailOptions = {
        from: process.env.SMTP_USER,
        to: user.email,
        subject: "Xác thực đa yếu tố cho tài khoản của bạn",
        html: `<p>Chào ${user.username},</p>
               <p>Mã xác thực của bạn là: <strong>${token}</strong></p>
               <p>Nếu bạn không yêu cầu điều này, vui lòng bỏ qua email này.</p>`,
      };
      await transporter.sendMail(mailOptions);
      res.status(200).json({ message: "MFA setup email sent." });
    } catch (err) {
      next(err);
    }
  },

  validateMFA: async (req, res) => {
    try {
      const { email, token } = req.body;

      const user = await userModel.findOne({ email });
      if (!user) {
        return res.status(404).json("User not found");
      }

      // Lấy mã token chính xác từ secret
      // const correctToken = authenticator.generate(user.twoFactorSecret);
      // console.log("Correct MFA Token:", correctToken);

      // Xác minh mã MFA bằng otplib
      const verified = authenticator.check(token, user.twoFactorSecret);

      // Kiểm tra nếu mã không hợp lệ hoặc hết hạn
      if (!verified) {
        return res.status(403).json({
          message: "Invalid MFA token",
        });
      }

      // Đánh dấu người dùng đã xác thực MFA
      user.isMFAAuthenticated = true;
      await user.save();

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      const newRefreshTokenDB = new refreshTokens({
        refreshToken: refreshToken,
        accessToken: accessToken,
      });
      await newRefreshTokenDB.save();

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        sameSite: "strict",
      });

      const { password, twoFactorSecret, ...others } = user._doc;
      res.status(200).json({ ...others, accessToken, refreshToken });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  refreshAccessToken: async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    console.log("1", refreshToken);
    if (!refreshToken) return res.status(401).json("You're not authenticated");

    const dbToken = await refreshTokens.findOne({ refreshToken });
    if (!dbToken) return res.status(403).json("Refresh Token is not valid!");

    jwt.verify(refreshToken, process.env.JWT_REFRESH_KEY, async (err, user) => {
      if (err) return res.status(403).json("Token is not valid!");

      const newAccessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);

      await refreshTokens.findByIdAndDelete(dbToken._id);

      const newRefreshTokenDB = new refreshTokens({
        refreshToken: newRefreshToken,
        accessToken: newAccessToken,
      });
      await newRefreshTokenDB.save();

      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        sameSite: "strict",
      });

      res
        .status(200)
        .json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    });
  },

  logOut: async (req, res) => {
    const user = req.user; // Lấy thông tin người dùng từ middleware
    console.log("1", user);

    const authHeader = req.headers.authorization;
    console.log("2", authHeader);

    if (!authHeader) return res.status(401).json("No authorization header");
    const token = authHeader.split(" ")[1];

    if (!token) return res.status(401).json("No token to logout");

    const deletedToken = await refreshTokens.deleteOne({ accessToken: token });

    if (deletedToken.deletedCount === 0) {
      return res.status(404).json("Token not found");
    }
    const findUser = await userModel.findOne({ email: user.email });
    findUser.isMFAAuthenticated = false;
    await findUser.save();

    res.status(200).json("Logged out successfully!");
  },
  resendCode: async (req, res) => {
    try {
      const { email } = req.body;

      const user = await userModel.findOne({ email });
      if (!user) {
        return res.status(404).json("User not found");
      }

      const secret = user.twoFactorSecret;
      if (!secret) {
        return res.status(400).json("MFA not set up for this user");
      }

      const token = authenticator.generate(secret);

      const mailOptions = {
        from: process.env.SMTP_USER,
        to: user.email,
        subject: "Resend MFA Setup Code",
        html: `<p>Chào ${user.username},</p>
               <p>Mã xác thực của bạn là: <strong>${token}</strong></p>
               <p>Nếu bạn không yêu cầu điều này, vui lòng bỏ qua email này.</p>`,
      };

      await transporter.sendMail(mailOptions);

      res.status(200).json({ message: "MFA setup email resent." });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  protectedAction: async (req, res) => {
    try {
      const user = req.user;
      if (!user || !user.isMFAAuthenticated) {
        return res
          .status(403)
          .json({ message: "Access denied. Please log in and complete MFA." });
      }
      const protectedData = await userModel.find({ userId: user._id });
      res.status(200).json({
        message: "Protected data accessed successfully.",
        data: protectedData,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  requestPasswordReset: async (req, res) => {
    const { email } = req.body;
    try {
      const user = await userModel.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiry = Date.now() + 3600000; // 1 tiếng

      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = resetTokenExpiry;
      await user.save();

      const resetUrl = `http://localhost:5500/#!/reset-password?token=${resetToken}`;

      const mailOptions = {
        to: user.email,
        from: process.env.SMTP_USER,
        subject: "Yêu cầu đặt lại mật khẩu",
        text: `Bạn nhận được email này vì bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của bạn.\n\n
        Vui lòng nhấp vào liên kết sau, hoặc dán vào trình duyệt của bạn để hoàn tất quá trình:\n\n
        ${resetUrl}\n\n
        Nếu bạn không yêu cầu điều này, vui lòng bỏ qua email này và mật khẩu của bạn sẽ không thay đổi.\n`,
      };

      await transporter.sendMail(mailOptions);

      res.status(200).json({ message: "Password reset email sent" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  resetPassword: async (req, res) => {
    const { token, newPassword } = req.body;
    try {
      const user = await userModel.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() },
      });

      if (!user) {
        return res.status(400).json({ message: "Password reset token is invalid or has expired" });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      user.password = hashedPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      res.status(200).json({ message: "Password has been reset" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = userController;
