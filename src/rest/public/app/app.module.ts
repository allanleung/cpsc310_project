import { NgModule }      from '@angular/core';
import { HttpModule } from "@angular/http";
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent }  from './app.component';
import { QueryService } from "./query.service";

@NgModule({
    imports:      [ BrowserModule, HttpModule ],
    declarations: [ AppComponent ],
    bootstrap:    [ AppComponent ],
    providers: [ QueryService ]
})
export class AppModule { }