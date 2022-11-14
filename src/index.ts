import { app, BrowserWindow, ipcMain, dialog, autoUpdater } from 'electron';
import Realm from 'realm';
import ElectronStore from 'electron-store';
import * as fs from 'fs';
import * as path from 'path';
import * as iconv from 'iconv-lite';
import { format, addMonths } from 'date-fns';
import { updateLocalDb, syncFirestore } from './localDb';
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
  SyncDateTime,
} from './realmConfig';
import { Shop, Prescription } from './types';
import { cipher, decipher } from './encryption';
// This allows TypeScript to pick up the magic constants that's auto-generated by Forge's Webpack
// plugin that tells the Electron app where to look for the Webpack-bundled app code (depending on
// whether you're running in development or production).
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

const store = new ElectronStore();

let SIPS_DIR: string;
let SIPS_INDEX_DIR: string;
let SIPS_DATA_DIR: string;
let SIPS_FIXED_DIR: string;
let SIPS_SALES_DIR: string;

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

  mainWindow.setMenuBarVisibility(false);

  // and load the index.html of the app.
  const launched = store.get('LAUNCHED');
  if (launched) {
    initSipsDir();
    deleteOldSipsFiles();
    mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  } else {
    mainWindow.loadURL(`${MAIN_WINDOW_WEBPACK_ENTRY}#/app_setting`);
  }

  setInterval(() => {
    const launched = store.get('LAUNCHED');
    if (launched) {
      try {
        syncSales();
        syncFirestore();
      } catch (error) {
        console.log(error);
      }
    }
  }, 5 * 60 * 1000);

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
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

require('update-electron-app')(
  {notifyUser: false}
);

autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
  const dialogOpts = {
    type: 'info',
    buttons: ['再起動', '後で'],
    title: 'アップデート通知',
    message: process.platform === 'win32' ? releaseNotes : releaseName,
    detail: '新しいバージョンがダウンロードされました。再起動して更新を適用してください。'
  }

  dialog.showMessageBox(dialogOpts).then(({ response }) => {
    if (response === 0) autoUpdater.quitAndInstall()
  })
})

const initSipsDir = () => {
  const sipsDirSetting = realm.objectForPrimaryKey<{ key: string; value: string }>('AppSetting', 'SIPS_DIR');
  if (sipsDirSetting && sipsDirSetting.value.length > 0) {
    SIPS_DIR = sipsDirSetting.value;
    SIPS_INDEX_DIR = path.join(SIPS_DIR, 'INDEX');
    SIPS_DATA_DIR = path.join(SIPS_DIR, 'DATA');
    SIPS_FIXED_DIR = path.join(SIPS_DIR, 'FIXED');
    SIPS_SALES_DIR = path.join(SIPS_DIR, 'SALES');
    if (!fs.existsSync(SIPS_INDEX_DIR)) {
      fs.mkdirSync(SIPS_INDEX_DIR);
    }
    if (!fs.existsSync(SIPS_DATA_DIR)) {
      fs.mkdirSync(SIPS_DATA_DIR);
    }
    if (!fs.existsSync(SIPS_FIXED_DIR)) {
      fs.mkdirSync(SIPS_FIXED_DIR);
    }
    if (!fs.existsSync(SIPS_SALES_DIR)) {
      fs.mkdirSync(SIPS_SALES_DIR);
    }
  } else {
    SIPS_DIR = '';
    SIPS_INDEX_DIR = '';
    SIPS_DATA_DIR = '';
    SIPS_FIXED_DIR = '';
    SIPS_SALES_DIR = '';
  }
};

