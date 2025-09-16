'use client';
import Link from 'next/link';

function Navbar() {
  return (
    <nav style={{padding:'12px 16px', borderBottom:'1px solid #eee'}}>
      <Link href="/">DipMembers</Link>
    </nav>
  );
}

export default Navbar;   // <-- add this
