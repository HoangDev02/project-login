var app = angular.module('loginApp', ['ui.router', 'ngCookies'])
app.run(['$transitions', '$cookies', '$state', function($transitions, $cookies, $state) {
    $transitions.onStart({ to: 'home' }, function(trans) {
        var refresherToken = $cookies.get('refreshToken');
        if (!refresherToken) {
            return trans.router.stateService.target('login');
        }
    });
}]);