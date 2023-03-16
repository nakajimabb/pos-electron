import React, { useState, useEffect } from 'react';
import { Button, Form, Modal, Table, NumberPad } from './components';
import { useAppContext } from './AppContext';
import { BasketItem } from './types';
import { RegisterItemLocal } from './realmConfig';
import { toNumber } from './tools';

type Props = {
  open: boolean;
  registerItem: RegisterItemLocal | undefined;
  basketItems: BasketItem[];
  setBasketItems: React.Dispatch<React.SetStateAction<BasketItem[]>>;
  onClose: () => void;
};

const RegisterInput: React.FC<Props> = ({ open, registerItem, basketItems, setBasketItems, onClose }) => {
  const [priceText, setPriceText] = useState<string>('0');
  const [inputFocus, setInputFocus] = useState<string>('');
  const { addBundleDiscount, fixedCostRates, numberPad } = useAppContext();

  useEffect(() => {
    const inputPrice = document.getElementById('inputPrice') as HTMLInputElement;
    if (inputPrice && registerItem) inputPrice.value = toNumber(String(registerItem.defaultPrice)).toString();
    inputPrice?.focus();
    inputPrice?.select();
    if (numberPad) {
      setInputFocus('inputPrice');
      if (registerItem) setPriceText(toNumber(String(registerItem.defaultPrice)).toString());
    }
  }, [open, registerItem]);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const inputPrice = document.getElementById('inputPrice') as HTMLInputElement;
    const price = toNumber(inputPrice.value);
    if (registerItem && price !== 0) {
      const existingRateIndex = fixedCostRates.findIndex((rate) => rate.productCode === registerItem.code);
      const costPrice =
        existingRateIndex >= 0 ? Math.floor((price * fixedCostRates[existingRateIndex].rate) / 100) : null;
      const basketItem: any = {
        product: {
          abbr: '',
          code: registerItem.code,
          kana: '',
          name: registerItem.name,
          hidden: false,
          costPrice: costPrice,
          avgCostPrice: null,
          sellingPrice: price,
          stockTaxClass: null,
          sellingTaxClass: registerItem.taxClass,
          stockTax: null,
          sellingTax: registerItem.tax,
          selfMedication: false,
          supplierRef: null,
          categoryRef: null,
          note: '',
        },
        division: registerItem.division,
        outputReceipt: registerItem.outputReceipt,
        quantity: 1,
      };
      setBasketItems(addBundleDiscount([...basketItems, basketItem]));
    }
    setPriceText('0');
    onClose();
  };

  return (
    <Modal open={open && !!registerItem} size="none" onClose={onClose} className={numberPad ? 'w-1/2' : 'w-1/3'}>
      <Modal.Header centered={false} onClose={onClose}>
        {`${registerItem?.index}. ${registerItem?.name}`}
      </Modal.Header>
      <Modal.Body>
        <Table border="row" className="table-fixed w-full">
          <Table.Body>
            <Table.Row>
              <Table.Cell type="th" className="w-1/3">
                金額
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
                      id="inputPrice"
                      value={priceText}
                      setValue={setPriceText}
                      inputFocus={inputFocus}
                      setInputFocus={setInputFocus}
                    ></NumberPad>
                  ) : (
                    <Form.Text
                      id="inputPrice"
                      placeholder="金額"
                      value={priceText}
                      onChange={(e) => setPriceText(e.target.value)}
                      onBlur={() => setPriceText(toNumber(priceText).toString())}
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
        <Button color="primary" onClick={save}>
          OK
        </Button>
        <Button color="secondary" variant="outlined" onClick={onClose}>
          キャンセル
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default RegisterInput;
