"use client";
import {X,ExternalLink} from "lucide-react";
import {useDialogFocus} from "./dialog-focus";
export type UniversityComparisonItem={id:string;name:string;city:string;citySource:string;logo:string;programmes:number;faculties:string[];directory:string};
export default function IndonesiaComparePanel({items,language,close,remove,open}:{items:UniversityComparisonItem[];language:"en"|"id";close:()=>void;remove:(id:string)=>void;open:(id:string)=>void}) {
 const t=(en:string,id:string)=>language==="id"?id:en;
 const ref=useDialogFocus(close);
 return <div ref={ref as React.RefObject<HTMLDivElement>} tabIndex={-1} className="modal-backdrop indonesia-compare-backdrop" role="dialog" aria-modal="true" aria-labelledby="indonesia-compare-title" onMouseDown={e=>e.target===e.currentTarget&&close()}><section className="indonesia-compare-panel">
 <header><div><span className="section-label">Indonesia · S1</span><h2 id="indonesia-compare-title">{t("Compare universities","Bandingkan universitas")}</h2><p>{t("Compare the same information for each university.","Bandingkan informasi yang sama untuk setiap universitas.")}</p></div><button className="icon-button" onClick={close} aria-label={t("Close comparison","Tutup perbandingan")}><X size={20}/></button></header>
 <p className="indonesia-compare-scroll-hint">{t("Scroll sideways to see every university.","Geser ke samping untuk melihat semua universitas.")}</p>
 <div className="indonesia-compare-scroll" tabIndex={0} role="region" aria-label={t("University comparison table","Tabel perbandingan universitas")}><table><caption>{t("University information from the MyWay catalogue. Counts are not rankings.","Informasi universitas dari katalog MyWay. Jumlah bukan peringkat.")}</caption><thead><tr><th scope="col">{t("University","Universitas")}</th>{items.map(item=><th scope="col" key={item.id}><div className="comparison-university"><img src={item.logo} alt="" width={40} height={40}/><strong>{item.name}</strong><button className="icon-button" onClick={()=>remove(item.id)} aria-label={`${t("Remove","Hapus")} ${item.name}`}><X size={15}/></button></div></th>)}</tr></thead><tbody>
 <tr><th scope="row">{t("Main campus area","Lokasi kampus utama")}</th>{items.map(item=><td key={item.id}><a href={item.citySource} target="_blank" rel="noreferrer">{item.city}<ExternalLink size={12}/></a></td>)}</tr>
 <tr><th scope="row">{t("Listed S1 programmes","Program S1 tercatat")}</th>{items.map(item=><td key={item.id}><strong>{item.programmes}</strong></td>)}</tr>
 <tr><th scope="row">{t("Faculties and schools","Fakultas dan sekolah")}</th>{items.map(item=><td key={item.id}><strong>{item.faculties.length}</strong><details><summary>{t("View faculty names","Lihat nama fakultas")}</summary><ul>{item.faculties.map(f=><li key={f}>{f}</li>)}</ul></details></td>)}</tr>
 <tr><th scope="row">{t("Programme directory","Direktori program")}</th>{items.map(item=><td key={item.id}><a href={item.directory} target="_blank" rel="noreferrer">{t("Official source","Sumber resmi")}<ExternalLink size={12}/></a></td>)}</tr>
 <tr><th scope="row">{t("Explore programmes","Jelajahi program")}</th>{items.map(item=><td key={item.id}><button className="outline-button" onClick={()=>open(item.id)}>{t("View university","Lihat universitas")}</button></td>)}</tr>
 </tbody></table></div><footer><p>{t("Main campus areas may differ from programme campuses. No admission chance or ranking is inferred.","Lokasi kampus utama dapat berbeda dari kampus program studi. Tidak ada kesimpulan peluang diterima atau peringkat.")}</p><button className="primary-button" onClick={close}>{t("Back to results","Kembali ke hasil")}</button></footer>
 </section></div>;
}
