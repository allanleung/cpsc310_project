import {Component} from '@angular/core';

import { QueryService } from '../query.service';
import { ModalService } from "../modal/modal.service";
import { ModalComponent } from "../modal/modal.component";
import { GeoPoint } from "../models/GeoPoint";

const SCHEDULING_BLOCKS = 15;

@Component({
    selector: 'schedule',
    template: `
<div class="row">
    <!-- Rooms -->

    <!--<div class="col-md-3">-->
        <!--<h3>Rooms Order By</h3>-->
        <!--<order-selector [order]="rooms_order"></order-selector>-->
    <!--</div>-->

    <div class="col-md-6">
        <h3>Rooms Filters</h3>
        <filter-selector [filterJunction]="rooms_filterJunction" [filters]="rooms_filters"></filter-selector>
    </div>
    
    <!-- Courses -->
    
    <!--<div class="col-md-3">-->
        <!--<h3>Courses Order By</h3>-->
        <!--<order-selector [order]="courses_order"></order-selector>-->
    <!--</div>-->

    <div class="col-md-6">
        <h3>Courses Filters</h3>
        <filter-selector [filterJunction]="courses_filterJunction" [filters]="courses_filters"></filter-selector>
    </div>
</div>

<div class="row">
    <button type="button" class="btn btn-primary btn-lg btn-block" (click)="query()">Query</button>
</div>

<hr>

<div class="row">
    <rooms-map [rooms]="getScheduleRooms()"></rooms-map>

    <h3>Schedule quality: {{describeScheduleQuality()}}</h3>
    <table class="table table-hover">
        <thead>
            <tr>
                <th>Room</th>
                <th>Seats</th>
                <th>Blocks</th>
            </tr>
        </thead>
        <tbody>
            <tr *ngFor="let room of getScheduleRooms();">
                <td>{{ room.rooms_name }}</td>
                <td>{{ room.rooms_seats }}</td>
                <td><timetable [schedule]="schedules.get(room)"></timetable></td>
            </tr>
        </tbody>
    </table>
</div>
`
})
export class ScheduleComponent {
    rooms_columns: any;
    rooms_order: any;
    rooms_filterJunction: string;
    rooms_filters: any[];

    courses_columns: any;
    courses_order: any;
    courses_filterJunction: string;
    courses_filters: any[];

    schedules = new Map<any, Map<number, any>>();

    quality = 0;

    constructor (private queryService: QueryService, private modalService: ModalService) {
        this.rooms_columns = [
            {
                name: "rooms_fullname",
                value: true
            },
            {
                name: "rooms_shortname",
                value: true
            },
            {
                name: "rooms_name",
                value: true
            },
            {
                name: "rooms_number",
                value: true
            },
            {
                name: "rooms_address",
                value: true
            },
            {
                name: "rooms_lat",
                value: true
            },
            {
                name: "rooms_lon",
                value: true
            },
            {
                name: "rooms_seats",
                value: true
            },
            {
                name: "rooms_type",
                value: true
            },
            {
                name: "rooms_furniture",
                value: true
            },
            {
                name: "rooms_href",
                value: true
            }
        ];

        this.rooms_order = {
            dir: "UP",
            keys: [
                {
                    name: "rooms_seats",
                    value: true
                },
                {
                    name: "rooms_name",
                    value: false
                }
            ]
        };

        this.rooms_filterJunction = "AND";

        this.rooms_filters = [
            {
                name: "rooms_fullname",
                type: "string",
                comparator: "",
                value: ""
            },
            {
                name: "rooms_shortname",
                type: "string",
                comparator: "",
                value: ""
            },
            {
                name: "location_distance (lat,lon,dist)",
                type: "location",
                comparator: "",
                value: "",
                template: (self: any) => {
                    if (self.value.split(',').length !== 3) {
                        throw "Invalid data format for " + self.name;
                    }

                    let lat: number = parseFloat(self.value.split(',')[0]);
                    let lon: number = parseFloat(self.value.split(',')[1]);
                    let dist: number = parseFloat(self.value.split(',')[2])/1000;

                    if (isNaN(lat) || isNaN(lon) || isNaN(dist)) {
                        throw "Invalid data type for " + self.name;
                    }

                    let point = new GeoPoint(lat, lon, false);
                    let boundingBox = point.boundingCoordinates(dist, 0, true);

                    let boxQuery: any = {
                        "AND": [
                            {
                                "GT": {
                                    "rooms_lat": boundingBox[0].degLat
                                }
                            },
                            {
                                "LT": {
                                    "rooms_lat": boundingBox[1].degLat
                                }
                            },
                            {
                                "LT": {
                                    "rooms_lon": boundingBox[1].degLon
                                }
                            },
                            {
                                "GT": {
                                    "rooms_lon": boundingBox[0].degLon
                                }
                            }
                        ]
                    };

                    if (self.comparator === "OUT") {
                        boxQuery = {
                            "NOT": boxQuery
                        }
                    }

                    return boxQuery;
                }
            }
        ];

        this.courses_order = {
            dir: "UP",
            keys: [
                {
                    name: "courses_id",
                    value: true
                },
                {
                    name: "courses_pass",
                    value: false
                },
                {
                    name: "courses_fail",
                    value: false
                }
            ]
        };

        this.courses_columns = [
            {
                name: "courses_dept",
                value: true
            },
            {
                name: "courses_id",
                value: true
            },
            {
                name: "courses_avg",
                value: true
            },
            {
                name: "courses_instructor",
                value: true
            },
            {
                name: "courses_title",
                value: true
            },
            {
                name: "courses_pass",
                value: true
            },
            {
                name: "courses_fail",
                value: true
            },
            {
                name: "courses_audit",
                value: true
            },
            {
                name: "courses_uuid",
                value: true
            },
            {
                name: "courses_year",
                value: true
            }
        ];

        this.courses_filterJunction = "AND";

        this.courses_filters = [
            {
                name: "courses_dept",
                type: "string",
                comparator: "",
                value: ""
            },
            {
                name: "courses_id",
                type: "string",
                comparator: "",
                value: ""
            }
        ];
    }

