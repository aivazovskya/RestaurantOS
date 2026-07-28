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
  customerPhone?: string;
  customerName?: string;
  appliedPoints?: number;
  couponCode?: string;
  totalAmount: number;
  paymentType?: string;
  items: PosReceiptItemDto[];
}
