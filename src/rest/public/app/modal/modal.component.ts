import {Component, Input} from '@angular/core';
import { ModalContainer } from "./modal.container";

@Component({
    selector: 'modal',
    template: `
<div class="modal fade in" tabindex="-1" role="dialog">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
        <h4 class="modal-title">{{title}}</h4>
      </div>
      <div class="modal-body">
        <p>{{body}}</p>
      </div>
      <div class="modal-footer">
        <button type="button" (click)="close()" class="btn btn-primary" data-dismiss="modal">Close</button>
      </div>
    </div>
  </div>
</div>
`
})
export class ModalComponent extends ModalContainer {
    @Input()
    title: string;
    @Input()
    body: string;
}


