import { Layout, Menu, Dropdown, Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { loggedOut } from '@/store/slices/authSlice';

const { Header, Content } = Layout;

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((s: RootState) => s.auth.user);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header className="app-header">
        <span className="brand">Retail Dashboard</span>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[location.pathname]}
          style={{ flex: 1, minWidth: 0 }}
          items={[
            { key: '/overview', label: <Link to="/overview">Overview</Link> },
            { key: '/comparison', label: <Link to="/comparison">Store Comparison</Link> },
          ]}
        />
        <Dropdown
          menu={{
            items: [{ key: 'logout', label: 'Log out' }],
            onClick: ({ key }) => {
              if (key === 'logout') {
                dispatch(loggedOut());
                navigate('/login');
              }
            },
          }}
        >
          <span style={{ color: '#fff', cursor: 'pointer' }}>
            <Avatar size="small" icon={<UserOutlined />} style={{ marginRight: 8 }} />
            {user?.displayName}
          </span>
        </Dropdown>
      </Header>
      <Content className="app-content">
        <Outlet />
      </Content>
    </Layout>
  );
}