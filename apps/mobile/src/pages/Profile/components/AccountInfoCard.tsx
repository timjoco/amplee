type Props = {
  email: string | undefined;
  fullName: string;
};

export function AccountInfoCard({ email, fullName }: Props) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16,
        padding: '20px 24px',
        marginBottom: 16,
      }}
    >
      <h3
        style={{
          margin: '0 0 12px',
          fontSize: 12,
          fontWeight: 600,
          color: '#9ca3af',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        Account
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div>
          <span style={{ fontSize: 13, color: '#6b7280' }}>Email: </span>
          <span style={{ fontSize: 13, color: '#e5e7eb' }}>
            {email ?? 'Add your email'}
          </span>
        </div>
        <div>
          <span style={{ fontSize: 13, color: '#6b7280' }}>Name: </span>
          <span style={{ fontSize: 13, color: '#e5e7eb' }}>{fullName}</span>
        </div>
      </div>
    </div>
  );
}
