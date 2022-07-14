import React, { useState, useEffect } from 'react';
import { useAppContext } from './AppContext';
import { Card, Flex, Tabs } from './components';
import SignInUserCode from './SignInUserCode';

const SignIn: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authorized, setAuthorized] = useState<boolean>(false);
  const [tab, setTab] = useState('email');
  const { currentUser } = useAppContext();

  useEffect(() => {
    setAuthorized(!!currentUser);
  }, [currentUser]);

  if (authorized) {
    return <>{children}</>;
  } else {
    return (
      <Flex justify_content="center" align_items="center" className="h-screen">
        <Card className="m-8">
          <Tabs value={tab} variant="bar" size="sm" baseLine onChange={(v) => setTab(v)} className="w-96">
            <Tabs.Tab label="店舗番号でログイン" value="email" />
          </Tabs>
          <Card.Body className="bg-gray-50">{tab === 'email' && <SignInUserCode />}</Card.Body>
        </Card>
      </Flex>
    );
  }
};

export default SignIn;
