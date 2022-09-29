import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import { parse } from 'date-fns';
import { Button, Card, Flex, Form, Grid, Icon, Table } from './components';
import { Brand } from './components/type';
import { useAppContext } from './AppContext';
import RegisterPayment from './RegisterPayment';
import RegisterInput from './RegisterInput';
import RegisterModify from './RegisterModify';
import RegisterSearch from './RegisterSearch';
import PrescriptionList from './PrescriptionList';
import { BasketItem } from './types';
import { OTC_DIVISION, nameWithCode, toAscii } from './tools';
import { ProductLocal, RegisterItemLocal, RegisterStatusLocal, ShortcutItemLocal } from './realmConfig';

const RegisterMain: React.FC = () => {
  type Shortcut = {
    index: number;
    color: string;
    product: ProductLocal;
  };

  const { currentShop, addBundleDiscount } = useAppContext();
  const [productCode, setProductCode] = useState<string>('');
  const [productError, setProductError] = useState<string>('');
  const [basketItemIndex, setBasketItemIndex] = useState<number>(0);
  const [basketItems, setBasketItems] = useState<BasketItem[]>([]);
  const [registerItem, setRegisterItem] = useState<RegisterItemLocal>();
  const [registerItems, setRegisterItems] = useState<RegisterItemLocal[]>([]);
  const [shortcuts, setShortcuts] = useState<(Shortcut | null)[]>([]);
  const [openPayment, setOpenPayment] = useState<boolean>(false);
  const [openInput, setOpenInput] = useState<boolean>(false);
  const [openModify, setOpenModify] = useState<boolean>(false);
  const [openSearch, setOpenSearch] = useState<boolean>(false);
  const [openPrescriptions, setOpenPrescriptions] = useState<boolean>(false);
  const [registerMode, setRegisterMode] = useState<'Sales' | 'Return'>('Sales');
  const [paymentType, setPaymentType] = useState<'Cash' | 'Credit'>('Cash');
  const [registerClosed, setRegisterClosed] = useState<boolean>(true);
  const [registerStatus, setRegisterStatus] = useState<RegisterStatusLocal>();
  const registerSign = registerMode === 'Return' ? -1 : 1;

  const logout = () => {
    if (window.confirm('ログアウトしますか？')) {
      const auth = getAuth();
      signOut(auth)
        .then(function () {
          // Sign-out successful.
        })
        .catch(function (error) {
          // An error happened.
          alert('エラーが発生しました。');
          console.log({ error });
        });
    }
  };

  const findProduct = async (code: string) => {
    try {
      setProductError('');
      const product = await window.electronAPI.findProductByPk(code);
      if (product) {
        const sellingPrice = await window.electronAPI.findProductSellingPriceByPk(code);
        if (sellingPrice) {
          product.sellingPrice = sellingPrice.sellingPrice;
        }
        const existingIndex = basketItems.findIndex((item) => item.product.code === code);
        if (existingIndex >= 0) {
          basketItems[existingIndex].quantity += 1;
          setBasketItems(addBundleDiscount(basketItems));
        } else {
          const basketItem = {
            product,
            division: OTC_DIVISION,
            outputReceipt: true,
            quantity: 1,
          };
          setBasketItems(addBundleDiscount([...basketItems, basketItem]));
        }
        setProductCode('');
      } else {
        setProductCode('');
        setProductError(`${code}：商品の登録がありません。`);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProductError('');
    if (productCode) {
      findProduct(toAscii(productCode));
    } else {
      if (basketItems.length > 0) {
        setOpenPayment(true);
      }
    }
  };

  const exclusiveTaxTotal = ((items: BasketItem[]) => {
    let normalTotal = 0;
    let reducedTotal = 0;
    items.forEach((item) => {
      if (item.product.sellingTaxClass === 'exclusive') {
        if (item.product.sellingTax) {
          if (item.product.sellingTax === 10) {
            normalTotal += Number(item.product.sellingPrice) * item.quantity;
          } else if (item.product.sellingTax === 8) {
            reducedTotal += Number(item.product.sellingPrice) * item.quantity;
          }
        }
      }
    });
    const total = Math.floor((normalTotal * 10) / 100) + Math.floor((reducedTotal * 8) / 100);
    return total * registerSign;
  })(basketItems);

  const inclusiveTaxTotal = ((items: BasketItem[]) => {
    let normalTotal = 0;
    let reducedTotal = 0;
    items.forEach((item) => {
      if (item.product.sellingTaxClass === 'inclusive') {
        if (item.product.sellingTax) {
          if (item.product.sellingTax === 10) {
            normalTotal += Number(item.product.sellingPrice) * item.quantity;
          } else if (item.product.sellingTax === 8) {
            reducedTotal += Number(item.product.sellingPrice) * item.quantity;
          }
        }
      }
    });
    const total = Math.floor((normalTotal * 10) / (100 + 10)) + Math.floor((reducedTotal * 8) / (100 + 8));
    return total * registerSign;
  })(basketItems);

  const taxTotal = exclusiveTaxTotal + inclusiveTaxTotal;

  const salesTotal =
    basketItems.reduce((result, item) => result + Number(item.product.sellingPrice) * item.quantity, 0) * registerSign +
    exclusiveTaxTotal;

  const getRegisterStatus = useCallback(async () => {
    const status = await window.electronAPI.getRegisterStatus();
    if (status) {
      setRegisterStatus(status);
      setRegisterClosed(!!status.closedAt);
    } else {
      setRegisterClosed(true);
    }
  }, []);

  const getRegisterItems = useCallback(async () => {
    const items = (await window.electronAPI.findRegisterItems()) as RegisterItemLocal[];
    setRegisterItems(items);
  }, []);

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
            if (sellingPrice) {
              product.sellingPrice = sellingPrice.sellingPrice;
            }
            shortcutArray[item.index] = {
              index: item.index,
              color: item.color,
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
    getRegisterStatus();
    getRegisterItems();
    getShortcutItems();
    document.getElementById('productCode')?.focus();
  }, [currentShop, getRegisterStatus, getRegisterItems, getShortcutItems]);

  return (
    <div className="flex w-full h-screen">
      <RegisterPayment
        open={openPayment}
        registerMode={registerMode}
        paymentType={paymentType}
        basketItems={basketItems}
        setBasketItems={setBasketItems}
        setRegisterMode={setRegisterMode}
        onClose={() => {
          setOpenPayment(false);
          document.getElementById('productCode')?.focus();
        }}
      />
      <RegisterInput
        open={openInput}
        registerItem={registerItem}
        basketItems={basketItems}
        setBasketItems={setBasketItems}
        onClose={() => {
          setOpenInput(false);
          document.getElementById('productCode')?.focus();
        }}
      />
      <RegisterModify
        open={openModify}
        itemIndex={basketItemIndex}
        basketItems={basketItems}
        setBasketItems={setBasketItems}
        onClose={() => {
          setOpenModify(false);
          document.getElementById('productCode')?.focus();
        }}
      />
      <RegisterSearch
        open={openSearch}
        setProductCode={setProductCode}
        findProduct={findProduct}
        onClose={() => {
          setOpenSearch(false);
          document.getElementById('productCode')?.focus();
        }}
      ></RegisterSearch>
      <PrescriptionList
        open={openPrescriptions}
        onClose={() => {
          setOpenPrescriptions(false);
          document.getElementById('productCode')?.focus();
        }}
      ></PrescriptionList>
      <Card className="container justify-center m-2 w-1/2">
        <Card.Body>
          {registerClosed ? (
            <Flex className="mt-8 ml-4">
              <Link to="/register_open">
                <Button color="warning" size="xs" className="h-8">
                  レジ開設
                </Button>
              </Link>
              <p className="ml-2 mt-2 text-xs text-red-500 font-bold">
                売上登録を開始するにはレジ開設ボタンを押下してください。
              </p>
            </Flex>
          ) : (
            <Flex>
              <Form className="mt-8 ml-4" onSubmit={handleSubmit}>
                <Form.Text
                  id="productCode"
                  size="md"
                  placeholder="商品コード"
                  disabled={registerClosed}
                  className="mb-3 sm:mb-0"
                  value={productCode}
                  onChange={(e) => setProductCode(e.target.value.trim())}
                />
              </Form>
              <Button
                color="light"
                size="xs"
                disabled={registerClosed}
                className="mt-8 ml-4 w-24"
                onClick={() => setOpenSearch(true)}
              >
                商品検索
              </Button>
              <Button
                variant={registerMode === 'Sales' ? 'contained' : 'outlined'}
                color={registerMode === 'Sales' ? 'info' : 'light'}
                size="xs"
                disabled={basketItems.length > 0 || registerClosed}
                className="w-16 mt-8 ml-16"
                onClick={() => setRegisterMode('Sales')}
              >
                売上
              </Button>
              <Button
                variant={registerMode === 'Return' ? 'contained' : 'outlined'}
                color={registerMode === 'Return' ? 'info' : 'light'}
                size="xs"
                disabled={basketItems.length > 0 || registerClosed}
                className="w-16 mt-8"
                onClick={() => setRegisterMode('Return')}
              >
                返品
              </Button>
              {/* <Button
                color="light"
                size="xs"
                disabled={registerClosed}
                className="mt-8 ml-4 w-24"
                onClick={() => setOpenPrescriptions(true)}
              >
                レセコン
              </Button> */}
            </Flex>
          )}

          <Flex className="w-full">
            <div className="w-1/2 mx-4 my-2 h-4 text-xs text-red-500 font-bold">{productError}</div>
            <Flex justify_content="end" className="w-1/2 pt-2">
              {basketItems.length > 0 ? (
                <Button
                  color="danger"
                  size="xs"
                  className="w-24 mr-4"
                  onClick={() => {
                    if (window.confirm('明細をクリアしてもよろしいですか？')) {
                      setBasketItems([]);
                    }
                  }}
                >
                  明細クリア
                </Button>
              ) : null}
            </Flex>
          </Flex>

          <div className="h-96 overflow-y-scroll">
            <Table border="row" className="table-fixed w-full text-xs">
              <Table.Head>
                <Table.Row>
                  <Table.Cell type="th" className="w-1/12">
                    No.
                  </Table.Cell>
                  <Table.Cell type="th" className="w-3/12">
                    コード
                  </Table.Cell>
                  <Table.Cell type="th" className="w-3/12">
                    商品名
                  </Table.Cell>
                  <Table.Cell type="th" className="w-2/12">
                    単価
                  </Table.Cell>
                  <Table.Cell type="th" className="w-1/12">
                    数量
                  </Table.Cell>
                  <Table.Cell type="th" className="w-1/12" />
                  <Table.Cell type="th" className="w-1/12" />
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {basketItems?.map((basketItem, index) => (
                  <Table.Row key={index} className={index % 2 === 1 ? 'bg-blue-50' : ''}>
                    <Table.Cell>{index + 1}</Table.Cell>
                    <Table.Cell className="text-base">{basketItem.product.code}</Table.Cell>
                    <Table.Cell className="text-base">{basketItem.product.name}</Table.Cell>
                    <Table.Cell className="text-base text-right">
                      ¥{basketItem.product.sellingPrice?.toLocaleString()}
                    </Table.Cell>
                    <Table.Cell className="text-base text-right">{basketItem.quantity}</Table.Cell>
                    <Table.Cell className="text-center">
                      {basketItem.product.code && basketItem.division === OTC_DIVISION ? (
                        <Button
                          variant="icon"
                          size="xs"
                          color="none"
                          className="hover:bg-gray-300"
                          onClick={(e) => {
                            setProductError('');
                            setBasketItemIndex(index);
                            setOpenModify(true);
                          }}
                        >
                          <Icon name="pencil-alt" />
                        </Button>
                      ) : null}
                    </Table.Cell>
                    <Table.Cell className="text-center">
                      <Button
                        variant="icon"
                        size="xs"
                        color="none"
                        className="hover:bg-gray-300"
                        onClick={(e) => {
                          setProductError('');
                          if (window.confirm('削除してもよろしいですか？')) {
                            setBasketItems(
                              addBundleDiscount(basketItems.filter((item, itemIndex) => index !== itemIndex))
                            );
                          }
                        }}
                      >
                        <Icon name="trash" />
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>

          <Flex className="mt-4">
            <Table border="cell" className="table-fixed w-3/5">
              <Table.Body>
                <Table.Row>
                  <Table.Cell type="th" className="text-xl bg-red-100">
                    {registerMode === 'Return' ? '返品合計' : '合計'}
                  </Table.Cell>
                  <Table.Cell className="text-right text-xl pr-4">¥{(salesTotal + 0).toLocaleString()}</Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell type="th" className="bg-red-100">
                    消費税
                  </Table.Cell>
                  <Table.Cell className="text-right pr-4">¥{(taxTotal + 0).toLocaleString()}</Table.Cell>
                </Table.Row>
              </Table.Body>
            </Table>
            <div className="mt-1 ml-4">
              <Grid cols="2" gap="2">
                <Button
                  color="info"
                  size="xs"
                  disabled={basketItems.length === 0}
                  className="h-20"
                  onClick={() => {
                    setPaymentType('Cash');
                    setOpenPayment(true);
                  }}
                >
                  現金会計
                </Button>
                <Button
                  color="success"
                  size="xs"
                  disabled={basketItems.length === 0}
                  className="h-20"
                  onClick={() => {
                    setPaymentType('Credit');
                    setOpenPayment(true);
                  }}
                >
                  クレジット会計
                </Button>
              </Grid>
            </div>
          </Flex>
        </Card.Body>
      </Card>
      {registerItems.length > 0 && shortcuts.length > 0 && (
        <Card className="m-2 w-1/2">
          <Card.Body>
            <p className="mt-1 mr-2 text-sm text-right">
              {currentShop && `${nameWithCode(currentShop)} \u00A0`}
              {!registerClosed &&
                `${parse(registerStatus?.dateString, 'yyyyMMdd', new Date()).toLocaleDateString()} \u00A0`}
              <Link to="/" onClick={logout} className="underline">
                ログアウト
              </Link>
            </p>
            <div className="p-2">
              <div className="grid grid-cols-4 gap-2">
                {registerItems.map((registerItem, index) => (
                  <Button
                    variant="contained"
                    size="xs"
                    color="info"
                    disabled={registerClosed}
                    className="h-14"
                    onClick={(e) => {
                      setProductError('');
                      setRegisterItem(registerItem);
                      setOpenInput(true);
                    }}
                    key={index}
                  >
                    {`${registerItem.index}. ${registerItem.name}`}
                  </Button>
                ))}
              </div>
            </div>

            <div className="mt-4 p-2">
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <Link to="/shortcut_edit">
                    <Button color="light" size="xs" disabled={basketItems.length > 0} className="w-full">
                      ショートカット登録
                    </Button>
                  </Link>
                </div>
                <div>
                  <Link to="/receipt_list">
                    <Button color="light" size="xs" disabled={basketItems.length > 0} className="w-full">
                      レシート再発行
                    </Button>
                  </Link>
                </div>
                <div>
                  <Link to="/daily_cash_report">
                    <Button color="light" size="xs" disabled={basketItems.length > 0} className="w-full">
                      精算・点検レポート
                    </Button>
                  </Link>
                </div>
                <div>
                  <Link to="/daily_journal">
                    <Button color="light" size="xs" disabled={basketItems.length > 0} className="w-full">
                      ジャーナル
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
            <div className="mt-4 p-2">
              <div className="grid grid-cols-4 gap-2">
                {shortcuts.map((shortcut, index) => (
                  <Button
                    variant={shortcut ? 'contained' : 'outlined'}
                    size="xs"
                    color={shortcut ? (shortcut.color as Brand) : 'info'}
                    className="h-14 truncate"
                    disabled={!shortcut || registerClosed}
                    onClick={(e) => {
                      if (shortcut) {
                        setProductError('');
                        const existingIndex = basketItems.findIndex(
                          (basketItem) => basketItem.product.code === shortcut.product.code
                        );
                        if (existingIndex >= 0) {
                          basketItems[existingIndex].quantity += 1;
                          setBasketItems(addBundleDiscount([...basketItems]));
                        } else {
                          const basketItem = {
                            product: shortcut.product,
                            division: OTC_DIVISION,
                            outputReceipt: true,
                            quantity: 1,
                          };
                          setBasketItems(addBundleDiscount([...basketItems, basketItem]));
                        }
                        document.getElementById('productCode')?.focus();
                      }
                    }}
                    key={index}
                  >
                    {shortcut?.product.name}
                    <br />
                    {shortcut ? `¥${Number(shortcut.product.sellingPrice).toLocaleString()}` : null}
                  </Button>
                ))}
              </div>
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};
export default RegisterMain;
