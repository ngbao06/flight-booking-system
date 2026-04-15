import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import request from "supertest";

import errorMiddleware from "../../src/common/middlewares/error.middleware.js";

import airlinesRoutes from "../../src/modules/airlines/airlines.routes.js";
import airportsRoutes from "../../src/modules/airports/airports.routes.js";
import usersRoutes from "../../src/modules/users/users.routes.js";
import planeRoutes from "../../src/modules/plane/plane.routes.js";
import flightsRoutes from "../../src/modules/flights/flights.routes.js";
import bookingRoutes from "../../src/modules/booking/booking.routes.js";
import paymentsRoutes from "../../src/modules/payments/payments.routes.js";
import ticketsRoutes from "../../src/modules/tickets/tickets.routes.js";
import seatsRoutes from "../../src/modules/seats/seats.routes.js";
import loyaltyRoutes from "../../src/modules/loyalty/loyalty.routes.js";

import AirlinesService from "../../src/modules/airlines/airlines.service.js";
import AirportsService from "../../src/modules/airports/airports.service.js";
import UsersService from "../../src/modules/users/users.service.js";
import PlaneService from "../../src/modules/plane/plane.service.js";
import FlightsService from "../../src/modules/flights/flights.service.js";
import BookingService from "../../src/modules/booking/booking.service.js";
import PaymentsService from "../../src/modules/payments/payments.service.js";
import TicketsService from "../../src/modules/tickets/tickets.service.js";
import SeatsService from "../../src/modules/seats/seats.service.js";
import LoyaltyService from "../../src/modules/loyalty/loyalty.service.js";

const buildApp = () => {
	const app = express();
	app.use(express.json());

	app.use("/api/airlines", airlinesRoutes);
	app.use("/api/airports", airportsRoutes);
	app.use("/api/users", usersRoutes);
	app.use("/api/plane", planeRoutes);
	app.use("/api/flights", flightsRoutes);
	app.use("/api/booking", bookingRoutes);
	app.use("/api/payments", paymentsRoutes);
	app.use("/api/tickets", ticketsRoutes);
	app.use("/api/seats", seatsRoutes);
	app.use("/api/loyalty", loyaltyRoutes);

	app.use(errorMiddleware);
	return app;
};

const app = buildApp();

const okResponse = (statusCode = 200) => ({
	ok: true,
	statusCode,
	message: "OK",
	data: { id: 1 }
});

const setServiceMock = (service, method, impl) => {
	const original = service[method];
	service[method] = impl;
	return () => {
		service[method] = original;
	};
};

const runReq = ({ method, path, body, query }) => {
	let req = request(app)[method](path);
	if (query) req = req.query(query);
	if (body) req = req.send(body);
	return req;
};

