import { app, BrowserWindow, ipcMain, session } from 'electron';
import Realm from 'realm';
import { updateLocalDb } from './localDb';
import {
  ProductLocal,
  ProductSellingPriceLocal,
  SaleLocal,
  SaleDetailLocal,
  RegisterStatusLocal,
  FixedCostRateLocal,
  ProductBulkLocal,
  ProductBundleLocal,
  RealmConfig,
  RegisterItemLocal,
  ShortcutItemLocal,
} from './realmConfig';
// This allows TypeScript to pick up the magic constants that's auto-generated by Forge's Webpack
// plugin that tells the Electron app where to look for the Webpack-bundled app code (depending on
// whether you're running in development or production).
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

let realm: Realm;
Realm.open(RealmConfig).then((r) => {
  realm = r;
});

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  // eslint-disable-line global-require
  app.quit();
}

const createWindow = (): void => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 720,
    width: 1280,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
const printOptions = {
  silent: true,
  printBackground: true,
  pageSize: 'A4',
  color: false,
  margin: {
    marginType: 'printableArea',
  },
  landscape: false,
  pagesPerSheet: 1,
  collate: false,
  copies: 1,
};

ipcMain.handle('printComponent', (event, url) => {
  let win = new BrowserWindow({ show: false });
  win.loadURL(url);

  win.webContents.on('did-finish-load', () => {
    win.webContents.print(printOptions, (success, failureReason) => {
      console.log('Print Initiated in Main...');
      if (!success) console.log(failureReason);
    });
  });
  return 'done in main';
});

ipcMain.handle('updateLocalDb', (event, shopCode) => {
  updateLocalDb(shopCode);
});

