import { ipcMain } from 'electron';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from './firebaseConfig';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, getFirestore } from 'firebase/firestore';
import Realm from 'realm';
import { RealmConfig } from './realmConfig';
import { Product, ProductSellingPrice } from './types';
import { ProductLocal, ProductSellingPriceLocal, SaleLocal, SaleDetailLocal } from './realmConfig';

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
};

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