    getRoomBlocks(room: any): number[] {
        return [...this.schedules.get(room).keys()];
    }

    getScheduleRooms(): any[] {
        return [...this.schedules.keys()];
    }

    describeScheduleQuality(): string {
        return "" + Math.round(100 * this.quality) + "%";
    }

    query(): void {
        let rooms_query: any;
        let courses_query: any;

        try {
            rooms_query = this.queryService.compose(this.rooms_filters, this.rooms_filterJunction, this.rooms_columns, this.rooms_order);
            courses_query = this.queryService.compose(this.courses_filters, this.courses_filterJunction, this.courses_columns, this.courses_order);
        } catch(error) {
            this.modalService.create(ModalComponent, {
                title: "Query Error",
                body: error
            });

            return;
        }

        Promise.all([
            this.queryService.search(rooms_query),
            this.queryService.search(courses_query)
        ]).then(results => {
            const rooms_results = results[0].result;
            const courses_results = results[1].result;

            if (rooms_results.length === 0 || courses_results.length === 0) {
                this.modalService.create(ModalComponent, {
                    title: "Query Error",
                    body: "No results found"
                });
            } else {
                this.scheduleCourses(courses_results, rooms_results);
            }
        }).catch(error => {
            this.modalService.create(ModalComponent, {
                title: "Query Error",
                body: error._body
            });
        });
    }

    scheduleCourses(sections: any[], rooms: any[]) {
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
        this.schedules.clear();

        // seats to list of rooms
        const capacities = new Map<number, any[]>();

        // courses_dept + " " + courses_id to number of seats and blocks needed
        const courses = new Map<string, {seats: number, section_count: number, name: string}>();

        // first create the mapping of seat count to room list
        for (let room of rooms) {
            const seats: number = room.rooms_seats;

            if (!capacities.has(seats)) {
                capacities.set(seats, [])
            }

            capacities.get(seats).push(room)
        }

        // get a list of available seating options
        const seating_options = [...capacities.keys()].sort((a, b) => a - b);

        for (let section of sections) {
            if (section.courses_year === 1900) {
                continue;
            }

            const course_key = section.courses_dept + " " + section.courses_id;

            if (!courses.has(course_key)) {
                courses.set(course_key, {seats: 0, section_count: 0, name: course_key});
            }

            const course = courses.get(course_key);
            if (section.courses_year === 2014) {
                course.section_count++;
            }

            course.seats = Math.max(course.seats, section.courses_pass + section.courses_fail);
        }

        let total_blocks = 0;
        let failed_blocks = 0;

        for (let course_key of [...courses.keys()].sort((a, b) => {
            return courses.get(b).seats - courses.get(a).seats;
        })) {
            const course = courses.get(course_key);
            // skip courses without any sections
            if (course.section_count === 0) continue;

            const conflicts = new Set<number>();
            let blocks_left = Math.ceil(course.section_count / 3);
            total_blocks += blocks_left;

            for (let option of seating_options) {
                if (option < course.seats) {
                    continue;
                }

                for (let room of capacities.get(option)) {
                    if (!this.schedules.has(room)) {
                        this.schedules.set(room, new Map());
                    }

                    const schedule = this.schedules.get(room);

                    for (let block = 0; block < SCHEDULING_BLOCKS; block++) {
                        if (schedule.has(block)) {
                            continue;
                        }

                        if (conflicts.has(block)) {
                            continue;
                        }

                        // we've found a block that works!
                        schedule.set(block, course);
                        conflicts.add(block);
                        blocks_left--;

                        if (blocks_left === 0) {
                            break;
                        }
                    }

                    if (blocks_left === 0)
                        break;
                }

                if (blocks_left === 0) {
                    // done!
                    break;
                }
            }

            failed_blocks += blocks_left;
        }

        this.quality = 1 - (failed_blocks / total_blocks);
    }
}


