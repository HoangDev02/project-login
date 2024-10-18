angular.module("loginApp").controller("HeaderController", [
    "$state",
    "$http",
    "$window",
    function ($state, $http, $window) {
      var vm = this;
  
      vm.isLoggedIn = function () {
        return !!sessionStorage.getItem("accessToken");
      };
  
      vm.username = sessionStorage.getItem("username") || "User"; 
  
      vm.logout = function () {
        $http
          .post(
            "http://localhost:8080/api/v1/auth/logout",
            {},
            {
              headers: {
                Authorization: "Bearer " + sessionStorage.getItem("accessToken"),
              },
            }
          )
          .then(function (response) {
            sessionStorage.removeItem("accessToken");
            sessionStorage.removeItem("username");
            Swal.fire({
                icon: 'success',
                title: 'Login thành công',
                text: 'Vui lòng thử lại.'
            });
            $state.go("login");
          })
          .catch(function (error) {
            console.error("Logout failed:", error);
            Swal.fire({
                icon: 'error',
                title: 'logout thất bại',
                text: 'Vui lòng thử lại.'
            });
          });
      };
    },
  ]);