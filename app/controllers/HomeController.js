angular.module('loginApp').controller("HomeController", [
    "$http",
    "$cookies",
    "$state",
    "ENV",
    function ($http, $cookies, $state, ENV) {
      var vm = this;
      var accessToken = sessionStorage.getItem('accessToken'); 
      console.log(ENV.API_URL);
      
      vm.getProtectedData = function () {
        if (!accessToken) {
          vm.refreshAccessToken();
          return;
        }
  
        $http.post(`${ENV.API_URL}/auth/protected`, {}, {
          headers: {
            'Authorization': 'Bearer ' + accessToken
          },
          withCredentials: true
        }).then(
          function (response) {
            console.log("Protected data:", response);
            vm.protectedData = response.data;
          },
          function (error) {
            if (error.status === 401) {
              vm.refreshAccessToken(); // nếu accesstoken hết hạn thì làm mới
            } else {
              console.error("Failed to get protected data:", error);
            }
          }
        );
      };
  
      vm.refreshAccessToken = function () {
        let refreshToken = $cookies.get('refreshToken');
        
        if (!refreshToken) {
          console.error("No refresh token found");
          $state.go('login');
          return;
        }
  
        $http.post(`${ENV.API_URL}/auth/refresh-token`, {}, {
          withCredentials: true // Cho phép cookie được gửi kèm
        }).then(
          function (response) {
            accessToken = response.data.accessToken;
            sessionStorage.setItem('accessToken', accessToken);
            vm.getProtectedData();
          },
          function (error) {
            console.error("Failed to refresh access token:", error);
            if (error.status === 403) {
              $state.go('login');
            }
          }
        );
      };
  
      // Gọi để lấy dữ liệu bảo vệ ngay khi controller được khởi tạo
      vm.getProtectedData();
    }
  ]);
  