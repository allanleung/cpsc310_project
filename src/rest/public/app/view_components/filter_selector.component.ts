import {Component, Input, OnInit, AfterContentInit, EventEmitter, Output} from '@angular/core';

@Component({
    selector: 'filter-selector',
    template: `
<select class="form-control" [(ngModel)]="filterJunction">
    <option>AND</option>
    <option>OR</option>
</select>
<div *ngFor="let filter of filters;"class="form-group">
    <label>{{filter.name}}</label>
    <div class="row">
        <div class="col-md-8">
            <input class="form-control" [(ngModel)]="filter.value">
        </div>
        <div class="col-md-4">
            <select class="form-control" [(ngModel)]="filter.comparator">
            <option *ngFor="let comparator of comparators(filter.type);">{{comparator}}</option>
            </select>
        </div>
    </div>
</div>
`
})
export class FilterSelectorComponent extends OnInit {
    @Input()
    filterJunction: string;
    @Input()
    filters: any[];

    ngOnInit(): void {
        // <option *ngFor> doesn't like to cooperate during the initial render
        this.filters.forEach((filter: any) => {
            filter.comparator = this.comparators(filter.type)[0];
        });
    }

    comparators(type: string): string[] {
        if (type === "string") {
            return [ "IS" ]
        } else if (type === "location") {
            return [ "IN", "OUT" ]
        }

        return [ "LT", "EQ", "GT" ];
    }
}


