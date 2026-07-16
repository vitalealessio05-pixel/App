'use client';

export default function Footer() {
  return (
    <footer style={{
      marginTop: 40, paddingTop: 20, borderTop: '1px solid var(--line)',
      display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap',
    }}>
      <a href="/termini" style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'none' }}>
        Termini
      </a>
      <a href="/privacy" style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'none' }}>
        Privacy
      </a>
      <span style={{ fontSize: 12, color: 'var(--muted)' }}>Maisola — in fase di test</span>
    </footer>
  );
}
