import { app } from 'electron';

const userData = app.getPath('userData');

const AppSettingSchema = {
  name: 'AppSetting',
  properties: {
    key: 'string',
    value: 'string',
  },
  primaryKey: 'key',
};

const ProductSchema = {
  name: 'Product',
  properties: {
    code: 'string',
    abbr: 'string',
    kana: 'string',
    name: 'string',
    note: 'string',
    hidden: 'bool',
    unregistered: 'bool?',
    sellingPrice: 'int?',
    costPrice: 'int?',
    avgCostPrice: 'int?',
    sellingTaxClass: 'string?',
    stockTaxClass: 'string?',
    sellingTax: 'int?',
    stockTax: 'int?',
    selfMedication: 'bool',
    supplierCode: 'string?',
    noReturn: 'bool?',
    createdAt: 'date?',
    updatedAt: 'date?',
  },
  primaryKey: 'code',
};

const ProductSellingPriceSchema = {
  name: 'ProductSellingPrice',
  properties: {
    productCode: 'string',
    productName: 'string',
    sellingPrice: 'int?',
    updatedAt: 'date?',
  },
  primaryKey: 'productCode',
};

const SaleSchema = {
  name: 'Sale',
  properties: {
    id: 'string',
    receiptNumber: 'int',
    shopCode: 'string',
    createdAt: 'date',
    detailsCount: 'int',
    salesTotal: 'int',
    taxTotal: 'int',
    discountTotal: 'int',
    paymentType: 'string',
    cashAmount: 'int',
    salesTaxFreeTotal: 'int',
    salesNormalTotal: 'int',
    salesReducedTotal: 'int',
    taxNormalTotal: 'int',
    taxReducedTotal: 'int',
    status: 'string',
  },
  primaryKey: 'id',
};

const SaleDetailSchema = {
  name: 'SaleDetail',
  properties: {
    saleId: 'string',
    index: 'int',
    productCode: 'string',
    productName: 'string',
    abbr: 'string',
    kana: 'string',
    note: 'string',
    hidden: 'bool',
    unregistered: 'bool?',
    sellingPrice: 'int?',
    costPrice: 'int?',
    avgCostPrice: 'int?',
    sellingTaxClass: 'string?',
    stockTaxClass: 'string?',
    sellingTax: 'int?',
    stockTax: 'int?',
    selfMedication: 'bool',
    supplierCode: 'string?',
    noReturn: 'bool?',
    division: 'string',
    quantity: 'int',
    discount: 'int',
    outputReceipt: 'bool',
    status: 'string',
  },
};

const RegisterStatusSchema = {
  name: 'RegisterStatus',
  properties: {
    dateString: 'string',
    openedAt: 'date',
    closedAt: 'date?',
  },
  primaryKey: 'dateString',
};

const RegisterItemSchema = {
  name: 'RegisterItem',
  properties: {
    index: 'int',
    code: 'string',
    name: 'string',
    division: 'string',
    defaultPrice: 'int',
    outputReceipt: 'bool',
    sortOrder: 'int',
    taxClass: 'string?',
    tax: 'int?',
  },
  primaryKey: 'index',
};

const ShortcutItemSchema = {
  name: 'ShortcutItem',
  properties: {
    index: 'int',
    color: 'string',
    productCode: 'string',
  },
  primaryKey: 'index',
};

const ProductBundleSchema = {
  name: 'ProductBundle',
  properties: {
    code: 'string',
    name: 'string',
    sellingTaxClass: 'string?',
    sellingTax: 'int?',
    quantity: 'int',
    discount: 'int',
    productCodes: 'string[]',
  },
  primaryKey: 'code',
};

const ProductBulkSchema = {
  name: 'ProductBulk',
  properties: {
    parentProductCode: 'string',
    parentProductName: 'string',
    childProductCode: 'string',
    childProductName: 'string',
    quantity: 'int',
  },
  primaryKey: 'parentProductCode',
};

const FixedCostRateSchema = {
  name: 'FixedCostRate',
  properties: {
    productCode: 'string',
    description: 'string',
    rate: 'int',
  },
  primaryKey: 'productCode',
};

