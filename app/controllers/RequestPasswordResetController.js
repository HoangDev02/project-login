angular.module('loginApp').controller('RequestPasswordResetController', [
    '$http',
    function ($http) {
        var vm = this;
        vm.email = '';

        vm.requestPasswordReset = function () {
            $http.post('http://localhost:8080/api/v1/auth/request-password-reset', { email: vm.email })
                .then(function (response) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Success',
                        text: 'Password reset email sent.',
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