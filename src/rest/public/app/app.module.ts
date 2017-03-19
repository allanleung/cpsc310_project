import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule }   from "@angular/http";
import { FormsModule }  from "@angular/forms";

import { AppComponent } from './app.component';
import { ResultComponent } from './result.component';
import { CoursesComponent } from './courses.component';
import { RoomsComponent } from './rooms.component';
import { QueryService } from "./query.service";

import { RoutingModule }    from './routing.module';

@NgModule({
    imports:      [
        BrowserModule,
        FormsModule,
        HttpModule,
        RoutingModule
    ],
    declarations: [ 
        AppComponent,
        CoursesComponent,
        RoomsComponent,
        ResultComponent
    ],
    bootstrap: [
        AppComponent
    ],
    providers: [ 
        QueryService
    ]
})
export class AppModule { }