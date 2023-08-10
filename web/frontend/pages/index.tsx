import { useState } from 'react';
import {
  Card,
  Layout,
  Page,
  TextField,
  Text,
  VerticalStack,
  Button,
} from '@shopify/polaris';
import { useAuthenticatedFetch } from '../hooks';

export default function HomePage() {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fetch = useAuthenticatedFetch();

  const handleChange = (value: string) => setToken(value);
  const handleSubmit = async (token: string) => {
    setIsLoading(true);

    const res = await fetch(`/api/connect?token=${token}`);

    if (res.ok) {
      setIsLoading(false);
    }
  };

  const submitButton = (
    <Button primary loading={isLoading} onClick={() => handleSubmit(token)}>
      Connect
    </Button>
  );

  return (
    <Page narrowWidth>
      <Layout>
        <Layout.Section>
          <Card>
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
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
