angular.module('loginApp').controller("LoginController", [
    "$http",
    "$state",
    "$cookies", 
    "$window",
    "$interval",
    "UserModel",
    "VerifyModel",
    function ($http, $state,$cookies,$window, $interval, UserModel, VerifyModel) {
        var vm = this;
        vm.user = UserModel;
        vm.errorMessage = "";
        vm.isVerification = false;
        vm.token = ["", "", "", "", "", ""]; 
        vm.countdown = 10;
        vm.isResendEnabled = true;

        vm.login = function () {
            $http.post("http://localhost:8080/api/v1/auth/login", vm.user).then(
                function () {
                    // console.log("Login successful:", response.data);
                    VerifyModel.email = vm.user.email
                    vm.isVerification = true; 
                    vm.token = ["", "", "", "", "", ""]; 
                    vm.countdown = 10; 
                    vm.isResendEnabled = false; 
                    startCountdown()
                }
            )
            .catch(function(err)  {
                if (err.status === 404) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Sai tài khoản hoặc mật khẩu',
                        text: 'Vui lòng thử lại.'
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Đã xảy ra lỗi',
                        text: 'Vui lòng thử lại sau.'
                    });
                }
            });
        };

        vm.handleOtpInput = function (input, index) {
            if (/^[0-9]$/.test(input) && index >= 0 && index < vm.token.length) {
                vm.token[index] = input; 
            }
        };

        vm.verifyCode = function () {
            var actualToken = vm.token.join('');         
            $http.post("http://localhost:8080/api/v1/auth/verify-mfa", {
                email: VerifyModel.email,
                token: actualToken 
            }).then(
                function (response) {
                    let refreshToken = response.data.refreshToken;
                    let cookies = $cookies.get('refreshToken')
                    if (cookies) {
                        $cookies.remove('refreshToken');
                    }
                    $cookies.put('refreshToken',refreshToken)
                    sessionStorage.setItem('accessToken', response.data.accessToken);
                    sessionStorage.setItem('username', response.data.username);
                    $state.go('home'); 
                },
            )
            .catch(function(err)  {
                if (err.status === 403) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Sai mã xác thực',
                        text: 'Vui lòng thử lại.'
                    });
                }else if(err.status === 301) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Tài khoản chưa đăng ký',
                        text: 'Vui lòng thử lại.'
                    });
                }
                 else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Đã xảy ra lỗi',
                        text: 'Vui lòng thử lại sau.'
                    });
                }
            });
        };

        vm.resendCode = function () {
            if (vm.isResendEnabled) { 
                $http.post("http://localhost:8080/api/v1/auth/resend-code", {
                    email: VerifyModel.email
                }).then(
                    function (response) {
                        console.log("Code resent successfully:", response.data);
                        vm.token = ["", "", "", "", "", ""]; 
                        vm.isResendEnabled = false;
                        vm.countdown = 10; 
                        startCountdown(); 
                    },
                    function (error) {
                        vm.errorMessage = "Failed to resend code.";
                        console.error("Resend code failed:", error);
                    }
                );
            } else {
                vm.errorMessage = "Please wait before resending the code.";
            }
        };

        function startCountdown() {
            vm.isResendEnabled = false; 
            var interval = $interval(function () {
                if (vm.countdown > 0) {
                    vm.countdown--;
                } else {
                    $interval.cancel(interval);
                    vm.isResendEnabled = true; 
                }
            }, 1000);
        }
        
    },
]);
