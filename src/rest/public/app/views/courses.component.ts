import { Component }    from '@angular/core';

import { QueryService } from '../query.service';
import { ModalService } from "../modal/modal.service";
import { ModalComponent } from '../modal/modal.component';

@Component({
    selector: 'courses',
    template: `
<div class="row">
    <div class="col-md-4">
        <h3>Select Columns</h3>
        <column-selector [columns]="columns"></column-selector>
    </div>

    <div class="col-md-4">
        <h3>Order By</h3>
        <order-selector [order]="order"></order-selector>
    </div>

    <div class="col-md-4">
        <h3>Filters</h3>
        <filter-selector [filterJunction]="filterJunction" [filters]="filters"></filter-selector>
    </div>
</div>

<div class="row">
    <button type="button" class="btn btn-primary" (click)="query()">Query</button>
</div>

<query-results [columns]="columns" [results]="results"></query-results>
`
})
export class CoursesComponent {
    columns: any[];
    order: any;
    filterJunction: string;
    filters: any[];
    results: any[];

    constructor (private queryService: QueryService, private modalService: ModalService) {
        this.order = {
            dir: "UP",
            keys: [
                { 
                    name: "courses_avg",
                    value: true
                },
                { 
                    name: "courses_pass",
                    value: false
                },
                { 
                    name: "courses_fail",
                    value: false
                }
            ]
        };

        this.columns = [
            {
                name: "courses_dept",
                value: true
            },
            {
                name: "courses_id",
                value: true
            },
            {
                name: "courses_avg",
                value: true
            },
            {
                name: "courses_instructor",
                value: true
            },
            {
                name: "courses_title",
                value: true
            },
            {
                name: "courses_pass",
                value: true
            },
            {
                name: "courses_fail",
                value: true
            },
            {
                name: "courses_audit",
                value: true
            },
            {
                name: "courses_uuid",
                value: true
            },
            {
                name: "courses_year",
                value: true
            }
        ];

        this.filterJunction = "AND";

        this.filters = [
            {
                name: "courses_instructor",
                type: "string",
                comparator: "",
                value: ""
            },
            {
                name: "courses_title",
                type: "string",
                comparator: "",
                value: ""
            },
            {
                name: "courses_dept",
                type: "string",
                comparator: "",
                value: ""
            },
            {
                name: "courses_pass",
                type: "number",
                comparator: "",
                value: ""
            },
            {
                name: "courses_fail",
                type: "number",
                comparator: "",
                value: ""
            }
        ];

        this.results = [];
    }

    query(): void {
        let query: any;
        try {
            query = this.queryService.compose(this.filters, this.filterJunction, this.columns, this.order);

            // query.TRANSFORMATIONS = {
            //     "GROUP": ["courses_dept", "courses_id"],
            //     "APPLY": []
            // };
        } catch(error) {
            this.modalService.create(ModalComponent, {
                title: "Query Error",
                body: error
            });

            return;
        }

        this.queryService
            .search(query)
            .then(results => {
                this.results = results.result;

                if (this.results.length === 0) {
                    this.modalService.create(ModalComponent, {
                        title: "Query",
                        body: "No results found"
                    });
                }
            }).catch(error => {
                this.modalService.create(ModalComponent, {
                    title: "Query Error",
                    body: error._body
                });
            });
    }
}


