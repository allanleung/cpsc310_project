angular.module('app').component('results', {
    template: `
<ul class="unstyled">
    <li ng-repeat="column in $root.Utils.keys($ctrl.columns)">
        <label class="checkbox">
            <input type="checkbox" ng-model="$ctrl.columns[column]">
            <span>{{column}}</span>
        </label>
    </li>
</ul>

<a href="" ng-click="$ctrl.query()">Query</a>

<table class="table table-hover">
    <thead>
    <tr>
        <th ng-repeat="key in $root.Utils.keys($ctrl.columns)" ng-if="$ctrl.columns[key]">{{key}}</th>
    </tr>
    </thead>
    <tbody>
    <tr ng-repeat="result in $ctrl.results">
        <th ng-repeat="key in $root.Utils.keys($ctrl.columns)" ng-if="$ctrl.columns[key]">{{result[key]}}</th>
    </tr>
    </tbody>
</table>
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

        this.query = function() {
            $http.post('/query', {
                "WHERE": {
                    "OR":[
                        {
                            "AND":[
                                {
                                    "GT":{
                                        "courses_avg":90
                                    }
                                },
                                {
                                    "IS":{
                                        "courses_dept":"adhe"
                                    }
                                }
                            ]
                        },
                        {
                            "EQ":{
                                "courses_avg":95
                            }
                        }
                    ]
                },
                "OPTIONS": {
                    "COLUMNS": Object.keys(this.columns).filter(e => {
                        return this.columns[e];
                    }),
                    "ORDER": {
                        "dir": "UP",
                        "keys": ["courses_dept", "courses_id"]
                    },
                    "FORM": "TABLE"
                }
            }, {}).then((response) => {
                this.results = [];
                this.results = response.data.result;
            });
        };
    }
});