interface Window {
  epson: any;
  electronAPI: {
    fixFocus: () => Promise<void>;
    getAppVersion: () => Promise<any>;
    checkSipsDir: (sipsDirPath: string) => Promise<any>;
    initSipsDir: () => Promise<void>;
    getPrinters: () => Promise<any>;
    createReceiptWindow: (id: string) => Promise<void>;
    printContents: () => Promise<void>;
    showOpenFolderDialog: () => Promise<any>;
    updateLocalDb: () => Promise<void>;
    syncFirestore: () => Promise<void>;
    syncSales: () => Promise<void>;
    cipher: (plainText: string, key: string) => Promise<any>;
    decipher: (cipheredText: string, key: string) => Promise<any>;
    getStore: (key: string, defaultValue?: any) => Promise<any>;
    setStore: (key: string, value: any) => Promise<void>;
    findAppSettings: (conds?: string) => Promise<any>;
    getAppSetting: (key: string) => Promise<any>;
    setAppSetting: (key: string, value: any) => Promise<void>;
    findProductByPk: (code: string) => Promise<any>;
    findProducts: (conds?: string) => Promise<any>;
    findProductSellingPriceByPk: (code: string) => Promise<any>;
    findProductSellingPrices: (conds?: string) => Promise<any>;
    findSaleByPk: (id: string) => Promise<any>;
    findSales: (conds?: string, ...args: any[]) => Promise<any>;
    findSaleDetails: (conds?: string) => Promise<any>;
    createSaleWithDetails: (sale: SaleLocal, saleDetails: SaleDetailLocal[]) => Promise<void>;
    deleteSaleWithDetails: (id: string) => Promise<void>;
    getRegisterStatus: (dateString?: string) => Promise<any>;
    setRegisterStatus: (status: RegisterStatusLocal) => Promise<void>;
    findRegisterItemByPk: (index: number) => Promise<any>;
    findRegisterItems: (conds?: string) => Promise<any>;
    findShortcutItemByPk: (index: number) => Promise<any>;
    findShortcutItems: (conds?: string) => Promise<any>;
    setShortcutItem: (shortcutItem: ShortcutItemLocal) => Promise<void>;
    deleteShortcutItem: (index: number) => Promise<void>;
    findProductBundles: (conds?: string) => Promise<any>;
    findProductBulks: (conds?: string) => Promise<any>;
    findFixedCostRates: (conds?: string) => Promise<any>;
    getCurrentShop: () => Promise<any>;
    findShopByPk: (shopCode: string) => Promise<any>;
    findSyncDateTimeByPk: (shopCode: string) => Promise<any>;
    getPrescriptions: (dateString?: string) => Promise<any>;
    getFixedPrescriptions: (dateString?: string) => Promise<any>;
    setFixedPrescription: (prescription: Prescription) => Promise<void>;
  };
}
