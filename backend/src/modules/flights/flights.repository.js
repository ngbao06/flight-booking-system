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
            flightNumber:       "flight_number",
            planeId:            "plane_id",
            airlineId:          "airline_id",
            departureAirportId: "departure_airport_id",
            arrivalAirportId:   "arrival_airport_id",
            distance:           "distance",
            departureTime:      "departure_time",
            arrivalTime:        "arrival_time",
            status:             "status"
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

    // object
    static async getById(id) {
        const [result] = await query(`
            SELECT * FROM Flights
            WHERE is_deleted = 0 AND id = ?
            `, [id]);

        return result.length > 0 ? result[0] : null;
    }

    static async getByFlightNumber(flightNumber) {
        const [result] = await query(`
            SELECT * FROM Flights
            WHERE is_deleted = 0 AND flight_number = ?
            `, [flightNumber]);

        return result.length > 0 ? result[0] : null;
    }

    // get all hoặc có filter
    static async getFlightsComplex(filter) {
        const page = Number(filter.page) || 1;
        const limit = Number(filter.limit) || 20;
        const offset = Number((page - 1) * limit);

        let sql = " FROM Flights WHERE is_deleted = 0";

        const params = [];

        if (filter && Object.keys(filter).length > 0) {
            if (filter.flightNumber) {
                sql += " AND flight_number = ?";
                params.push(filter.flightNumber);
            }

            if (filter.planeId) {
                sql += " AND plane_id = ?";
                params.push(filter.planeId);
            }

            if (filter.airlineId) {
                sql += " AND airline_id = ?";
                params.push(filter.airlineId);
            }
        
            if (filter.departureAirportId) {
                sql += " AND departure_airport_id = ?";
                params.push(filter.departureAirportId);
            }
            
            if (filter.arrivalAirportId) {
                sql += " AND arrival_airport_id = ?";
                params.push(filter.arrivalAirportId);
            }

            if (filter.departureTime) {
                sql += " AND departure_time = ?";
                params.push(filter.departureTime);
            }

            if (filter.arrivalTime) {
                sql += " AND DATE_FORMAT(arrival_time, '%Y-%m-%d %H:%i') = DATE_FORMAT(?, '%Y-%m-%d %H:%i')";
                params.push(filter.arrivalTime);
            }

            if (filter.status) {
                sql += " AND status = ?";
                params.push(filter.status);
            }
        }
        
        const totalRecords = await this.getTotalRecord(sql, params);
        const finalSql = `SELECT * ${sql} LIMIT ${limit} OFFSET ${offset}`;

        console.log(finalSql + " | " + params + " | " + totalRecords)
        const [result] = await query(finalSql, params);

        return {
            data: result,
            totalItems: totalRecords,
            page: page,
            limit: limit
        }
    }

    static async getTotalRecord(sql, params) {
        const countSql = "SELECT COUNT(*) as total " + sql;
        const [result] = await query(countSql, params);
        return result[0].total;
    }
}

export default FlightRepository;