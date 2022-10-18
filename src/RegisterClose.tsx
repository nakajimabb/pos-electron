import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import app from './firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { format, parse } from 'date-fns';
import { Button, Card, Flex, Form, Progress } from './components';
import { useAppContext } from './AppContext';
import { nameWithCode } from './tools';
import Loader from './components/Loader';

const RegisterClose: React.FC = () => {
  const { currentShop } = useAppContext();
  const [loading, setLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState(0);
  const [closeDate, setCloseDate] = useState<Date>(new Date());

  const getRegisterStatus = useCallback(async () => {
    const status = await window.electronAPI.getRegisterStatus();
    if (status) {
      setCloseDate(parse(status.dateString, 'yyyyMMdd', new Date()));
    }
  }, [currentShop]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (currentShop) {
        setInterval(() => setProgress((prev) => (prev + 1) % 100), 10);
        const status = await window.electronAPI.getRegisterStatus(format(closeDate, 'yyyyMMdd'));
        if (status) {
          status.closedAt = new Date();
          await window.electronAPI.setRegisterStatus(status);
        }
        if (false) {
          const functions = getFunctions(app, 'asia-northeast1');
          const result = await httpsCallable(
            functions,
            'sendDailyClosingData'
          )({ code: currentShop.code, date: format(closeDate, 'yyyy/MM/dd') });
        }
      }
      setLoading(false);
      window.location.href = '#/daily_cash_report';
    } catch (error) {
      setLoading(false);
    }
  };

  useEffect(() => {
    getRegisterStatus();
  }, [getRegisterStatus]);

  return (
    <Flex direction="col" justify_content="center" align_items="center" className="h-screen">
      {loading && <Loader />}
      <Card className="container w-1/3 p-2">
        <Card.Body>
          <p className="text-center text-xl mb-4">{currentShop && nameWithCode(currentShop)}</p>
          <p className="text-center">この営業日で精算を実行します。</p>
          <div className="flex justify-center">
            <Form className="my-4">
              <Form.Date
                value={closeDate ? format(closeDate, 'yyyy-MM-dd') : ''}
                disabled={true}
                onChange={(e) => {
                  if (e.target.value) {
                    setCloseDate(new Date(e.target.value));
                  }
                }}
              />
            </Form>
          </div>

          <div className="flex justify-center p-4">
            <Button color="primary" className="w-40" disabled={loading} onClick={save}>
              OK
            </Button>
          </div>
          <div>{loading && <Progress value={progress} label={' '} />}</div>
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
};

export default RegisterClose;
