import { Component } from '@angular/core';

@Component({
    selector: 'my-app',
    template: `
<nav class="navbar navbar-default">
  <div class="container-fluid">
    <!-- Brand and toggle get grouped for better mobile display -->
    <div class="navbar-header">
      <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1" aria-expanded="false">
        <span class="sr-only">Toggle navigation</span>
        <span class="icon-bar"></span>
        <span class="icon-bar"></span>
        <span class="icon-bar"></span>
      </button>
      <a class="navbar-brand" href="#">insightUBC</a>
    </div>

    <!-- Collect the nav links, forms, and other content for toggling -->
    <div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
      <ul class="nav navbar-nav">
        <li routerLinkActive="active"><a routerLink="/courses">Course Explorer</a></li>
        <li routerLinkActive="active"><a routerLink="/rooms">Room Explorer</a></li>
        <li routerLinkActive="active"><a routerLink="/schedule">Room Scheduling</a></li>
      </ul>
    </div>
  </div>
</nav>

<!-- Outlet for default router components -->
<router-outlet></router-outlet>

<!-- Placeholder for modal views -->
<modal-placeholder></modal-placeholder>
`
})
export class AppComponent {

}


