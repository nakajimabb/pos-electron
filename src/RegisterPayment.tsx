import React, { useState, useEffect } from 'react';
import { Button, Form, Modal, Table } from './components';
import { useAppContext } from './AppContext';
import { BasketItem } from './types';
import { SaleLocal, SaleDetailLocal } from './realmConfig';
import { createId, toNumber } from './tools';

type Props = {
  open: boolean;
  registerMode: 'Sales' | 'Return';
  paymentType: 'Cash' | 'Credit';
  basketItems: BasketItem[];
  setBasketItems: React.Dispatch<React.SetStateAction<BasketItem[]>>;
  setRegisterMode: React.Dispatch<React.SetStateAction<'Sales' | 'Return'>>;
  onClose: () => void;
};

const RegisterPayment: React.FC<Props> = ({
  open,
  registerMode,
  paymentType,
  basketItems,
  setBasketItems,
  setRegisterMode,
  onClose,
}) => {
  const { currentShop } = useAppContext();
  const [cashText, setCashText] = useState<string>('0');
  const registerSign = registerMode === 'Return' ? -1 : 1;

  const save = async () => {
    if (!currentShop) return;
    const newId = createId();
    const receiptNumber = new Date().getTime();
    const sale: SaleLocal = {
      id: newId,
      receiptNumber,
      shopCode: currentShop.code,
      createdAt: new Date(),
      detailsCount: basketItems.filter((item) => !!item.product.code).length,
      salesTotal: salesExceptHidden,
      taxTotal: exclusiveTaxNormalTotal + inclusiveTaxNormalTotal + exclusiveTaxReducedTotal + inclusiveTaxReducedTotal,
      discountTotal: 0,
      paymentType,
      cashAmount: toNumber(cashText),
      salesTaxFreeTotal: priceTaxFreeTotal,
      salesNormalTotal: priceNormalTotal + exclusiveTaxNormalTotal,
      salesReducedTotal: priceReducedTotal + exclusiveTaxReducedTotal,
      taxNormalTotal: exclusiveTaxNormalTotal + inclusiveTaxNormalTotal,
      taxReducedTotal: exclusiveTaxReducedTotal + inclusiveTaxReducedTotal,
      status: registerMode,
    };

    let discountTotal = 0;
    const details: SaleDetailLocal[] = [];
    basketItems.forEach((item, index) => {
      const detail: SaleDetailLocal = {
        saleId: newId,
        index: index,
        productCode: item.product.code,
        productName: item.product.name ?? '',
        abbr: item.product.abbr ?? '',
        kana: item.product.kana ?? '',
        note: item.product.note ?? '',
        hidden: item.product.hidden ?? false,
        unregistered: item.product.unregistered ?? false,
        sellingPrice: item.product.sellingPrice ?? 0,
        costPrice: item.product.costPrice ?? 0,
        avgCostPrice: item.product.avgCostPrice ?? 0,
        sellingTaxClass: item.product.sellingTaxClass ?? null,
        stockTaxClass: item.product.stockTaxClass ?? null,
        sellingTax: item.product.sellingTax ?? null,
        stockTax: item.product.stockTax ?? null,
        selfMedication: item.product.selfMedication ?? false,
        supplierCode: item.product.supplierCode,
        noReturn: item.product.noReturn ?? false,
        division: item.division,
        quantity: item.quantity,
        discount: 0,
        outputReceipt: item.outputReceipt,
        status: registerMode,
      };
      details.push(detail);

      if (!item.product.code && item.product.sellingPrice) {
        const prevDetail = details[index - 1];
        prevDetail.discount = -item.product.sellingPrice;
        discountTotal += -item.product.sellingPrice;
      }
      sale.discountTotal = discountTotal;
    });
    await window.electronAPI.createSaleWithDetails(sale, details);
    if (basketItems.some((item) => item.outputReceipt)) {
      await window.electronAPI.createReceiptWindow(sale.id);
    }
    // await window.electronAPI.syncFirestore(currentShop.code);
  };

  const priceNormalTotal = ((items: BasketItem[]) => {
    return (
      items
        .filter((item) => item.outputReceipt && item.product.sellingTax === 10)
        .reduce((result, item) => result + Number(item.product.sellingPrice) * item.quantity, 0) * registerSign
    );
  })(basketItems);

  const priceReducedTotal = ((items: BasketItem[]) => {
    return (
      items
        .filter((item) => item.outputReceipt && item.product.sellingTax === 8)
        .reduce((result, item) => result + Number(item.product.sellingPrice) * item.quantity, 0) * registerSign
    );
  })(basketItems);

  const priceTaxFreeTotal = ((items: BasketItem[]) => {
    return (
      items
        .filter((item) => item.outputReceipt && item.product.sellingTax === 0)
        .reduce((result, item) => result + Number(item.product.sellingPrice) * item.quantity, 0) * registerSign
    );
  })(basketItems);

  const exclusiveTaxNormalTotal = ((items: BasketItem[]) => {
    return (
      Math.floor(
        (items
          .filter(
            (item) =>
              item.outputReceipt && item.product.sellingTaxClass === 'exclusive' && item.product.sellingTax === 10
          )
          .reduce((result, item) => result + Number(item.product.sellingPrice) * item.quantity, 0) *
          10) /
          100
      ) * registerSign
    );
  })(basketItems);

  const inclusiveTaxNormalTotal = ((items: BasketItem[]) => {
    return (
      Math.floor(
        (items
          .filter(
            (item) =>
              item.outputReceipt && item.product.sellingTaxClass === 'inclusive' && item.product.sellingTax === 10
          )
          .reduce((result, item) => result + Number(item.product.sellingPrice) * item.quantity, 0) *
          10) /
          (100 + 10)
      ) * registerSign
    );
  })(basketItems);

  const exclusiveTaxReducedTotal = ((items: BasketItem[]) => {
    return (
      Math.floor(
        (items
          .filter(
            (item) =>
              item.outputReceipt && item.product.sellingTaxClass === 'exclusive' && item.product.sellingTax === 8
          )
          .reduce((result, item) => result + Number(item.product.sellingPrice) * item.quantity, 0) *
          8) /
          100
      ) * registerSign
    );
  })(basketItems);

  const inclusiveTaxReducedTotal = ((items: BasketItem[]) => {
    return (
      Math.floor(
        (items
          .filter(
            (item) =>
              item.outputReceipt && item.product.sellingTaxClass === 'inclusive' && item.product.sellingTax === 8
          )
          .reduce((result, item) => result + Number(item.product.sellingPrice) * item.quantity, 0) *
          8) /
          (100 + 8)
      ) * registerSign
    );
  })(basketItems);

  const salesTotal = ((items: BasketItem[]) => {
    return (
      items.reduce((result, item) => result + Number(item.product.sellingPrice) * item.quantity, 0) * registerSign +
      exclusiveTaxReducedTotal +
      exclusiveTaxNormalTotal
    );
  })(basketItems);

  const salesExceptHidden = ((items: BasketItem[]) => {
    return (
      items
        .filter((item) => item.outputReceipt)
        .reduce((result, item) => result + Number(item.product.sellingPrice) * item.quantity, 0) *
        registerSign +
      exclusiveTaxReducedTotal +
      exclusiveTaxNormalTotal
    );
  })(basketItems);

  useEffect(() => {
    if (registerMode === 'Return') {
      setCashText((-salesTotal).toString());
    } else {
      setCashText(salesTotal.toString());
    }
    const inputCash = document.getElementById('inputCash') as HTMLInputElement;
    inputCash?.focus();
    inputCash?.select();
  }, [open, registerMode, paymentType, salesTotal]);

  return (
    <Modal open={open} size="none" onClose={onClose} className="w-1/3">
      <Modal.Header
        centered={false}
        onClose={onClose}
        className={paymentType === 'Cash' ? 'bg-blue-200' : 'bg-green-200'}
      >
        {registerMode === 'Return' ? '返品' : 'お会計'}
        {paymentType === 'Cash' ? '（現金）' : '（クレジット）'}
      </Modal.Header>
      <Modal.Body>
        <Table border="row" className="table-fixed w-full">
          <Table.Body>
            <Table.Row>
              <Table.Cell type="th" className="text-xl bg-red-100">
                {registerMode === 'Return' ? 'ご返金' : '合計'}
              </Table.Cell>
              <Table.Cell className="text-right text-xl pr-4">¥{salesTotal.toLocaleString()}</Table.Cell>
            </Table.Row>
            <Table.Row className={registerMode === 'Return' ? 'hidden' : ''}>
              <Table.Cell type="th">お預かり</Table.Cell>
              <Table.Cell>
                <Form className="space-y-2">
                  <Form.Text
                    id="inputCash"
                    placeholder="金額"
                    value={cashText}
                    onChange={(e) => setCashText(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (toNumber(cashText) >= salesTotal) {
                          save();
                          setBasketItems([]);
                          setRegisterMode('Sales');
                          onClose();
                        }
                      }
                    }}
                    onBlur={() => setCashText(toNumber(cashText).toString())}
                    className="text-right w-full"
                  />
                </Form>
              </Table.Cell>
            </Table.Row>
            <Table.Row className={registerMode === 'Return' ? 'hidden' : ''}>
              <Table.Cell type="th">お釣り</Table.Cell>
              <Table.Cell className="text-right pr-4">
                ¥{toNumber(cashText) < salesTotal ? '0' : (toNumber(cashText) - salesTotal).toLocaleString()}
              </Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>
      </Modal.Body>
      <Modal.Footer className="flex justify-end">
        <Button color="secondary" variant="outlined" className="mr-3" onClick={onClose}>
          キャンセル
        </Button>
        <Button
          onClick={(e) => {
            save();
            setBasketItems([]);
            setRegisterMode('Sales');
            onClose();
          }}
          color="primary"
          disabled={toNumber(cashText) < salesTotal}
        >
          レシート発行
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default RegisterPayment;
