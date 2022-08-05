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
    shopCode: 'string',
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
    _id: 'int',
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
    details: 'SaleDetail[]',
  },
  primaryKey: '_id',
};

const SaleDetailSchema = {
  name: 'SaleDetail',
  properties: {
    _id: 'int',
    salesId: 'string',
    index: 'int',
    productCode: 'string',
    product: 'Product?',
    division: 'int',
    quantity: 'int',
    discount: 'int',
    outputReceipt: 'bool',
    status: 'string',
  },
  primaryKey: '_id',
};

export const RealmConfig = {
  path: `./pos.realm`,
  schema: [ProductSchema, ProductSellingPriceSchema, SaleSchema, SaleDetailSchema],
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
  shopCode: string; // 店舗コード
  productCode: string; // JANコード
  productName: string;
  sellingPrice: number | null; // 売価(税抜)
  updatedAt: Date | null;
};

export type SaleLocal = {
  _id: number;
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
  _id: number;
  salesId: string;
  index: number;
  productCode: string;
  product: ProductLocal;
  division: string;
  quantity: number;
  discount: number;
  outputReceipt: boolean;
  status: 'Sales' | 'Cancel' | 'Return';
};
