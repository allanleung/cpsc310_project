angular.module('app').component('query', {
    template: `
<ul class="unstyled">
    <li ng-repeat="column in $root.Utils.keys($ctrl.columns)">
        <label class="checkbox">
            <input type="checkbox" ng-model="$ctrl.columns[column]">
            <span>{{column}}</span>
        </label>
    </li>
</ul>
`, controller: function QueryController($scope, $http) {

        this.columns = {
            "courses_dept": true,
            "courses_id": true,
            "courses_avg": true,
            "courses_instructor": true,
            "courses_title": true,
            "courses_pass": true,
            "courses_fail": true,
            "courses_audit": true,
            "courses_uuid": true,
            "courses_year": true
        };

    }
});