const CASES = [
	{
		name: "airlines list",
		method: "get",
		path: "/api/airlines",
		service: AirlinesService,
		serviceMethod: "getAirlines",
		normal: { query: { code: "VN" }, expectedStatus: 200 },
		boundary: { query: { id: 1 }, expectedStatus: 200 },
		abnormal: { query: { id: 0 }, expectedStatus: 400 }
	},
	{
		name: "airlines get by id",
		method: "get",
		path: "/api/airlines/1",
		service: AirlinesService,
		serviceMethod: "getAirlineById",
		normal: { expectedStatus: 200 },
		boundary: { path: "/api/airlines/1", expectedStatus: 200 },
		abnormal: { path: "/api/airlines/0", expectedStatus: 400 }
	},
	{
		name: "airlines create",
		method: "post",
		path: "/api/airlines",
		service: AirlinesService,
		serviceMethod: "createAirline",
		normal: { body: { code: "VNA", name: "Vietnam Airlines" }, expectedStatus: 201 },
		boundary: { body: { code: "AA", name: "AB" }, expectedStatus: 201 },
		abnormal: { body: { code: "A", name: "" }, expectedStatus: 400 }
	},
	{
		name: "airlines update",
		method: "patch",
		path: "/api/airlines/1",
		service: AirlinesService,
		serviceMethod: "updateAirline",
		normal: { body: { name: "VN New" }, expectedStatus: 200 },
		boundary: { body: { code: "BB" }, expectedStatus: 200 },
		abnormal: { body: {}, expectedStatus: 400 }
	},
	{
		name: "airlines delete",
		method: "delete",
		path: "/api/airlines/1",
		service: AirlinesService,
		serviceMethod: "deleteAirline",
		normal: { expectedStatus: 200 },
		boundary: { path: "/api/airlines/1", expectedStatus: 200 },
		abnormal: { path: "/api/airlines/0", expectedStatus: 400 }
	},
	{
		name: "airports list",
		method: "get",
		path: "/api/airports",
		service: AirportsService,
		serviceMethod: "getAirports",
		normal: { query: { city: "HCM" }, expectedStatus: 200 },
		boundary: { query: { id: 1 }, expectedStatus: 200 },
		abnormal: { query: { id: 0 }, expectedStatus: 400 }
	},
	{
		name: "airports get by id",
		method: "get",
		path: "/api/airports/1",
		service: AirportsService,
		serviceMethod: "getAirportById",
		normal: { expectedStatus: 200 },
		boundary: { path: "/api/airports/1", expectedStatus: 200 },
		abnormal: { path: "/api/airports/0", expectedStatus: 400 }
	},
	{
		name: "airports create",
		method: "post",
		path: "/api/airports",
		service: AirportsService,
		serviceMethod: "createAirport",
		normal: { body: { iataCode: "SGN", name: "Tan Son Nhat", city: "HCM", region: "South" }, expectedStatus: 201 },
		boundary: { body: { iataCode: "HAN", name: "AB", city: "CD", region: "EF" }, expectedStatus: 201 },
		abnormal: { body: { iataCode: "HN", name: "A", city: "", region: "" }, expectedStatus: 400 }
	},
	{
		name: "airports lock",
		method: "patch",
		path: "/api/airports/1/lock",
		service: AirportsService,
		serviceMethod: "lockAirport",
		normal: { expectedStatus: 200 },
		boundary: { path: "/api/airports/1/lock", expectedStatus: 200 },
		abnormal: { path: "/api/airports/0/lock", expectedStatus: 400 }
	},
	{
		name: "airports unlock",
		method: "patch",
		path: "/api/airports/1/unlock",
		service: AirportsService,
		serviceMethod: "unlockAirport",
		normal: { expectedStatus: 200 },
		boundary: { path: "/api/airports/1/unlock", expectedStatus: 200 },
		abnormal: { path: "/api/airports/0/unlock", expectedStatus: 400 }
	},
	{
		name: "airports update",
		method: "patch",
		path: "/api/airports/1",
		service: AirportsService,
		serviceMethod: "updateAirport",
		normal: { body: { name: "Noi Bai" }, expectedStatus: 200 },
		boundary: { body: { city: "HN" }, expectedStatus: 200 },
		abnormal: { body: {}, expectedStatus: 400 }
	},
	{
		name: "airports delete",
		method: "delete",
		path: "/api/airports/1",
		service: AirportsService,
		serviceMethod: "deleteAirport",
		normal: { expectedStatus: 200 },
		boundary: { path: "/api/airports/1", expectedStatus: 200 },
		abnormal: { path: "/api/airports/0", expectedStatus: 400 }
	},
	{
		name: "users list",
		method: "get",
		path: "/api/users",
		service: UsersService,
		serviceMethod: "getUsers",
		normal: { query: { username: "alice" }, expectedStatus: 200 },
		boundary: { query: { id: 1 }, expectedStatus: 200 },
		abnormal: { query: { id: 0 }, expectedStatus: 400 }
	},
	{
		name: "users get by id",
		method: "get",
		path: "/api/users/1",
		service: UsersService,
		serviceMethod: "getUserById",
		normal: { expectedStatus: 200 },
		boundary: { path: "/api/users/1", expectedStatus: 200 },
		abnormal: { path: "/api/users/0", expectedStatus: 400 }
	},
	{
		name: "users create",
		method: "post",
		path: "/api/users",
		service: UsersService,
		serviceMethod: "createUser",
		normal: { body: { username: "alice123", password: "password123", role: "PASSENGER" }, expectedStatus: 201 },
		boundary: { body: { username: "abc", password: "123456", role: "AG" }, expectedStatus: 201 },
		abnormal: { body: { username: "ab", password: "123" }, expectedStatus: 400 }
	},
	{
		name: "users update",
		method: "patch",
		path: "/api/users/1",
		service: UsersService,
		serviceMethod: "updateUser",
		normal: { body: { username: "alice_updated" }, expectedStatus: 200 },
		boundary: { body: { password: "123456" }, expectedStatus: 200 },
		abnormal: { body: {}, expectedStatus: 400 }
	},
	{
		name: "users delete",
		method: "delete",
		path: "/api/users/1",
		service: UsersService,
		serviceMethod: "deleteUser",
		normal: { expectedStatus: 200 },
		boundary: { path: "/api/users/1", expectedStatus: 200 },
		abnormal: { path: "/api/users/0", expectedStatus: 400 }
	},
	{
		name: "plane list",
		method: "get",
		path: "/api/plane",
		service: PlaneService,
		serviceMethod: "getPlanes",
		normal: { query: { model: "A320" }, expectedStatus: 200 },
		boundary: { query: { id: 1 }, expectedStatus: 200 },
		abnormal: { query: { id: 0 }, expectedStatus: 400 }
	},
	{
		name: "plane get by id",
		method: "get",
		path: "/api/plane/1",
		service: PlaneService,
		serviceMethod: "getPlaneById",
		normal: { expectedStatus: 200 },
		boundary: { path: "/api/plane/1", expectedStatus: 200 },
		abnormal: { path: "/api/plane/0", expectedStatus: 400 }
	},
	{
		name: "plane create",
		method: "post",
		path: "/api/plane",
		service: PlaneService,
		serviceMethod: "createPlane",
		normal: { body: { airlineId: 1, model: "A321", totalSeats: 180, status: "ACTIVE" }, expectedStatus: 201 },
		boundary: { body: { airlineId: 1, model: "A", totalSeats: 1, status: "A" }, expectedStatus: 201 },
		abnormal: { body: { airlineId: 0, model: "", totalSeats: 0 }, expectedStatus: 400 }
	},
	{
		name: "plane update",
		method: "patch",
		path: "/api/plane/1",
		service: PlaneService,
		serviceMethod: "updatePlane",
		normal: { body: { model: "B737" }, expectedStatus: 200 },
		boundary: { body: { totalSeats: 1 }, expectedStatus: 200 },
		abnormal: { body: {}, expectedStatus: 400 }
	},
	{
		name: "plane delete",
		method: "delete",
		path: "/api/plane/1",
		service: PlaneService,
		serviceMethod: "deletePlane",
		normal: { expectedStatus: 200 },
		boundary: { path: "/api/plane/1", expectedStatus: 200 },
		abnormal: { path: "/api/plane/0", expectedStatus: 400 }
	},
	{
		name: "flights list",
		method: "get",
		path: "/api/flights",
		service: FlightsService,
		serviceMethod: "getFlights",
		normal: { query: { flightNumber: "VN123" }, expectedStatus: 200 },
		boundary: { query: { id: 1 }, expectedStatus: 200 },
		abnormal: { query: { id: 0 }, expectedStatus: 400 }
	},
	{
		name: "flights get by id",
		method: "get",
		path: "/api/flights/1",
		service: FlightsService,
		serviceMethod: "getFlightById",
		normal: { expectedStatus: 200 },
		boundary: { path: "/api/flights/1", expectedStatus: 200 },
		abnormal: { path: "/api/flights/0", expectedStatus: 400 }
	},
	{
		name: "flights create",
		method: "post",
		path: "/api/flights",
		service: FlightsService,
		serviceMethod: "createFlight",
		normal: {
			body: {
				flightNumber: "VN123",
				planeId: 1,
				airlineId: 1,
				departureAirportId: 1,
				arrivalAirportId: 2,
				distance: 1200,
				departureTime: "2026-06-01T10:00:00.000Z",
				arrivalTime: "2026-06-01T12:00:00.000Z",
				status: "WAITING"
			},
			expectedStatus: 201
		},
		boundary: {
			body: {
				flightNumber: "F1",
				planeId: 1,
				airlineId: 1,
				departureAirportId: 1,
				arrivalAirportId: 1,
				distance: 1,
				departureTime: "2026-06-01T00:00:00.000Z",
				arrivalTime: "2026-06-01T00:01:00.000Z",
				status: "A"
			},
			expectedStatus: 201
		},
		abnormal: {
			body: {
				flightNumber: "",
				planeId: 0,
				airlineId: 0,
				departureAirportId: 0,
				arrivalAirportId: 0,
				distance: 0,
				departureTime: "bad-date",
				arrivalTime: "bad-date"
			},
			expectedStatus: 400
		}
	},
	{
		name: "flights update",
		method: "patch",
		path: "/api/flights/1",
		service: FlightsService,
		serviceMethod: "updateFlight",
		normal: { body: { status: "DELAYED" }, expectedStatus: 200 },
		boundary: { body: { distance: 1 }, expectedStatus: 200 },
		abnormal: { body: {}, expectedStatus: 400 }
	},
	{
		name: "flights delete",
		method: "delete",
		path: "/api/flights/1",
		service: FlightsService,
		serviceMethod: "deleteFlight",
		normal: { expectedStatus: 200 },
		boundary: { path: "/api/flights/1", expectedStatus: 200 },
		abnormal: { path: "/api/flights/0", expectedStatus: 400 }
	},
	{
		name: "booking list",
		method: "get",
		path: "/api/booking",
		service: BookingService,
		serviceMethod: "getBookings",
		normal: { query: { flightId: 1 }, expectedStatus: 200 },
		boundary: { query: { id: 1 }, expectedStatus: 200 },
		abnormal: { query: { id: 0 }, expectedStatus: 400 }
	},
	{
		name: "booking get by id",
		method: "get",
		path: "/api/booking/1",
		service: BookingService,
		serviceMethod: "getBookingById",
		normal: { expectedStatus: 200 },
		boundary: { path: "/api/booking/1", expectedStatus: 200 },
		abnormal: { path: "/api/booking/0", expectedStatus: 400 }
	},
	{
		name: "booking create",
		method: "post",
		path: "/api/booking",
		service: BookingService,
		serviceMethod: "createBooking",
		normal: { body: { flightId: 1, bookingDate: "2026-06-01T00:00:00.000Z", totalAmount: 100, status: "PENDING" }, expectedStatus: 201 },
		boundary: { body: { flightId: 1, bookingDate: "2026-06-01T00:00:00.000Z", totalAmount: 0.01, status: "A" }, expectedStatus: 201 },
		abnormal: { body: { flightId: 0, bookingDate: "bad-date", totalAmount: 0 }, expectedStatus: 400 }
	},
	{
		name: "booking update",
		method: "patch",
		path: "/api/booking/1",
		service: BookingService,
		serviceMethod: "updateBooking",
		normal: { body: { status: "CONFIRMED" }, expectedStatus: 200 },
		boundary: { body: { totalAmount: 0.01 }, expectedStatus: 200 },
		abnormal: { body: {}, expectedStatus: 400 }
	},
	{
		name: "booking delete",
		method: "delete",
		path: "/api/booking/1",
		service: BookingService,
		serviceMethod: "deleteBooking",
		normal: { expectedStatus: 200 },
		boundary: { path: "/api/booking/1", expectedStatus: 200 },
		abnormal: { path: "/api/booking/0", expectedStatus: 400 }
	},
	{
		name: "payments list",
		method: "get",
		path: "/api/payments",
		service: PaymentsService,
		serviceMethod: "getPayments",
		normal: { query: { bookingId: 1 }, expectedStatus: 200 },
		boundary: { query: { id: 1 }, expectedStatus: 200 },
		abnormal: { query: { id: 0 }, expectedStatus: 400 }
	},
	{
		name: "payments get by id",
		method: "get",
		path: "/api/payments/1",
		service: PaymentsService,
		serviceMethod: "getPaymentById",
		normal: { expectedStatus: 200 },
		boundary: { path: "/api/payments/1", expectedStatus: 200 },
		abnormal: { path: "/api/payments/0", expectedStatus: 400 }
	},
	{
		name: "payments create",
		method: "post",
		path: "/api/payments",
		service: PaymentsService,
		serviceMethod: "createPayment",
		normal: { body: { bookingId: 1, transactionId: "TXN-001", amount: 100, paymentMethod: "CARD", status: "PENDING" }, expectedStatus: 201 },
		boundary: { body: { bookingId: 1, transactionId: "T", amount: 0.01, paymentMethod: "C", status: "A" }, expectedStatus: 201 },
		abnormal: { body: { bookingId: 0, transactionId: "", amount: 0, paymentMethod: "" }, expectedStatus: 400 }
	},
	{
		name: "payments update",
		method: "patch",
		path: "/api/payments/1",
		service: PaymentsService,
		serviceMethod: "updatePayment",
		normal: { body: { status: "PAID" }, expectedStatus: 200 },
		boundary: { body: { amount: 0.01 }, expectedStatus: 200 },
		abnormal: { body: {}, expectedStatus: 400 }
	},
	{
		name: "payments delete",
		method: "delete",
		path: "/api/payments/1",
		service: PaymentsService,
		serviceMethod: "deletePayment",
		normal: { expectedStatus: 200 },
		boundary: { path: "/api/payments/1", expectedStatus: 200 },
		abnormal: { path: "/api/payments/0", expectedStatus: 400 }
	},
	{
		name: "tickets list",
		method: "get",
		path: "/api/tickets",
		service: TicketsService,
		serviceMethod: "getTickets",
		normal: { query: { bookingId: 1 }, expectedStatus: 200 },
		boundary: { query: { id: 1 }, expectedStatus: 200 },
		abnormal: { query: { id: 0 }, expectedStatus: 400 }
	},
	{
		name: "tickets get by id",
		method: "get",
		path: "/api/tickets/1",
		service: TicketsService,
		serviceMethod: "getTicketById",
		normal: { expectedStatus: 200 },
		boundary: { path: "/api/tickets/1", expectedStatus: 200 },
		abnormal: { path: "/api/tickets/0", expectedStatus: 400 }
	},
	{
		name: "tickets create",
		method: "post",
		path: "/api/tickets",
		service: TicketsService,
		serviceMethod: "createTicket",
		normal: {
			body: {
				ticketNumber: "TK-001",
				bookingId: 1,
				seatId: 1,
				buyerId: 1,
				passengerLastname: "Nguyen",
				passengerFirstname: "An",
				passengerIdCard: "0123456789",
				issueDate: "2026-06-01T00:00:00.000Z",
				finalPrice: 100,
				status: "ISSUED"
			},
			expectedStatus: 201
		},
		boundary: {
			body: {
				ticketNumber: "T",
				bookingId: 1,
				seatId: 1,
				buyerId: 1,
				passengerLastname: "A",
				passengerFirstname: "B",
				passengerIdCard: "1",
				issueDate: "2026-06-01T00:00:00.000Z",
				finalPrice: 0.01,
				status: "A"
			},
			expectedStatus: 201
		},
		abnormal: {
			body: {
				ticketNumber: "",
				bookingId: 0,
				seatId: 0,
				buyerId: 0,
				passengerLastname: "",
				passengerFirstname: "",
				passengerIdCard: "",
				issueDate: "bad-date",
				finalPrice: 0
			},
			expectedStatus: 400
		}
	},
	{
		name: "tickets update",
		method: "patch",
		path: "/api/tickets/1",
		service: TicketsService,
		serviceMethod: "updateTicket",
		normal: { body: { status: "CHECKED_IN" }, expectedStatus: 200 },
		boundary: { body: { finalPrice: 0.01 }, expectedStatus: 200 },
		abnormal: { body: {}, expectedStatus: 400 }
	},
	{
		name: "tickets delete",
		method: "delete",
		path: "/api/tickets/1",
		service: TicketsService,
		serviceMethod: "deleteTicket",
		normal: { expectedStatus: 200 },
		boundary: { path: "/api/tickets/1", expectedStatus: 200 },
		abnormal: { path: "/api/tickets/0", expectedStatus: 400 }
	},
	{
		name: "seats list",
		method: "get",
		path: "/api/seats",
		service: SeatsService,
		serviceMethod: "getSeats",
		normal: { query: { flightId: 1 }, expectedStatus: 200 },
		boundary: { query: { fromPrice: 0.01, toPrice: 0.01 }, expectedStatus: 200 },
		abnormal: { query: { fromPrice: -1, toPrice: 0 }, expectedStatus: 400 }
	},
	{
		name: "seats create",
		method: "post",
		path: "/api/seats",
		service: SeatsService,
		serviceMethod: "createSeats",
		normal: { body: { flightId: 1, basePrice: 100 }, expectedStatus: 201 },
		boundary: { body: { flightId: 1, basePrice: 0.01 }, expectedStatus: 201 },
		abnormal: { body: { flightId: 0, basePrice: 0 }, expectedStatus: 400 }
	},
	{
		name: "seats update",
		method: "patch",
		path: "/api/seats/1",
		service: SeatsService,
		serviceMethod: "updateSeat",
		normal: { body: { status: "BOOKED" }, expectedStatus: 200 },
		boundary: { body: { price: 0.01 }, expectedStatus: 200 },
		abnormal: { body: {}, expectedStatus: 400 }
	},
	{
		name: "loyalty exchange",
		method: "post",
		path: "/api/loyalty/exchange",
		service: LoyaltyService,
		serviceMethod: "exchangePoints",
		normal: { body: { passengerId: 1, amount: 100 }, expectedStatus: 200 },
		boundary: { body: { passengerId: 1, amount: 0.01 }, expectedStatus: 200 },
		abnormal: { body: { passengerId: 0, amount: 0 }, expectedStatus: 400 }
	}
];

