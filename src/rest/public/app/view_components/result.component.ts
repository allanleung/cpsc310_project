import {Component, Input } from '@angular/core';

@Component({
    selector: 'query-results',
    styles: [
        'th { font-size: 13px; }',
        'td { word-break: break-word; }'
    ],
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
                <td *ngFor="let column of visibleColumns();">{{result[column]}}</td>
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


