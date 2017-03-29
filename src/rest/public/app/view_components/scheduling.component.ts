/**
 * Created by Jerome on 3/28/2017.
 */
import {Component, Input} from '@angular/core';

const SCHEDULING_BLOCKS = 15;

@Component({
    selector: 'scheduling',
    template: `
<div class="row">
    {{scheduleCourses()}}    
</div>
`
})
export class SchedulingComponent {
    @Input()
    rooms: any[];

    @Input()
    sections: any[];

    scheduleCourses(): string {
        // 15 (9 + 6) possible scheduling blocks for courses
        // we need
        // - a set of courses, constructed from courses_id + courses_dept
        //   size is the pass + fail in largest section that's not in 1900
        //   number of blocks to schedule for the course is the number of sections in 2014 / 3 rounded up
        // - mapping of rooms to their schedules

        // we need to keep around
        // - a set of schedule blocks for each room
        // - a set of schedule blocks for each courses_id + courses_dept
        // - a list of scheduled courses
        // Create a mapping from seat count to rooms
        // For each section, ascent the seat count mapping from the closest match up
        //   for each room that's big enough, go through the available scheduling blocks
        //     if the scheduling block is available for the courses_id + courses_dept,
        //       select this scheduling block, update everything above and add the course to the scheduled courses

        // rooms to their schedule of blocks to sections
        const schedules = new Map<any, Map<number, string>>();

        // seats to list of rooms
        const capacities = new Map<number, any[]>();

        // courses_dept + " " + courses_id to number of seats and blocks needed
        const courses = new Map<string, {seats: number, section_count: number}>();

        // first create the mapping of seat count to room list
        for (let room of this.rooms) {
            const seats: number = room.rooms_seats;

            if (!capacities.has(seats)) {
                capacities.set(seats, [])
            }

            capacities.get(seats).push(room)
        }

        // get a list of available seating options
        const seating_options = [...capacities.keys()].sort((a, b) => a - b);

        for (let section of this.sections) {
            if (section.courses_year === 1900) {
                continue;
            }

            const course_key = section.courses_dept + " " + section.courses_id;

            if (!courses.has(course_key)) {
                courses.set(course_key, {seats: 0, section_count: 0});
            }

            const course = courses.get(course_key);
            if (section.courses_year === 2014) {
                course.section_count++;
            }

            course.seats = Math.max(course.seats, section.courses_pass + section.courses_fail);
        }

        let total_blocks = 0;
        let failed_blocks = 0;

        for (let course_key of courses.keys()) {
            const course = courses.get(course_key);
            const conflicts = new Set<number>();
            let blocks_left = Math.ceil(course.section_count / 3);
            total_blocks += blocks_left;

            for (let option of seating_options) {
                if (option < course.seats) {
                    continue;
                }

                for (let room of capacities.get(option)) {
                    if (!schedules.has(room)) {
                        schedules.set(room, new Map());
                    }

                    const schedule = schedules.get(room);

                    for (let block = 0; block < SCHEDULING_BLOCKS; block++) {
                        if (schedule.has(block)) {
                            continue;
                        }

                        if (conflicts.has(block)) {
                            continue;
                        }

                        // we've found a block that works!
                        schedule.set(block, course_key);
                        conflicts.add(block);
                        blocks_left--;

                        if (blocks_left === 0) {
                            break;
                        }
                    }
                }

                if (blocks_left === 0) {
                    // done!
                    break;
                }
            }

            failed_blocks += blocks_left;
        }

        return "Total blocks: " + total_blocks + " Failed blocks: " + failed_blocks;
    }
}