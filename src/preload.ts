// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { RegisterStatusLocal, SaleDetailLocal, SaleLocal, ShortcutItemLocal } from './realmConfig';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  createReceiptWindow: async (id: string) => {
    await ipcRenderer.invoke('createReceiptWindow', id);
  },
  printContents: async () => {
    await ipcRenderer.invoke('printContents');
  },
  updateLocalDb: async (shopCode: string) => {
    return await ipcRenderer.invoke('updateLocalDb', shopCode);
  },
  syncFirestore: async (shopCode: string) => {
    return await ipcRenderer.invoke('syncFirestore', shopCode);
  },
  findProductByPk: async (code: string) => {
    return await ipcRenderer.invoke('findProductByPk', code);
  },
  findProducts: async (conds?: string) => {
    return await ipcRenderer.invoke('findProducts', conds);
  },
  findProductSellingPriceByPk: async (code: string) => {
    return await ipcRenderer.invoke('findProductSellingPriceByPk', code);
  },
  findProductSellingPrices: async (conds?: string) => {
    return await ipcRenderer.invoke('findProductSellingPrices', conds);
  },
  findSaleByPk: async (id: string) => {
    return await ipcRenderer.invoke('findSaleByPk', id);
  },
  findSales: async (conds?: string, ...args: any[]) => {
    return await ipcRenderer.invoke('findSales', conds, ...args);
  },
  findSaleDetails: async (conds?: string) => {
    return await ipcRenderer.invoke('findSaleDetails', conds);
  },
  getReceiptNumber: async () => {
    return await ipcRenderer.invoke('getReceiptNumber');
  },
  createSaleWithDetails: async (sale: SaleLocal, saleDetails: SaleDetailLocal[]) => {
    await ipcRenderer.invoke('createSaleWithDetails', sale, saleDetails);
  },
  getRegisterStatus: async (dateString?: string) => {
    return await ipcRenderer.invoke('getRegisterStatus', dateString);
  },
  setRegisterStatus: async (status: RegisterStatusLocal) => {
    return await ipcRenderer.invoke('setRegisterStatus', status);
  },
  findRegisterItems: async (conds?: string) => {
    return await ipcRenderer.invoke('findRegisterItems', conds);
  },
  findShortcutItemByPk: async (index: number) => {
    return await ipcRenderer.invoke('findShortcutItemByPk', index);
  },
  findShortcutItems: async (conds?: string) => {
    return await ipcRenderer.invoke('findShortcutItems', conds);
  },
  setShortcutItem: async (shortcutItem: ShortcutItemLocal) => {
    return await ipcRenderer.invoke('setShortcutItem', shortcutItem);
  },
  deleteShortcutItem: async (index: number) => {
    return await ipcRenderer.invoke('deleteShortcutItem', index);
  },
  findProductBundles: async (conds?: string) => {
    return await ipcRenderer.invoke('findProductBundles', conds);
  },
  findProductBulks: async (conds?: string) => {
    return await ipcRenderer.invoke('findProductBulks', conds);
  },
  findFixedCostRates: async (conds?: string) => {
    return await ipcRenderer.invoke('findFixedCostRates', conds);
  },
  findShopByPk: async (shopCode: string) => {
    return await ipcRenderer.invoke('findShopByPk', shopCode);
  },
  findSyncDateTimeByPk: async (shopCode: string) => {
    return await ipcRenderer.invoke('findSyncDateTimeByPk', shopCode);
  },
  getPrescriptions: async () => {
    return await ipcRenderer.invoke('getPrescriptions');
  },
});
