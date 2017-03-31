import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule }   from "@angular/http";
import { FormsModule }  from "@angular/forms";
import { AgmCoreModule } from 'angular2-google-maps/core';

import { AppComponent } from './app.component';
import { ModalComponent } from './modal/modal.component';
import { ResultComponent } from './view_components/result.component';
import { ColumnSelectorComponent } from './view_components/column_selector.component';
import { OrderSelectorComponent } from './view_components/order_selector.component';
import { FilterSelectorComponent } from "./view_components/filter_selector.component";
import { TimetableComponent } from "./view_components/timetable.component";
import { RoomsMapComponent } from "./view_components/rooms_map.component";

import { CoursesComponent } from './views/courses.component';
import { RoomsComponent } from './views/rooms.component';
import { ScheduleComponent } from './views/schedule.component';

import { CoursesPaneComponent } from './views/courses_pane.component';
import { SectionPaneComponent } from './views/section_pane.component';

import { QueryService } from "./query.service";

import { RoutingModule }    from './routing.module';
import { ModalService} from "./modal/modal.service";
import { ModalPlaceholderComponent } from "./modal/modal-placeholder.component";

@NgModule({
    imports:      [
        BrowserModule,
        FormsModule,
        HttpModule,
        RoutingModule,
        AgmCoreModule.forRoot({
            apiKey: 'AIzaSyDcKrCx76jtmQSmRooS2o8HLwhS0arNOZU'
        })
    ],
    declarations: [ 
        AppComponent,
        ModalPlaceholderComponent,
        ModalComponent,

        ResultComponent,
        ColumnSelectorComponent,
        OrderSelectorComponent,
        FilterSelectorComponent,
        TimetableComponent,
        RoomsMapComponent,

        CoursesPaneComponent,
        SectionPaneComponent,

        CoursesComponent,
        RoomsComponent,
        ScheduleComponent
    ],
    entryComponents: [
        ModalComponent
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