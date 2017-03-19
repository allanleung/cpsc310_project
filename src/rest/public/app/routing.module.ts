/**
 * Created by Jnani on 3/18/17.
 */
import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent }   from './app.component';
import { CoursesComponent } from './courses.component';
import { RoomsComponent }   from './rooms.component';

const routes: Routes = [
    // { path: '', redirectTo: '/courses', pathMatch: 'full' },
    { path: '',  component: CoursesComponent },
    { path: 'courses',  component: CoursesComponent },
    { path: 'rooms',  component: RoomsComponent }
];

@NgModule({
    imports: [ RouterModule.forRoot(routes) ],
    exports: [ RouterModule ]
})
export class RoutingModule {}