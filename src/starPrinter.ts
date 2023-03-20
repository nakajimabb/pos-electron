import { SaleLocal, SaleDetailLocal } from './realmConfig';
import { prefectureName } from './prefecture';
import { Shop } from './types';

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

    const trader = new window.star.StarWebPrintTrader({ url: `http://${printerAddress}/StarWebPRNT/SendMessage` });

    trader.onReceive = function (response: any) {
      if (response.traderSuccess) {
        if (onSuccess) onSuccess();
      } else {
        let msg = '印刷できません。\n\n';
        if (trader.isCoverOpen({ traderStatus: response.traderStatus })) {
          msg += '\tCoverOpen,\n';
        }
        if (trader.isOffLine({ traderStatus: response.traderStatus })) {
          msg += '\tOffLine,\n';
        }
        if (trader.isCompulsionSwitchClose({ traderStatus: response.traderStatus })) {
          msg += '\tCompulsionSwitchClose,\n';
        }
        if (trader.isEtbCommandExecute({ traderStatus: response.traderStatus })) {
          msg += '\tEtbCommandExecute,\n';
        }
        if (trader.isHighTemperatureStop({ traderStatus: response.traderStatus })) {
          msg += '\tHighTemperatureStop,\n';
        }
        if (trader.isNonRecoverableError({ traderStatus: response.traderStatus })) {
          msg += '\tNonRecoverableError,\n';
        }
        if (trader.isAutoCutterError({ traderStatus: response.traderStatus })) {
          msg += '\tAutoCutterError,\n';
        }
        if (trader.isBlackMarkError({ traderStatus: response.traderStatus })) {
          msg += '\tBlackMarkError,\n';
        }
        if (trader.isPaperEnd({ traderStatus: response.traderStatus })) {
          msg += '\tPaperEnd,\n';
        }
        if (trader.isPaperNearEnd({ traderStatus: response.traderStatus })) {
          msg += '\tPaperNearEnd,\n';
        }
        alert(msg);
        if (onFailure) onFailure();
      }
    };

    trader.onError = function (response: any) {
      let msg = 'エラーが発生しました。\n\n';
      msg += '\tStatus:' + response.status + '\n';
      msg += '\tResponseText:' + response.responseText;
      alert(msg);
      if (onFailure) onFailure();
    };

    const builder = new window.star.StarWebPrintBuilder();
    let request = '';
    request += builder.createInitializationElement();
    request += builder.createTextElement({ codepage: 'utf8' });
    request += builder.createTextElement({ characterspace: 0, international: 'japan' });
    request += builder.createPeripheralElement({ channel: 1, on: 200, off: 200 });
    request += builder.createTextElement({ data: '\n' });
    request += builder.createAlignmentElement({ position: 'center' });
    request += builder.createTextElement({ emphasis: true });
    request += builder.createTextElement({ width: 2, data: `${sale.status === 'Return' ? '返品' : '領収書'}\n` });
    request += builder.createTextElement({ width: 1 });
    request += builder.createTextElement({ emphasis: false });
    request += builder.createTextElement({ data: '\n' });
    request += builder.createAlignmentElement({ position: 'left' });
    request += builder.createTextElement({ data: `${shop?.formalName}\n` });
    request += builder.createTextElement({
      data: `${shop ? prefectureName(shop.prefecture) : ''}${shop?.municipality}\n`,
    });
    request += builder.createTextElement({ data: `${shop?.houseNumber} ${shop?.buildingName}\n` });
    request += builder.createTextElement({ data: `TEL: ${shop.tel}\n` });
    request += builder.createTextElement({ data: '\n' });
    request += builder.createTextElement({
      data: `${sale.createdAt?.toLocaleDateString()} ${sale.createdAt?.toLocaleTimeString()}`,
    });
    request += builder.createTextElement({ data: '\n' });
    request += builder.createAlignmentElement({ position: 'center' });
    request += builder.createTextElement({ data: `${''.padStart(32, '-')}\n` });
    saleDetails
      ?.filter((saleDetail) => saleDetail.outputReceipt)
      ?.forEach((saleDetail) => {
        request += builder.createAlignmentElement({ position: 'left' });
        request += builder.createTextElement({
          data: `${saleDetail.selfMedication ? '★' : ''}${saleDetail.sellingTax === 8 ? '※' : ''}${
            saleDetail.productName
          }\n`,
        });
        request += builder.createAlignmentElement({ position: 'right' });
        let quantityAndUnit = '';
        if (saleDetail.productCode && saleDetail.quantity > 1) {
          quantityAndUnit = `${saleDetail.quantity} x @${(
            Number(saleDetail.sellingPrice) * registerSign +
            0
          ).toLocaleString()}`;
        }
        request += builder.createTextElement({
          data: `${quantityAndUnit}  ¥${(
            Number(saleDetail.sellingPrice) * saleDetail.quantity * registerSign +
            0
          )?.toLocaleString()} \n`,
        });
      });
    request += builder.createTextElement({ data: '\n' });
    request += builder.createAlignmentElement({ position: 'center' });
    request += builder.createTextElement({ data: `${''.padStart(32, '-')}\n` });
    request += builder.createAlignmentElement({ position: 'left' });

    const priceTotalText = `¥${priceTotal.toLocaleString()}`;
    request += builder.createTextElement({
      data: `小計${''.padStart(28 - priceTotalText.length, ' ')}${priceTotalText}\n`,
    });
    request += builder.createTextElement({ data: '\n' });
    const taxFreeTotalText = `¥${(Number(sale?.salesTaxFreeTotal) + 0).toLocaleString()}`;
    request += builder.createTextElement({
      data: `非課税対象${''.padStart(10 - taxFreeTotalText.length, ' ')}${taxFreeTotalText}\n`,
    });
    const reducedTotalText = `¥${(priceReducedTotal + 0).toLocaleString()}`;
    request += builder.createTextElement({
      data: `    8%対象${''.padStart(10 - reducedTotalText.length, ' ')}${reducedTotalText}`,
    });
    const reducedTaxText = `¥${(Number(sale?.taxReducedTotal) + 0).toLocaleString()}`;
    request += builder.createTextElement({
      data: ` 税${''.padStart(8 - reducedTaxText.length, ' ')}${reducedTaxText}\n`,
    });
    const normalTotalText = `¥${(priceNormalTotal + 0).toLocaleString()}`;
    request += builder.createTextElement({
      data: `   10%対象${''.padStart(10 - normalTotalText.length, ' ')}${normalTotalText}`,
    });
    const normalTaxText = `¥${(Number(sale?.taxNormalTotal) + 0).toLocaleString()}`;
    request += builder.createTextElement({
      data: ` 税${''.padStart(8 - normalTaxText.length, ' ')}${normalTaxText}\n`,
    });
    request += builder.createTextElement({ data: '\n' });
    const totalTitle = sale?.status === 'Return' ? 'ご返金' : '合計';
    const totalString = `¥${sale?.salesTotal.toLocaleString()}`;
    request += builder.createTextElement({ data: totalTitle });
    request += builder.createTextElement({
      data: `${''.padStart(31 - (totalTitle.length + totalString.length) * 2, ' ')}`,
    });
    request += builder.createTextElement({ emphasis: true });
    request += builder.createTextElement({ width: 2, data: `${totalString}\n` });
    request += builder.createTextElement({ width: 1 });
    request += builder.createTextElement({ emphasis: false });
    if (sale?.status === 'Sales' && saleDetails.some((detail) => detail.outputReceipt)) {
      const cashAmountText = `¥${sale?.cashAmount.toLocaleString()}`;
      request += builder.createTextElement({
        data: `お預かり${''.padStart(24 - cashAmountText.length, ' ')}${cashAmountText}\n`,
      });
      const changeText = `¥${(Number(sale?.cashAmount) - Number(sale?.salesTotal)).toLocaleString()}`;
      request += builder.createTextElement({
        data: `お釣り${''.padStart(26 - changeText.length, ' ')}${changeText}\n`,
      });
    }
    request += builder.createTextElement({ data: '\n' });
    request += builder.createTextElement({ data: '※印は、軽減税率対象商品です。\n' });
    request += builder.createTextElement({ data: '★印は、セルフメディケーション\n' });
    request += builder.createTextElement({ data: '税制対象製品です。\n' });
    request += builder.createTextElement({ data: '\n' });
    request += builder.createTextElement({ data: '\n' });
    request += builder.createTextElement({ characterspace: 0 });
    request += builder.createCutPaperElement({ feed: true });

    console.log(request);

    trader.sendMessage({ request: request });
  }
}
