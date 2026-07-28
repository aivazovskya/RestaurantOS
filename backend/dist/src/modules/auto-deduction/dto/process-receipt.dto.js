"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessPosReceiptDto = exports.PosReceiptItemDto = void 0;
class PosReceiptItemDto {
    posItemId;
    name;
    quantity;
    price;
}
exports.PosReceiptItemDto = PosReceiptItemDto;
class ProcessPosReceiptDto {
    eventId;
    branchId;
    receiptId;
    posHardwareId;
    tableNumber;
    waiterName;
    totalAmount;
    paymentType;
    items;
}
exports.ProcessPosReceiptDto = ProcessPosReceiptDto;
//# sourceMappingURL=process-receipt.dto.js.map