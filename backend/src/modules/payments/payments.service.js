import PaymentsRepository from "./payments.repository.js";
import qrConfig from "../../config/payment.js";
import QRCode from "qrcode";

import pkg from 'vietnam-qr-pay';
// Kiểm tra xem VietQRPay nằm ở đâu trong object được import

class PaymentsService {
	static async generateQRCode(payload) {
		const { amount, content } = payload;
		const { QRPay } = pkg;

		const f = (id, val) => {
			const v = String(val);
			return id.toString().padStart(2, '0') + v.length.toString().padStart(2, '0') + v;
		};

		try {
			const guid = f('00', 'A000000727'); // GUID của Napas
			const bankData = f('00', qrConfig.BANK_INFO.BANK_ID) + f('01', qrConfig.BANK_INFO.ACCOUNT_NO);
			const service = f('02', 'QRIBFTTA'); // Mã dịch vụ chuyển khoản nhanh
			const merchantInfo = f('38', guid + f('01', bankData) + service);

			// Lắp ghép chuỗi tổng
			let rawData = "000201"; // Phiên bản định dạng
			rawData += "010211";   // QR tĩnh
			rawData += merchantInfo;
			rawData += f('53', '704'); // Mã tiền tệ (VND)
			if (amount) rawData += f('54', amount);
			rawData += f('58', 'VN'); // Quốc gia
			rawData += f('62', f('08', content)); // Nội dung chuyển khoản

			// Tính toán mã CRC (4 ký tự cuối)
			rawData += "6304";
			const crc = (str) => {
				let crc = 0xFFFF;
				for (let i = 0; i < str.length; i++) {
					crc ^= str.charCodeAt(i) << 8;
					for (let j = 0; j < 8; j++) {
						if ((crc & 0x8000) !== 0) crc = (crc << 1) ^ 0x1021;
						else crc <<= 1;
					}
				}
				return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
			};
			
			const finalQR = rawData + crc(rawData);
			console.log("Mã QR Chuẩn VietQR:", finalQR);

			// Tạo ảnh
			const qrImageBase64 = await QRCode.toDataURL(finalQR, qrConfig.QR_OPTIONS);

			return {
				ok: true,
				statusCode: 200,
				message: "QR code generated successfully",
				data: {
					qrCode: finalQR,      // Chuỗi raw nếu FE muốn tự vẽ
					qrImage: qrImageBase64, // Chuỗi base64 để FE bỏ vào thẻ <img>
				}
			};
		} catch (err) {
			return {
				ok: false,
				statusCode: 500,
				message: "Failed to create qrcode"
			};
		}
	}

	static async createPayment(payload) {
		const existing = await PaymentsRepository.getByTransactionId(payload.transactionId);
		if (existing) {
			return {
				ok: false,
				statusCode: 409,
				message: "Transaction ID already exists"
			};
		}

		const created = await PaymentsRepository.createPayment({
			...payload,
			status: payload.status || "PENDING"
		});
		if (!created) {
			return {
				ok: false,
				statusCode: 500,
				message: "Failed to create payment"
			};
		}

		return {
			ok: true,
			statusCode: 201,
			message: "Payment created successfully",
			data: payload
		};
	}

	static async getPayments(filters = {}) {
		const { id, bookingId, transactionId, fromAmount, toAmount, paymentMethod, status } = filters;

		if (id !== undefined) {
			const payment = await PaymentsRepository.getById(Number(id));
			if (!payment) {
				return {
					ok: false,
					statusCode: 404,
					message: "Payment not found"
				};
			}

			return {
				ok: true,
				statusCode: 200,
				message: "Payment fetched successfully",
				data: payment
			};
		}

		if (bookingId !== undefined) {
			const payments = await PaymentsRepository.getByBookingId(bookingId);
			return {
				ok: true,
				statusCode: 200,
				message: "Payments fetched successfully",
				data: payments || []
			};
		}

		if (transactionId) {
			const payment = await PaymentsRepository.getByTransactionId(transactionId);
			if (!payment) {
				return {
					ok: false,
					statusCode: 404,
					message: "Payment not found"
				};
			}

			return {
				ok: true,
				statusCode: 200,
				message: "Payment fetched successfully",
				data: payment
			};
		}

		if (fromAmount !== undefined && toAmount !== undefined) {
			const payments = await PaymentsRepository.getByRangeAmount(fromAmount, toAmount);
			return {
				ok: true,
				statusCode: 200,
				message: "Payments fetched successfully",
				data: payments || []
			};
		}

		if (paymentMethod) {
			const payments = await PaymentsRepository.getByPaymentMethod(paymentMethod);
			return {
				ok: true,
				statusCode: 200,
				message: "Payments fetched successfully",
				data: payments || []
			};
		}

		if (status) {
			const payments = await PaymentsRepository.getByStatus(status);
			return {
				ok: true,
				statusCode: 200,
				message: "Payments fetched successfully",
				data: payments || []
			};
		}

		const payments = await PaymentsRepository.getAll();
		return {
			ok: true,
			statusCode: 200,
			message: "Payments fetched successfully",
			data: payments || []
		};
	}

	static async getPaymentById(id) {
		const payment = await PaymentsRepository.getById(id);
		if (!payment) {
			return {
				ok: false,
				statusCode: 404,
				message: "Payment not found"
			};
		}

		return {
			ok: true,
			statusCode: 200,
			message: "Payment fetched successfully",
			data: payment
		};
	}

	static async updatePayment(id, payload) {
		const existed = await PaymentsRepository.getById(id);
		if (!existed) {
			return {
				ok: false,
				statusCode: 404,
				message: "Payment not found"
			};
		}

		if (payload.transactionId && payload.transactionId !== existed.transaction_id) {
			const duplicated = await PaymentsRepository.getByTransactionId(payload.transactionId);
			if (duplicated) {
				return {
					ok: false,
					statusCode: 409,
					message: "Transaction ID already exists"
				};
			}
		}

		const updated = await PaymentsRepository.updatePayment(id, payload);
		if (!updated) {
			return {
				ok: false,
				statusCode: 500,
				message: "Failed to update payment"
			};
		}

		const payment = await PaymentsRepository.getById(id);
		return {
			ok: true,
			statusCode: 200,
			message: "Payment updated successfully",
			data: payment
		};
	}
}

export default PaymentsService;
// payments.service.js
