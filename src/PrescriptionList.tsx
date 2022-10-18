import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Alert, Button, Card, Modal, Table, Tabs } from './components';
import { BasketItem, Prescription } from './types';

type Props = {
  open: boolean;
  basketItems: BasketItem[];
  setBasketItems: React.Dispatch<React.SetStateAction<BasketItem[]>>;
  onClose: () => void;
};

const PrescriptionList: React.FC<Props> = ({ open, basketItems, setBasketItems, onClose }) => {
  const [tab, setTab] = useState('unfixed');
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [fixedPrescriptions, setFixedPrescriptions] = useState<Prescription[]>([]);
  const [error, setError] = useState<string>('');

  const getPrescriptions = async () => {
    try {
      setError('');
      const status = await window.electronAPI.getRegisterStatus();
      const dateString = status ? status.dateString : format(new Date(), 'yyyyMMdd');
      const prescriptions = (await window.electronAPI.getPrescriptions(dateString)) as Prescription[];
      const fixedPrescriptions = (await window.electronAPI.getFixedPrescriptions(dateString)) as Prescription[];
      const basketPrescriptions = basketItems.filter((item) => item.prescription).map((item) => item.prescription);
      if (prescriptions) {
        const unfixedPrescriptions = prescriptions.filter((prescription) => {
          return (
            fixedPrescriptions.every((fp) => fp.code !== prescription.code) &&
            basketPrescriptions.every((bp) => bp.code !== prescription.code)
          );
        });
        setPrescriptions(unfixedPrescriptions);
      }
      setFixedPrescriptions(fixedPrescriptions);
    } catch (error) {
      setError(error);
    }
  };

  const save = async (prescription: Prescription) => {
    const registerItem = await window.electronAPI.findRegisterItemByPk(1);
    if (registerItem) {
      const basketItem: any = {
        product: {
          abbr: '',
          code: registerItem.code,
          kana: '',
          name: registerItem.name,
          hidden: false,
          costPrice: null,
          avgCostPrice: null,
          sellingPrice: prescription.amount,
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
        prescription,
      };
      setBasketItems([...basketItems, basketItem]);
    }
    onClose();
  };

  useEffect(() => {
    getPrescriptions();
  }, [open]);

  return (
    <Modal open={open} size="none" onClose={onClose} className="w-2/3">
      <Modal.Body>
        <Card className="mx-8 mb-2">
          <Tabs value={tab} variant="bar" size="sm" onChange={(v) => setTab(v)} className="w-full">
            <Tabs.Tab label="未精算" value="unfixed" />
            <Tabs.Tab label="精算済み" value="fixed" />
          </Tabs>
          <Card.Body className="px-4 py-2">
            {error && <Alert severity="error">{error}</Alert>}
            <div className="overflow-y-scroll" style={{ height: '24rem' }}>
              <Table border="row" className="table-fixed w-full text-md">
                <Table.Head>
                  <Table.Row size="xs">
                    <Table.Cell type="th" className="w-2/12">
                      受付番号
                    </Table.Cell>
                    <Table.Cell type="th" className="w-6/12">
                      患者名
                    </Table.Cell>
                    <Table.Cell type="th" className="w-2/12">
                      金額
                    </Table.Cell>
                    <Table.Cell type="th" className="w-2/12"></Table.Cell>
                  </Table.Row>
                </Table.Head>
                <Table.Body>
                  {tab === 'unfixed'
                    ? prescriptions.map((prescription, i) => {
                        return (
                          <Table.Row size="xs" className="hover:bg-gray-300" key={i}>
                            <Table.Cell>{prescription.sequence}</Table.Cell>
                            <Table.Cell className="truncate">{`${prescription.patientName}　${prescription.patientKana}`}</Table.Cell>
                            <Table.Cell className="text-right">{prescription.amount?.toLocaleString()}</Table.Cell>
                            <Table.Cell>
                              <Button
                                color="primary"
                                size="xs"
                                onClick={() => {
                                  save(prescription);
                                }}
                              >
                                選択
                              </Button>
                            </Table.Cell>
                          </Table.Row>
                        );
                      })
                    : fixedPrescriptions.map((prescription, i) => {
                        return (
                          <Table.Row size="xs" className="hover:bg-gray-300" key={i}>
                            <Table.Cell>{prescription.sequence}</Table.Cell>
                            <Table.Cell className="truncate">{`${prescription.patientName}　${prescription.patientKana}`}</Table.Cell>
                            <Table.Cell className="text-right">{prescription.amount?.toLocaleString()}</Table.Cell>
                            <Table.Cell>
                              <Button color="primary" size="xs" disabled={true}>
                                選択
                              </Button>
                            </Table.Cell>
                          </Table.Row>
                        );
                      })}
                </Table.Body>
              </Table>
            </div>
          </Card.Body>
        </Card>
      </Modal.Body>
      <Modal.Footer className="flex justify-end">
        <Button variant="outlined" size="sm" className="mr-2" onClick={getPrescriptions}>
          更新
        </Button>
        <Button color="secondary" variant="outlined" className="mr-3" onClick={onClose}>
          キャンセル
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PrescriptionList;
