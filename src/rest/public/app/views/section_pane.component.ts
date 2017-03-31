import { Component }    from '@angular/core';

import { QueryService } from '../query.service';
import { ModalService } from "../modal/modal.service";
import { ModalComponent } from '../modal/modal.component';

@Component({
    selector: 'section-pane',
    template: `
<div class="row">
    <div class="col-md-6">
        <h3>Order By</h3>
        <order-selector [order]="order"></order-selector>
    </div>

    <div class="col-md-6">
        <h3>Filters</h3>
        <filter-selector [filterJunction]="filterJunction" [filters]="filters"></filter-selector>
    </div>
</div>
        
<div class="row">
    <button type="button" class="btn btn-primary btn-lg btn-block" (click)="query()">Query</button>
</div>
        
<hr>

<query-results [columns]="columns" [results]="results"></query-results>
`
})
export class SectionPaneComponent {
    columns: any[];
    order: any;

    filterJunction: string;
    filters: any[];

    section_results: any[];
    results: any[];

    constructor (private queryService: QueryService, private modalService: ModalService) {
        this.order = {
            dir: "UP",
            keys: [
                {
                    name: "sections",
                    value: true
                },
                {
                    name: "courses_dept",
                    value: false
                },
                {
                    name: "courses_id",
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
                name: "courses_title",
                value: true
            },
            {
                name: "sections",
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
        this.section_results = [];
    }

    query(): void {
        let query: any;
        try {
            query = this.queryService.compose(this.filters, this.filterJunction, this.columns, this.order);

            query.TRANSFORMATIONS = {
                "GROUP": this.columns.filter((item: any) => {
                    debugger;
                    return item.value && item.name.includes("_");
                }).map((item: any) => {
                    return item.name;
                }),
                "APPLY": [
                    {
                        "sections": {
                            "COUNT": "courses_uuid"
                        }
                    }
                ]
            }
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


