import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { ActionForm } from "@/components/action-form";
import { login } from "../hesap-actions";

export default async function LoginPage() {
  if (await currentUser()) redirect("/");
  return <main className="auth-page"><section className="auth-panel"><span className="eyebrow">MACERAYA DEVAM ET</span><h1>Tekrar hoş geldin.</h1><p className="muted">Oyunların ve yeni dünyalar seni bekliyor.</p>
    <ActionForm action={login} submitLabel="Giriş yap →">
      <label>E-posta<input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="sen@ornek.com" /></label>
      <label>Şifre<input name="password" type="password" autoComplete="current-password" required minLength={8} maxLength={72} /></label>
    </ActionForm><p className="muted">Hesabın yok mu? <Link href="/kayit">Hesap oluştur</Link></p>
  </section><div className="auth-art"><span>SONRAKİ<br />MACERAN<br /><em>BURADA.</em></span><p>Keşfet. Oyna. Koleksiyonunu büyüt.</p></div></main>;
}
