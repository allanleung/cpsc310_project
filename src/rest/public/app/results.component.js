angular.module('app').component('results', {
    template: `
<table class="table table-hover">
    <thead>
    <tr>
        <th ng-repeat="key in $ctrl.keys">{{key}}</th>
    </tr>
    </thead>
    <tbody>
    <tr ng-repeat="result in $ctrl.results">
        <th ng-repeat="key in $ctrl.keys">{{result[key]}}</th>
    </tr>
    </tbody>
</table>
`, controller: function ResultListController($scope, $http) {
        this.keys = [
            "courses_dept",
            "courses_id",
            "courses_avg",
            "courses_instructor",
            "courses_title",
            "courses_pass",
            "courses_fail",
            "courses_audit",
            "courses_uuid",
            "courses_year"
        ];

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
                "COLUMNS": this.keys,
                "ORDER": {
                    "dir": "UP",
                    "keys": ["courses_dept", "courses_id"]
                },
                "FORM": "TABLE"
            }
        }, {}).then((response) => {
            console.log(response);
            this.results = response.data.result;
        });
    }
});