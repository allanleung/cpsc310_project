/**
 * Created by Jnani on 3/15/17.
 */
var app = angular.module('app', []).run(($rootScope) => {
    //Just add a reference to some utility methods in rootscope.
    $rootScope.Utils = {
        keys: Object.keys
    };
});