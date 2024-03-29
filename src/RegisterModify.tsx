import React, { useState, useEffect } from 'react';
import { Button, Form, Modal, Table, NumberPad } from './components';
import { useAppContext } from './AppContext';
import { BasketItem } from './types';
import { toNumber, OTC_DIVISION } from './tools';

type Props = {
  open: boolean;
  itemIndex: number;
  basketItems: BasketItem[];
  setBasketItems: React.Dispatch<React.SetStateAction<BasketItem[]>>;
  onClose: () => void;
};

const RegisterModify: React.FC<Props> = ({ open, itemIndex, basketItems, setBasketItems, onClose }) => {
  const [priceText, setPriceText] = useState<string>('');
  const [quantityText, setQuantityText] = useState<string>('1');
  const [discountText, setDiscountText] = useState<string>('0');
  const [rateText, setRateText] = useState<string>('0');
  const [inputFocus, setInputFocus] = useState<string>('');
  const { addBundleDiscount, numberPad } = useAppContext();

  useEffect(() => {
    const sellingPrice = basketItems[itemIndex]?.product.sellingPrice;
    const zeroPrice = basketItems[itemIndex]?.zeroPrice;
    const inputPrice = document.getElementById('inputPrice') as HTMLInputElement;
    if (inputPrice) inputPrice.value = String(sellingPrice);
    setPriceText(String(sellingPrice));
    const inputQuantity = document.getElementById('inputQuantity') as HTMLInputElement;
    if (inputQuantity) inputQuantity.value = String(basketItems[itemIndex]?.quantity);
    // if (sellingPrice === 0 && !zeroPrice) {
    //   inputPrice?.focus();
    //   inputPrice?.select();
    // } else {
    //   inputQuantity?.focus();
    //   inputQuantity?.select();
    // }
    inputQuantity?.focus();
    inputQuantity?.select();
    if (numberPad) {
      setInputFocus('inputQuantity');
    }
    setQuantityText(String(basketItems[itemIndex]?.quantity));
  }, [open, basketItems, itemIndex]);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (basketItems[itemIndex]) {
      const existingIndex = basketItems.findIndex((item) => item.product.code === basketItems[itemIndex].product.code);
      if (existingIndex >= 0) {
        basketItems[existingIndex].product.sellingPrice = toNumber(priceText);
        basketItems[existingIndex].quantity = toNumber(quantityText);
        if (toNumber(priceText) === 0) {
          basketItems[existingIndex].zeroPrice = true;
        }
        if (toNumber(discountText) > 0 || toNumber(rateText) > 0) {
          let discountName = '値引き';
          let discountPrice = 0;
          if (toNumber(discountText) > 0) {
            discountPrice = -toNumber(discountText);
          } else {
            discountName += `(${toNumber(rateText)}%)`;
            discountPrice = -Math.floor(
              (Number(basketItems[itemIndex].product.sellingPrice) * toNumber(rateText)) / 100.0
            );
          }
          const discountItem: any = {
            product: {
              abbr: '',
              code: '',
              kana: '',
              name: discountName,
              hidden: false,
              costPrice: null,
              avgCostPrice: null,
              sellingPrice: discountPrice,
              stockTaxClass: null,
              sellingTaxClass: basketItems[itemIndex].product.sellingTaxClass,
              stockTax: null,
              sellingTax: basketItems[itemIndex].product.sellingTax,
              selfMedication: false,
              supplierRef: null,
              categoryRef: null,
              note: '',
            },
            division: OTC_DIVISION,
            outputReceipt: true,
            quantity: 1,
          };

          if (basketItems[existingIndex + 1] && !basketItems[existingIndex + 1].product.code) {
            basketItems.splice(existingIndex + 1, 1, discountItem);
          } else {
            basketItems.splice(existingIndex + 1, 0, discountItem);
          }
        }
        setBasketItems(addBundleDiscount(basketItems));
      }
    }
    setDiscountText('0');
    setRateText('0');
    onClose();
  };

  return (
    <Modal open={open && !!basketItems[itemIndex]} size="none" onClose={onClose} className="w-1/2">
      <Modal.Header centered={false} onClose={onClose}>
        明細修正
      </Modal.Header>
      <Modal.Body>
        <Table border="row" className="table-fixed w-full">
          <Table.Body>
            <Table.Row>
              <Table.Cell type="th" className="w-1/3">
                商品名
              </Table.Cell>
              <Table.Cell className="w-2/3">{basketItems[itemIndex]?.product.name}</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell type="th" className="w-1/3">
                単価{' '}
                {toNumber(basketItems[itemIndex]?.product.sellingPrice) === 0 && (
                  <span className="text-red-500 font-bold ml-2">0が設定されています!</span>
                )}
              </Table.Cell>
              <Table.Cell className="w-2/3">
                <Form onSubmit={save} className="space-y-2">
                  <Form.Text
                    id="inputPrice"
                    placeholder="単価"
                    value={priceText}
                    disabled={true}
                    onChange={(e) => setPriceText(e.target.value)}
                    onBlur={() => setPriceText(toNumber(priceText).toString())}
                    className="text-right w-full"
                  />
                </Form>
              </Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell type="th" className="w-1/3">
                数量
              </Table.Cell>
              <Table.Cell className="w-2/3">
                <Form
                  onSubmit={(e) => {
                    if (numberPad) {
                      e.preventDefault();
                    } else {
                      save(e);
                    }
                  }}
                  className="space-y-2"
                >
                  {numberPad ? (
                    <NumberPad
                      id="inputQuantity"
                      value={quantityText}
                      setValue={setQuantityText}
                      inputFocus={inputFocus}
                      setInputFocus={setInputFocus}
                    />
                  ) : (
                    <Form.Text
                      id="inputQuantity"
                      placeholder="数量"
                      value={quantityText}
                      onChange={(e) => setQuantityText(e.target.value)}
                      onBlur={() => setQuantityText(toNumber(quantityText).toString())}
                      className="text-right w-full"
                    />
                  )}
                </Form>
              </Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell type="th" className="w-1/3">
                値引き(金額)
              </Table.Cell>
              <Table.Cell className="w-2/3">
                <Form
                  onSubmit={(e) => {
                    if (numberPad) {
                      e.preventDefault();
                    } else {
                      save(e);
                    }
                  }}
                  className="space-y-2"
                >
                  {numberPad ? (
                    <NumberPad
                      id="inputDiscount"
                      value={discountText}
                      setValue={setDiscountText}
                      inputFocus={inputFocus}
                      setInputFocus={setInputFocus}
                    />
                  ) : (
                    <Form.Text
                      id="inputDiscount"
                      placeholder="値引き(金額)"
                      value={discountText}
                      onChange={(e) => setDiscountText(e.target.value)}
                      onBlur={() => setDiscountText(toNumber(discountText).toString())}
                      className="text-right w-full"
                    />
                  )}
                </Form>
              </Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell type="th" className="w-1/3">
                値引き(%)
              </Table.Cell>
              <Table.Cell className="w-2/3">
                <Form
                  onSubmit={(e) => {
                    if (numberPad) {
                      e.preventDefault();
                    } else {
                      save(e);
                    }
                  }}
                  className="space-y-2"
                >
                  {numberPad ? (
                    <NumberPad
                      id="inputRate"
                      value={rateText}
                      setValue={setRateText}
                      inputFocus={inputFocus}
                      setInputFocus={setInputFocus}
                    />
                  ) : (
                    <Form.Text
                      id="inputRate"
                      placeholder="値引き(%)"
                      value={rateText}
                      onChange={(e) => setRateText(e.target.value)}
                      onBlur={() => setRateText(toNumber(rateText).toString())}
                      className="text-right w-full"
                    />
                  )}
                </Form>
              </Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>
      </Modal.Body>
      <Modal.Footer className="flex justify-end space-x-2">
        <Button color="primary" disabled={toNumber(quantityText) <= 0} onClick={save}>
          OK
        </Button>
        <Button
          color="secondary"
          variant="outlined"
          onClick={() => {
            if (toNumber(priceText) === 0) {
              basketItems[itemIndex].zeroPrice = true;
            }
            onClose();
          }}
        >
          キャンセル
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default RegisterModify;
