import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { startOfToday, startOfTomorrow } from 'date-fns';
import { Button, Flex, Table } from './components';
import { useAppContext } from './AppContext';
import { SaleLocal, SaleDetailLocal, RegisterStatusLocal } from './realmConfig';

const DailyJournal: React.FC = () => {
  const { currentShop, inputMode } = useAppContext();
  const [completed, setCompleted] = useState<boolean>(false);
  const [sales, setSales] = useState<[string, SaleLocal, SaleDetailLocal[]][]>();
  const [registerStatus, setRegisterStatus] = useState<RegisterStatusLocal>();
  const componentRef = useRef(null);
  const [reportDateTime, setReportDateTime] = useState<Date>(new Date());

  const getRegisterStatus = useCallback(async () => {
    const status = await window.electronAPI.getRegisterStatus();
    if (status) {
      if (status.closedAt) {
        setReportDateTime(status.closedAt);
      }
      setRegisterStatus(status);
    }
  }, [currentShop, setReportDateTime, setRegisterStatus]);

  const querySales = useCallback(async () => {
    if (completed) return;
    if (!currentShop) return;
    try {
      let conds = `shopCode == '${currentShop.code} AND inputMode == '${inputMode}'`;
      let args = [];
      let paramIndex = 0;

      if (registerStatus) {
        conds += ` AND createdAt >= $${paramIndex}`;
        args.push(registerStatus.openedAt);
        paramIndex += 1;
        if (registerStatus.closedAt) {
          conds += ` AND createdAt < $${paramIndex}`;
          args.push(registerStatus.closedAt);
          paramIndex += 1;
        }
      } else {
        conds += ` AND createdAt >= $${paramIndex}`;
        args.push(startOfToday());
        paramIndex += 1;
        conds += ` AND createdAt < $${paramIndex}`;
        args.push(startOfTomorrow());
        paramIndex += 1;
      }
      const saleLocals = (await window.electronAPI.findSales(conds, ...args)) as SaleLocal[];
      saleLocals.sort((saleA, saleB) => {
        return saleA.createdAt > saleB.createdAt ? 1 : -1;
      });
      const salesData = new Array<[string, SaleLocal, SaleDetailLocal[]]>();
      await Promise.all(
        saleLocals.map(async (sale) => {
          const saleDetailLocals = (await window.electronAPI.findSaleDetails(
            `saleId == '${sale.id}'`
          )) as SaleDetailLocal[];
          salesData.push([sale.id, sale, saleDetailLocals]);
        })
      );
      setSales(salesData);
      setCompleted(true);
    } catch (error) {
      console.log({ error });
      setCompleted(true);
    }
  }, [completed, currentShop, registerStatus]);

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });

  useEffect(() => {
    let unmounted = false;
    (async () => {
      if (!unmounted) {
        getRegisterStatus();
        querySales();
      }
    })();
    return () => {
      unmounted = true;
    };
  }, [getRegisterStatus, querySales]);

  return (
    <Flex direction="col" justify_content="center" align_items="center" className="h-screen">
      <div className="mt-16 mb-2 w-1/2">
        <Flex justify_content="center" align_items="center">
          <div>
            ジャーナル
            <Button color="primary" size="xs" className="ml-4" onClick={handlePrint}>
              印刷
            </Button>
          </div>
        </Flex>
      </div>
      <div className="w-1/2 overflow-y-scroll border border-solid" style={{ height: '40rem' }}>
        <div ref={componentRef} className="p-10">
          <p className="text-right text-xs mb-4">
            {currentShop?.formalName}　{reportDateTime.toLocaleDateString()} {reportDateTime.toLocaleTimeString()}
          </p>

          {sales &&
            sales.map((data, index) => {
              const [docId, saleData, saleDetails] = data;
              const registerSign = saleData.status === 'Return' ? -1 : 1;
              const rows = [
                <Table.Row className="hover:bg-yellow-500" key={docId}>
                  <Table.Cell className="w-2/12">{saleData.status === 'Return' ? '返品' : '売上'}</Table.Cell>
                  <Table.Cell className="w-4/12">{saleData.createdAt.toLocaleTimeString()}</Table.Cell>
                  <Table.Cell className="w-2/12 text-right"></Table.Cell>
                  <Table.Cell className="w-2/12 text-right"></Table.Cell>
                  <Table.Cell className="w-2/12 text-right"></Table.Cell>
                </Table.Row>,
              ];

              let priceTotal = 0;
              let normalTotal = 0;
              let reducedTotal = 0;

              saleDetails?.forEach((saleDetail, index) => {
                priceTotal += Number(saleDetail.sellingPrice) * saleDetail.quantity;
                if (saleDetail.sellingTaxClass === 'exclusive') {
                  if (saleDetail.sellingTax) {
                    if (saleDetail.sellingTax === 10) {
                      normalTotal += Number(saleDetail.sellingPrice) * saleDetail.quantity;
                    } else if (saleDetail.sellingTax === 8) {
                      reducedTotal += Number(saleDetail.sellingPrice) * saleDetail.quantity;
                    }
                  }
                }
                rows.push(
                  <Table.Row className="hover:bg-yellow-500" key={`${docId}${index}`}>
                    <Table.Cell></Table.Cell>
                    <Table.Cell>{saleDetail.productName}</Table.Cell>
                    <Table.Cell className="text-right">
                      {saleDetail.productCode ? saleDetail.quantity : null}
                    </Table.Cell>
                    <Table.Cell className="text-right">
                      {saleDetail.productCode
                        ? `¥${(Number(saleDetail.sellingPrice) * registerSign)?.toLocaleString()}`
                        : null}
                    </Table.Cell>
                    <Table.Cell className="text-right">
                      ¥{(Number(saleDetail.sellingPrice) * saleDetail.quantity * registerSign)?.toLocaleString()}
                    </Table.Cell>
                  </Table.Row>
                );
              });
              const total =
                (priceTotal + Math.floor((normalTotal * 10) / 100) + Math.floor((reducedTotal * 8) / 100)) *
                registerSign;
              rows.push(
                <Table.Row className="hover:bg-yellow-500" key={`${docId}Total`}>
                  <Table.Cell></Table.Cell>
                  <Table.Cell></Table.Cell>
                  <Table.Cell className="text-right"></Table.Cell>
                  <Table.Cell className="text-right">合計</Table.Cell>
                  <Table.Cell className="text-right">¥{total.toLocaleString()}</Table.Cell>
                </Table.Row>
              );
              if (saleData.status !== 'Return') {
                rows.push(
                  <Table.Row className="hover:bg-yellow-500" key={`${docId}CashAmount`}>
                    <Table.Cell></Table.Cell>
                    <Table.Cell></Table.Cell>
                    <Table.Cell className="text-right"></Table.Cell>
                    <Table.Cell className="text-right">
                      {saleData.paymentType === 'Credit' ? 'クレジット' : '預り金'}
                    </Table.Cell>
                    <Table.Cell className="text-right">¥{saleData.cashAmount.toLocaleString()}</Table.Cell>
                  </Table.Row>
                );
                if (saleData.paymentType !== 'Credit') {
                  rows.push(
                    <Table.Row className="hover:bg-yellow-500" key={`${docId}Change`}>
                      <Table.Cell></Table.Cell>
                      <Table.Cell></Table.Cell>
                      <Table.Cell className="text-right"></Table.Cell>
                      <Table.Cell className="text-right">お釣り</Table.Cell>
                      <Table.Cell className="text-right">¥{(saleData.cashAmount - total).toLocaleString()}</Table.Cell>
                    </Table.Row>
                  );
                }
              }
              return (
                <div className="my-2 border-b-2" style={{ breakInside: 'avoid' }} key={index}>
                  <Table border="none" size="xs" className="table-fixed w-full text-xs shadow-none">
                    <Table.Body>{rows}</Table.Body>
                  </Table>
                </div>
              );
            })}
        </div>
      </div>
      <div className="m-4">
        <Link to="/">
          <Button color="light" size="sm">
            戻る
          </Button>
        </Link>
      </div>
    </Flex>
  );
};

export default DailyJournal;
