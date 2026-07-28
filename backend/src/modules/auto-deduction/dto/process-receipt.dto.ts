export class PosReceiptItemDto {
  posItemId: string;
  name: string;
  quantity: number;
  price: number;
}

export class ProcessPosReceiptDto {
  eventId?: string;
  branchId?: string;
  receiptId: string;
  posHardwareId?: string;
  tableNumber?: string;
  waiterName?: string;
  totalAmount: number;
  paymentType?: string;
  items: PosReceiptItemDto[];
}
