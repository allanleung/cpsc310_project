import {getElementsByAttrs, promisify, geoUrlPrefix} from "./IInsightFacade";
import * as parse5 from 'parse5';

type GeoResponse = GeoResponseLatLon | GeoResponseError;

interface GeoResponseLatLon {
    lat: number,
    lon: number
}

interface GeoResponseError {
    error: string
}

/*function isGeoResponseLatLon(response: GeoResponse): response is GeoResponseLatLon {
    return typeof (<GeoResponseLatLon>response).lat === 'number'
        && typeof (<GeoResponseLatLon>response).lon === 'number'
}*/

function isGeoResponseError(response: GeoResponse): response is GeoResponseError {
    return typeof (<GeoResponseError>response).error === 'string'
}

export function parseRoomsZip (zip: JSZip): Promise<any[]> {
    const indexFile = zip.file('index.htm');

    return indexFile.async("string").then(data => {
        const links = parseRoomsIndex(data);

        const promises: Promise<any[]>[] = [];

        for (let link of links) {
            promises.push(zip.file(link.substring(2)).async('string').then(parseRoomsFile));
        }

        return Promise.all(promises).then(data => {
            const allItems: any[] = [];

            for (let item of data) {
                allItems.push(...item);
            }

            return allItems;
        })
    })
}

function parseRoomsIndex (data: string): string[] {
    const document: parse5.AST.Default.Document = parse5.parse(data) as parse5.AST.Default.Document;

    const buildings = getElementsByAttrs(document, [
        {
            name: "class",
            value: "^(odd|even).*"
        }
    ]);

    return buildings.map(node => {
        const linkNode = getElementsByAttrs(node, [
            {
                name: "href",
                value: ".*"
            }
        ]);

        return extractHREF(linkNode[0])
    })
}

function extractHREF(node: parse5.AST.Default.Element): string {
    for (let attr of node.attrs) {
        if (attr.name === 'href') {
            return attr.value
        }
    }

    throw new Error("Failed to find href");
}

export function parseRoomsFile (data: string): Promise<any[]> {
    let buildingDocument: parse5.AST.Default.Document = parse5.parse(data) as parse5.AST.Default.Document;
    let canonicalName = getElementsByAttrs(buildingDocument, [
        {
            name: "rel",
            value: "canonical"
        }
    ]);

    let buildings = getElementsByAttrs(buildingDocument, [
        {
            name: "id",
            value: "^buildings-wrapper$"
        }
    ]);
    let buildingInfo = getElementsByAttrs(buildings[0], [
        {
            name: "class",
            value: "^field-content$"
        }
    ]);

    let classrooms = getElementsByAttrs(buildingDocument, [
        {
            name: "class",
            value: "^view view-buildings-and-classrooms view-id-buildings_and_classrooms .*"
        }
    ]);

    let rooms = getElementsByAttrs(classrooms[0], [
        {
            name: "class",
            value: "^(odd|even).*"
        }
    ]);

    return Promise.all(rooms.map(room => {
        const fields = getElementsByAttrs(room, [
            {
                name: "class",
                value: "^views-field .*"
            }
        ]);

        const rooms_shortname = canonicalName[0].attrs[1].value;
        const rooms_number = (<parse5.AST.Default.TextNode>(<parse5.AST.Default.Element>fields[0].childNodes[1]).childNodes[0]).value.trim();
        const rooms_seats = parseInt((<parse5.AST.Default.TextNode>fields[1].childNodes[0]).value.trim());

        const rooms_name = rooms_shortname + "_" + rooms_number;

        const rooms_address = (<parse5.AST.Default.TextNode>buildingInfo[1].childNodes[0]).value;

        const url = geoUrlPrefix + encodeURI(rooms_address);

        return promisify(url).then(responseObject => {
            const response = <GeoResponse>responseObject;

            if (isGeoResponseError(response)) {
                throw new Error(response.error)
            }

            return {
                rooms_fullname: (<parse5.AST.Default.TextNode>buildingInfo[0].childNodes[0]).value,
                rooms_shortname,
                rooms_name,
                rooms_number,
                rooms_address,
                rooms_lat: response.lat,
                rooms_lon: response.lon,
                rooms_seats,
                rooms_type: (<parse5.AST.Default.TextNode>fields[3].childNodes[0]).value.trim(),
                rooms_furniture: (<parse5.AST.Default.TextNode>fields[2].childNodes[0]).value.trim(),
                rooms_href: (<parse5.AST.Default.Element>fields[0].childNodes[1]).attrs[0].value
            }
        })
    }))
}