/**
 * So sánh 2 object và chỉ trả về những fields khác nhau dựa trên keys của payload
 * @param {Object} oldData - Dữ liệu lấy từ DB trước khi update
 * @param {Object} newData - Dữ liệu user gửi lên (payload)
 * @returns { {old_changes: Object, new_changes: Object} }
 */
export const getDiff = (oldData, newData) => {
    const old_changes = {};
    const new_changes = {};

    Object.keys(newData).forEach((key) => {
        // Chuyển về string hoặc so sánh Date để chính xác tuyệt đối
        const newValue = newData[key];
        const oldValue = oldData[key];

        // Nếu oldValue bị undefined, có thể do lệch tên cột (snake_case vs camelCase)
        // Ta thử check thêm dạng snake_case nếu key là camelCase
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        const actualOldValue = (oldValue !== undefined) ? oldValue : oldData[snakeKey];

        // So sánh bằng != (loại bỏ sai lệch kiểu dữ liệu string/number)
        if (actualOldValue != newValue) {
            old_changes[key] = (actualOldValue === undefined) ? "N/A" : actualOldValue;
            new_changes[key] = newValue;
        }
    });

    return { old_changes, new_changes };
};