import { SaleLocal, SaleDetailLocal } from './realmConfig';
import { prefectureName } from './prefecture';
import { Shop } from './types';

const ePosDev = new window.epson.ePOSDevice();

export async function printReceipt(saleId: string) {
  const sale: SaleLocal | null = await window.electronAPI.findSaleByPk(saleId);
  const shop: Shop | null = await window.electronAPI.findShopByPk(sale.shopCode);
  if (sale) {
    const printerAddress = await window.electronAPI.getAppSetting('PRINTER_ADDRESS');
    const saleDetails = (await window.electronAPI.findSaleDetails(`saleId == '${sale.id}'`)) as SaleDetailLocal[];
    ePosDev.connect(printerAddress, 8008, (data: string) => {
      if (data == 'OK' || data == 'SSL_CONNECT_OK') {
        ePosDev.createDevice(
          'local_printer',
          ePosDev.DEVICE_TYPE_PRINTER,
          { crypto: false, buffer: false },
          (devobj: any, retcode: string) => {
            if (retcode == 'OK') {
              const printer = devobj;
              printer.timeout = 60000;
              printer.onreceive = function (res: any) {
                console.log(res.success);
              };
              printer.oncoveropen = function () {
                console.log('coveropen');
              };
              printer.addTextLang('ja');
              printer.addTextAlign(printer.ALIGN_CENTER);
              printer.addTextDouble(true, false);
              printer.addText(`${sale.status === 'Return' ? '返品' : '領収書'}\n`);
              printer.addFeed();
              printer.addTextAlign(printer.ALIGN_LEFT);
              printer.addTextDouble(false, false);
              printer.addText(`${shop?.formalName}\n`);
              printer.addText(`${shop ? prefectureName(shop.prefecture) : ''} ${shop?.municipality}`);
              printer.addText(`${shop?.houseNumber} ${shop?.buildingName}`);
              printer.addText(`TEL: ${shop.tel}`);
              printer.addFeed();
              printer.addText(`${sale.createdAt?.toLocaleDateString()} ${sale.createdAt?.toLocaleTimeString()}`);
              printer.addFeed();
              printer.addTextAlign(printer.ALIGN_CENTER);
              printer.addText(`---------------------------------\n`);
              saleDetails
                ?.filter((saleDetail) => saleDetail.outputReceipt)
                ?.forEach((saleDetail) => {
                  printer.addTextAlign(printer.ALIGN_LEFT);
                  printer.addText(
                    `${saleDetail.selfMedication ? '★' : ''}${saleDetail.sellingTax === 8 ? '※' : ''}${
                      saleDetail.productName
                    }\n`
                  );
                  printer.addTextAlign(printer.ALIGN_RIGHT);
                  let quantityAndUnit = '';
                  if (saleDetail.productCode && saleDetail.quantity > 1) {
                    quantityAndUnit = `${saleDetail.quantity} x @${Number(saleDetail.sellingPrice).toLocaleString()}`;
                  }
                  printer.addText(
                    `${quantityAndUnit}  ¥${(
                      Number(saleDetail.sellingPrice) * saleDetail.quantity
                    )?.toLocaleString()}\n`
                  );
                });
              printer.addTextAlign(printer.ALIGN_CENTER);
              printer.addText(`${''.padStart(33, '-')}\n`);
              printer.addTextAlign(printer.ALIGN_LEFT);
              const totalTitle = sale?.status === 'Return' ? 'ご返金' : '合計';
              const totalString = `¥${sale?.salesTotal.toLocaleString()}`;
              printer.addText(totalTitle);
              printer.addText(`${''.padStart(35 - (totalTitle.length + totalString.length) * 2, ' ')}`);
              printer.addTextDouble(true, false);
              printer.addText(`${totalString}\n`);
              printer.addTextDouble(false, false);
              const taxFreeTotalText = `¥${(Number(sale?.salesTaxFreeTotal) + 0).toLocaleString()}`;
              printer.addText(`(非課税対象${''.padStart(9 - taxFreeTotalText.length, ' ')}${taxFreeTotalText})\n`);
              const reducedTotalText = `¥${(Number(sale?.salesReducedTotal) + 0).toLocaleString()}`;
              printer.addText(`(    8%対象${''.padStart(9 - reducedTotalText.length, ' ')}${reducedTotalText}`);
              const reducedTaxText = `¥${(Number(sale?.taxReducedTotal) + 0).toLocaleString()}`;
              printer.addText(` 税${''.padStart(8 - reducedTaxText.length, ' ')}${reducedTaxText})\n`);
              const normalTotalText = `¥${(Number(sale?.salesNormalTotal) + 0).toLocaleString()}`;
              printer.addText(`(   10%対象${''.padStart(9 - normalTotalText.length, ' ')}${normalTotalText}`);
              const normalTaxText = `¥${(Number(sale?.taxNormalTotal) + 0).toLocaleString()}`;
              printer.addText(` 税${''.padStart(8 - normalTaxText.length, ' ')}${normalTaxText})\n`);
              if (sale?.status === 'Sales' && saleDetails.some((detail) => detail.outputReceipt)) {
                const cashAmountText = `¥${sale?.cashAmount.toLocaleString()}`;
                printer.addText(`お預かり${''.padStart(27 - cashAmountText.length, ' ')}${cashAmountText})\n`);
                const changeText = `¥${(Number(sale?.cashAmount) - Number(sale?.salesTotal)).toLocaleString()}`;
                printer.addText(`お釣り${''.padStart(29 - changeText.length, ' ')}${changeText})\n`);
              }
              printer.addFeed();
              printer.addText('※印は、軽減税率対象商品です。\n');
              printer.addText('★印は、セルフメディケーション\n');
              printer.addText('税制対象製品です。\n');
              printer.addFeed();
              printer.send();
            } else {
              console.log(retcode);
            }
          }
        );
      } else {
        console.log(data);
      }
    });
  }
}
