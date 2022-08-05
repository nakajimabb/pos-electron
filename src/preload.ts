// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  printComponent: async (url: string, callback: (response: any) => any) => {
    let response = await ipcRenderer.invoke('printComponent', url);
    callback(response);
  },
  findProducts: async (conds: string) => {
    return await ipcRenderer.invoke('findProducts', conds);
  },
  findProductSellingPrices: async (conds: string) => {
    return await ipcRenderer.invoke('findProductSellingPrices', conds);
  },
});
