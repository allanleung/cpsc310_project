import {Component, Input } from '@angular/core';

@Component({
    selector: 'rooms-map',
    template: `
<sebm-google-map [latitude]="49.2606" [longitude]="-123.2460" [zoom]="14">
    <ng-container *ngFor="let room of uniqueRooms()">
        <sebm-google-map-marker *ngIf="room.rooms_lat && room.rooms_lon" [latitude]="room.rooms_lat" [longitude]="room.rooms_lon">
            <sebm-google-map-info-window>
                <strong *ngIf="room.rooms_fullname && room.rooms_shortname">{{room.rooms_fullname}} ({{room.rooms_shortname}})</strong>
                <p *ngIf="room.rooms_address">{{room.rooms_address}}</p>
                <p>{{room.rooms_lat}}, {{room.rooms_lon}}</p>
            </sebm-google-map-info-window>
        </sebm-google-map-marker>
    </ng-container>
</sebm-google-map>
`
})
export class RoomsMapComponent
{
    @Input()
    rooms: any[];

    uniqueRooms(): any[] {
        var seen = {};
        return this.rooms.filter((room) => {
            let key = JSON.stringify({
                rooms_lat: room.rooms_lat,
                rooms_lon: room.rooms_lon
            });
            return seen.hasOwnProperty(key) ? false : (seen[key] = true);
        });
    }
}


