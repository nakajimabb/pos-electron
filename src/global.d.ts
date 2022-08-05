interface Window {
  electronAPI: {
    printComponent: (url: string, callback: (response: any) => any) => Promise<void>;
    findProducts: (conds: string) => Promise<any>;
    findProductSellingPrices: (conds: string) => Promise<any>;
  };
}
