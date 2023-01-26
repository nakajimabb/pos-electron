import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState, useEffect } from 'react';
import { PrinterInfo } from 'electron';
import { Link, useNavigate } from 'react-router-dom';
import firebaseError from './firebaseError';
import firebaseApp from './firebase';
import { useAppContext } from './AppContext';
import { Alert, Button, Card, Flex, Form, Grid } from './components';
import { MAIL_DOMAIN } from './tools';
import Loader from './components/Loader';

const AppSetting: React.FC = () => {
  const { setContextInputMode } = useAppContext();
  const [shopCode, setShopCode] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [sipsDir, setSipsDir] = useState<string>('');
  const [printerType, setPrinterType] = useState<string>('Other');
  const [printerAddress, setPrinterAddress] = useState<string>('');
  const [printer, setPrinter] = useState<string>('');
  const [printers, setPrinters] = useState<{ label: string; value: string }[]>([]);
  const [inputMode, setInputMode] = useState<string>('Normal');
  const [errors, setErrors] = useState<string[]>([]);
  const [launched, setLaunched] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const getAppSettings = async () => {
    const launched = await window.electronAPI.getStore('LAUNCHED', false);
    if (launched) {
      setLaunched(launched);
    }
    const settings = (await window.electronAPI.findAppSettings()) as any[];
    const shopCodeSetting = settings.find((setting) => setting.key === 'SHOP_CODE');
    if (shopCodeSetting) setShopCode(shopCodeSetting.value);
    const passwordSetting = settings.find((setting) => setting.key === 'PASSWORD');
    if (passwordSetting && shopCodeSetting) {
      const plainPassword = await window.electronAPI.decipher(passwordSetting.value, shopCodeSetting.value);
      setPassword(plainPassword);
    }
    const sipsDirSetting = settings.find((setting) => setting.key === 'SIPS_DIR');
    if (sipsDirSetting) setSipsDir(sipsDirSetting.value);
    const printerTypeSetting = settings.find((setting) => setting.key === 'PRINTER_TYPE');
    if (printerTypeSetting) setPrinterType(printerTypeSetting.value);
    const printerAddressSetting = settings.find((setting) => setting.key === 'PRINTER_ADDRESS');
    if (printerAddressSetting) setPrinterAddress(printerAddressSetting.value);
    const printerInfos = (await window.electronAPI.getPrinters()) as PrinterInfo[];
    if (printerInfos) {
      setPrinters(
        printerInfos.map((printerInfo) => {
          return { label: printerInfo.displayName, value: printerInfo.name };
        })
      );
      const printerSetting = settings.find((setting) => setting.key === 'PRINTER');
      if (printerSetting && printerInfos.find((printerInfo) => printerInfo.name === printerSetting.value)) {
        setPrinter(printerSetting.value);
      } else {
        let defaultPrinterInfo = printerInfos.find((printerInfo) => printerInfo.isDefault);
        if (!defaultPrinterInfo) {
          defaultPrinterInfo = printerInfos[0];
        }
        setPrinter(defaultPrinterInfo.name);
      }
    }
    const inputModeSetting = settings.find((setting) => setting.key === 'INPUT_MODE');
    if (inputModeSetting) setInputMode(inputModeSetting.value);
  };

  const save = async (e: React.FormEvent) => {
    const errorsData: string[] = [];
    setErrors([]);
    setLoading(true);
    if (!shopCode.trim()) {
      errorsData.push('店舗番号を入力してください。');
    } else if (shopCode[0] !== '$') {
      errorsData.push('店舗番号が正しくありません。');
    }
    if (!password) {
      errorsData.push('パスワードを入力してください。');
    }
    const ipRegExp = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (printerType === 'Receipt') {
      if (!printerAddress.trim()) {
        errorsData.push('プリンターIPアドレスを入力してください。');
      } else if (!ipRegExp.test(printerAddress.trim())) {
        errorsData.push('プリンターIPアドレスが正しくありません。');
      }
    } else {
      if (!printer.trim()) {
        errorsData.push('プリンターを選択してください。');
      }
    }
    if (errorsData.length == 0) {
      try {
        await window.electronAPI.setAppSetting('SHOP_CODE', shopCode);
        const encryptedPassword = await window.electronAPI.cipher(password, shopCode);
        await window.electronAPI.setAppSetting('PASSWORD', encryptedPassword);
        await window.electronAPI.setAppSetting('SIPS_DIR', sipsDir);
        await window.electronAPI.setAppSetting('PRINTER_TYPE', printerType);
        await window.electronAPI.setAppSetting('PRINTER_ADDRESS', printerAddress);
        await window.electronAPI.setAppSetting('PRINTER', printer);
        await window.electronAPI.setAppSetting('INPUT_MODE', inputMode);
        setContextInputMode(inputMode);
        await window.electronAPI.initSipsDir();
        const auth = getAuth(firebaseApp);
        const email = shopCode.slice(1) + MAIL_DOMAIN;
        signInWithEmailAndPassword(auth, email, password)
          .then(() => {
            window.electronAPI.setStore('LAUNCHED', '1');
            navigate('/');
          })
          .catch((error) => {
            console.log({ error });
            setErrors([firebaseError(error)]);
            setLoading(false);
          });
      } catch (error) {
        console.log({ error });
        setLoading(false);
      }
    } else {
      setErrors(errorsData);
      setLoading(false);
    }
  };

  useEffect(() => {
    getAppSettings();
  }, []);

  return (
    <Flex direction="col" justify_content="center" align_items="center" className="h-screen">
      {loading && <Loader />}
      <p className="text-lg">基本設定</p>
      <Card className="m-2 p-2 w-1/2 bg-blue-100">
        <Card.Body>
          <Grid cols="2" gap="3" auto_cols="fr" template_cols="1fr 3fr" className="row-end-2">
            <Form.Label className="mt-1">店舗番号</Form.Label>
            <Form.Text
              value={shopCode}
              className="w-1/2"
              disabled={launched && !!shopCode}
              onChange={(e) => setShopCode(e.target.value)}
            />
            <Form.Label className="mt-1">パスワード</Form.Label>
            <Form.Password
              value={password}
              required
              className="w-1/2"
              onChange={(e) => {
                setPassword(e.target.value);
              }}
            />
            <Form.Label className="mt-1">SIPSフォルダ</Form.Label>
            <Flex>
              <Form.Text
                value={sipsDir}
                disabled={true}
                className="w-4/5"
                onChange={(e) => setSipsDir(e.target.value)}
              />
              <div className="relative mt-1 w-6" style={{ left: -30 }}>
                {sipsDir && (
                  <Button
                    variant="icon"
                    size="xs"
                    color="none"
                    className="hover:bg-gray-300"
                    onClick={() => {
                      setSipsDir('');
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                )}
              </div>
              <div className="relative mt-0.5" style={{ left: -20 }}>
                <Button
                  color="light"
                  size="xs"
                  onClick={async () => {
                    const folders = await window.electronAPI.showOpenFolderDialog();
                    if (folders) {
                      setSipsDir(folders[0]);
                    }
                  }}
                >
                  選択
                </Button>
              </div>
            </Flex>
            <Form.Label className="mt-1">プリンター種別</Form.Label>
            <Grid cols="2" gap="2" className="mt-1">
              <Form.Radio
                id="radio1"
                name="printer-type"
                size="md"
                label="普通紙プリンター"
                checked={printerType === 'Other'}
                disabled={!launched}
                onChange={(e) => setPrinterType('Other')}
              />
              <Form.Radio
                id="radio2"
                name="printer-type"
                size="md"
                label="レシートプリンター"
                checked={printerType === 'Receipt'}
                disabled={true}
                onChange={(e) => setPrinterType('Receipt')}
              />
            </Grid>
            {printerType === 'Receipt' ? (
              <>
                <Form.Label className="mt-1">IPアドレス</Form.Label>
                <Form.Text
                  value={printerAddress}
                  className="w-1/2"
                  disabled={!launched}
                  onChange={(e) => setPrinterAddress(e.target.value)}
                />
              </>
            ) : (
              <>
                <Form.Label className="mt-1">プリンター名</Form.Label>
                <Form.Select
                  className="w-4/5"
                  value={printer}
                  options={printers}
                  onChange={(e) => setPrinter(e.target.value)}
                />
              </>
            )}
            <Form.Label className="mt-1">入力モード</Form.Label>
            <Grid cols="3" gap="2" className="mt-1">
              <Form.Radio
                id="radio3"
                name="input-mode"
                size="md"
                label="通常モード"
                checked={inputMode === 'Normal'}
                disabled={!launched}
                onChange={(e) => setInputMode('Normal')}
              />
              <Form.Radio
                id="radio4"
                name="input-mode"
                size="md"
                label="テストモード"
                checked={inputMode === 'Test'}
                disabled={!launched}
                onChange={(e) => setInputMode('Test')}
              />
            </Grid>
          </Grid>
        </Card.Body>
      </Card>
      <div className="m-4">
        <Button variant="contained" size="sm" color="primary" className="mr-2" disabled={loading} onClick={save}>
          OK
        </Button>
        {launched && (
          <Link to="/">
            <Button color="light" size="sm" disabled={loading}>
              キャンセル
            </Button>
          </Link>
        )}
      </div>
      {errors.length > 0 && (
        <Alert severity="error" onClose={() => setErrors([])}>
          {errors.map((err, i) => (
            <p key={i}>{err}</p>
          ))}
        </Alert>
      )}
    </Flex>
  );
};

export default AppSetting;
