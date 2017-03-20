/**
 * Created by Jnani on 3/20/17.
 */
export class GeoPoint {

    private DEG2RAD = Math.PI / 180; // degrees to radian conversion
    private RAD2DEG = 180 / Math.PI; // radians to degrees conversion
    private MI2KM = 1.6093439999999999; // miles to kilometers conversion
    private KM2MI = 0.621371192237334; // kilometers to miles conversion
    private EARTH_RADIUS_KM = 6371.01; // Earth's radius in km
    private EARTH_RADIUS_MI = 3958.762079; // Earth's radius in miles
    private MAX_LAT = Math.PI / 2; // 90 degrees
    private MIN_LAT = -this.MAX_LAT; // -90 degrees
    private MAX_LON = Math.PI; // 180 degrees
    private MIN_LON = -this.MAX_LON; // -180 degrees
    private FULL_CIRCLE_RAD = Math.PI * 2; // Full cirle (360 degrees) in radians

    public degLat: number;
    public degLon: number;
    public radLat: number;
    public radLon: number;

    /**
     * Constructor
     *
     * @param   {Number}    lat         Latitude
     * @param   {Number}    long        Longitude
     * @param   {Boolean}   inRadians   true if latitude and longitude are in radians
     */
    constructor(lat: number, lon: number, inRadians: boolean) {
        if (inRadians === true) {
            this.degLat = this.radiansToDegrees(lat);
            this.degLon = this.radiansToDegrees(lon);
            this.radLat = lat;
            this.radLon = lon;
        } else {
            this.degLat = lat;
            this.degLon = lon;
            this.radLat = this.degreesToRadians(lat);
            this.radLon = this.degreesToRadians(lon);
        }
        if (this.radLat < this.MIN_LAT || this.radLat > this.MAX_LAT) {
            throw new Error('Latitude out of bounds');
        } else if (this.radLon < this.MIN_LON || this.radLon > this.MAX_LON) {
            throw new Error('Longitude out of bounds');
        }
    }

    /**
     * Return the latitude
     *
     * @param   {Boolean}   inRadians   true to return the latitude in radians
     * @param   {Number}    latitude
     */
    public latitude(inRadians: boolean) {
        if (inRadians) {
            return this.radLat;
        }

        return this.degLat;
    };

    /**
     * Return the longitude
     *
     * @param   {Boolean}   inRadians   true to return the longitude in radians
     * @param   {Number}    longitude
     */
    public longitude(inRadians: boolean) {
        if (inRadians) {
            return this.radLon;
        }

        return this.degLon;
    };

    /**
     * Calculates the distance between two points
     *
     * @param   {Object}    point         GeoPoint instance
     * @param   {Boolean}   inKilometers  true to return the distance in kilometers
     * @return  {Number}    distance between points
     */
    public distanceTo(point: GeoPoint, inKilometers: boolean) {
        var radius = inKilometers ? this.EARTH_RADIUS_KM : this.EARTH_RADIUS_MI,
            lat1 = this.latitude(true),
            lat2 = point.latitude(true),
            lon1 = this.longitude(true),
            lon2 = point.longitude(true);
        return Math.acos(
                Math.sin(lat1) * Math.sin(lat2) +
                Math.cos(lat1) * Math.cos(lat2) *
                Math.cos(lon1 - lon2)) * radius;
    };

    /**
     * Calculate the bouding coordinates
     *
     * @param   {Number}    distance      distance from the point
     * @param   {Number}    radius        optional sphere radius to use
     * @param   {Boolean}   inKilometers  true to return the distance in kilometers
     * @return  {Array}     array containing SW and NE points of bounding box
     */
    public boundingCoordinates(distance: number, radius: number, inKilometers: boolean) {
        if (distance <= 0) {
            throw new Error('Invalid distance');
        }

        // if (radius === true || radius === false) {
        //     inKilometers = radius;
        //     radius = null;
        // }

        if (radius <= 0) {
            radius = inKilometers === true ? this.EARTH_RADIUS_KM : this.EARTH_RADIUS_MI;
        }

        var lat = this.latitude(true),
            lon = this.longitude(true),
            radDist = distance / radius,
            minLat = lat - radDist,
            maxLat = lat + radDist,
            minLon,
            maxLon,
            deltaLon;
        if (minLat > this.MIN_LAT && maxLat < this.MAX_LAT) {
            deltaLon = Math.asin(Math.sin(radDist) / Math.cos(lat));
            minLon = lon - deltaLon;
            if (minLon < this.MIN_LON) {
                minLon += this.FULL_CIRCLE_RAD;
            }
            maxLon = lon + deltaLon;
            if (maxLon > this.MAX_LON) {
                maxLon -= this.FULL_CIRCLE_RAD;
            }
        } else {
            minLat = Math.max(minLat, this.MIN_LAT);
            maxLat = Math.min(maxLat, this.MAX_LAT);
            minLon = this.MIN_LON;
            maxLon = this.MAX_LON;
        }
        return [new GeoPoint(minLat, minLon, true), new GeoPoint(maxLat, maxLon, true)];
    };

    /**
     * Convert degrees to radians
     *
     * @param   {Number}    value   degree value
     * @return  {Number}    radian value
     */
    public degreesToRadians(value: number) {
        return value * this.DEG2RAD;
    };

    /**
     * Convert radians to degrees
     *
     * @param   {Number}    value   radian value
     * @return  {Number}    degree value
     */
    public radiansToDegrees(value: number) {
        return value * this.RAD2DEG;
    };

    /**
     * Cnvert miles to kilometers
     *
     * @param   {Number}    value   miles value
     * @return  {Number}    kilometers value
     */
    public milesToKilometers(value: number) {
        return value * this.MI2KM;
    };

    /**
     * Convert kilometers to miles
     *
     * @param   {Number}    value   kilometer value
     * @return  {Number}    miles value
     */
    public kilometersToMiles(value: number) {
        return value * this.KM2MI;
    };

}