const deleteOldSipsFiles = () => {
  if (!SIPS_INDEX_DIR) return;
  let indexfiles = fs.readdirSync(SIPS_INDEX_DIR);
  const dateString = format(addMonths(new Date(), -1), 'yyyyMMdd');
  indexfiles = indexfiles.filter((fileName) => fileName.substring(3, 11) < dateString);
  indexfiles.forEach((fileName) => {
    fs.unlinkSync(path.format({ dir: SIPS_INDEX_DIR, base: fileName }));
    fs.unlinkSync(path.format({ dir: SIPS_DATA_DIR, base: fileName }));
  });

  let fixedFiles = fs.readdirSync(SIPS_FIXED_DIR);
  fixedFiles = fixedFiles.filter((fileName) => fileName.substring(2, 10) < dateString);
  fixedFiles.forEach((fileName) => {
    fs.unlinkSync(path.format({ dir: SIPS_FIXED_DIR, base: fileName }));
  });

  let salesfiles = fs.readdirSync(SIPS_SALES_DIR);
  salesfiles = salesfiles.filter((fileName) => fileName.substring(0, 8) < dateString);
  salesfiles.forEach((fileName) => {
    fs.unlinkSync(path.format({ dir: SIPS_SALES_DIR, base: fileName }));
  });
};

const syncSales = () => {
  if (!SIPS_SALES_DIR) return;
  console.log('syncSales');
  const files = fs.readdirSync(SIPS_SALES_DIR);
  files.forEach((fileName) => {
    const buffer = fs.readFileSync(path.format({ dir: SIPS_SALES_DIR, base: fileName }));
    const content = iconv.decode(buffer, 'Shift_JIS');
    const data = JSON.parse(content);
    if (data) {
      const saleExisted = realm.objectForPrimaryKey<SaleLocal>('Sale', data.sale.id);
      if (!saleExisted) {
        const sale = data.sale;
        const saleDetails = data.saleDetails;

        if (sale.inputMode === 'Normal') {
          realm.write(() => {
            realm.create<SaleLocal>('Sale', {
              id: sale.id,
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
              inputMode: sale.inputMode,
            });

            saleDetails.forEach((saleDetail: SaleDetailLocal) => {
              realm.create<SaleDetailLocal>('SaleDetail', {
                saleId: saleDetail.saleId,
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
                supplierCode: saleDetail.supplierCode,
                noReturn: saleDetail.noReturn,
                division: saleDetail.division,
                quantity: saleDetail.quantity,
                discount: saleDetail.discount,
                outputReceipt: saleDetail.outputReceipt,
                status: saleDetail.status,
              });
            });
          });
        }
      }
    }
  });
};

ipcMain.handle('initSipsDir', (event) => {
  initSipsDir();
});

ipcMain.handle('getPrinters', async (event) => {
  return await event.sender.getPrintersAsync();
});

ipcMain.handle('createReceiptWindow', (event, id) => {
  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });
  win.loadURL(`${MAIN_WINDOW_WEBPACK_ENTRY}#/receipt_print?id=${id}`);
});

ipcMain.handle('printContents', (event) => {
  const printOptions: Electron.WebContentsPrintOptions = {
    silent: true,
    printBackground: true,
    pageSize: 'A4',
    color: false,
  };
  const printerSetting = realm.objectForPrimaryKey<{ key: string; value: string }>('AppSetting', 'PRINTER');
  if (printerSetting && printerSetting.value) {
    printOptions.deviceName = printerSetting.value;
  }
  event.sender.print(printOptions, (success, failureReason) => {
    if (!success) {
      console.log(failureReason);
    }
    BrowserWindow.fromWebContents(event.sender).close();
  });
});

ipcMain.handle('showOpenFolderDialog', (event) => {
  return dialog.showOpenDialogSync(BrowserWindow.fromWebContents(event.sender), {
    properties: ['openDirectory'],
    title: 'フォルダを選択',
    defaultPath: '.',
  });
});

ipcMain.handle('updateLocalDb', async (event) => {
  await updateLocalDb();
});

ipcMain.handle('syncFirestore', async (event) => {
  await syncFirestore();
});

ipcMain.handle('syncSales', async (event) => {
  syncSales();
});

ipcMain.handle('cipher', (event, plainText: string, key: string) => {
  return cipher(plainText, key);
});

ipcMain.handle('decipher', (event, cipheredText: string, key: string) => {
  return decipher(cipheredText, key);
});

ipcMain.handle('getStore', (event, key, defaultValue?) => {
  let result: any;
  if (defaultValue) {
    result = store.get(key, defaultValue);
  } else {
    result = store.get(key);
  }
  return result;
});

ipcMain.handle('setStore', (event, key, value) => {
  store.set(key, value);
});

