import { ipcMain } from 'electron';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from './firebaseConfig';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, getFirestore, query, orderBy, getDoc } from 'firebase/firestore';
import Realm from 'realm';
import {
  Product,
  ProductBulk,
  ProductBundle,
  ProductSellingPrice,
  RegisterItem,
  ShortcutItem,
  FixedCostRate,
} from './types';
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

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const MAIL_DOMAIN = '@ebondregister.com';
let realm: Realm;
Realm.open(RealmConfig).then((r) => {
  realm = r;
});

export const updateLocalDb = async () => {
  const auth = getAuth(firebaseApp);
  const email = '9999' + MAIL_DOMAIN;
  await signInWithEmailAndPassword(auth, email, 'password');
  const realm = await Realm.open(RealmConfig);
  const querySnapshot = await getDocs(collection(db, 'products'));
  realm.write(() => {
    querySnapshot.forEach((doc) => {
      const product = doc.data() as Product;
      realm.create<ProductLocal>(
        'Product',
        {
          code: product.code ?? '',
          abbr: product.abbr ?? '',
          kana: product.kana ?? '',
          name: product.name ?? '',
          note: product.note ?? '',
          hidden: product.hidden ?? false,
          unregistered: product.unregistered ?? false,
          sellingPrice: product.sellingPrice ?? 0,
          costPrice: product.costPrice ?? 0,
          avgCostPrice: product.avgCostPrice ?? 0,
          sellingTaxClass: product.sellingTaxClass ?? null,
          stockTaxClass: product.stockTaxClass ?? null,
          sellingTax: product.sellingTax ?? null,
          stockTax: product.stockTax ?? null,
          selfMedication: product.selfMedication ?? false,
          noReturn: product.noReturn ?? false,
          createdAt:
            product.createdAt && product.createdAt.hasOwnProperty('toDate') ? product.createdAt.toDate() : null,
          updatedAt:
            product.updatedAt && product.updatedAt.hasOwnProperty('toDate') ? product.updatedAt?.toDate() : null,
        },
        Realm.UpdateMode.Modified
      );
    });
  });

  const querySnapshot2 = await getDocs(collection(db, 'shops', '9999', 'productSellingPrices'));
  realm.write(() => {
    querySnapshot2.forEach((doc) => {
      const productSellingPrice = doc.data() as ProductSellingPrice;
      realm.create<ProductSellingPriceLocal>(
        'ProductSellingPrice',
        {
          productCode: productSellingPrice.productCode,
          productName: productSellingPrice.productName,
          sellingPrice: productSellingPrice.sellingPrice,
          updatedAt:
            productSellingPrice.updatedAt && productSellingPrice.updatedAt.hasOwnProperty('toDate')
              ? productSellingPrice.updatedAt?.toDate()
              : null,
        },
        Realm.UpdateMode.Modified
      );
    });
  });

  const querySnapshot3 = await getDocs(query(collection(db, 'registerItems'), orderBy('sortOrder')));
  realm.write(() => {
    querySnapshot3.forEach((doc) => {
      const registerItem = doc.data() as RegisterItem;
      realm.create<RegisterItemLocal>(
        'RegisterItem',
        {
          index: registerItem.index,
          code: registerItem.code,
          name: registerItem.name,
          division: registerItem.division,
          defaultPrice: registerItem.defaultPrice ?? 0,
          outputReceipt: registerItem.outputReceipt,
          sortOrder: registerItem.sortOrder,
          taxClass: registerItem.taxClass,
          tax: registerItem.tax,
        },
        Realm.UpdateMode.Modified
      );
    });
  });

  const querySnapshot4 = await getDocs(collection(db, 'shops', '9999', 'shortcutItems'));
  const shortcutItemLocals = new Array<ShortcutItemLocal>();
  await Promise.all(
    querySnapshot4.docs.map(async (doc) => {
      const shortcutItem = doc.data() as ShortcutItem;
      const productSnap = await getDoc(shortcutItem.productRef);
      if (productSnap.exists()) {
        const product = productSnap.data() as Product;
        shortcutItemLocals.push({
          index: shortcutItem.index,
          color: shortcutItem.color,
          productCode: product.code,
        });
      }
    })
  );

  realm.write(() => {
    shortcutItemLocals.forEach((shortcutItem) => {
      realm.create<ShortcutItemLocal>('ShortcutItem', shortcutItem, Realm.UpdateMode.Modified);
    });
  });

  const querySnapshot5 = await getDocs(collection(db, 'productBundles'));
  realm.write(() => {
    querySnapshot5.forEach((doc) => {
      const productBundle = doc.data() as ProductBundle;
      realm.create<ProductBundleLocal>(
        'ProductBundle',
        {
          code: productBundle.code,
          name: productBundle.name,
          sellingTaxClass: productBundle.sellingTaxClass,
          sellingTax: productBundle.sellingTax,
          quantity: productBundle.quantity,
          discount: productBundle.discount,
          productCodes: productBundle.productCodes,
        },
        Realm.UpdateMode.Modified
      );
    });
  });

  const querySnapshot6 = await getDocs(collection(db, 'productBulks'));
  realm.write(() => {
    querySnapshot6.forEach((doc) => {
      const productBulk = doc.data() as ProductBulk;
      realm.create<ProductBulkLocal>(
        'ProductBulk',
        {
          parentProductCode: productBulk.parentProductCode,
          parentProductName: productBulk.parentProductName,
          childProductCode: productBulk.childProductCode,
          childProductName: productBulk.childProductName,
          quantity: productBulk.quantity,
        },
        Realm.UpdateMode.Modified
      );
    });
  });

  const querySnapshot7 = await getDocs(collection(db, 'fixedCostRates'));
  realm.write(() => {
    querySnapshot7.forEach((doc) => {
      const fixedCostRate = doc.data() as FixedCostRate;
      realm.create<FixedCostRateLocal>(
        'FixedCostRate',
        {
          productCode: fixedCostRate.productCode,
          description: fixedCostRate.description,
          rate: fixedCostRate.rate,
        },
        Realm.UpdateMode.Modified
      );
    });
  });
};

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
