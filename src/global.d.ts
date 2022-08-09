interface Window {
  electronAPI: {
    printComponent: (url: string, callback: (response: any) => any) => Promise<void>;
    findProducts: (conds: string) => Promise<any>;
    findProductSellingPrices: (conds: string) => Promise<any>;
    findSales: (conds: string, ...args: any[]) => Promise<any>;
    findSaleDetails: (conds: string) => Promise<any>;
    getReceiptNumber: () => Promise<number>;
    createSaleWithDetails: (sale: SaleLocal, saleDetails: SaleDetailLocal[]) => Promise<void>;
    getRegisterStatus: (dateString?: string) => Promise<any>;
    setRegisterStatus: (status: RegisterStatusLocal) => Promise<void>;
  };
}
