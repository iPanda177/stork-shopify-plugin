import { useContext, useState } from 'react';
import {
  Card,
  Layout,
  Page,
  TextField,
  Text,
  VerticalStack,
  Button,
  Frame,
  Toast,
} from '@shopify/polaris';
import { useAuthenticatedFetch } from '../hooks';
import { AuthContext } from '../context/AuthContext';

export default function HomePage() {
  const { auth, updateContext } = useContext(AuthContext);
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeToast, setActiveToast] = useState(false);

  const fetch = useAuthenticatedFetch();

  const handleChange = (value: string) => setToken(value);
  const toggleActiveToast = () => setActiveToast(!activeToast);
  const handleSubmit = async (token: string) => {
    setIsLoading(true);

    const res = await fetch(`/api/shop/auth?token=${token}`);

    if (res.ok) {
      setIsLoading(false);
      const newContext = { ...auth };
      newContext.authorized = true;
      updateContext(newContext);
    } else {
      setIsLoading(false);
      setActiveToast(true);
    }
  };

  const submitButton = (
    <Button primary loading={isLoading} onClick={() => handleSubmit(token)}>
      Connect
    </Button>
  );

  return (
    <Page narrowWidth>
      <Frame>
        <Layout>
          <Layout.Section>
            <Card>
              {auth && auth.authorized ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <div style={{ width: 100, height: 100 }}>
                    <svg
                      version="1.1"
                      x="0px"
                      y="0px"
                      viewBox="0 0 97.199997 97.199997"
                      xmlSpace="preserve"
                      id="svg12"
                      width="97.199997"
                      height="97.199997"
                    >
                      <defs id="defs16" />
                      <g
                        id="g6"
                        transform="translate(-1.4,-1.4)"
                        fill="#008000"
                      >
                        <polygon
                          points="44.1,58.3 31.8,45.9 28.8,48.9 44.1,64.2 69.5,38.8 66.6,35.8 "
                          id="polygon2"
                          fill="#008000"
                        />
                        <path
                          d="M 50,88.6 C 71.3,88.6 88.6,71.3 88.6,50 88.6,28.7 71.3,11.4 50,11.4 28.7,11.4 11.4,28.7 11.4,50 11.4,71.3 28.7,88.6 50,88.6 Z m 0,-73 C 68.9,15.6 84.4,31 84.4,50 84.4,69 68.9,84.4 50,84.4 31.1,84.4 15.6,68.9 15.6,50 15.6,31.1 31.1,15.6 50,15.6 Z"
                          id="path4"
                          fill="#008000"
                        />
                      </g>
                    </svg>
                  </div>

                  <Text
                    variant="headingXl"
                    as="h1"
                    alignment="center"
                    fontWeight="medium"
                    color="success"
                  >
                    Shop successfully connected to Stork
                  </Text>
                </div>
              ) : (
                <VerticalStack gap="10">
                  <Text
                    variant="headingXl"
                    as="h1"
                    alignment="center"
                    fontWeight="medium"
                  >
                    Connect your shop to Stork App
                  </Text>

                  <TextField
                    label="Access token"
                    value={token}
                    onChange={handleChange}
                    autoComplete="off"
                    connectedRight={submitButton}
                  />
                </VerticalStack>
              )}
            </Card>
          </Layout.Section>
        </Layout>
        {activeToast && (
          <Toast
            content="Invalid access token"
            error
            onDismiss={toggleActiveToast}
          />
        )}
      </Frame>
    </Page>
  );
}
