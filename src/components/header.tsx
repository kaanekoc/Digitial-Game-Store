import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { logout } from "@/app/hesap-actions";

export async function Header() {
  const user = await currentUser();
  const count = user ? (await query<{ count: number }>("SELECT COUNT(*) AS count FROM cart_items WHERE user_id=?", [user.id]))[0].count : 0;
  return <header className="site-header"><div className="header-inner">
    <Link href="/" className="brand" aria-label="Nexus ana sayfa"><span className="brand-symbol">N</span>NEXUS<span className="brand-dot">.</span></Link>
    <nav aria-label="Ana menü"><Link href="/">Mağaza</Link><Link href="/kutuphane">Kütüphanem</Link><Link href="/siparisler">Siparişlerim</Link>{user?.role === "admin" && <Link href="/yonetim">Yönetim</Link>}</nav>
    <div className="header-actions"><Link href="/sepet" className="cart-link">Sepet <span className="count">{count}</span></Link>
      {user ? <><span className="user-name">{user.name}</span><form action={logout}><button className="text-button">Çıkış</button></form></> : <Link className="button small secondary" href="/giris">Giriş yap ↗</Link>}
    </div>
  </div></header>;
}
