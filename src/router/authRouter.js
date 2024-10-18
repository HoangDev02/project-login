const express = require("express");
const authController = require("../controllers/authController");
const checkMFA = require("../middleware/checkMFA")
const authentica = require("../middleware/authentica")
const router = express.Router();

router.post("/register", authController.isRegister);
router.post("/login", authController.isLogin);
router.post("/verify-mfa", authController.validateMFA);
router.post("/refresh-token", authController.refreshAccessToken);
router.post("/resend-code", authController.resendCode);
router.post("/protected",authentica, checkMFA,authController.protectedAction)
router.post("/logout",authentica, authController.logOut)
router.post("/request-password-reset", authController.requestPasswordReset);
router.post("/reset-password", authController.resetPassword);
module.exports = router;
