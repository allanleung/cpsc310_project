import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule }   from "@angular/http";
import { FormsModule }  from "@angular/forms";

import { AppComponent } from './app.component';
import { ModalComponent } from './modal/modal.component';
import { ResultComponent } from './result.component';
import { CoursesComponent } from './courses.component';
import { RoomsComponent } from './rooms.component';
import { ScheduleComponent } from './schedule.component';

import { QueryService } from "./query.service";

import { RoutingModule }    from './routing.module';
import { ModalService} from "./modal/modal.service";
import { ModalPlaceholderComponent } from "./modal/modal-placeholder.component";

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
        RoomsComponent,
        ScheduleComponent
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