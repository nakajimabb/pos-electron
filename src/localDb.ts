import { ipcMain } from 'electron';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from './firebaseConfig';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, getFirestore } from 'firebase/firestore';
import Realm from 'realm';
import { RealmConfig } from './realmConfig';
import { Product, ProductSellingPrice } from './types';
import { ProductLocal, ProductSellingPriceLocal } from './realmConfig';

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
          shopCode: '9999',
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
      shopCode: productSellingPrice.shopCode,
      productCode: productSellingPrice.productCode,
      productName: productSellingPrice.productName,
      sellingPrice: productSellingPrice.sellingPrice,
      updatedAt: productSellingPrice.updatedAt,
    };
  });
  return result;
});
