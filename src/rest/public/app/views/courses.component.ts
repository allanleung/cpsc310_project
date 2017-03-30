import { Component }    from '@angular/core';

@Component({
    selector: 'courses',
    template: `
<div>
  <!-- Nav tabs -->
  <ul class="nav nav-tabs" role="tablist">
    <li role="presentation" class="active"><a href="#courses" aria-controls="courses" role="tab" data-toggle="tab">Courses</a></li>
    <li role="presentation"><a href="#sections" aria-controls="sections" role="tab" data-toggle="tab">Sections</a></li>
  </ul>

  <!-- Tab panes -->
  <div class="tab-content">
    <div role="tabpanel" class="tab-pane active" id="courses">
        <courses-pane></courses-pane>    
    </div>
    
    <div role="tabpanel" class="tab-pane" id="sections">
        <section-pane></section-pane>
    </div>
  </div>
</div>
`
})
export class CoursesComponent {
}


