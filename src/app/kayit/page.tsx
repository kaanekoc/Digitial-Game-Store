import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { ActionForm } from "@/components/action-form";
import { register } from "../hesap-actions";

export default async function RegisterPage() {
  if (await currentUser()) redirect("/");
  return (
    <main className="auth-page">
      <section className="auth-panel">
        <span className="eyebrow">NEXUS'A KATIL</span>
        <h1>Yeni dünyalara açıl.</h1>
        <p className="muted">Kendi oyun koleksiyonunu oluşturmaya başla.</p>
        <ActionForm action={register} submitLabel="Hesap oluştur →">
          <label>
            Adın
            <input
              name="name"
              autoComplete="name"
              required
              minLength={2}
              maxLength={100}
              placeholder="Adın Soyadın"
            />
          </label>
          <label>
            E-posta
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              placeholder="sen@ornek.com"
            />
          </label>
          <label>
            Şifre
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={72}
              placeholder="En az 8 karakter"
            />
          </label>
        </ActionForm>
        <p className="muted">
          Zaten üye misin? <Link href="/giris">Giriş yap</Link>
        </p>
      </section>
      <div className="auth-art">
        <span>
          HER OYUN
          <br />
          YENİ BİR
          <br />
          <em>HİKÂYE.</em>
        </span>
        <p>Bir sonraki hikâyene ilk adımı at.</p>
      </div>
    </main>
  );
}
