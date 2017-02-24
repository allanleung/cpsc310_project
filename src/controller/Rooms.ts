import {getElementsByAttrs} from "./IInsightFacade";
import * as parse5 from 'parse5';

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

export function parseRoomsFile (data: string): any[] {
    // TODO: Move into implementation
    // TODO: Fix room number format, Lookup address

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

    return rooms.map((room) => {
        let fields = getElementsByAttrs(room, [
            {
                name: "class",
                value: "^views-field .*"
            }
        ]);

        const shortname = canonicalName[0].attrs[1].value;
        const number = (<parse5.AST.Default.TextNode>(<parse5.AST.Default.Element>fields[0].childNodes[1]).childNodes[0]).value.trim();
        const seats = parseInt((<parse5.AST.Default.TextNode>fields[1].childNodes[0]).value.trim());

        const name = shortname + "_" + number;

        return {
            rooms_fullname: (<parse5.AST.Default.TextNode>buildingInfo[0].childNodes[0]).value,
            rooms_shortname: shortname,
            rooms_name: name,
            rooms_number: number,
            rooms_address: (<parse5.AST.Default.TextNode>buildingInfo[1].childNodes[0]).value,
            rooms_lat: 'number',
            rooms_lon: 'number',
            rooms_seats: seats,
            rooms_type: (<parse5.AST.Default.TextNode>fields[3].childNodes[0]).value.trim(),
            rooms_furniture: (<parse5.AST.Default.TextNode>fields[2].childNodes[0]).value.trim(),
            rooms_href: (<parse5.AST.Default.Element>fields[0].childNodes[1]).attrs[0].value
        };
    });
}