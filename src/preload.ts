// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { RegisterStatusLocal, SaleDetailLocal, SaleLocal, ShortcutItemLocal } from './realmConfig';
import { Prescription } from './types';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: async () => {
    return await ipcRenderer.invoke('getAppVersion');
  },
  initSipsDir: async () => {
    await ipcRenderer.invoke('initSipsDir');
  },
  getPrinters: async () => {
    return await ipcRenderer.invoke('getPrinters');
  },
  createReceiptWindow: async (id: string) => {
    await ipcRenderer.invoke('createReceiptWindow', id);
  },
  printContents: async () => {
    await ipcRenderer.invoke('printContents');
  },
  showOpenFolderDialog: async () => {
    return await ipcRenderer.invoke('showOpenFolderDialog');
  },
  updateLocalDb: async () => {
    await ipcRenderer.invoke('updateLocalDb');
  },
  syncFirestore: async () => {
    await ipcRenderer.invoke('syncFirestore');
  },
  syncSales: async () => {
    await ipcRenderer.invoke('syncSales');
  },
  cipher: async (plainText: string, key: string) => {
    return await ipcRenderer.invoke('cipher', plainText, key);
  },
  decipher: async (cipheredText: string, key: string) => {
    return await ipcRenderer.invoke('decipher', cipheredText, key);
  },
  getStore: async (key: string, defaultValue?: any) => {
    return await ipcRenderer.invoke('getStore', key, defaultValue);
  },
  setStore: async (key: string, value: any) => {
    await ipcRenderer.invoke('setStore', key, value);
  },
  findAppSettings: async (conds?: string) => {
    return await ipcRenderer.invoke('findAppSettings', conds);
  },
  getAppSetting: async (key: string) => {
    return await ipcRenderer.invoke('getAppSetting', key);
  },
  setAppSetting: async (key: string, value: any) => {
    await ipcRenderer.invoke('setAppSetting', key, value);
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
  createSaleWithDetails: async (sale: SaleLocal, saleDetails: SaleDetailLocal[]) => {
    await ipcRenderer.invoke('createSaleWithDetails', sale, saleDetails);
  },
  getRegisterStatus: async (dateString?: string) => {
    return await ipcRenderer.invoke('getRegisterStatus', dateString);
  },
  setRegisterStatus: async (status: RegisterStatusLocal) => {
    await ipcRenderer.invoke('setRegisterStatus', status);
  },
  findRegisterItemByPk: async (index: number) => {
    return await ipcRenderer.invoke('findRegisterItemByPk', index);
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
    await ipcRenderer.invoke('setShortcutItem', shortcutItem);
  },
  deleteShortcutItem: async (index: number) => {
    await ipcRenderer.invoke('deleteShortcutItem', index);
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
  getCurrentShop: async () => {
    return await ipcRenderer.invoke('getCurrentShop');
  },
  findShopByPk: async (shopCode: string) => {
    return await ipcRenderer.invoke('findShopByPk', shopCode);
  },
  findSyncDateTimeByPk: async (shopCode: string) => {
    return await ipcRenderer.invoke('findSyncDateTimeByPk', shopCode);
  },
  getPrescriptions: async (dateString?: string) => {
    return await ipcRenderer.invoke('getPrescriptions', dateString);
  },
  getFixedPrescriptions: async (dateString?: string) => {
    return await ipcRenderer.invoke('getFixedPrescriptions', dateString);
  },
  setFixedPrescription: async (prescription: Prescription) => {
    await ipcRenderer.invoke('setFixedPrescription', prescription);
  },
});
