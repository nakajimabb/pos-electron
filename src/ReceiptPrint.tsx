import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Flex, Table } from './components';
import { SaleLocal, SaleDetailLocal } from './realmConfig';
import { prefectureName } from './prefecture';
import { Shop } from './types';

const ReceiptPrint: React.FC = () => {
  const [shop, setShop] = useState<Shop>();
  const [sale, setSale] = useState<SaleLocal>();
  const [saleDetails, setSaleDetails] = useState<SaleDetailLocal[]>([]);
  const params = useLocation().search;

  useEffect(() => {
    const querySales = async () => {
      const query = new URLSearchParams(params);
      const id = query.get('id');
      const saleLocal = await window.electronAPI.findSaleByPk(id);
      if (saleLocal) {
        setSale(saleLocal);
        const saleDetailLocals = (await window.electronAPI.findSaleDetails(
          `saleId == '${saleLocal.id}'`
        )) as SaleDetailLocal[];
        setSaleDetails(saleDetailLocals);
        const shopData = await window.electronAPI.findShopByPk(saleLocal.shopCode);
        setShop(shopData);
      }
    };
    querySales();
  }, []);

  useEffect(() => {
    if (sale && shop) {
      window.electronAPI.printContents();
    }
  }, [sale, shop]);

  const registerSign = sale?.status === 'Return' ? -1 : 1;

  return (
    <div className="p-10">
      <p className="text-right text-sm mt-2">
        {sale?.createdAt?.toLocaleDateString()} {sale?.createdAt?.toLocaleTimeString()}
      </p>
      <p className="text-right text-sm mt-2">
        {shop ? prefectureName(shop.prefecture) : ''}
        {shop?.municipality}
        {shop?.houseNumber}
        {shop?.buildingName}
      </p>
      <p className="text-right text-sm mt-2">{shop?.formalName}</p>
      <p className="text-center text-xl font-bold m-2">{sale?.status === 'Return' ? '返品' : '領収書'}</p>
      <Table border="cell" className="table-fixed w-full text-sm shadow-none">
        <Table.Head>
          <Table.Row>
            <Table.Cell type="th" className="w-1/12" />
            <Table.Cell type="th" className="w-5/12">
              商品名
            </Table.Cell>
            <Table.Cell type="th" className="w-2/12">
              数量
            </Table.Cell>
            <Table.Cell type="th" className="w-2/12">
              単価
            </Table.Cell>
            <Table.Cell type="th" className="w-2/12">
              金額
            </Table.Cell>
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {saleDetails
            ?.filter((saleDetail) => saleDetail.outputReceipt)
            ?.map((saleDetail, index) => (
              <Table.Row key={index}>
                <Table.Cell>
                  {saleDetail.selfMedication ? '★' : ''}
                  {saleDetail.sellingTax === 8 ? '軽' : ''}
                </Table.Cell>
                <Table.Cell>{saleDetail.productName}</Table.Cell>
                <Table.Cell className="text-right">{saleDetail.productCode ? saleDetail.quantity : null}</Table.Cell>
                <Table.Cell className="text-right">
                  {saleDetail.productCode ? `¥${Number(saleDetail.sellingPrice) * registerSign + 0}` : null}
                </Table.Cell>
                <Table.Cell className="text-right">
                  ¥{(Number(saleDetail.sellingPrice) * saleDetail.quantity * registerSign + 0)?.toLocaleString()}
                </Table.Cell>
              </Table.Row>
            ))}
        </Table.Body>
      </Table>

      <Flex className="mt-4">
        <div className="text-xs w-1/3 mt-4">
          軽印は、軽減税率対象商品です。 <br />
          ★印は、セルフメディケーション
          <br />
          税制対象製品です。
        </div>
        <Table border="none" size="sm" className="table-fixed w-2/3 shadow-none">
          <Table.Head>
            <Table.Row>
              <Table.Cell type="th" className="w-3/12" />
              <Table.Cell type="th" className="w-3/12" />
              <Table.Cell type="th" className="w-6/12" />
            </Table.Row>
          </Table.Head>
          <Table.Body>
            <Table.Row>
              <Table.Cell type="th" className="text-lg">
                {sale?.status === 'Return' ? 'ご返金' : '合計'}
              </Table.Cell>
              <Table.Cell className="text-right text-xl pr-4">¥{sale?.salesTotal.toLocaleString()}</Table.Cell>
              <Table.Cell></Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell type="th">非課税対象</Table.Cell>
              <Table.Cell className="text-right pr-4">
                ¥{(Number(sale?.salesTaxFreeTotal) + 0).toLocaleString()}
              </Table.Cell>
              <Table.Cell></Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell type="th">8%対象</Table.Cell>
              <Table.Cell className="text-right pr-4">
                ¥{(Number(sale?.salesReducedTotal) + 0).toLocaleString()}
              </Table.Cell>
              <Table.Cell>（内消費税等　¥{(Number(sale?.taxReducedTotal) + 0).toLocaleString()}）</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell type="th">10%対象</Table.Cell>
              <Table.Cell className="text-right pr-4">
                ¥{(Number(sale?.salesNormalTotal) + 0).toLocaleString()}
              </Table.Cell>
              <Table.Cell>（内消費税等　¥{(Number(sale?.taxNormalTotal) + 0).toLocaleString()}）</Table.Cell>
            </Table.Row>
            {sale?.status === 'Return' || saleDetails.every((detail) => !detail.outputReceipt) ? null : (
              <Table.Row>
                <Table.Cell type="th">
                  {sale.paymentType === 'Cash'
                    ? 'お預かり'
                    : sale.paymentType === 'Credit'
                    ? 'クレジット'
                    : '電子マネー'}
                </Table.Cell>
                <Table.Cell className="text-right pr-4">¥{sale?.cashAmount.toLocaleString()}</Table.Cell>
                <Table.Cell></Table.Cell>
              </Table.Row>
            )}
            {sale?.status === 'Return' || saleDetails.every((detail) => !detail.outputReceipt) ? null : (
              <Table.Row>
                <Table.Cell type="th">お釣り</Table.Cell>
                <Table.Cell className="text-right pr-4">
                  ¥{(Number(sale?.cashAmount) - Number(sale?.salesTotal)).toLocaleString()}
                </Table.Cell>
                <Table.Cell></Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table>
      </Flex>
    </div>
  );
};

export default ReceiptPrint;
