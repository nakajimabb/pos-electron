import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, Flex, Form, Grid } from './components';

const AppSetting: React.FC = () => {
  const [shopCode, setShopCode] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [sipsDir, setSipsDir] = useState<string>('');
  const [errors, setErrors] = useState<string[]>([]);

  const getAppSettings = async () => {
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
    if (!shopCode.trim()) {
      setErrors((prev) => [...prev, '店舗番号を入力してください。']);
    }
    if (!password) {
      setErrors((prev) => [...prev, 'パスワードを入力してください。']);
    }
    if (!sipsDir.trim()) {
      setErrors((prev) => [...prev, 'SIPSフォルダを入力してください。']);
    }
    if (errors.length == 0) {
      try {
        await window.electronAPI.setAppSetting('SHOP_CODE', shopCode);
        const encryptedPassword = await window.electronAPI.cipher(password, shopCode);
        await window.electronAPI.setAppSetting('PASSWORD', encryptedPassword);
        await window.electronAPI.setAppSetting('SIPS_DIR', sipsDir);
        await window.electronAPI.setStore('LAUNCHED', '1');
        window.location.href = '/main_window';
      } catch (error) {
        console.log({ error });
      }
    }
  };

  useEffect(() => {
    getAppSettings();
  }, []);

  return (
    <Flex direction="col" justify_content="center" align_items="center" className="h-screen">
      <Grid cols="1 sm:2" gap="0 sm:3" auto_cols="fr" template_cols="1fr 2fr" className="row-end-2">
        <Form.Label className="mt-1">店舗番号</Form.Label>
        <Form.Text value={shopCode} required onChange={(e) => setShopCode(e.target.value)} />
        <Form.Label className="mt-1">パスワード</Form.Label>
        <Form.Password
          value={password}
          required
          onChange={(e) => {
            setPassword(e.target.value);
          }}
        />
        <Form.Label className="mt-1">SIPSフォルダ</Form.Label>
        <Form.Text value={sipsDir} required onChange={(e) => setSipsDir(e.target.value)} />
      </Grid>
      <div className="m-4">
        <Button variant="contained" size="sm" color="primary" className="mr-2" onClick={save}>
          OK
        </Button>
        <Link to="/">
          <Button color="light" size="sm">
            キャンセル
          </Button>
        </Link>
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
