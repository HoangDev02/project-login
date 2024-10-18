angular.module('loginApp').controller('RegisterController', [
    '$http',
    function ($http) {
        var vm = this;
        vm.user = {
            username: '',
            email: '',
            password: ''
        };

        vm.register = function () {
            $http.post('http://localhost:8080/api/v1/auth/register', vm.user)
                .then(function (response) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Success',
                        text: 'Registration successful.',
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