/**
 * Created by Jnani on 3/18/17.
 */
import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ModalComponent }   from './modal/modal.component';
import { CoursesComponent } from './views/courses.component';
import { RoomsComponent }   from './views/rooms.component';
import { ScheduleComponent }   from './views/schedule.component';

const routes: Routes = [
    { path: '', redirectTo: '/courses', pathMatch: 'full' },
    { path: 'courses',  component: CoursesComponent },
    { path: 'rooms',  component: RoomsComponent },
    { path: 'schedule', component: ScheduleComponent }
];

@NgModule({
    imports: [ RouterModule.forRoot(routes) ],
    exports: [ RouterModule ]
})
export class RoutingModule {}