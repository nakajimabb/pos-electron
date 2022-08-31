interface Window {
  electronAPI: {
    printComponent: (url: string, callback: (response: any) => any) => Promise<void>;
    updateLocalDb: (shopCode: string) => Promise<void>;
    syncFirestore: (shopCode: string) => Promise<void>;
    findProductByPk: (code: string) => Promise<any>;
    findProducts: (conds?: string) => Promise<any>;
    findProductSellingPriceByPk: (code: string) => Promise<any>;
    findProductSellingPrices: (conds?: string) => Promise<any>;
    findSales: (conds?: string, ...args: any[]) => Promise<any>;
    findSaleDetails: (conds?: string) => Promise<any>;
    getReceiptNumber: () => Promise<number>;
    createSaleWithDetails: (sale: SaleLocal, saleDetails: SaleDetailLocal[]) => Promise<void>;
    getRegisterStatus: (dateString?: string) => Promise<any>;
    setRegisterStatus: (status: RegisterStatusLocal) => Promise<void>;
    findRegisterItems: (conds?: string) => Promise<any>;
    findShortcutItemByPk: (index: number) => Promise<any>;
    findShortcutItems: (conds?: string) => Promise<any>;
    setShortcutItem: (shortcutItem: ShortcutItemLocal) => Promise<void>;
    deleteShortcutItem: (index: number) => Promise<void>;
    findProductBundles: (conds?: string) => Promise<any>;
    findProductBulks: (conds?: string) => Promise<any>;
    findFixedCostRates: (conds?: string) => Promise<any>;
    findShopByPk: (shopCode: string) => Promise<any>;
    findSyncDateTimeByPk: (shopCode: string) => Promise<any>;
  };
}
