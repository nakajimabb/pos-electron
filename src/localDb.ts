import { initializeApp } from 'firebase/app';
import { startOfDay } from 'date-fns';
import { firebaseConfig } from './firebaseConfig';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {
  collection,
  getDocs,
  getFirestore,
  query,
  orderBy,
  getDoc,
  runTransaction,
  doc,
  Timestamp,
  DocumentReference,
  QueryConstraint,
  where,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import Realm from 'realm';
import {
  Product,
  ProductBulk,
  ProductBundle,
  ProductSellingPrice,
  RegisterItem,
  ShortcutItem,
  FixedCostRate,
  Sale,
  SaleDetail,
  TaxClass,
  Supplier,
  Shop,
  stockPath,
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
  SaleLocal,
  SaleDetailLocal,
  SyncDateTime,
} from './realmConfig';
import { MAIL_DOMAIN, OTC_DIVISION } from './tools';
import { decipher } from './encryption';

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

export const updateLocalDb = async (shopCode: string) => {
  const auth = getAuth(firebaseApp);
  const email = shopCode + MAIL_DOMAIN;
  const realm = await Realm.open(RealmConfig);
  const passwordSetting = realm.objectForPrimaryKey<{ key: string; value: string }>('AppSetting', 'PASSWORD');
  if (!passwordSetting) return;
  const password = decipher(passwordSetting.value, `$${shopCode}`);
  await signInWithEmailAndPassword(auth, email, password);

  const docSnapshot = await getDoc(doc(db, 'shops', shopCode));
  realm.write(() => {
    realm.delete(realm.objects('Shop'));
    const shop = docSnapshot.data() as Shop;
    realm.create<Shop>(
      'Shop',
      {
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
      },
      Realm.UpdateMode.Modified
    );
  });

  const querySnapshot1 = await getDocs(query(collection(db, 'registerItems'), orderBy('sortOrder')));
  realm.write(() => {
    realm.delete(realm.objects('RegisterItem'));
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
    realm.delete(realm.objects('ShortcutItem'));
    shortcutItemLocals.forEach((shortcutItem) => {
      realm.create<ShortcutItemLocal>('ShortcutItem', shortcutItem, Realm.UpdateMode.Modified);
    });
  });

  const querySnapshot3 = await getDocs(collection(db, 'products'));
  realm.write(() => {
    realm.delete(realm.objects('Product'));
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
    realm.delete(realm.objects('ProductSellingPrice'));
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
    realm.delete(realm.objects('ProductBundle'));
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
    realm.delete(realm.objects('ProductBulk'));
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
    realm.delete(realm.objects('FixedCostRate'));
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

export const syncFirestore = async (shopCode: string) => {
  const auth = getAuth(firebaseApp);
  const email = shopCode + MAIL_DOMAIN;
  const realm = await Realm.open(RealmConfig);
  const passwordSetting = realm.objectForPrimaryKey<{ key: string; value: string }>('AppSetting', 'PASSWORD');
  if (!passwordSetting) return;
  const password = decipher(passwordSetting.value, `$${shopCode}`);
  await signInWithEmailAndPassword(auth, email, password);
  console.log('syncFirestore');
  runTransaction(db, async (transaction) => {
    console.log('runTransaction');
    let dateTime = new Date();
    const syncDateTime = realm.objectForPrimaryKey<SyncDateTime>('SyncDateTime', shopCode);
    if (syncDateTime && syncDateTime.updatedAt) {
      dateTime = syncDateTime.updatedAt;
    }
    const syncStartAt = startOfDay(new Date());
    const conds: QueryConstraint[] = [];
    conds.push(where('shopCode', '==', shopCode));
    conds.push(where('createdAt', '>=', dateTime));
    conds.push(orderBy('createdAt', 'desc'));
    const q = query(collection(db, 'sales'), ...conds);
    const querySnapshot = await getDocs(q);
    console.log('querySnapshot');
    const realmConds = `shopCode == '${shopCode}' AND inputMode == 'Normal' AND createdAt >= $0`;
    const saleLocals = realm.objects<SaleLocal>('Sale').filtered(realmConds, dateTime);
    await Promise.all(
      saleLocals.map(async (saleLocal) => {
        const sale: Sale = {
          receiptNumber: saleLocal.receiptNumber,
          shopCode: saleLocal.shopCode,
          createdAt: Timestamp.fromDate(saleLocal.createdAt),
          detailsCount: saleLocal.detailsCount,
          salesTotal: saleLocal.salesTotal,
          taxTotal: saleLocal.taxTotal,
          discountTotal: saleLocal.discountTotal,
          paymentType: saleLocal.paymentType,
          cashAmount: saleLocal.cashAmount,
          salesTaxFreeTotal: saleLocal.salesTaxFreeTotal,
          salesNormalTotal: saleLocal.salesNormalTotal,
          salesReducedTotal: saleLocal.salesReducedTotal,
          taxNormalTotal: saleLocal.taxNormalTotal,
          taxReducedTotal: saleLocal.taxReducedTotal,
          status: saleLocal.status,
        };
        const saleRef = doc(collection(db, 'sales'), saleLocal.id);
        const saleExist = await transaction.get(saleRef);
        if (!saleExist.exists()) {
          transaction.set(saleRef, sale);
          const detailConds = `saleId == '$0'`;
          const saleDetailLocals = realm.objects<SaleDetailLocal>('SaleDetail').filtered(detailConds, saleLocal.id);
          saleDetailLocals.forEach((saleDetailLocal) => {
            let supplierRef: DocumentReference<Supplier> | null = null;
            if (saleDetailLocal.supplierCode) {
              supplierRef = doc(
                collection(db, 'suppliers'),
                saleDetailLocal.supplierCode
              ) as DocumentReference<Supplier>;
            }
            const detail: SaleDetail = {
              salesId: saleLocal.id,
              index: saleDetailLocal.index,
              productCode: saleDetailLocal.productCode,
              product: {
                abbr: saleDetailLocal.abbr,
                code: saleDetailLocal.productCode,
                kana: saleDetailLocal.kana,
                name: saleDetailLocal.productName,
                note: saleDetailLocal.note,
                hidden: saleDetailLocal.hidden,
                unregistered: saleDetailLocal.unregistered,
                sellingPrice: saleDetailLocal.sellingPrice,
                costPrice: saleDetailLocal.costPrice,
                avgCostPrice: saleDetailLocal.avgCostPrice,
                sellingTaxClass: saleDetailLocal.sellingTaxClass as TaxClass,
                stockTaxClass: saleDetailLocal.stockTaxClass as TaxClass,
                sellingTax: saleDetailLocal.sellingTax,
                stockTax: saleDetailLocal.stockTax,
                selfMedication: saleDetailLocal.selfMedication,
                supplierRef,
                categoryRef: null,
                noReturn: saleDetailLocal.noReturn,
              },
              division: saleDetailLocal.division,
              quantity: saleDetailLocal.quantity,
              discount: saleDetailLocal.discount,
              outputReceipt: saleDetailLocal.outputReceipt,
              status: saleDetailLocal.status,
            };
            const detailRef = doc(collection(db, 'sales', saleRef.id, 'saleDetails'), saleDetailLocal.index.toString());
            transaction.set(detailRef, detail);

            if (saleDetailLocal.productCode && saleDetailLocal.division === OTC_DIVISION) {
              const registerSign = detail.status === 'Return' ? -1 : 1;
              const incr = -saleDetailLocal.quantity * registerSign;
              const productBulk = realm
                .objects<ProductBulkLocal>('ProductBulk')
                .find((bulk) => bulk.parentProductCode === saleDetailLocal.productCode);
              const code = productBulk ? productBulk.childProductCode : saleDetailLocal.productCode;
              const name = productBulk ? productBulk.childProductName : saleDetailLocal.productName;
              const path = stockPath(shopCode, code);
              const ref = doc(db, path);
              const incmnt = productBulk ? productBulk.quantity * incr : incr;
              const data = {
                shopCode,
                productCode: code,
                productName: name,
                quantity: increment(incmnt),
                updatedAt: serverTimestamp(),
              };
              transaction.set(ref, data, { merge: true });
            }
          });
        }
      })
    );

    await Promise.all(
      querySnapshot.docs.map(async (doc) => {
        const sale = doc.data() as Sale;
        const saleLocalExist = realm.objectForPrimaryKey<SaleLocal>('Sale', doc.id);
        if (!saleLocalExist) {
          const detailsSnapshot = await getDocs(collection(db, 'sales', doc.id, 'saleDetails'));
          realm.write(() => {
            realm.create<SaleLocal>('Sale', {
              id: doc.id,
              receiptNumber: sale.receiptNumber,
              shopCode: sale.shopCode,
              createdAt: sale.createdAt.toDate(),
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
              inputMode: 'Normal',
            });
            detailsSnapshot.forEach((detailDoc) => {
              const saleDetail = detailDoc.data() as SaleDetail;
              realm.create<SaleDetailLocal>('SaleDetail', {
                saleId: doc.id,
                index: saleDetail.index,
                productCode: saleDetail.productCode,
                productName: saleDetail.product.name,
                abbr: saleDetail.product.abbr,
                kana: saleDetail.product.kana,
                note: saleDetail.product.note,
                hidden: saleDetail.product.hidden,
                unregistered: saleDetail.product.unregistered,
                sellingPrice: saleDetail.product.sellingPrice,
                costPrice: saleDetail.product.costPrice,
                avgCostPrice: saleDetail.product.avgCostPrice,
                sellingTaxClass: saleDetail.product.sellingTaxClass,
                stockTaxClass: saleDetail.product.stockTaxClass,
                sellingTax: saleDetail.product.sellingTax,
                stockTax: saleDetail.product.stockTax,
                selfMedication: saleDetail.product.selfMedication,
                supplierCode: saleDetail.product.supplierRef ? saleDetail.product.supplierRef.id : null,
                noReturn: saleDetail.product.noReturn,
                division: saleDetail.division,
                quantity: saleDetail.quantity,
                discount: saleDetail.discount,
                outputReceipt: saleDetail.outputReceipt,
                status: saleDetail.status,
              });
            });
          });
        }
      })
    );
    realm.write(() => {
      realm.create<SyncDateTime>(
        'SyncDateTime',
        {
          shopCode,
          updatedAt: syncStartAt,
        },
        Realm.UpdateMode.Modified
      );
    });
  });
};
