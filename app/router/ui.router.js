var app = angular.module("loginApp");
app.config([
  "$stateProvider",
  "$urlRouterProvider",
  "$locationProvider",
  function ($stateProvider, $urlRouterProvider, $locationProvider) {
    $stateProvider
      .state("register", {
        url: "/register",
        templateUrl: "./app/views/register.html",
        controller: "RegisterController as registerCtrl",
      })
      .state("login", {
        url: "/login",
        templateUrl: "./app/views/login.html",
        controller: "LoginController as ctrl",
      })
      .state("home", {
        url: "/home",
        templateUrl: "./app/views/home.html",
        controller: "HomeController as homeCtrl",
      })
      .state("request-password-reset", {
        url: "/request-password-reset",
        templateUrl: "./app/views/request-password-reset.html",
        controller: "RequestPasswordResetController as requestCtrl",
      })
      .state("reset-password", {
        url: "/reset-password?token",
        templateUrl: "./app/views/reset-password.html",
        controller: "ResetPasswordController as resetCtrl",
      });

    $urlRouterProvider.otherwise("login");

    // $locationProvider.html5Mode({
    //     enabled: true,
    // });
  },
]);
