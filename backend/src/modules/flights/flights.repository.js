// flights.repository.js
import { query } from "../../database/mysql/conn.js";

class FlightRepository {
    // bool
    static async createFlight(flight) {
        const {
            flightNumber,
            planeId,
            airlineId,
            departureAirportId,
            arrivalAirportId,
            distance,
            departureTime,
            arrivalTime,
            status
        } = flight;

        const [result] = await query(`
            INSERT INTO Flights
            (flight_number, plane_id, airline_id, departure_airport_id, arrival_airport_id, distance, departure_time, arrival_time, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                flightNumber,
                planeId,
                airlineId,
                departureAirportId,
                arrivalAirportId,
                distance,
                departureTime,
                arrivalTime,
                status || "WAITING"
            ]);

        return result.affectedRows > 0;
    }
    
    // bool
    static async updateFlight(id, flight) {
        const allowedFields = {
            flightNumber: "flight_number",
            planeId: "plane_id",
            airlineId: "airline_id",
            departureAirportId: "departure_airport_id",
            arrivalAirportId: "arrival_airport_id",
            distance: "distance",
            departureTime: "departure_time",
            arrivalTime: "arrival_time",
            status: "status"
        };

        const fields = [];
        const values = [];

        for (const [key, value] of Object.entries(flight)) {
            if (allowedFields[key] && value !== undefined) {
                fields.push(`${allowedFields[key]} = ?`);
                values.push(value);
            }
        }

        if (fields.length === 0) return false;

        values.push(id);

        const [result] = await query(`
            UPDATE Flights
            SET ${fields.join(", ")}
            WHERE is_deleted = 0 AND id = ?
            `, values);

        return result.affectedRows > 0;
    }
    
    // bool
    static async deleteFlight(id) {
        const [result] = await query(`
            UPDATE Flights
            SET is_deleted = 1, status = 'CANCELED'
            WHERE id = ?
            `, [id]);

        return result.affectedRows > 0;
    }
    
    // list
    static async getAll() {
        const [result] = await query(`
            SELECT * FROM Flights
            WHERE is_deleted = 0
            `);

        return result.length > 0 ? result : null;
    }
    
    // object
    static async getById(id) {
        const [result] = await query(`
            SELECT * FROM Flights
            WHERE is_deleted = 0 AND id = ?
            `, [id]);

        return result.length > 0 ? result[0] : null;
    }
    
    // object
    static async getByFlightNumber(flightNumber) {
        const [result] = await query(`
            SELECT * FROM Flights
            WHERE is_deleted = 0 AND flight_number = ?
            `, [flightNumber]);

        return result.length > 0 ? result[0] : null;
    }
    
    // list
    static async getByPlaneId(planeId) {
        const [result] = await query(`
            SELECT * FROM Flights
            WHERE is_deleted = 0 AND plane_id = ?
            `, [planeId]);

        return result.length > 0 ? result : null;
    }
    
    // list
    static async getByAirlineId(airlineId) {
        const [result] = await query(`
            SELECT * FROM Flights
            WHERE is_deleted = 0 AND airline_id = ?
            `, [airlineId]);

        return result.length > 0 ? result : null;
    }
    
    // list
    static async getByDepartureAirport(departureAirport) {
        const [result] = await query(`
            SELECT * FROM Flights
            WHERE is_deleted = 0 AND departure_airport_id = ?
            `, [departureAirport]);

        return result.length > 0 ? result : null;
    }
    
    // list
    static async getByArrivalAirport(arrivalAirport) {
        const [result] = await query(`
            SELECT * FROM Flights
            WHERE is_deleted = 0 AND arrival_airport_id = ?
            `, [arrivalAirport]);

        return result.length > 0 ? result : null;
    }
    
    // list
    static async getByDepartureTime(departureTime) {
        const [result] = await query(`
            SELECT * FROM Flights
            WHERE is_deleted = 0 AND DATE(departure_time) = DATE(?)
            `, [departureTime]);

        return result.length > 0 ? result : null;
    }
    
    // list
    static async getByArrivalTime(arrivalTime) {
        const [result] = await query(`
            SELECT * FROM Flights
            WHERE is_deleted = 0 AND DATE(arrival_time) = DATE(?)
            `, [arrivalTime]);

        return result.length > 0 ? result : null;
    }
    
    // list
    static async getByStatus(status) {
        const [result] = await query(`
            SELECT * FROM Flights
            WHERE is_deleted = 0 AND status = ?
            `, [status]);

        return result.length > 0 ? result : null;
    }
    
    // object
    static async getStatusOfFlight(flightId) {
        const [result] = await query(`
            SELECT status FROM Flights
            WHERE is_deleted = 0 AND id = ?
            `, [flightId]);

        return result.length > 0 ? result[0] : null;
    }
}

export default FlightRepository;