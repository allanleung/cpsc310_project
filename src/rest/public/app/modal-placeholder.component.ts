import {Component, ViewChild, OnInit, ViewContainerRef} from "@angular/core";
import {ModalService} from "./modal.service";

@Component({
    selector: "modal-placeholder",
    template: `<template #placeholder></template>`
})
export class ModalPlaceholderComponent implements OnInit {
    @ViewChild("placeholder", { read: ViewContainerRef })
    viewContainerRef: ViewContainerRef;

    constructor(private modalService: ModalService) { }

    ngOnInit(): void {
        this.modalService.registerViewContainer(this.viewContainerRef);
    }
}