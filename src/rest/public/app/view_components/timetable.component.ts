/**
 * Created by jerome on 2017-03-30.
 */

import {Component, Input} from "@angular/core";

@Component({
    selector: 'timetable',
    template: `
<table class="table table-hover">
    <thead>
        <tr>
            <th>Block</th>
            <th>Course</th>
            <th>Seats</th>
        </tr>
    </thead>
    <tbody>
        <tr *ngFor="let block of getScheduleBlocks();">
            <td>{{ describeScheduleBlock(block) }}</td>
            <td>{{ schedule.get(block).name }}</td>
            <td>{{ schedule.get(block).seats }}</td>
        </tr>
    </tbody>
</table>`
})
export class TimetableComponent {
    @Input()
    schedule: Map<number, any>;

    getScheduleBlocks(): number[] {
        return [...this.schedule.keys()];
    }

    describeScheduleBlock(block: number): string {
        switch (block) {
            case 0:
                return "MWF 8:00 - 9:00";
            case 1:
                return "MWF 9:00 - 10:00";
            case 2:
                return "MWF 10:00 - 11:00";
            case 3:
                return "MWF 11:00 - 12:00";
            case 4:
                return "MWF 12:00 - 13:00";
            case 5:
                return "MWF 13:00 - 14:00";
            case 6:
                return "MWF 14:00 - 15:00";
            case 7:
                return "MWF 15:00 - 16:00";
            case 8:
                return "MWF 16:00 - 17:00";
            case 9:
                return "TT 8:00 - 8:30";
            case 10:
                return "TT 8:30 - 10:00";
            case 11:
                return "TT 10:00 - 11:30";
            case 12:
                return "TT 11:30 - 13:00";
            case 13:
                return "TT 13:00 - 14:30";
            case 14:
                return "TT 14:30 - 16:00";
        }
    }
}