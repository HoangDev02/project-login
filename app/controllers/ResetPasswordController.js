angular.module('loginApp').controller('ResetPasswordController', [
    '$http',
    '$stateParams',
    function ($http, $stateParams) {
        var vm = this;
        vm.newPassword = '';
        vm.token = $stateParams.token;

        vm.resetPassword = function () {
            $http.post('http://localhost:8080/api/v1/auth/reset-password', { token: vm.token, newPassword: vm.newPassword })
                .then(function (response) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Success',
                        text: 'Password has been reset.',
                    });
                })
                .catch(function (error) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: error.data.message,
                    });
                });
        };
    }
]);