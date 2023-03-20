import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Alert, Button, Card, Flex, Form, Table } from './components';
import { useAppContext } from './AppContext';
import { SaleLocal, SaleDetailLocal } from './realmConfig';
import { printReceipt as printReceiptEpson } from './eposPrinter';
import { printReceipt as printReceiptStar } from './starPrinter';
import Loader from './components/Loader';

const MAX_SEARCH = 50;

const ReceiptList: React.FC = () => {
  const { currentShop, printerType, printerBrand, inputMode } = useAppContext();
  const [sales, setSales] = useState<[string, SaleLocal, string][]>();
  const [dateTimeFrom, setDateTimeFrom] = useState<Date>();
  const [dateTimeTo, setDateTimeTo] = useState<Date>();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const querySales = useCallback(async () => {
    if (!currentShop) return;
    try {
      setError('');
      let conds = `shopCode == '${currentShop.code}' AND inputMode == '${inputMode}'`;
      let args = [];
      let paramIndex = 0;
      if (dateTimeFrom) {
        conds += ` AND createdAt >= $${paramIndex}`;
        args.push(dateTimeFrom);
        paramIndex += 1;
      }
      if (dateTimeTo) {
        conds += ` AND createdAt <= $${paramIndex}`;
        args.push(dateTimeTo);
      }
      const saleLocals = (await window.electronAPI.findSales(conds, ...args)) as SaleLocal[];
      const salesData = new Array<[string, SaleLocal, string]>();
      await Promise.all(
        saleLocals.map(async (sale) => {
          const saleDetailLocals = (await window.electronAPI.findSaleDetails(
            `saleId == '${sale.id}'`
          )) as SaleDetailLocal[];
          salesData.push([
            sale.id,
            sale,
            saleDetailLocals
              .map((detail) => {
                return detail.productName;
              })
              .join('、'),
          ]);
        })
      );
      if (salesData.length > MAX_SEARCH) {
        setSales(salesData.slice(0, MAX_SEARCH - 1));
      } else {
        setSales(salesData);
      }
    } catch (error) {
      setError(error);
    }
  }, [currentShop, dateTimeFrom, dateTimeTo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    querySales();
  };

  useEffect(() => {
    querySales();
  }, [querySales]);

  return (
    <Flex direction="col" justify_content="center" align_items="center" className="h-screen">
      {loading && <Loader />}
      <Flex justify_content="between" align_items="center" className="p-4">
        <Flex>
          <Form onSubmit={handleSubmit}>
            <Form.DateTime
              className="mr-2 inline"
              id="DateTimeFrom"
              size="sm"
              value={dateTimeFrom ? format(dateTimeFrom, "yyyy-MM-dd'T'HH:mm") : ''}
              onChange={(e) => {
                setDateTimeFrom(new Date(e.target.value));
              }}
            />
            〜
            <Form.DateTime
              className="ml-2 mr-2 inline"
              id="DateTimeTo"
              size="sm"
              value={dateTimeTo ? format(dateTimeTo, "yyyy-MM-dd'T'HH:mm") : ''}
              onChange={(e) => {
                setDateTimeTo(new Date(e.target.value));
              }}
            />
            <Button
              variant="outlined"
              size="sm"
              className="mr-2"
              onClick={async () => {
                await querySales();
              }}
            >
              検索
            </Button>
          </Form>
        </Flex>
      </Flex>
      <Card className="mx-8 mb-4">
        <Card.Body className="p-4">
          {error && <Alert severity="error">{error}</Alert>}
          <div className="overflow-y-scroll h-96">
            <Table border="row" className="table-fixed w-full text-sm">
              <Table.Head>
                <Table.Row>
                  <Table.Cell type="th" className="w-1/12">
                    No.
                  </Table.Cell>
                  <Table.Cell type="th" className="w-1/12" />
                  <Table.Cell type="th" className="w-2/12">
                    時間
                  </Table.Cell>
                  <Table.Cell type="th" className="w-2/12">
                    金額
                  </Table.Cell>
                  <Table.Cell type="th" className="w-1/12">
                    点数
                  </Table.Cell>
                  <Table.Cell type="th" className="w-3/12">
                    商品
                  </Table.Cell>
                  <Table.Cell type="th" className="w-2/12"></Table.Cell>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {sales &&
                  sales.map((data, index) => {
                    const [docId, saleData, productName] = data;
                    return (
                      <Table.Row className="hover:bg-gray-300" key={index}>
                        <Table.Cell>{index + 1}</Table.Cell>
                        <Table.Cell>{saleData?.status === 'Return' ? '返品' : ''}</Table.Cell>
                        <Table.Cell className="truncate">{`${saleData.createdAt?.toLocaleDateString()} ${saleData.createdAt?.toLocaleTimeString()}`}</Table.Cell>
                        <Table.Cell className="text-right">{saleData.salesTotal?.toLocaleString()}</Table.Cell>
                        <Table.Cell className="text-right">{saleData.detailsCount?.toLocaleString()}</Table.Cell>
                        <Table.Cell className="truncate">{productName}</Table.Cell>
                        <Table.Cell>
                          <Button
                            color="primary"
                            size="xs"
                            onClick={async () => {
                              setLoading(true);
                              if (printerType === 'Receipt') {
                                if (printerBrand === 'Star') {
                                  await printReceiptStar(
                                    saleData.id,
                                    () => {
                                      setLoading(false);
                                    },
                                    () => {
                                      setLoading(false);
                                    }
                                  );
                                } else if (printerBrand === 'Epson') {
                                  await printReceiptEpson(
                                    saleData.id,
                                    () => {
                                      setLoading(false);
                                    },
                                    () => {
                                      setLoading(false);
                                    }
                                  );
                                } else {
                                  alert('レシートプリンターが指定されていません。');
                                  setLoading(false);
                                }
                              } else {
                                await window.electronAPI.createReceiptWindow(saleData.id);
                                setLoading(false);
                              }
                            }}
                          >
                            印刷
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
      <div className="m-2">
        <Link to="/">
          <Button color="light" size="sm">
            戻る
          </Button>
        </Link>
      </div>
    </Flex>
  );
};

export default ReceiptList;
