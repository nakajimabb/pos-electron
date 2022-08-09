import { app } from 'electron';

const userData = app.getPath('userData');

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
  primaryKey: 'receiptNumber',
};

const SaleDetailSchema = {
  name: 'SaleDetail',
  properties: {
    receiptNumber: 'int',
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

export const RealmConfig = {
  path: `./pos.realm`,
  schema: [ProductSchema, ProductSellingPriceSchema, SaleSchema, SaleDetailSchema, RegisterStatusSchema],
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
  receiptNumber: number;
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
