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
      <a class="navbar-brand" href="#">insight UBC</a>
    </div>

    <!-- Collect the nav links, forms, and other content for toggling -->
    <div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
      <ul class="nav navbar-nav">
        <li><a routerLink="/courses" routerLinkActive="active">Link</a></li>
        <li><a routerLink="/rooms" routerLinkActive="active">Link</a></li>
      </ul>
    </div>
  </div>
</nav>

<router-outlet></router-outlet>
`
})
export class AppComponent {

}