for (const spec of CASES) {
	test(`${spec.name} - normal`, async () => {
		let called = false;
		const restore = setServiceMock(spec.service, spec.serviceMethod, async () => {
			called = true;
			return okResponse(spec.normal.expectedStatus);
		});

		try {
			const res = await runReq({
				method: spec.method,
				path: spec.normal.path || spec.path,
				body: spec.normal.body,
				query: spec.normal.query
			});

			assert.equal(res.status, spec.normal.expectedStatus);
			assert.equal(res.body.success, true);
			assert.equal(called, true);
		} finally {
			restore();
		}
	});

	test(`${spec.name} - boundary`, async () => {
		let called = false;
		const restore = setServiceMock(spec.service, spec.serviceMethod, async () => {
			called = true;
			return okResponse(spec.boundary.expectedStatus);
		});

		try {
			const res = await runReq({
				method: spec.method,
				path: spec.boundary.path || spec.path,
				body: spec.boundary.body,
				query: spec.boundary.query
			});

			assert.equal(res.status, spec.boundary.expectedStatus);
			assert.equal(res.body.success, true);
			assert.equal(called, true);
		} finally {
			restore();
		}
	});

	test(`${spec.name} - abnormal`, async () => {
		let called = false;
		const restore = setServiceMock(spec.service, spec.serviceMethod, async () => {
			called = true;
			return okResponse(200);
		});

		try {
			const res = await runReq({
				method: spec.method,
				path: spec.abnormal.path || spec.path,
				body: spec.abnormal.body,
				query: spec.abnormal.query
			});

			assert.equal(res.status, spec.abnormal.expectedStatus);
			assert.equal(called, false);
		} finally {
			restore();
		}
	});
}
