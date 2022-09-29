import React, { useState, useEffect } from 'react';
import { Alert, Button, Card, Flex, Form, Modal, Table } from './components';
import firebaseError from './firebaseError';
import { Prescription } from './types';

type Props = {
  open: boolean;
  onClose: () => void;
};

const PrescriptionList: React.FC<Props> = ({ open, onClose }) => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [error, setError] = useState<string>('');

  const getPrescriptions = () => async () => {
    try {
      setError('');
      const prescriptions = (await window.electronAPI.getPrescriptions()) as Prescription[];
      if (prescriptions) {
        setPrescriptions(prescriptions);
      }
    } catch (error) {
      console.log({ error });
      setError(firebaseError(error));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    getPrescriptions();
  };

  useEffect(() => {
    getPrescriptions();
  }, [open]);

  return (
    <Modal open={open} size="none" onClose={onClose} className="w-full">
      <Modal.Header centered={false} onClose={onClose}>
        商品検索
      </Modal.Header>
      <Modal.Body>
        <Card className="mx-8 mb-2">
          <Flex justify_content="between" align_items="center" className="p-4">
            <Form onSubmit={handleSubmit}>
              <Flex>
                <Button variant="outlined" size="sm" className="mr-2" onClick={getPrescriptions()}>
                  更新
                </Button>
              </Flex>
            </Form>
          </Flex>
          <Card.Body className="p-4">
            {error && <Alert severity="error">{error}</Alert>}
            <div className="overflow-y-scroll" style={{ height: '24rem' }}>
              <Table border="row" className="table-fixed w-full text-xs">
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
                  {prescriptions.map((prescription, i) => {
                    return (
                      <Table.Row size="xs" className="hover:bg-gray-300" key={i}>
                        <Table.Cell>{prescription.sequence}</Table.Cell>
                        <Table.Cell className="truncate">{`${prescription.patientName}　${prescription.patientKana}`}</Table.Cell>
                        <Table.Cell className="text-right">{prescription.amount.toLocaleString()}</Table.Cell>
                        <Table.Cell>
                          <Button color="primary" size="xs">
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
        <Button color="secondary" variant="outlined" className="mr-3" onClick={onClose}>
          キャンセル
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PrescriptionList;
