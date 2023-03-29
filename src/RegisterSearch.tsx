import React, { useState, useEffect } from 'react';
import { Alert, Button, Card, Flex, Form, Modal, Table } from './components';
import { ProductLocal, ProductSellingPriceLocal } from './realmConfig';
import { toAscii, toHankana } from './tools';

const PER_PAGE = 10;

type Props = {
  open: boolean;
  setProductCode: React.Dispatch<React.SetStateAction<string>>;
  findProduct: (code: string) => Promise<void>;
  onClose: () => void;
};

const RegisterSearch: React.FC<Props> = ({ open, setProductCode, findProduct, onClose }) => {
  const [search, setSearch] = useState({ text: '' });
  const [products, setProducts] = useState<ProductLocal[]>([]);
  const [page, setPage] = useState(0);
  const [productCount, setProductCount] = useState<number | null>(null);
  const [sellingPrices, setSellingPrices] = useState<{
    [code: string]: number;
  }>({});
  const [error, setError] = useState<string>('');

  const queryProducts = (action: 'head' | 'prev' | 'next') => async () => {
    try {
      setError('');
      const searchText = toHankana(toAscii(search.text.trim().toUpperCase()));
      let conds = '';
      if (searchText) {
        conds = `name CONTAINS '${searchText}' OR abbr CONTAINS '${searchText}' OR code CONTAINS '${searchText}'`;
      }

      let nextPage = 0;
      if (action === 'next') {
        nextPage = page + 1;
      } else if (action === 'prev') {
        nextPage = page - 1;
      }
      const productLocals = (await window.electronAPI.findProducts(conds)) as ProductLocal[];

      if (productLocals) {
        const sellingPricesDic: { [code: string]: number } = {};
        const productSellingPriceLocals = (await window.electronAPI.findProductSellingPrices(
          ''
        )) as ProductSellingPriceLocal[];
        productSellingPriceLocals.forEach((productSellingPrice) => {
          if (productSellingPrice.sellingPrice) {
            sellingPricesDic[productSellingPrice.productCode] = Number(productSellingPrice.sellingPrice);
          }
        });
        setSellingPrices(sellingPricesDic);
        setPage(nextPage);
        const startAt = nextPage * PER_PAGE;
        setProducts(productLocals.slice(startAt, startAt + 9));
        setProductCount(productLocals.length);
      }
    } catch (error) {
      setError(error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    queryProducts('head')();
  };

  useEffect(() => {
    setProducts([]);
    setSearch({ text: '' });
    document.getElementById('searchText')?.focus();
    queryProducts('head')();
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
                <Form.Text
                  id="select"
                  size="md"
                  placeholder="PLUコード 商品名"
                  className="mr-2 w-64"
                  value={search.text}
                  onChange={(e) => setSearch({ ...search, text: e.target.value })}
                />
                <Button variant="outlined" size="sm" className="mr-2" onClick={queryProducts('head')}>
                  検索
                </Button>
              </Flex>
            </Form>
            {products && productCount > 0 && (
              <Flex>
                <Button
                  color="light"
                  size="xs"
                  disabled={page <= 0 || !products || products.length === 0}
                  className="mr-2"
                  onClick={queryProducts('prev')}
                >
                  前へ
                </Button>
                <Button
                  color="light"
                  size="xs"
                  disabled={PER_PAGE * (page + 1) >= productCount || !products || products.length === 0}
                  className="mr-2"
                  onClick={queryProducts('next')}
                >
                  次へ
                </Button>
                <div className="text-xs align-middle p-1.5">
                  {`${PER_PAGE * page + 1}～${PER_PAGE * page + products.length}`}/{`${productCount}`}
                </div>
              </Flex>
            )}
          </Flex>
          <Card.Body className="p-4">
            {error && <Alert severity="error">{error}</Alert>}
            <div className="overflow-y-scroll" style={{ height: '24rem' }}>
              <Table border="row" className="table-fixed w-full text-xs">
                <Table.Head>
                  <Table.Row size="xs">
                    <Table.Cell type="th" className="w-2/12">
                      コード
                    </Table.Cell>
                    <Table.Cell type="th" className="w-6/12">
                      商品名称
                    </Table.Cell>
                    <Table.Cell type="th" className="w-2/12">
                      売価税抜
                    </Table.Cell>
                    <Table.Cell type="th" className="w-2/12"></Table.Cell>
                  </Table.Row>
                </Table.Head>
                <Table.Body>
                  {products.map((product, i) => {
                    return (
                      <Table.Row size="xs" className="hover:bg-gray-300" key={i}>
                        <Table.Cell>{product.code}</Table.Cell>
                        <Table.Cell className="truncate">{product.name}</Table.Cell>
                        <Table.Cell className="text-right">
                          {sellingPrices[product.code]
                            ? sellingPrices[product.code].toLocaleString()
                            : product.sellingPrice?.toLocaleString()}
                        </Table.Cell>
                        <Table.Cell>
                          <Button
                            color="primary"
                            size="xs"
                            onClick={() => {
                              setProductCode(product.code);
                              findProduct(product.code);
                              onClose();
                            }}
                          >
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

export default RegisterSearch;
