import { Component, Input } from '@angular/core';

@Component({
    selector: 'column-selector',
    template: `
<ul class="unstyled">
    <li *ngFor="let column of columns;">
        <label class="checkbox">
            <input [(ngModel)]="column.value" type="checkbox">
            <span>{{column.name}}</span>
        </label>
    </li>
</ul>
`
})
export class ColumnSelectorComponent {
    @Input()
    columns: any[];
}


