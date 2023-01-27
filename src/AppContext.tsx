import React, { useState, useEffect, useContext, createContext, useCallback } from 'react';
import { getAuth, User, onAuthStateChanged } from 'firebase/auth';
import { OTC_DIVISION, userCodeFromEmail } from './tools';
import { Shop, BasketItem } from './types';
import { ProductBundleLocal, ProductBulkLocal, FixedCostRateLocal } from './realmConfig';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from './firebaseConfig';
import { doc, getDoc, getFirestore } from 'firebase/firestore';

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const auth = getAuth();

export type ContextType = {
  currentUser: User | null;
  currentShop: Shop | null;
  productBundles: ProductBundleLocal[];
  productBulks: ProductBulkLocal[];
  fixedCostRates: FixedCostRateLocal[];
  printerType: 'Receipt' | 'Other';
  printerAddress: string;
  inputMode: 'Normal' | 'Test';
  numberPad: boolean;
  setContextInputMode: React.Dispatch<React.SetStateAction<string>>;
  setContextNumberPad: React.Dispatch<React.SetStateAction<boolean>>;
  addBundleDiscount: (basketItems: BasketItem[]) => BasketItem[];
};

const AppContext = createContext({
  currentUser: null,
  currentShop: null,
  productBundles: [],
  productBulks: [],
  fixedCostRates: [],
  printerType: 'Other',
  printerAddress: '',
  inputMode: 'Normal',
  numberPad: false,
  setContextInputMode: null,
  setContextNumberPad: null,
  addBundleDiscount: (basketItems: BasketItem[]) => basketItems,
} as ContextType);

type AppContextProviderProps = {
  children: React.ReactNode;
};

export const AppContextProvider: React.FC<AppContextProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentShop, setCurrentShop] = useState<Shop | null>(null);
  const [productBundles, setProductBundles] = useState<ProductBundleLocal[]>([]);
  const [productBulks, setProductBulks] = useState<ProductBulkLocal[]>([]);
  const [fixedCostRates, setFixedCostRates] = useState<FixedCostRateLocal[]>([]);
  const [printerType, setPrinterType] = useState<'Receipt' | 'Other'>('Other');
  const [printerAddress, setPrinterAddress] = useState<string>('');
  const [inputMode, setInputMode] = useState<'Normal' | 'Test'>('Normal');
  const [numberPad, setNumberPad] = useState<boolean>(false);

  const getProductBundles = useCallback(async () => {
    const bundles = (await window.electronAPI.findProductBundles()) as ProductBundleLocal[];
    setProductBundles(bundles);
  }, []);

  const getProductBulks = useCallback(async () => {
    const bulks = (await window.electronAPI.findProductBulks()) as ProductBulkLocal[];
    setProductBulks(bulks);
  }, []);

  const getFixedCostRates = useCallback(async () => {
    const rates = (await window.electronAPI.findFixedCostRates()) as FixedCostRateLocal[];
    setFixedCostRates(rates);
  }, []);

  const getPrinterType = useCallback(async () => {
    const printerTypeSetting = await window.electronAPI.getAppSetting('PRINTER_TYPE');
    setPrinterType(printerTypeSetting);
  }, []);

  const getPrinterAddress = useCallback(async () => {
    const printerAddressSetting = await window.electronAPI.getAppSetting('PRINTER_ADDRESS');
    setPrinterAddress(printerAddressSetting);
  }, []);

  const getInputMode = useCallback(async () => {
    const inputModeSetting = await window.electronAPI.getAppSetting('INPUT_MODE');
    setInputMode(inputModeSetting);
  }, []);

  const getNumberPad = useCallback(async () => {
    const numberPadSetting = await window.electronAPI.getAppSetting('NUMBER_PAD');
    setNumberPad(numberPadSetting);
  }, []);

  useEffect(() => {
    getProductBundles();
    getProductBulks();
    getFixedCostRates();
    getPrinterType();
    getPrinterAddress();
    getInputMode();
    getNumberPad();
  }, [
    getProductBundles,
    getProductBulks,
    getFixedCostRates,
    getPrinterType,
    getPrinterAddress,
    getInputMode,
    getNumberPad,
  ]);

  useEffect(() => {
    const getCurrentShop = async () => {
      const shopData = await window.electronAPI.getCurrentShop();
      if (shopData && !currentShop) {
        setCurrentShop(shopData as Shop);
      }
    };
    getCurrentShop();
  }, []);

  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setCurrentShop(null);
      if (user && user.email) {
        const shopCode = userCodeFromEmail(user.email);
        if (shopCode) {
          const snap = await getDoc(doc(db, 'shops', shopCode));
          const shopData = snap.data();
          if (shopData) {
            setCurrentShop(shopData as Shop);
          }
        }
      }
    });
  }, []);

  const addBundleDiscount = (basketItems: BasketItem[]) => {
    productBundles.forEach((productBundle) => {
      let count = 0;
      basketItems.forEach((item) => {
        if (productBundle.productCodes.includes(item.product.code)) {
          count += item.quantity;
        }
      });
      if (count >= productBundle.quantity) {
        const discountPrice = -Math.floor(count / productBundle.quantity) * productBundle.discount;
        const discountItem: any = {
          product: {
            abbr: '',
            code: '',
            kana: '',
            name: productBundle.name,
            hidden: false,
            costPrice: null,
            avgCostPrice: null,
            sellingPrice: discountPrice,
            stockTaxClass: null,
            sellingTaxClass: productBundle.sellingTaxClass,
            stockTax: null,
            sellingTax: productBundle.sellingTax,
            selfMedication: false,
            supplierRef: null,
            categoryRef: null,
            note: '',
          },
          division: OTC_DIVISION,
          outputReceipt: true,
          quantity: 1,
        };
        const existingIndex = basketItems.findIndex((item) => item.product.name === productBundle.name);
        if (existingIndex >= 0) {
          basketItems.splice(existingIndex, 1, discountItem);
        } else {
          basketItems.push(discountItem);
        }
      }
    });
    return basketItems;
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentShop,
        productBundles,
        productBulks,
        fixedCostRates,
        printerType,
        printerAddress,
        inputMode,
        numberPad,
        setContextInputMode: setInputMode,
        setContextNumberPad: setNumberPad,
        addBundleDiscount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
export default AppContext;
