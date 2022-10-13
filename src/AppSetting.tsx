import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import firebaseError from './firebaseError';
import firebaseApp from './firebase';
import { Alert, Button, Card, Flex, Form, Grid } from './components';
import { MAIL_DOMAIN } from './tools';

const AppSetting: React.FC = () => {
  const [shopCode, setShopCode] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [sipsDir, setSipsDir] = useState<string>('');
  const [errors, setErrors] = useState<string[]>([]);
  const [launched, setLaunched] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

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
    if (!sipsDir.trim()) {
      errorsData.push('SIPSフォルダを入力してください。');
    }
    if (errorsData.length == 0) {
      try {
        await window.electronAPI.setAppSetting('SHOP_CODE', shopCode);
        const encryptedPassword = await window.electronAPI.cipher(password, shopCode);
        await window.electronAPI.setAppSetting('PASSWORD', encryptedPassword);
        await window.electronAPI.setAppSetting('SIPS_DIR', sipsDir);
        await window.electronAPI.initSipsDir();
        const auth = getAuth(firebaseApp);
        const email = shopCode.slice(1) + MAIL_DOMAIN;
        signInWithEmailAndPassword(auth, email, password)
          .then(() => {
            window.electronAPI.setStore('LAUNCHED', '1');
            window.location.href = '/main_window';
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
      <p className="text-lg">基本設定</p>
      <Card className="container justify-center m-2 p-2 w-1/2 bg-blue-100">
        <Card.Body>
          <Grid cols="1 sm:2" gap="0 sm:3" auto_cols="fr" template_cols="1fr 3fr" className="row-end-2">
            <Form.Label className="mt-1">店舗番号</Form.Label>
            <Form.Text value={shopCode} required className="w-1/2" onChange={(e) => setShopCode(e.target.value)} />
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
              <Button
                color="light"
                size="xs"
                className="ml-1"
                onClick={async () => {
                  const folders = await window.electronAPI.showOpenFolderDialog();
                  if (folders) {
                    setSipsDir(folders[0]);
                  }
                }}
              >
                選択
              </Button>
            </Flex>
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
