import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule }   from "@angular/http";
import { FormsModule }  from "@angular/forms";

import { AppComponent } from './app.component';
import { ModalComponent } from './modal.component';
import { ResultComponent } from './result.component';
import { CoursesComponent } from './courses.component';
import { RoomsComponent } from './rooms.component';
import { QueryService } from "./query.service";

import { RoutingModule }    from './routing.module';
import {ModalService} from "./modal.service";
import {ModalPlaceholderComponent} from "./modal-placeholder.component";

@NgModule({
    imports:      [
        BrowserModule,
        FormsModule,
        HttpModule,
        RoutingModule
    ],
    declarations: [ 
        AppComponent,
        ModalPlaceholderComponent,
        ModalComponent,
        ResultComponent,
        CoursesComponent,
        RoomsComponent
    ],
    bootstrap: [
        AppComponent
    ],
    providers: [ 
        QueryService,
        ModalService
    ]
})
export class AppModule { }