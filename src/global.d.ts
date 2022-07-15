interface Window {
  electronAPI: {
    printComponent: (url: string, callback: (response: any) => any) => Promise<void>;
  };
}
