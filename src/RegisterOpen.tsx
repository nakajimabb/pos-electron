import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Alert, Button, Card, Flex, Form } from './components';
import SignIn from './SignIn';
import { useAppContext } from './AppContext';
import { nameWithCode, toDateString } from './tools';

const RegisterOpen: React.FC = () => {
  const { currentShop } = useAppContext();
  const [error, setError] = useState('');
  const [openDate, setOpenDate] = useState<Date>(new Date());

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const status = await window.electronAPI.getRegisterStatus();
      console.log(status);
      if (status) {
        if (status.openedAt.toLocaleDateString() === openDate.toLocaleDateString() && status.closedAt) {
          if (openDate.toLocaleDateString() === new Date().toLocaleDateString()) {
            status.closedAt = null;
            await window.electronAPI.setRegisterStatus(status);
          } else {
            throw Error('すでに精算済みです。');
          }
        }
      } else {
        await window.electronAPI.setRegisterStatus({
          dateString: format(openDate, 'yyyyMMdd'),
          openedAt: new Date(),
          closedAt: null,
        });
      }
      await window.electronAPI.updateLocalDb(currentShop.code);
      setTimeout(() => {
        window.location.href = '/main_window';
      }, 1500);
    } catch (error) {
      setError(error);
    }
  };

  if (currentShop) {
    return (
      <Flex direction="col" justify_content="center" align_items="center" className="h-screen">
        <Card className="container w-1/3 p-2">
          <Card.Body>
            {error && (
              <Alert severity="error" className="my-4">
                {error}
              </Alert>
            )}
            <p className="text-center text-xl mb-4">{currentShop && nameWithCode(currentShop)}</p>
            <p className="text-center">この営業日でレジを開設します。</p>
            <div className="flex justify-center">
              <Form className="my-4">
                <Form.Date
                  value={openDate ? format(openDate, 'yyyy-MM-dd') : ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      setOpenDate(new Date(e.target.value));
                    }
                  }}
                />
              </Form>
            </div>

            <div className="flex justify-center p-4">
              <Button color="primary" className="w-40" onClick={save}>
                OK
              </Button>
            </div>
          </Card.Body>
        </Card>
        <div className="m-4">
          <Link to="/">
            <Button color="light" size="sm">
              戻る
            </Button>
          </Link>
        </div>
      </Flex>
    );
  } else {
    return <SignIn />;
  }
};
export default RegisterOpen;