ipcMain.handle('findAppSettings', (event, conds) => {
  let result: any[] = [];
  let appSettings = realm.objects<{ key: string; value: string }>('AppSetting');
  if (conds) {
    appSettings = appSettings.filtered(conds);
  }
  result = appSettings.map((appSetting) => {
    return {
      key: appSetting.key,
      value: appSetting.value,
    };
  });
  return result;
});

ipcMain.handle('getAppSetting', (event, key) => {
  const appSetting = realm.objectForPrimaryKey<{ key: string; value: string }>('AppSetting', key);
  if (appSetting) {
    return appSetting.value;
  } else {
    return null;
  }
});

ipcMain.handle('setAppSetting', (event, key, value) => {
  realm.write(() => {
    realm.create(
      'AppSetting',
      {
        key,
        value,
      },
      Realm.UpdateMode.Modified
    );
  });
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
      supplierCode: product.supplierCode,
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
      supplierCode: product.supplierCode,
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

ipcMain.handle('findSaleByPk', (event, id) => {
  const sale = realm.objectForPrimaryKey<SaleLocal>('Sale', id);
  if (sale) {
    return {
      id: sale.id,
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
      inputMode: sale.inputMode,
    };
  } else {
    return null;
  }
});

ipcMain.handle('findSales', (event, conds, ...args) => {
  let result: any[] = [];
  let sales = realm.objects<SaleLocal>('Sale');
  if (conds) {
    sales = sales.filtered(conds, ...args);
  }
  result = sales.map((sale) => {
    return {
      id: sale.id,
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
      inputMode: sale.inputMode,
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
      saleId: saleDetail.saleId,
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
      supplierCode: saleDetail.supplierCode,
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
      id: sale.id,
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
      inputMode: sale.inputMode,
    });

    saleDetails.forEach((saleDetail: SaleDetailLocal) => {
      realm.create<SaleDetailLocal>('SaleDetail', {
        saleId: saleDetail.saleId,
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
        supplierCode: saleDetail.supplierCode,
        noReturn: saleDetail.noReturn,
        division: saleDetail.division,
        quantity: saleDetail.quantity,
        discount: saleDetail.discount,
        outputReceipt: saleDetail.outputReceipt,
        status: saleDetail.status,
      });
    });
  });
  if (SIPS_SALES_DIR) {
    const fileName = path.format({
      dir: SIPS_SALES_DIR,
      name: `${format(new Date(), 'yyyyMMdd')}-${sale.id}`,
      ext: '.json',
    });
    fs.writeFileSync(fileName, '');
    var fd = fs.openSync(fileName, 'w');

    const data = { sale, saleDetails };
    var buf = iconv.encode(JSON.stringify(data), 'Shift_JIS');
    fs.write(fd, buf, 0, buf.length, (error) => {
      if (error) console.log(error);
    });
  }
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

ipcMain.handle('findRegisterItemByPk', (event, index) => {
  const registerItem = realm.objectForPrimaryKey<RegisterItemLocal>('RegisterItem', index);
  if (registerItem) {
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
  } else {
    return null;
  }
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

ipcMain.handle('getCurrentShop', (event) => {
  const shops = realm.objects<Shop>('Shop').sorted('code');
  if (shops.length > 0) {
    return {
      code: shops[0].code,
      name: shops[0].name,
      kana: shops[0].kana,
      formalName: shops[0].formalName,
      formalKana: shops[0].formalKana,
      hidden: shops[0].hidden,
      email: shops[0].email,
      zip: shops[0].zip,
      prefecture: shops[0].prefecture,
      municipality: shops[0].municipality,
      houseNumber: shops[0].houseNumber,
      buildingName: shops[0].buildingName,
      tel: shops[0].tel,
      fax: shops[0].fax,
      orderable: shops[0].orderable ?? false,
      role: shops[0].role ?? 'shop',
    };
  } else {
    return null;
  }
});

ipcMain.handle('findShopByPk', (event, shopCode) => {
  const shop: Shop = realm.objectForPrimaryKey<Shop>('Shop', shopCode);
  if (shop) {
    return {
      code: shop.code,
      name: shop.name,
      kana: shop.kana,
      formalName: shop.formalName,
      formalKana: shop.formalKana,
      hidden: shop.hidden,
      email: shop.email,
      zip: shop.zip,
      prefecture: shop.prefecture,
      municipality: shop.municipality,
      houseNumber: shop.houseNumber,
      buildingName: shop.buildingName,
      tel: shop.tel,
      fax: shop.fax,
      orderable: shop.orderable ?? false,
      role: shop.role ?? 'shop',
    };
  } else {
    return null;
  }
});

ipcMain.handle('findSyncDateTimeByPk', (event, shopCode) => {
  const syncDateTime = realm.objectForPrimaryKey<SyncDateTime>('SyncDateTime', shopCode);
  if (syncDateTime) {
    return {
      shopCode: syncDateTime.shopCode,
      updatedAt: syncDateTime.updatedAt,
    };
  } else {
    return null;
  }
});

ipcMain.handle('getPrescriptions', (event, dateString) => {
  let result: any[] = [];
  if (!SIPS_INDEX_DIR) return result;
  let files = fs.readdirSync(SIPS_INDEX_DIR);
  if (dateString) {
    files = files.filter((fileName) => fileName.substring(3, 11) === dateString);
  }
  files.sort().forEach((fileName) => {
    const buffer = fs.readFileSync(path.format({ dir: SIPS_DATA_DIR, base: fileName }));
    const content = iconv.decode(buffer, 'Shift_JIS');
    const lines = content.split(/\r?\n/);
    const data: Prescription = {
      code: '',
      sequence: 0,
      patientName: '',
      patientKana: '',
      amount: 0,
    };
    lines.forEach((line) => {
      const cols = line.split(',');
      if (cols.length > 0) {
        if (cols[0] === '1') {
          data.patientName = cols[3];
          data.patientKana = cols[2];
        } else if (cols[0] === '2') {
          if (data.sequence == 0) {
            data.code = cols[1];
            data.sequence = Number(cols[2]);
          }
        } else if (cols[0] === '5') {
          data.amount = Number(cols[13]);
        }
      }
    });

    const dataType = fileName.substring(0, 1);
    const prescriptionCode = fileName.substring(1, 16);
    const existedIndex = result.findIndex((d) => d.code === prescriptionCode);
    switch (dataType) {
      case 'A':
        if (existedIndex < 0) {
          result.push(data);
        }
        break;
      case 'U':
        if (existedIndex >= 0) {
          result.splice(existedIndex, 1, data);
        }
        break;
      case 'D':
        if (existedIndex >= 0) {
          result.splice(existedIndex, 1);
        }
        break;
    }
  });
  return result;
});

ipcMain.handle('getFixedPrescriptions', (event, dateString) => {
  let result: any[] = [];
  if (!SIPS_FIXED_DIR) return result;
  let files = fs.readdirSync(SIPS_FIXED_DIR);
  if (dateString) {
    files = files.filter((fileName) => fileName.substring(2, 10) === dateString);
  }
  files.forEach((fileName) => {
    const buffer = fs.readFileSync(path.format({ dir: SIPS_FIXED_DIR, base: fileName }));
    const content = iconv.decode(buffer, 'Shift_JIS');
    const lines = content.split(/\r?\n/);
    const data: Prescription = {
      code: '',
      sequence: 0,
      patientName: '',
      patientKana: '',
      amount: 0,
    };
    const line = lines[0];
    const cols = line.split(',');
    if (cols.length > 0) {
      data.code = cols[0];
      data.sequence = Number(cols[1]);
      data.patientName = cols[2];
      data.patientKana = cols[3];
      data.amount = Number(cols[4]);
    }
    result.push(data);
  });
  return result;
});

ipcMain.handle('setFixedPrescription', (event, prescription: Prescription) => {
  if (!SIPS_FIXED_DIR) return;
  const fileName = path.format({ dir: SIPS_FIXED_DIR, name: prescription.code, ext: '.txt' });
  fs.writeFileSync(fileName, '');
  var fd = fs.openSync(fileName, 'w');

  const data = [
    prescription.code,
    prescription.sequence.toString(),
    prescription.patientName,
    prescription.patientKana,
    prescription.amount.toString(),
  ];
  var buf = iconv.encode(data.join(','), 'Shift_JIS');
  fs.write(fd, buf, 0, buf.length, (error) => {
    if (error) console.log(error);
  });
});
