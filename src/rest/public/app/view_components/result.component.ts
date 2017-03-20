import {Component, Input } from '@angular/core';

@Component({
    selector: 'query-results',
    template: `
<div class="row">
    <table class="table table-hover">
        <thead>
            <tr>
                <th *ngFor="let column of visibleColumns();">{{column}}</th>
            </tr>
        </thead>
        <tbody>
            <tr *ngFor="let result of results;">
                <th *ngFor="let column of visibleColumns();">{{result[column]}}</th>
            </tr>
        </tbody>
    </table>
</div>
`
})
export class ResultComponent {
    @Input()
    columns: any;
    @Input()
    results: any[];

    visibleColumns(): string[] {
        return this.columns.filter((item: any) => {
            return item.value;
        }).map((item: any) => {
            return item.name;
        });
    }
}


