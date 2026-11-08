import { mkdir, writeFile } from "node:fs/promises";

// Projeye ozel, vektor tabanli kurmaca oyun kapaklari. Harici gorsel bagimliligi yoktur.
const themes = [
  ["racing", "NEON", "DRIFT", "#d75aef", "#ff613c", "#130d38"],
  ["space", "KAYIP", "YÖRÜNGE", "#548bff", "#b5dbff", "#0b1536"],
  ["forest", "ORMANIN", "KALBİ", "#96d397", "#f9dd87", "#123d39"],
  ["kingdom", "DEMİR", "KRALLIK", "#ecba72", "#ffddad", "#302031"],
  ["ocean", "DERİN", "MAVİ", "#37d5e1", "#7de1ca", "#092c53"],
  ["desert", "KIZIL", "UFUK", "#f48450", "#ffda9d", "#602e40"],
];
await mkdir("public/covers", { recursive: true });
for (const [slug, first, last, color, sun, bg] of themes) {
  const stars = Array.from(
    { length: 45 },
    (_, i) =>
      `<circle cx="${(i * 157 + 41) % 1200}" cy="${(i * 73 + 29) % 500}" r="${(i % 3) + 0.5}" fill="white" opacity="${0.15 + (i % 5) * 0.12}"/>`,
  ).join("");
  const skyline = Array.from(
    { length: 19 },
    (_, i) =>
      `<rect x="${i * 70}" y="${280 + ((i * 53) % 180)}" width="${30 + (i % 4) * 10}" height="360" fill="#080c1e"/><path d="M${i * 70 + 7} ${300 + ((i * 53) % 180)}v120" stroke="${color}" opacity=".6" stroke-width="3"/>`,
  ).join("");
  const trees = Array.from(
    { length: 20 },
    (_, i) =>
      `<path d="M${i * 70 - 45} 650l70 -${230 + (i % 5) * 40} 70 ${230 + (i % 5) * 40}z" fill="${i % 2 ? "#09272e" : "#0f383b"}" opacity=".9"/>`,
  ).join("");
  const scene =
    slug === "racing"
      ? `${skyline}<path d="M0 800L520 470h150l530 330" fill="#100b24"/><path d="M0 800l540-330M1200 800L650 470M300 800l270-330M900 800L620 470" stroke="${color}" stroke-width="2" opacity=".7"/><path d="M400 685l45-80 200-10 95 80-10 45H405z" fill="#17192e" stroke="${color}" stroke-width="3"/><path d="M450 610l35-45h100l55 37" fill="#151a35" stroke="#80ebed" stroke-width="2"/><path d="M420 675h70m155-5h70" stroke="#f778df" stroke-width="10"/>`
      : slug === "forest"
        ? `${trees}<path d="M540 800q-100-120 45-210t25-150q170 80 60 180t60 180" fill="#c8d888" opacity=".45"/><circle cx="615" cy="590" r="10" fill="#ffffbd"/><path d="M615 602v40m-12-20h24" stroke="#101c2c" stroke-width="7"/>`
        : slug === "kingdom"
          ? `<path d="M0 700l300-180 170 100 200-180 530 270v90H0" fill="#171b30"/><path d="M420 650V400h40v-60h30v60h50v250m50 0V320h25v-50h30v50h30v330m50 0V410h30v-50h30v50h35v240" fill="#141628" stroke="#bb956b" stroke-width="2"/><path d="M0 760q600-160 1200 0v40H0" fill="#101725"/>`
          : slug === "ocean"
            ? `<path d="M0 500q300-80 600 0t600 0v300H0" fill="#05213a" opacity=".6"/><path d="M0 650q300-150 600-20t600 0v170H0" fill="#092438"/><ellipse cx="620" cy="520" rx="130" ry="45" fill="#163f54" stroke="${color}" stroke-width="2"/><path d="M565 480v-35h45v35m-120 40h-70m330 0h40" stroke="${sun}" stroke-width="5"/><circle cx="670" cy="520" r="18" fill="${sun}"/><path d="M780 510l420-150v300L780 530" fill="${color}" opacity=".07"/>`
            : slug === "space"
              ? `<ellipse cx="800" cy="300" rx="190" ry="190" fill="url(#planet)"/><ellipse cx="800" cy="300" rx="310" ry="50" fill="none" stroke="${sun}" stroke-width="12" opacity=".35" transform="rotate(-25 800 300)"/><path d="M0 760l260-240 200 150 260-90 480 150v70H0" fill="#10172e"/><path d="M520 625l35-55h40l30 55-30-12-20 25-20-25z" fill="#ccd8ee"/>`
              : `<path d="M0 600q300-160 600 0t600 0v200H0" fill="#9c4d3f"/><path d="M0 720q250-190 600-40t600-40v160H0" fill="#552b39"/><path d="M730 620l30-180h110l30 180" fill="#292232" stroke="${sun}" stroke-width="2"/><path d="M780 440v-50h45v50" fill="#232035"/><path d="M0 800q600-150 1200-20v20" fill="#281d30"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><defs><linearGradient id="sky" x2=".5" y2="1"><stop stop-color="${bg}"/><stop offset="1" stop-color="${color}"/></linearGradient><radialGradient id="planet"><stop stop-color="${sun}"/><stop offset="1" stop-color="${color}"/></radialGradient><linearGradient id="shade" x2="0" y2="1"><stop offset=".35" stop-color="#080a16" stop-opacity="0"/><stop offset="1" stop-color="#080a16" stop-opacity=".8"/></linearGradient></defs><rect width="1200" height="800" fill="url(#sky)"/>${stars}${slug !== "space" ? `<circle cx="800" cy="265" r="125" fill="${sun}" opacity=".85"/>` : ""}${scene}<rect width="1200" height="800" fill="url(#shade)"/><text x="55" y="90" fill="white" opacity=".65" font-family="Arial,sans-serif" font-size="17" letter-spacing="8">NEXUS ORIGINAL WORLDS</text><text x="55" y="675" fill="white" font-family="Arial,sans-serif" font-size="63" font-weight="900" letter-spacing="6">${first}</text><text x="55" y="747" fill="${sun}" font-family="Arial,sans-serif" font-size="70" font-weight="900" letter-spacing="4">${last}</text></svg>`;
  await writeFile(`public/covers/${slug}.svg`, svg);
}
console.log("6 SVG kapak olusturuldu.");