ipcMain.handle('findProductByPk', (event, code) => {
  const product = realm.objectForPrimaryKey<ProductLocal>('Product', code);
  if (product) {
    return {
      code: product.code,
      abbr: product.abbr,
      kana: product.kana,
      name: product.name,
      note: product.note,
      hidden: product.hidden,
      unregistered: product.unregistered,
      sellingPrice: product.sellingPrice,
      costPrice: product.costPrice,
      avgCostPrice: product.avgCostPrice,
      sellingTaxClass: product.sellingTaxClass,
      stockTaxClass: product.stockTaxClass,
      sellingTax: product.sellingTax,
      stockTax: product.stockTax,
      selfMedication: product.selfMedication,
      noReturn: product.noReturn,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  } else {
    return null;
  }
});

ipcMain.handle('findProducts', (event, conds) => {
  let result: any[] = [];
  let products = realm.objects<ProductLocal>('Product');
  if (conds) {
    products = products.filtered(conds);
  }
  result = products.map((product) => {
    return {
      code: product.code,
      abbr: product.abbr,
      kana: product.kana,
      name: product.name,
      note: product.note,
      hidden: product.hidden,
      unregistered: product.unregistered,
      sellingPrice: product.sellingPrice,
      costPrice: product.costPrice,
      avgCostPrice: product.avgCostPrice,
      sellingTaxClass: product.sellingTaxClass,
      stockTaxClass: product.stockTaxClass,
      sellingTax: product.sellingTax,
      stockTax: product.stockTax,
      selfMedication: product.selfMedication,
      noReturn: product.noReturn,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  });
  return result;
});

ipcMain.handle('findProductSellingPriceByPk', (event, code) => {
  const productSellingPrice = realm.objectForPrimaryKey<ProductSellingPriceLocal>('ProductSellingPrice', code);
  if (productSellingPrice) {
    return {
      productCode: productSellingPrice.productCode,
      productName: productSellingPrice.productName,
      sellingPrice: productSellingPrice.sellingPrice,
      updatedAt: productSellingPrice.updatedAt,
    };
  } else {
    return null;
  }
});

ipcMain.handle('findProductSellingPrices', (event, conds) => {
  let result: any[] = [];
  let productSellingPrices = realm.objects<ProductSellingPriceLocal>('ProductSellingPrice');
  if (conds) {
    productSellingPrices = productSellingPrices.filtered(conds);
  }
  result = productSellingPrices.map((productSellingPrice) => {
    return {
      productCode: productSellingPrice.productCode,
      productName: productSellingPrice.productName,
      sellingPrice: productSellingPrice.sellingPrice,
      updatedAt: productSellingPrice.updatedAt,
    };
  });
  return result;
});

ipcMain.handle('getReceiptNumber', (event) => {
  let sales = realm.objects<SaleLocal>('Sale').sorted('receiptNumber', true);
  if (sales.length > 0) {
    return sales[0].receiptNumber + 1;
  } else {
    return 1;
  }
});

ipcMain.handle('findSales', (event, conds, ...args) => {
  console.log(conds);
  console.log(args);
  let result: any[] = [];
  let sales = realm.objects<SaleLocal>('Sale');
  if (conds) {
    sales = sales.filtered(conds, ...args);
  }
  result = sales.map((sale) => {
    return {
      receiptNumber: sale.receiptNumber,
      shopCode: sale.shopCode,
      createdAt: sale.createdAt,
      detailsCount: sale.detailsCount,
      salesTotal: sale.salesTotal,
      taxTotal: sale.taxTotal,
      discountTotal: sale.discountTotal,
      paymentType: sale.paymentType,
      cashAmount: sale.cashAmount,
      salesTaxFreeTotal: sale.salesTaxFreeTotal,
      salesNormalTotal: sale.salesNormalTotal,
      salesReducedTotal: sale.salesReducedTotal,
      taxNormalTotal: sale.taxNormalTotal,
      taxReducedTotal: sale.taxReducedTotal,
      status: sale.status,
    };
  });
  return result;
});

ipcMain.handle('findSaleDetails', (event, conds) => {
  let result: any[] = [];
  let saleDetails = realm.objects<SaleDetailLocal>('SaleDetail');
  if (conds) {
    saleDetails = saleDetails.filtered(conds);
  }
  result = saleDetails.map((saleDetail) => {
    return {
      receiptNumber: saleDetail.receiptNumber,
      index: saleDetail.index,
      productCode: saleDetail.productCode,
      productName: saleDetail.productName,
      abbr: saleDetail.abbr,
      kana: saleDetail.kana,
      note: saleDetail.note,
      hidden: saleDetail.hidden,
      unregistered: saleDetail.unregistered,
      sellingPrice: saleDetail.sellingPrice,
      costPrice: saleDetail.costPrice,
      avgCostPrice: saleDetail.avgCostPrice,
      sellingTaxClass: saleDetail.sellingTaxClass,
      stockTaxClass: saleDetail.stockTaxClass,
      sellingTax: saleDetail.sellingTax,
      stockTax: saleDetail.stockTax,
      selfMedication: saleDetail.selfMedication,
      noReturn: saleDetail.noReturn,
      division: saleDetail.division,
      quantity: saleDetail.quantity,
      discount: saleDetail.discount,
      outputReceipt: saleDetail.outputReceipt,
      status: saleDetail.status,
    };
  });
  return result;
});

ipcMain.handle('createSaleWithDetails', (event, sale, saleDetails) => {
  realm.write(() => {
    realm.create<SaleLocal>('Sale', {
      receiptNumber: sale.receiptNumber,
      shopCode: sale.shopCode,
      createdAt: sale.createdAt,
      detailsCount: sale.detailsCount,
      salesTotal: sale.salesTotal,
      taxTotal: sale.taxTotal,
      discountTotal: sale.discountTotal,
      paymentType: sale.paymentType,
      cashAmount: sale.cashAmount,
      salesTaxFreeTotal: sale.salesTaxFreeTotal,
      salesNormalTotal: sale.salesNormalTotal,
      salesReducedTotal: sale.salesReducedTotal,
      taxNormalTotal: sale.taxNormalTotal,
      taxReducedTotal: sale.taxReducedTotal,
      status: sale.status,
    });

    saleDetails.forEach((saleDetail: SaleDetailLocal) => {
      realm.create<SaleDetailLocal>('SaleDetail', {
        receiptNumber: saleDetail.receiptNumber,
        index: saleDetail.index,
        productCode: saleDetail.productCode,
        productName: saleDetail.productName,
        abbr: saleDetail.abbr,
        kana: saleDetail.kana,
        note: saleDetail.note,
        hidden: saleDetail.hidden,
        unregistered: saleDetail.unregistered,
        sellingPrice: saleDetail.sellingPrice,
        costPrice: saleDetail.costPrice,
        avgCostPrice: saleDetail.avgCostPrice,
        sellingTaxClass: saleDetail.sellingTaxClass,
        stockTaxClass: saleDetail.stockTaxClass,
        sellingTax: saleDetail.sellingTax,
        stockTax: saleDetail.stockTax,
        selfMedication: saleDetail.selfMedication,
        noReturn: saleDetail.noReturn,
        division: saleDetail.division,
        quantity: saleDetail.quantity,
        discount: saleDetail.discount,
        outputReceipt: saleDetail.outputReceipt,
        status: saleDetail.status,
      });
    });
  });
});

ipcMain.handle('getRegisterStatus', (event, dateString) => {
  let status = realm.objects<RegisterStatusLocal>('RegisterStatus');
  if (dateString) {
    status = status.filtered(`dateString == '${dateString}'`);
  } else {
    status = status.sorted('openedAt', true);
  }
  if (status.length > 0) {
    return {
      dateString: status[0].dateString,
      openedAt: status[0].openedAt,
      closedAt: status[0].closedAt,
    };
  } else {
    return null;
  }
});

ipcMain.handle('setRegisterStatus', (event, status: RegisterStatusLocal) => {
  console.log(status);
  realm.write(() => {
    realm.create<RegisterStatusLocal>(
      'RegisterStatus',
      {
        dateString: status.dateString,
        openedAt: status.openedAt,
        closedAt: status.closedAt,
      },
      Realm.UpdateMode.Modified
    );
  });
});

ipcMain.handle('findRegisterItems', (event, conds) => {
  let result: any[] = [];
  let registerItems = realm.objects<RegisterItemLocal>('RegisterItem');
  if (conds) {
    registerItems = registerItems.filtered(conds);
  }
  result = registerItems.map((registerItem) => {
    return {
      index: registerItem.index,
      code: registerItem.code,
      name: registerItem.name,
      division: registerItem.division,
      defaultPrice: registerItem.defaultPrice,
      outputReceipt: registerItem.outputReceipt,
      sortOrder: registerItem.sortOrder,
      taxClass: registerItem.taxClass,
      tax: registerItem.tax,
    };
  });
  return result;
});

ipcMain.handle('findShortcutItemByPk', (event, index) => {
  const shortcutItem = realm.objectForPrimaryKey<ShortcutItemLocal>('ShortcutItem', index);
  if (shortcutItem) {
    return {
      index: shortcutItem.index,
      color: shortcutItem.color,
      productCode: shortcutItem.productCode,
    };
  } else {
    return null;
  }
});

ipcMain.handle('findShortcutItems', (event, conds) => {
  let result: any[] = [];
  let shortcutItems = realm.objects<ShortcutItemLocal>('ShortcutItem');
  if (conds) {
    shortcutItems = shortcutItems.filtered(conds);
  }
  result = shortcutItems.map((shortcutItem) => {
    return {
      index: shortcutItem.index,
      color: shortcutItem.color,
      productCode: shortcutItem.productCode,
    };
  });
  return result;
});

ipcMain.handle('setShortcutItem', (event, shortcutItem: ShortcutItemLocal) => {
  realm.write(() => {
    realm.create<ShortcutItemLocal>(
      'ShortcutItem',
      {
        index: shortcutItem.index,
        color: shortcutItem.color,
        productCode: shortcutItem.productCode,
      },
      Realm.UpdateMode.Modified
    );
  });
});

ipcMain.handle('deleteShortcutItem', (event, index) => {
  const shortcutItem = realm.objectForPrimaryKey<ShortcutItemLocal>('ShortcutItem', index);
  realm.write(() => {
    realm.delete(shortcutItem);
  });
});

ipcMain.handle('findProductBundles', (event, conds) => {
  let result: any[] = [];
  let productBundles = realm.objects<ProductBundleLocal>('ProductBundle');
  if (conds) {
    productBundles = productBundles.filtered(conds);
  }
  result = productBundles.map((productBundle) => {
    return {
      code: productBundle.code,
      name: productBundle.name,
      sellingTaxClass: productBundle.sellingTaxClass,
      sellingTax: productBundle.sellingTax,
      quantity: productBundle.quantity,
      discount: productBundle.discount,
      productCodes: [...productBundle.productCodes],
    };
  });
  return result;
});

ipcMain.handle('findProductBulks', (event, conds) => {
  let result: any[] = [];
  let productBulks = realm.objects<ProductBulkLocal>('ProductBulk');
  if (conds) {
    productBulks = productBulks.filtered(conds);
  }
  result = productBulks.map((productBulk) => {
    return {
      parentProductCode: productBulk.parentProductCode,
      parentProductName: productBulk.parentProductName,
      childProductCode: productBulk.childProductCode,
      childProductName: productBulk.childProductName,
      quantity: productBulk.quantity,
    };
  });
  return result;
});

ipcMain.handle('findFixedCostRates', (event, conds) => {
  let result: any[] = [];
  let fixedCostRates = realm.objects<FixedCostRateLocal>('FixedCostRate');
  if (conds) {
    fixedCostRates = fixedCostRates.filtered(conds);
  }
  result = fixedCostRates.map((fixedCostRate) => {
    return {
      productCode: fixedCostRate.productCode,
      description: fixedCostRate.description,
      rate: fixedCostRate.rate,
    };
  });
  return result;
});
