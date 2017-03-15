import {getElementsByAttrs, requestPromise, geoUrlPrefix, flattenData} from "./IInsightFacade";
import * as parse5 from 'parse5';

const INDEX_PATH = 'index.htm';

type GeoResponse = GeoResponseLatLon | GeoResponseError;

interface GeoResponseLatLon {
    lat: number,
    lon: number
}

interface GeoResponseError {
    error: string
}

interface PartialRoomsInfo {
    rooms_shortname: string,
    rooms_fullname: string,
    rooms_address: string
}

function isGeoResponseError(response: GeoResponse): response is GeoResponseError {
    return typeof (<GeoResponseError>response).error === 'string'
}

export function parseRoomsZip (zip: JSZip): Promise<any[]> {
    const roomsIndex = zip.file(INDEX_PATH);

    return roomsIndex.async('string').then(index => {
        const buildings = extractBuildings(index);

        const promises = buildings.map(buildingLink => readAndParseBuilding(zip, buildingLink));

        return Promise.all(promises).then(flattenData)
    })
}

export function parseBuilding(building: string): Promise<any[]> {
    const buildingDocument = parse5.parse(building) as parse5.AST.Default.Document;

    const canonicalName = getElementsByAttrs(buildingDocument, [
        {
            name: "rel",
            value: "canonical"
        }
    ]);

    const rooms = getElementsByAttrs(buildingDocument, [
        {
            name: "id",
            value: "^buildings-wrapper$"
        }
    ]);

    const roomsInfo = getElementsByAttrs(rooms[0], [
        {
            name: "class",
            value: "^field-content$"
        }
    ]);

    const rooms_shortname = canonicalName[0].attrs[1].value;
    const rooms_address = (<parse5.AST.Default.TextNode>roomsInfo[1].childNodes[0]).value;
    const rooms_fullname = (<parse5.AST.Default.TextNode>roomsInfo[0].childNodes[0]).value;

    const url = geoUrlPrefix + encodeURI(rooms_address);

    return Promise.resolve(requestPromise(url)).then((responseObject) => {
        const geoResponse = <GeoResponse>responseObject;

        if (isGeoResponseError(geoResponse)) {
            throw new Error(geoResponse.error)
        }

        return getRoomEntries(buildingDocument).map(room => {
            const fields = getElementsByAttrs(room, [
                {
                    name: "class",
                    value: "^views-field .*"
                }
            ]);



            return createRoomEntry(fields, geoResponse, {rooms_shortname, rooms_fullname, rooms_address});
        }).filter(entry => {
            return Object.keys(entry)
                .map(key => entry[key])
                .every(value => value !== undefined)
        });
    });
}

function extractBuildings(index: string): string[] {
    const document = parse5.parse(index) as parse5.AST.Default.Document;

    const buildings = getElementsByAttrs(document, [
        {
            name: "class",
            value: "^(odd|even).*"
        }
    ]);

    return buildings.map(child => {
        const linkAttributes = getElementsByAttrs(child, [
            {
                name: "href",
                value: ".*"
            }
        ]);

        return extractHREF(linkAttributes[0])
    })
}

function readAndParseBuilding(zip: JSZip, buildingLink: string): Promise<any[]> {
    return zip.file(linkToZipPath(buildingLink)).async('string').then(parseBuilding);
}

function getRoomEntries(buildingDocument: parse5.AST.Default.Document) : parse5.AST.Default.ParentNode[] {
    let classrooms = getElementsByAttrs(buildingDocument, [
        {
            name: "class",
            value: "^view view-buildings-and-classrooms view-id-buildings_and_classrooms .*"
        }
    ]);

    return getElementsByAttrs(classrooms[0], [
        {
            name: "class",
            value: "^(odd|even).*"
        }
    ]);
}

function createRoomEntry(fields: parse5.AST.Default.Element[], geoResponse: GeoResponseLatLon, rooms_info: PartialRoomsInfo): any {
    const {rooms_shortname, rooms_fullname, rooms_address} = rooms_info;

    const rooms_number = (<parse5.AST.Default.TextNode>(<parse5.AST.Default.Element>fields[0].childNodes[1]).childNodes[0]).value.trim();
    const rooms_seats = parseInt((<parse5.AST.Default.TextNode>fields[1].childNodes[0]).value.trim());
    const rooms_name = rooms_shortname + "_" + rooms_number;
    const rooms_type = (<parse5.AST.Default.TextNode>fields[3].childNodes[0]).value.trim();
    const rooms_furniture = (<parse5.AST.Default.TextNode>fields[2].childNodes[0]).value.trim();
    const rooms_href = (<parse5.AST.Default.Element>fields[0].childNodes[1]).attrs[0].value;
    const rooms_lat = geoResponse.lat;
    const rooms_lon = geoResponse.lon;

    return {
        rooms_fullname,
        rooms_shortname,
        rooms_name,
        rooms_number,
        rooms_address,
        rooms_lat,
        rooms_lon,
        rooms_seats,
        rooms_type,
        rooms_furniture,
        rooms_href
    }
}

function extractHREF(node: parse5.AST.Default.Element): string {
    for (let attr of node.attrs) {
        if (attr.name === 'href') {
            return attr.value
        }
    }

    throw new Error("Failed to find href");
}

function linkToZipPath(link: string): string {
    return link.substring(2);
}