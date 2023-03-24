import { SaleLocal, SaleDetailLocal } from './realmConfig';
import { prefectureName } from './prefecture';
import { Shop } from './types';

const ePosDev = new window.epson.ePOSDevice();

export async function printReceipt(saleId: string, onSuccess?: () => any, onFailure?: () => any) {
  const sale: SaleLocal | null = await window.electronAPI.findSaleByPk(saleId);
  const shop: Shop | null = await window.electronAPI.findShopByPk(sale.shopCode);
  if (sale) {
    const printerAddress = await window.electronAPI.getAppSetting('PRINTER_ADDRESS');
    const registerSign = sale.status === 'Return' ? -1 : 1;
    const saleDetails = (await window.electronAPI.findSaleDetails(`saleId == '${sale.id}'`)) as SaleDetailLocal[];

    const priceTotal =
      saleDetails
        ?.filter((saleDetail) => saleDetail.outputReceipt)
        ?.reduce((result: number, saleDetail) => result + Number(saleDetail.sellingPrice) * saleDetail.quantity, 0) *
      registerSign;
    const priceReducedTotal =
      saleDetails
        .filter((saleDetail) => saleDetail.outputReceipt && saleDetail.sellingTax === 8)
        .reduce((result, saleDetail) => result + Number(saleDetail.sellingPrice) * saleDetail.quantity, 0) *
      registerSign;
    const priceNormalTotal =
      saleDetails
        .filter((saleDetail) => saleDetail.outputReceipt && saleDetail.sellingTax === 10)
        .reduce((result, saleDetail) => result + Number(saleDetail.sellingPrice) * saleDetail.quantity, 0) *
      registerSign;

    ePosDev.connect(
      printerAddress,
      8008,
      (data: string) => {
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
                  if (res.success) {
                    if (onSuccess) onSuccess();
                  } else {
                    alert(`印刷できません。\nエラーコード：${res.code}`);
                    if (onFailure) onFailure();
                  }
                };
                printer.addTextLang('ja');
                printer.addPulse();
                printer.addFeed();
                printer.addTextAlign(printer.ALIGN_CENTER);
                printer.addTextDouble(true, false);
                printer.addText(`${sale.status === 'Return' ? '返品' : '領収書'}\n`);
                printer.addFeed();
                printer.addTextAlign(printer.ALIGN_LEFT);
                printer.addTextDouble(false, false);
                printer.addText(`${shop?.formalName}\n`);
                printer.addText(`${shop ? prefectureName(shop.prefecture) : ''}${shop?.municipality}\n`);
                printer.addText(`${shop?.houseNumber} ${shop?.buildingName}\n`);
                printer.addText(`TEL: ${shop.tel}\n`);
                printer.addFeed();
                printer.addText(`${sale.createdAt?.toLocaleDateString()} ${sale.createdAt?.toLocaleTimeString()}`);
                printer.addFeed();
                printer.addTextAlign(printer.ALIGN_CENTER);
                printer.addText(`${''.padStart(32, '-')}\n`);
                saleDetails
                  ?.filter((saleDetail) => saleDetail.outputReceipt)
                  ?.forEach((saleDetail) => {
                    printer.addTextAlign(printer.ALIGN_LEFT);
                    printer.addText(
                      `${saleDetail.selfMedication ? '★' : ''}${saleDetail.sellingTax === 8 ? '※' : ''}${
                        saleDetail.productName
                      }\n`
                    );
                    printer.addTextAlign(printer.ALIGN_CENTER);
                    let quantityAndUnit = '';
                    if (saleDetail.productCode && saleDetail.quantity > 1) {
                      quantityAndUnit = `${saleDetail.quantity} x @${(
                        Number(saleDetail.sellingPrice) * registerSign +
                        0
                      ).toLocaleString()}`;
                    }
                    const quantityUnitAndPriceText = `${quantityAndUnit}  ¥${(
                      Number(saleDetail.sellingPrice) * saleDetail.quantity * registerSign +
                      0
                    )?.toLocaleString()}`;
                    printer.addText(
                      `${''.padStart(32 - quantityUnitAndPriceText.length, ' ')}${quantityUnitAndPriceText}\n`
                    );
                  });
                printer.addTextAlign(printer.ALIGN_CENTER);
                printer.addText(`${''.padStart(32, '-')}\n`);

                const priceTotalText = `¥${priceTotal.toLocaleString()}`;
                printer.addText(`小計${''.padStart(28 - priceTotalText.length, ' ')}${priceTotalText}\n`);
                printer.addFeed();
                const taxFreeTotalText = `¥${(Number(sale?.salesTaxFreeTotal) + 0).toLocaleString()}`;
                printer.addText(
                  `非課税対象${''.padStart(10 - taxFreeTotalText.length, ' ')}${taxFreeTotalText}${''.padStart(
                    12,
                    ' '
                  )}\n`
                );
                const reducedTotalText = `¥${(priceReducedTotal + 0).toLocaleString()}`;
                printer.addText(`    8%対象${''.padStart(10 - reducedTotalText.length, ' ')}${reducedTotalText}`);
                const reducedTaxText = `¥${(Number(sale?.taxReducedTotal) + 0).toLocaleString()}`;
                printer.addText(` 税${''.padStart(9 - reducedTaxText.length, ' ')}${reducedTaxText}\n`);
                const normalTotalText = `¥${(priceNormalTotal + 0).toLocaleString()}`;
                printer.addText(`   10%対象${''.padStart(10 - normalTotalText.length, ' ')}${normalTotalText}`);
                const normalTaxText = `¥${(Number(sale?.taxNormalTotal) + 0).toLocaleString()}`;
                printer.addText(` 税${''.padStart(9 - normalTaxText.length, ' ')}${normalTaxText}\n`);
                printer.addFeed();
                const totalTitle = sale?.status === 'Return' ? 'ご返金' : '合計';
                const totalString = `¥${sale?.salesTotal.toLocaleString()}`;
                printer.addText(totalTitle);
                printer.addText(`${''.padStart(32 - (totalTitle.length + totalString.length) * 2, ' ')}`);
                printer.addTextDouble(true, false);
                printer.addText(`${totalString}\n`);
                printer.addTextDouble(false, false);
                if (sale?.status === 'Sales' && saleDetails.every((detail) => detail.outputReceipt)) {
                  const cashAmountText = `¥${sale?.cashAmount.toLocaleString()}`;
                  switch (sale.paymentType) {
                    case 'Cash':
                      printer.addText(`お預かり${''.padStart(24 - cashAmountText.length, ' ')}${cashAmountText}\n`);
                      break;
                    case 'Credit':
                      printer.addText(`クレジット${''.padStart(22 - cashAmountText.length, ' ')}${cashAmountText}\n`);
                      break;
                    case 'Digital':
                      printer.addText(`電子マネー${''.padStart(22 - cashAmountText.length, ' ')}${cashAmountText}\n`);
                      break;
                  }
                  const changeText = `¥${(Number(sale?.cashAmount) - Number(sale?.salesTotal)).toLocaleString()}`;
                  printer.addText(`お釣り${''.padStart(26 - changeText.length, ' ')}${changeText}\n`);
                }
                printer.addFeed();
                printer.addTextAlign(printer.ALIGN_LEFT);
                printer.addText('※印は、軽減税率対象商品です。\n');
                printer.addText('★印は、セルフメディケーション\n');
                printer.addText('税制対象製品です。\n');
                printer.addFeed();
                printer.addFeed();
                printer.addCut();
                printer.send();
              } else {
                alert(`印刷できません。\nエラーコード：${retcode}`);
                if (onFailure) onFailure();
              }
            }
          );
        } else {
          alert(`プリンターに接続できません。\nエラーコード：${data}`);
          if (onFailure) onFailure();
        }
      },
      { eposprint: true }
    );
  }
}
