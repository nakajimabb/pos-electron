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

export const updateLocalDb = async (shopCode: string) => {
  const auth = getAuth(firebaseApp);
  const email = shopCode + MAIL_DOMAIN;
  await signInWithEmailAndPassword(auth, email, 'password');
  const realm = await Realm.open(RealmConfig);

  const querySnapshot1 = await getDocs(query(collection(db, 'registerItems'), orderBy('sortOrder')));
  realm.write(() => {
    querySnapshot1.forEach((doc) => {
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

  const querySnapshot2 = await getDocs(collection(db, 'shops', shopCode, 'shortcutItems'));
  const shortcutItemLocals = new Array<ShortcutItemLocal>();
  await Promise.all(
    querySnapshot2.docs.map(async (doc) => {
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

  const querySnapshot3 = await getDocs(collection(db, 'products'));
  realm.write(() => {
    querySnapshot3.forEach((doc) => {
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
          sellingPrice: Number.isNaN(product.sellingPrice) ? 0 : product.sellingPrice ?? 0,
          costPrice: Number.isNaN(product.costPrice) ? 0 : product.costPrice ?? 0,
          avgCostPrice: product.avgCostPrice ?? 0,
          sellingTaxClass: product.sellingTaxClass ?? null,
          stockTaxClass: product.stockTaxClass ?? null,
          sellingTax: product.sellingTax ?? null,
          stockTax: product.stockTax ?? null,
          selfMedication: product.selfMedication ?? false,
          supplierCode: product.supplierRef?.id ?? null,
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

  const querySnapshot4 = await getDocs(collection(db, 'shops', shopCode, 'productSellingPrices'));
  realm.write(() => {
    querySnapshot4.forEach((doc) => {
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
