import { useState } from 'react';
import {
  Alert,
  Button,
  Flex,
  Form,
  Grid,
  Input,
  Layout,
  Space,
  Typography,
  theme,
} from 'antd';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { login } from '@/api/endpoints';
import { loggedIn } from '@/store/slices/authSlice';

const { Title, Paragraph, Text } = Typography;
const { useBreakpoint } = Grid;

const INK = '#0D2226'; // deep ink teal

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const screens = useBreakpoint();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFinish = async (values: { username: string; password: string }) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await login(values.username, values.password);
      dispatch(loggedIn(res));
      navigate('/overview');
    } catch (e) {
      if (isAxiosError(e) && e.response?.status === 401) {
        setError('Invalid username or password.');
      } else {
        setError('Could not reach the server. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>

      {/* Brand panel — hidden below the lg breakpoint */}
      {screens.lg && (
        <Layout.Sider
          width="52%"
          aria-hidden="true"
          style={{
            background: `radial-gradient(1200px 600px at 20% -10%, rgba(63, 224, 197, 0.10), transparent 60%), ${INK}`,
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px),
              radial-gradient(1200px 600px at 20% -10%, rgba(63, 224, 197, 0.10), transparent 60%)`,
            backgroundSize: '44px 44px, 44px 44px, auto',
            backgroundColor: INK,
          }}
        >
          <Flex
            vertical
            justify="center"
            align="center"
            style={{ height: '100%' }}
          >
            <Text
              style={{
                color: token.colorWhite,
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
              }}
            >
              Retail Chain Dashboard
            </Text>
          </Flex>
        </Layout.Sider>
      )}

      {/* Form side */}
      <Layout.Content>
        <Flex
          align="center"
          justify="center"
          style={{ minHeight: '100vh', padding: `${token.paddingXL}px ${token.paddingLG}px` }}
        >
          <Space orientation="vertical" size={0} style={{ width: '100%', maxWidth: 380 }}>
            <Title level={3} style={{ marginBottom: token.marginXXS }}>
              Welcome back
            </Title>
            <Paragraph type="secondary" style={{ marginBottom: token.marginXL }}>
              Sign in to your account
            </Paragraph>

            {error && (
              <Alert
                type="error"
                message={error}
                showIcon
                style={{ marginBottom: token.marginLG }}
              />
            )}

            <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
              <Form.Item
                name="username"
                label="Username"
                rules={[{ required: true, message: 'Username is required' }]}
              >
                <Input size="large" autoFocus autoComplete="username" />
              </Form.Item>
              <Form.Item
                name="password"
                label="Password"
                rules={[{ required: true, message: 'Password is required' }]}
              >
                <Input.Password size="large" autoComplete="current-password" />
              </Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={submitting}
                style={{ marginTop: token.marginXS, height: 46, fontWeight: 600 }}
              >
                Sign in
              </Button>
            </Form>
          </Space>
        </Flex>
      </Layout.Content>
    </Layout>
  );
}