const ShopSchema = {
  name: 'Shop',
  properties: {
    code: 'string',
    name: 'string',
    kana: 'string',
    formalName: 'string',
    formalKana: 'string',
    hidden: 'bool',
    email: 'string',
    zip: 'string',
    prefecture: 'int',
    municipality: 'string',
    houseNumber: 'string',
    buildingName: 'string',
    tel: 'string',
    fax: 'string',
    orderable: 'bool?',
    role: 'string',
  },
  primaryKey: 'code',
};

const SyncDateTimeSchema = {
  name: 'SyncDateTime',
  properties: {
    shopCode: 'string',
    updatedAt: 'date?',
  },
  primaryKey: 'shopCode',
};

export const RealmConfig = {
  path: `./pos.realm`,
  schema: [
    AppSettingSchema,
    ProductSchema,
    ProductSellingPriceSchema,
    SaleSchema,
    SaleDetailSchema,
    RegisterStatusSchema,
    RegisterItemSchema,
    ShortcutItemSchema,
    ProductBundleSchema,
    ProductBulkSchema,
    FixedCostRateSchema,
    ShopSchema,
    SyncDateTimeSchema,
  ],
  schemaVersion: 1,
};

export type ProductLocal = {
  code: string;
  abbr: string;
  kana: string;
  name: string;
  note: string;
  hidden: boolean;
  unregistered: boolean;
  sellingPrice: number | null;
  costPrice: number | null;
  avgCostPrice: number | null;
  sellingTaxClass: string | null;
  stockTaxClass: string | null;
  sellingTax: number | null;
  stockTax: number | null;
  selfMedication: boolean;
  supplierCode: string | null;
  noReturn: boolean; // 返品不可
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type ProductSellingPriceLocal = {
  productCode: string; // JANコード
  productName: string;
  sellingPrice: number | null; // 売価(税抜)
  updatedAt: Date | null;
};

export type SaleLocal = {
  id: string;
  receiptNumber: number;
  shopCode: string;
  createdAt: Date;
  detailsCount: number;
  salesTotal: number;
  taxTotal: number;
  discountTotal: number;
  paymentType: 'Cash' | 'Credit';
  cashAmount: number;
  salesTaxFreeTotal: number;
  salesNormalTotal: number;
  salesReducedTotal: number;
  taxNormalTotal: number;
  taxReducedTotal: number;
  status: 'Sales' | 'Cancel' | 'PartialCancel' | 'Return' | 'PartialReturn';
};

export type SaleDetailLocal = {
  saleId: string;
  index: number;
  productCode: string;
  productName: string;
  abbr: string;
  kana: string;
  note: string;
  hidden: boolean;
  unregistered: boolean;
  sellingPrice: number | null;
  costPrice: number | null;
  avgCostPrice: number | null;
  sellingTaxClass: string | null;
  stockTaxClass: string | null;
  sellingTax: number | null;
  stockTax: number | null;
  selfMedication: boolean;
  supplierCode: string | null;
  noReturn: boolean;
  division: string;
  quantity: number;
  discount: number;
  outputReceipt: boolean;
  status: 'Sales' | 'Cancel' | 'Return';
};

export type RegisterStatusLocal = {
  dateString: string;
  openedAt: Date;
  closedAt: Date | null;
};

export type RegisterItemLocal = {
  index: number;
  code: string;
  name: string;
  division: string;
  defaultPrice: number;
  outputReceipt: boolean;
  sortOrder: number;
  taxClass: string | null;
  tax: number | null;
};

export type ShortcutItemLocal = {
  index: number;
  color: string;
  productCode: string;
};

export type ProductBundleLocal = {
  code: string;
  name: string;
  sellingTaxClass: string | null; // 税区分
  sellingTax: number | null; // 消費税
  quantity: number;
  discount: number;
  productCodes: string[];
};

export type ProductBulkLocal = {
  parentProductCode: string;
  parentProductName: string;
  childProductCode: string;
  childProductName: string;
  quantity: number;
};

export type FixedCostRateLocal = {
  productCode: string;
  description: string;
  rate: number;
};

export type SyncDateTime = {
  shopCode: string;
  updatedAt: Date | null;
};
