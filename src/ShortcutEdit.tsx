import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from './components/ThemeProvider';
import { Link } from 'react-router-dom';
import { Button, Card, Flex, Form, Grid, Table } from './components';
import { Brand, Brands } from './components/type';
import { useAppContext } from './AppContext';
import { ProductLocal, ShortcutItemLocal } from './realmConfig';
import { toAscii } from './tools';
import RegisterSearch from './RegisterSearch';

const ShortcutEdit: React.FC = () => {
  type Shortcut = {
    index: number;
    product: ProductLocal;
    color: Brand;
  };

  const { currentShop } = useAppContext();
  const [itemIndex, setItemIndex] = useState<number | null>();
  const [itemColor, setItemColor] = useState<Brand | null>('info');
  const [productCode, setProductCode] = useState<string>('');
  const [product, setProduct] = useState<ProductLocal | null>();
  const [productError, setProductError] = useState<string>('');
  const [shortcuts, setShortcuts] = useState<(Shortcut | null)[]>([]);
  const [openSearch, setOpenSearch] = useState<boolean>(false);

  const { theme } = useTheme();

  const findProduct = async (code: string) => {
    setProductError('');
    const product = await window.electronAPI.findProductByPk(code);
    if (product) {
      const sellingPrice = await window.electronAPI.findProductSellingPriceByPk(code);
      if (sellingPrice && sellingPrice.sellingPrice) {
        product.sellingPrice = sellingPrice.sellingPrice;
      }
      setProduct(product);
    } else {
      setProductCode('');
      setProductError(`${code}：商品の登録がありません。`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProductError('');
    if (productCode) {
      findProduct(toAscii(productCode));
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentShop) return;
    if (itemIndex != null) {
      const item = { color: itemColor, index: itemIndex, productCode };
      await window.electronAPI.setShortcutItem(item);
      setProduct(null);
      setProductCode('');
      setItemIndex(null);
    }
  };

  const remove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentShop) return;
    if (itemIndex != null) {
      await window.electronAPI.deleteShortcutItem(itemIndex);
      setProduct(null);
      setProductCode('');
      setItemIndex(null);
    }
  };

  const getShortcutItems = useCallback(async () => {
    const items = (await window.electronAPI.findShortcutItems()) as ShortcutItemLocal[];
    const shortcutArray = new Array<Shortcut | null>(20);
    const shortcutItemArray = new Array<ShortcutItemLocal>();
    shortcutArray.fill(null);
    items.forEach((item) => {
      shortcutItemArray.push(item);
    });
    await Promise.all(
      shortcutItemArray.map(async (item) => {
        if (item.productCode) {
          const product = await window.electronAPI.findProductByPk(item.productCode);
          if (product) {
            const sellingPrice = await window.electronAPI.findProductSellingPriceByPk(item.productCode);
            if (sellingPrice && sellingPrice.sellingPrice) {
              product.sellingPrice = sellingPrice.sellingPrice;
            }
            shortcutArray[item.index] = {
              index: item.index,
              color: item.color as Brand,
              product,
            };
          }
        }
      })
    );
    setShortcuts(shortcutArray);
  }, []);

  useEffect(() => {
    if (!currentShop) return;
    getShortcutItems();
    document.getElementById('productCode')?.focus();
  }, [itemIndex, currentShop]);

  return (
    <>
      {shortcuts.length > 0 && (
        <Flex direction="col" justify_content="center" align_items="center" className="h-screen">
          <RegisterSearch
            open={openSearch}
            setProductCode={setProductCode}
            findProduct={findProduct}
            onClose={() => {
              setOpenSearch(false);
              document.getElementById('productCode')?.focus();
            }}
          ></RegisterSearch>
          <Card className="m-2 w-1/2">
            <Card.Header className="p-2">商品を登録する枠を選択してください。</Card.Header>
            <Card.Body className="p-2">
              <Grid cols="4" gap="2">
                {shortcuts.map((shortcut, index) => {
                  const classes = ['h-14', 'truncate'];
                  if (index === itemIndex) {
                    classes.push('ring-2', 'ring-offset-1');
                    if (shortcut) {
                      classes.push(`ring-${theme.color[shortcut.color]}`);
                    }
                  }
                  return (
                    <Button
                      variant={shortcut ? 'contained' : 'outlined'}
                      size="xs"
                      color={shortcut ? (shortcut.color as Brand) : 'info'}
                      className={classes.join(' ')}
                      onClick={(e) => {
                        setProductError('');
                        setItemIndex(index);
                        if (shortcut) {
                          setItemColor(shortcut.color);
                          setProductCode(shortcut.product.code);
                          setProduct(shortcut.product);
                        } else {
                          setItemColor('info');
                          setProductCode('');
                          setProduct(null);
                        }
                      }}
                      key={index}
                    >
                      {shortcut ? (
                        <>
                          {index + 1}. {shortcut?.product.name}
                          <br />
                          {`¥${Number(shortcut.product.sellingPrice).toLocaleString()}`}
                        </>
                      ) : (
                        index + 1
                      )}
                    </Button>
                  );
                })}
              </Grid>
            </Card.Body>
          </Card>
          <Card className="m-2 w-1/2 h-48">
            {itemIndex != null ? (
              <Card.Body className="p-2">
                <Flex className="items-center h-12">
                  <div>No. {itemIndex + 1}</div>
                  {shortcuts[itemIndex] ? null : (
                    <>
                      <Form className="m-2" onSubmit={handleSubmit}>
                        <Form.Text
                          id="productCode"
                          size="md"
                          placeholder="商品コード"
                          className="mb-3 sm:mb-0"
                          value={productCode}
                          inputMode="numeric"
                          onChange={(e) => setProductCode(e.target.value.trim())}
                        />
                      </Form>
                      <Button
                        color="light"
                        size="xs"
                        className="ml-4"
                        onClick={() => {
                          setProductError('');
                          setOpenSearch(true);
                        }}
                      >
                        商品検索
                      </Button>
                      <div className="ml-4 text-xs text-red-500 font-bold">{productError}</div>
                    </>
                  )}
                </Flex>
                {product ? (
                  <>
                    <Table border="row" className="table-fixed w-full text-xs">
                      <Table.Head>
                        <Table.Row>
                          <Table.Cell type="th" className="w-8/12">
                            商品名
                          </Table.Cell>
                          <Table.Cell type="th" className="w-2/12">
                            単価
                          </Table.Cell>
                          <Table.Cell type="th" className="w-2/12" />
                        </Table.Row>
                      </Table.Head>
                      <Table.Body>
                        <Table.Row>
                          <Table.Cell className="truncate">{product.name}</Table.Cell>
                          <Table.Cell className="text-right">¥{product.sellingPrice?.toLocaleString()}</Table.Cell>
                          <Table.Cell className="text-center"></Table.Cell>
                        </Table.Row>
                      </Table.Body>
                    </Table>
                    <Flex className="items-center h-12 justify-between">
                      <Flex>
                        <div className="mr-2 text-xs">カラーを選択</div>
                        {Brands.map((brand, index) => {
                          if (brand !== 'none') {
                            const classes = ['mr-1'];
                            if (brand === itemColor) {
                              classes.push('ring-2', 'ring-offset-1', `ring-${theme.color[itemColor]}`);
                            }
                            return (
                              <Button
                                variant="contained"
                                size="xs"
                                color={brand}
                                className={classes.join(' ')}
                                key={index}
                                onClick={() => {
                                  setItemColor(brand);
                                }}
                              ></Button>
                            );
                          } else {
                            return null;
                          }
                        })}
                      </Flex>
                      <div>
                        <Button variant="contained" size="xs" color="primary" className="mr-2" onClick={save}>
                          登録
                        </Button>
                        {shortcuts[itemIndex] ? (
                          <Button variant="contained" size="xs" color="danger" className="mr-2" onClick={remove}>
                            削除
                          </Button>
                        ) : null}
                      </div>
                    </Flex>
                  </>
                ) : null}
              </Card.Body>
            ) : null}
          </Card>
          <div className="m-2">
            <Link to="/">
              <Button color="light" size="sm">
                戻る
              </Button>
            </Link>
          </div>
        </Flex>
      )}
    </>
  );
};

export default ShortcutEdit;
