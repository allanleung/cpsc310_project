import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'order-selector',
    template: `
<select class="form-control" [(ngModel)]="order.dir">
    <option>UP</option>
    <option>DOWN</option>
</select>
<ol class="unstyled">
    <li *ngFor="let item of order.keys">
        <label class="checkbox">
        <input [(ngModel)]="item.value" type="checkbox" (change)="orderKeys()">
        <span>{{item.name}}</span>
        </label>
    </li>
</ol>
`
})
export class OrderSelectorComponent extends OnInit {
    @Input()
    order: any;

    ngOnInit(): void {
        // Make sure keys are actually ordered.
        this.orderKeys();
    }
    
    orderKeys() {
        this.order.keys = [...this.order.keys.filter((item: any) => {
            return item.value;
        }), ...this.order.keys.filter((item: any) => {
            return !item.value;
        })];
    }
}


